const express = require('express');
const Stripe = require('stripe');
const { pool } = require('../db');
const { requireAuth } = require('../middleware/auth');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.STUDIO_URL || 'https://studio.will-barnard.com';

const PRICE_MAP = {
  [process.env.PRICE_BASIC_MONTHLY]: { tier: 'basic', interval: 'monthly' },
  [process.env.PRICE_BASIC_YEARLY]: { tier: 'basic', interval: 'yearly' },
  [process.env.PRICE_PROFESSIONAL_MONTHLY]: { tier: 'professional', interval: 'monthly' },
  [process.env.PRICE_PROFESSIONAL_YEARLY]: { tier: 'professional', interval: 'yearly' },
  [process.env.PRICE_ENTERPRISE_MONTHLY]: { tier: 'enterprise', interval: 'monthly' },
  [process.env.PRICE_ENTERPRISE_YEARLY]: { tier: 'enterprise', interval: 'yearly' },
};

const VALID_PRICE_IDS = new Set(Object.keys(PRICE_MAP).filter(Boolean));

const router = express.Router();

// ── Create Checkout Session ──
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    // If user already has a Stripe customer, reuse it
    const { rows: subRows } = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 AND stripe_customer_id IS NOT NULL LIMIT 1',
      [req.user.id]
    );

    const sessionParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${FRONTEND_URL}/billing/success`,
      cancel_url: `${FRONTEND_URL}/billing/cancel`,
    };

    if (subRows.length > 0 && subRows[0].stripe_customer_id) {
      sessionParams.customer = subRows[0].stripe_customer_id;
    } else {
      sessionParams.customer_email = rows[0].email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Create checkout session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── Get current subscription ──
router.get('/subscription', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT stripe_subscription_id, price_id, tier, billing_interval, status, current_period_end
       FROM subscriptions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
      [req.user.id]
    );
    if (rows.length === 0) return res.json(null);
    res.json(rows[0]);
  } catch (err) {
    console.error('Get subscription error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Create Customer Portal session ──
router.post('/portal-session', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1 AND stripe_customer_id IS NOT NULL LIMIT 1',
      [req.user.id]
    );
    if (rows.length === 0 || !rows[0].stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id,
      return_url: `${FRONTEND_URL}/`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal session error:', err);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ── Available price IDs (for frontend plan selection) ──
router.get('/prices', (req, res) => {
  const prices = {};
  for (const [priceId, meta] of Object.entries(PRICE_MAP)) {
    if (!priceId) continue;
    prices[`${meta.tier}_${meta.interval}`] = priceId;
  }
  res.json(prices);
});

// ── Webhook ──
// NOTE: This route uses express.raw() — it must NOT go through express.json().
// It's mounted separately in index.js as /api/billing/webhook.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { customer, subscription, customer_email } = session;

        if (customer_email) {
          const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [customer_email]);
          if (rows.length > 0) {
            // Upsert: link stripe customer to user
            await pool.query(
              `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, updated_at)
               VALUES ($1, $2, $3, 'active', NOW())
               ON CONFLICT (stripe_subscription_id) DO UPDATE
               SET stripe_customer_id = EXCLUDED.stripe_customer_id, user_id = EXCLUDED.user_id, updated_at = NOW()`,
              [rows[0].id, customer, subscription]
            );
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const priceId = sub.items.data[0]?.price?.id;
        const priceInfo = PRICE_MAP[priceId] || { tier: 'unknown', interval: 'unknown' };

        // Find user by stripe customer ID
        const { rows: userRows } = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1 LIMIT 1',
          [sub.customer]
        );
        const userId = userRows[0]?.user_id;

        if (userId) {
          await pool.query(
            `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, price_id, tier, billing_interval, status, current_period_end, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, to_timestamp($8), NOW())
             ON CONFLICT (stripe_subscription_id) DO UPDATE
             SET price_id = EXCLUDED.price_id, tier = EXCLUDED.tier, billing_interval = EXCLUDED.billing_interval,
                 status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end, updated_at = NOW()`,
            [userId, sub.customer, sub.id, priceId, priceInfo.tier, priceInfo.interval, sub.status, sub.current_period_end]
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await pool.query(
          `UPDATE subscriptions SET status = 'canceled', updated_at = NOW()
           WHERE stripe_subscription_id = $1`,
          [sub.id]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
});

module.exports = router;
