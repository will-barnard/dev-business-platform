const express = require('express');
const Stripe = require('stripe');
const { pool } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendBuildReadyEmail } = require('../services/email');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const FRONTEND_URL = process.env.STUDIO_URL || 'https://studio.will-barnard.com';

// Recurring subscription prices (existing)
const PRICE_MAP = {
  [process.env.PRICE_BASIC_MONTHLY]: { tier: 'basic', interval: 'monthly' },
  [process.env.PRICE_BASIC_YEARLY]: { tier: 'basic', interval: 'yearly' },
  [process.env.PRICE_PROFESSIONAL_MONTHLY]: { tier: 'professional', interval: 'monthly' },
  [process.env.PRICE_PROFESSIONAL_YEARLY]: { tier: 'professional', interval: 'yearly' },
  [process.env.PRICE_ENTERPRISE_MONTHLY]: { tier: 'enterprise', interval: 'monthly' },
  [process.env.PRICE_ENTERPRISE_YEARLY]: { tier: 'enterprise', interval: 'yearly' },
};
const VALID_PRICE_IDS = new Set(Object.keys(PRICE_MAP).filter(Boolean));

// One-time build prices — keyed by tier slug.
const BUILD_PRICE_MAP = {
  basic: process.env.PRICE_BUILD_BASIC,
  professional: process.env.PRICE_BUILD_PROFESSIONAL,
  enterprise: process.env.PRICE_BUILD_ENTERPRISE,
};
const BUILD_PRICE_IDS = new Set(Object.values(BUILD_PRICE_MAP).filter(Boolean));

const router = express.Router();

// Helpers ────────────────────────────────────────────────────────────────────

