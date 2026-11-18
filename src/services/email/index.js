import env from "../../config/env.js";
import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: (env.SMTP_PORT || 587) === 465,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  } else {
    // Ethereal test account — logs preview URL to console
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: "unix",
      buffer: true,
    });
  }
  return transporter;
}

export async function sendVerificationEmail(to, verifyUrl) {
  const t = getTransporter();
  const message = {
    from: env.SMTP_FROM || "Birr Tracker <no-reply@birrtracker.et>",
    to,
    subject: "Verify your email — Birr Tracker",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1d70f0;">Verify your email</h2>
        <p>Click the button below to confirm your email address:</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #1d70f0; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #64748b; font-size: 14px;">
          Or copy this link into your browser:<br>
          <span style="word-break: break-all;">${verifyUrl}</span>
        </p>
        <p style="color: #94a3b8; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
      </div>
    `,
  };
  const info = await t.sendMail(message);
  if (!env.SMTP_HOST) {
    console.log(
      "[email] verification link for %s: %s",
      to,
      verifyUrl,
    );
  }
  return { ok: true, messageId: info.messageId };
}
