const Stripe = require('stripe');
const { pool } = require('../db');
const { sendRenewalReminderEmail } = require('../services/email');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.STUDIO_URL || 'https://studio.will-barnard.com';

// Windows are intentionally wide (rather than an exact single day) so a missed
// or delayed run of the daily check still catches the reminder before the
// renewal date passes, without ever sending the same reminder twice —
// that's what the *_sent_at columns guard against.
const THIRTY_DAY_WINDOW = { upper: '30 days', lower: '7 days' };
const SEVEN_DAY_WINDOW = { upper: '7 days', lower: '0 days' };

// Best-effort lookup of what the customer will actually be charged.
// Prefers Stripe's upcoming-invoice preview (accounts for discounts/tax);
// falls back to the plain price amount if that call fails for any reason.
async function getUpcomingChargeAmount(sub) {
  try {
    const invoice = await stripe.invoices.retrieveUpcoming({ subscription: sub.stripe_subscription_id });
    return { amountCents: invoice.amount_due, currency: invoice.currency };
  } catch (err) {
    console.error(`Upcoming invoice lookup failed for subscription ${sub.stripe_subscription_id}:`, err.message);
    try {
      if (!sub.price_id) return { amountCents: null, currency: null };
      const price = await stripe.prices.retrieve(sub.price_id);
      return { amountCents: price.unit_amount, currency: price.currency };
    } catch (err2) {
      console.error(`Price lookup fallback also failed for ${sub.price_id}:`, err2.message);
      return { amountCents: null, currency: null };
    }
  }
}

async function sendReminderBatch({ column, upper, lower, daysUntil }) {
  const { rows } = await pool.query(
    `SELECT s.id, s.stripe_subscription_id, s.price_id, s.tier, s.current_period_end,
            u.email, u.name
     FROM subscriptions s
     JOIN users u ON u.id = s.user_id
     WHERE s.billing_interval = 'yearly'
       AND s.status = 'active'
       AND s.${column} IS NULL
       AND s.current_period_end <= NOW() + $1::interval
       AND s.current_period_end > NOW() + $2::interval`,
    [upper, lower]
  );

  for (const sub of rows) {
    try {
      const { amountCents, currency } = await getUpcomingChargeAmount(sub);
      await sendRenewalReminderEmail(sub.email, sub.name, {
        tier: sub.tier,
        amountCents,
        currency,
        renewalDate: sub.current_period_end,
        daysUntil,
        portalUrl: `${FRONTEND_URL}/billing`,
      });
      await pool.query(
        `UPDATE subscriptions SET ${column} = NOW() WHERE id = $1`,
        [sub.id]
      );
    } catch (err) {
      console.error(`Failed to send renewal reminder for subscription ${sub.id}:`, err);
      // Leave *_sent_at unset so the next run retries.
    }
  }

  return rows.length;
}

async function runRenewalReminderCheck() {
  try {
    const thirtyDayCount = await sendReminderBatch({
      column: 'renewal_reminder_30d_sent_at',
      upper: THIRTY_DAY_WINDOW.upper,
      lower: THIRTY_DAY_WINDOW.lower,
      daysUntil: 30,
    });
    const sevenDayCount = await sendReminderBatch({
      column: 'renewal_reminder_7d_sent_at',
      upper: SEVEN_DAY_WINDOW.upper,
      lower: SEVEN_DAY_WINDOW.lower,
      daysUntil: 7,
    });
    if (thirtyDayCount || sevenDayCount) {
      console.log(`Renewal reminders sent: ${thirtyDayCount} thirty-day, ${sevenDayCount} seven-day`);
    }
  } catch (err) {
    console.error('Renewal reminder check failed:', err);
  }
}

module.exports = { runRenewalReminderCheck };
