const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('[Email] SMTP not configured — emails disabled');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendPasswordResetEmail(toEmail, resetToken) {
  const t = getTransporter();
  if (!t) return { skipped: true };

  const resetUrl =
    `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  const mobileDeepLink =
    `clio://reset-password?token=${resetToken}`;

  await t.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@clio.app',
    to: toEmail,
    subject: 'Reset your Clio password',
    text: `Reset your password: ${resetUrl}`,
    html: `
      <p>You requested a password reset for your Clio account.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>If you're on mobile, open this link:
         <a href="${mobileDeepLink}">${mobileDeepLink}</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  return { sent: true };
}

async function sendOtpEmail(toEmail, code) {
  const t = getTransporter();
  // Tolerate a missing SMTP config in dev: do NOT throw/500 — the caller treats
  // {skipped:true} as a soft success so signup still works without email set up.
  if (!t) {
    console.log(`[Email] SMTP not configured — OTP for ${toEmail} would be: ${code}`);
    return { skipped: true };
  }

  await t.sendMail({
    from: process.env.SMTP_FROM ?? 'noreply@clio.app',
    to: toEmail,
    subject: `${code} is your Clio verification code`,
    text: `Your Clio verification code is ${code}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: `
      <p>Your Clio verification code is:</p>
      <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
      <p>It expires in 10 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  return { sent: true };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendContactSubmissionEmail({ name, email, organization, role, message }) {
  const t = getTransporter();
  if (!t) {
    console.log('[Contact] SMTP not configured — submission logged:', {
      name,
      email,
      organization,
      role,
      message: message.slice(0, 500),
    });
    return { skipped: true };
  }

  const to = process.env.CONTACT_EMAIL_TO || process.env.SMTP_FROM || 'team@clio.app';
  const from = process.env.SMTP_FROM ?? 'noreply@clio.app';

  await t.sendMail({
    from,
    to,
    replyTo: email,
    subject: `Contact submission from ${name} (${organization})`,
    text: `Name: ${name}\nEmail: ${email}\nOrganization: ${organization}\nRole: ${role}\n\nMessage:\n${message}`,
    html: `
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Organization:</strong> ${escapeHtml(organization)}</p>
      <p><strong>Role:</strong> ${escapeHtml(role)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
    `,
  });

  return { sent: true };
}

module.exports = { sendPasswordResetEmail, sendContactSubmissionEmail, sendOtpEmail };
