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

module.exports = { sendPasswordResetEmail, sendContactNotification };
