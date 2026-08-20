const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@will-barnard.com';

async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    console.log(`[Email Mock] Password reset for ${to}: ${resetUrl}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Reset Your Password — Will Barnard',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #e2e8f0; margin-bottom: 16px;">Password Reset</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          You requested a password reset. Click the button below to set a new password.
          This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #10b981; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Reset Password
        </a>
        <p style="color: #64748b; font-size: 14px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

async function sendContactNotification(name, email, message) {
  if (!resend) {
    console.log(`[Email Mock] Contact from ${name} <${email}>: ${message}`);
    return;
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `New Contact: ${name}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #e2e8f0;">New Contact Message</h2>
        <p><strong>From:</strong> ${name} &lt;${email}&gt;</p>
        <p><strong>Message:</strong></p>
        <p style="color: #94a3b8; line-height: 1.6; white-space: pre-wrap;">${message}</p>
      </div>
    `,
  });
}

async function sendBuildReadyEmail(to, name, tier, billingUrl) {
  if (!resend) {
    console.log(`[Email Mock] Build ready for ${to} (${tier}): ${billingUrl}`);
    return;
  }

  const tierLabel = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'your';

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Your site is ready to launch — Will Barnard',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #e2e8f0; margin-bottom: 16px;">Your ${tierLabel} build is ready</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          ${name ? `Hi ${name},` : 'Hi,'}
        </p>
        <p style="color: #94a3b8; line-height: 1.6;">
          Good news — your site has been built and is ready to go live. The final step is to start
          your monthly subscription. Once you do, your site will be deployed and live.
        </p>
        <a href="${billingUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #10b981; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Start Subscription &amp; Go Live
        </a>
        <p style="color: #64748b; font-size: 14px;">
          Questions? Just reply to this email.
        </p>
      </div>
    `,
  });
}

async function sendPurchaseNotification({ type, customerEmail, customerName, tier, amountCents, currency, interval }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const amount = typeof amountCents === 'number'
    ? `${(amountCents / 100).toFixed(2)} ${(currency || 'usd').toUpperCase()}`
    : 'N/A';

  const label = type === 'subscription'
    ? `New subscription (${tier || 'unknown'}${interval ? `, ${interval}` : ''})`
    : `New build purchase (${tier || 'unknown'})`;

  if (!resend) {
    console.log(`[Email Mock] Purchase notification for admin: ${label} — ${customerEmail} — ${amount}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: adminEmail,
    subject: `💰 ${label} — ${customerEmail}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #e2e8f0; margin-bottom: 16px;">${label}</h2>
        <p><strong>Customer:</strong> ${customerName ? `${customerName} ` : ''}&lt;${customerEmail}&gt;</p>
        <p><strong>Amount:</strong> ${amount}</p>
        <p><strong>Tier:</strong> ${tier || 'N/A'}</p>
        <p><strong>Type:</strong> ${type}</p>
      </div>
    `,
  });
}

async function sendRenewalReminderEmail(to, name, { tier, amountCents, currency, renewalDate, daysUntil, portalUrl }) {
  const tierLabel = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'your';
  const dateLabel = renewalDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const amountLabel = typeof amountCents === 'number'
    ? `${(amountCents / 100).toFixed(2)} ${(currency || 'usd').toUpperCase()}`
    : 'your usual amount';
  const whenLabel = daysUntil <= 10 ? 'in about a week' : 'in about a month';

  if (!resend) {
    console.log(`[Email Mock] Renewal reminder for ${to}: ${amountLabel} on ${dateLabel}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Upcoming renewal ${whenLabel} — ${dateLabel}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #e2e8f0; margin-bottom: 16px;">Your ${tierLabel} plan renews ${whenLabel}</h2>
        <p style="color: #94a3b8; line-height: 1.6;">
          ${name ? `Hi ${name},` : 'Hi,'}
        </p>
        <p style="color: #94a3b8; line-height: 1.6;">
          Just a heads up — your annual subscription is set to renew on <strong>${dateLabel}</strong>.
          You'll be charged <strong>${amountLabel}</strong> automatically on that date.
        </p>
        <p style="color: #94a3b8; line-height: 1.6;">
          No action is needed if you'd like to continue. If you'd rather cancel or switch to monthly
          billing instead, you can do that yourself below.
        </p>
        ${portalUrl ? `
        <a href="${portalUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #10b981; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Modify or Cancel Subscription
        </a>` : ''}
        <p style="color: #64748b; font-size: 14px;">
          Questions? Just reply to this email.
        </p>
      </div>
    `,
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendContactNotification,
  sendBuildReadyEmail,
  sendPurchaseNotification,
  sendRenewalReminderEmail,
};