async function getLatestBuildPurchase(userId) {
  const { rows } = await pool.query(
    `SELECT id, tier, amount_cents, status, build_status, build_ready_email_sent_at,
            is_manual, paid_at, created_at, updated_at
     FROM build_purchases
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

// ── Create Subscription Checkout Session ──
// Gated: user must have a paid build whose build_status is 'ready' or 'delivered'.
router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    const { priceId } = req.body;

    if (!priceId || !VALID_PRICE_IDS.has(priceId)) {
      return res.status(400).json({ error: 'Invalid price ID' });
    }

    // Gate: must have a ready build before they can subscribe.
    const build = await getLatestBuildPurchase(req.user.id);
    if (!build || build.status !== 'paid') {
      return res.status(400).json({
        error: 'You need to pay your build cost before subscribing.',
        code: 'build_required',
      });
    }
    if (build.build_status !== 'ready' && build.build_status !== 'delivered') {
      return res.status(400).json({
        error: "Your site is still being built. We'll email you when it's ready to launch.",
        code: 'build_not_ready',
      });
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
      client_reference_id: String(req.user.id),
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

// ── Create Build Checkout Session (one-time payment) ──
router.post('/create-build-checkout-session', requireAuth, async (req, res) => {
  try {
    const { tier } = req.body;
    const priceId = BUILD_PRICE_MAP[tier];
    if (!tier || !priceId) {
      return res.status(400).json({ error: 'Invalid or unconfigured build tier' });
    }

    // If they already have a paid build (manual or otherwise), block re-purchase.
    const existing = await getLatestBuildPurchase(req.user.id);
    if (existing && existing.status === 'paid') {
      return res.status(400).json({
        error: 'You already have a build in progress.',
        code: 'build_already_paid',
      });
    }

    const { rows } = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      client_reference_id: String(req.user.id),
      customer_email: rows[0].email,
      metadata: { tier, purchase_type: 'build' },
      payment_intent_data: { metadata: { tier, user_id: String(req.user.id), purchase_type: 'build' } },
      success_url: `${FRONTEND_URL}/billing/success?type=build`,
      cancel_url: `${FRONTEND_URL}/billing/cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Create build checkout session error:', err);
    res.status(500).json({ error: 'Failed to create build checkout session' });
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

// ── Get current build purchase ──
router.get('/build-purchase', requireAuth, async (req, res) => {
  try {
    const build = await getLatestBuildPurchase(req.user.id);
    res.json(build);
  } catch (err) {
    console.error('Get build purchase error:', err);
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
// Subscription price IDs keyed `<tier>_<interval>`, plus build_<tier> for one-time builds.
router.get('/prices', (req, res) => {
  const prices = {};
  for (const [priceId, meta] of Object.entries(PRICE_MAP)) {
    if (!priceId) continue;
    prices[`${meta.tier}_${meta.interval}`] = priceId;
  }
  for (const [tier, priceId] of Object.entries(BUILD_PRICE_MAP)) {
    if (!priceId) continue;
    prices[`build_${tier}`] = priceId;
  }
  res.json(prices);
});

// ── Admin: list build purchases ──
router.get('/admin/build-purchases', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT bp.id, bp.user_id, bp.tier, bp.amount_cents, bp.status, bp.build_status,
              bp.build_ready_email_sent_at, bp.is_manual, bp.paid_at, bp.created_at, bp.updated_at,
              u.email AS user_email, u.name AS user_name
       FROM build_purchases bp
       JOIN users u ON u.id = bp.user_id
       ORDER BY bp.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('List build purchases error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: manually flag a user as having paid for a build ──
router.post('/admin/build-purchases', requireAdmin, async (req, res) => {
  try {
    const { tier, build_status } = req.body;
    const userId = parseInt(req.body.user_id, 10);
    if (!userId || !tier) {
      return res.status(400).json({ error: 'user_id and tier are required' });
    }
    const validTiers = new Set(['basic', 'professional', 'enterprise']);
    if (!validTiers.has(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }
    const validBuildStatuses = new Set(['not_started', 'in_progress', 'ready', 'delivered']);
    const initialStatus = validBuildStatuses.has(build_status) ? build_status : 'not_started';

    // Verify user exists
    const userRow = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userRow.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Block if they already have a paid build
    const existing = await pool.query(
      `SELECT id FROM build_purchases WHERE user_id = $1 AND status = 'paid' LIMIT 1`,
      [userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already has a paid build' });
    }

    const { rows } = await pool.query(
      `INSERT INTO build_purchases (user_id, tier, is_manual, status, build_status, paid_at)
       VALUES ($1, $2, true, 'paid', $3, NOW())
       RETURNING *`,
      [userId, tier, initialStatus]
    );

    // If admin chose to skip straight to 'ready', fire the email so the user knows to subscribe.
    if (initialStatus === 'ready') {
      await maybeSendBuildReadyEmail(rows[0]);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Manual build flag error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Admin: update a build purchase's build_status ──
router.patch('/admin/build-purchases/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    const { build_status } = req.body;
    const valid = new Set(['not_started', 'in_progress', 'ready', 'delivered']);
    if (!valid.has(build_status)) {
      return res.status(400).json({ error: 'Invalid build_status' });
    }

    // Look up prior status so we can decide whether to fire the email on transition.
    const { rows: priorRows } = await pool.query(
      'SELECT * FROM build_purchases WHERE id = $1',
      [id]
    );
    if (priorRows.length === 0) return res.status(404).json({ error: 'Not found' });
    const prior = priorRows[0];

    const { rows } = await pool.query(
      `UPDATE build_purchases SET build_status = $1, updated_at = NOW()
       WHERE id = $2 RETURNING *`,
      [build_status, id]
    );

    // Fire email only on the transition INTO 'ready' (and not if we've already sent it).
    if (build_status === 'ready' && prior.build_status !== 'ready') {
      await maybeSendBuildReadyEmail(rows[0]);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Update build purchase error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send the build-ready email and stamp the timestamp on the build_purchases row.
async function maybeSendBuildReadyEmail(build) {
  if (!build || !build.user_id) return;
  if (build.build_ready_email_sent_at) return; // already sent
  try {
    const { rows } = await pool.query(
      'SELECT email, name FROM users WHERE id = $1',
      [build.user_id]
    );
    if (rows.length === 0) return;
    const billingUrl = `${FRONTEND_URL}/billing`;
    await sendBuildReadyEmail(rows[0].email, rows[0].name, build.tier, billingUrl);
    await pool.query(
      'UPDATE build_purchases SET build_ready_email_sent_at = NOW() WHERE id = $1',
      [build.id]
    );
  } catch (err) {
    console.error('Send build-ready email failed:', err);
  }
}

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

        if (session.mode === 'payment') {
          // One-time build payment.
          const userId = parseInt(session.client_reference_id, 10);
          const tier = session.metadata?.tier;
          if (!userId || !tier) {
            console.warn('Build checkout session missing client_reference_id or tier metadata', session.id);
            break;
          }
          await pool.query(
            `INSERT INTO build_purchases
               (user_id, tier, amount_cents, stripe_checkout_session_id, stripe_payment_intent_id,
                status, build_status, paid_at)
             VALUES ($1, $2, $3, $4, $5, 'paid', 'not_started', NOW())
             ON CONFLICT (stripe_checkout_session_id) DO NOTHING`,
            [userId, tier, session.amount_total, session.id, session.payment_intent]
          );
        } else if (session.mode === 'subscription') {
          // Existing flow: link Stripe customer to user.
          const { customer, subscription, customer_email, client_reference_id } = session;
          let userId = parseInt(client_reference_id, 10) || null;
          if (!userId && customer_email) {
            const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [customer_email]);
            if (rows.length > 0) userId = rows[0].id;
          }
          if (userId) {
            await pool.query(
              `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, updated_at)
               VALUES ($1, $2, $3, 'active', NOW())
               ON CONFLICT (stripe_subscription_id) DO UPDATE
               SET stripe_customer_id = EXCLUDED.stripe_customer_id, user_id = EXCLUDED.user_id, updated_at = NOW()`,
              [userId, customer, subscription]
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

          // Subscription went active → flip site_live and mark the build as delivered.
          // FUTURE: this is where the actual deploy/go-live hook will be wired in.
          if (sub.status === 'active') {
            await pool.query(
              `UPDATE users SET site_live = true,
                                site_live_at = COALESCE(site_live_at, NOW()),
                                updated_at = NOW()
               WHERE id = $1`,
              [userId]
            );
            await pool.query(
              `UPDATE build_purchases SET build_status = 'delivered', updated_at = NOW()
               WHERE user_id = $1 AND build_status = 'ready'`,
              [userId]
            );
          }
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
