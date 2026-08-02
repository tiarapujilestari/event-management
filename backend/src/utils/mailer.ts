import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendMail({ to, subject, html }: MailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[mailer] SMTP not configured. Skipping email to ${to}: ${subject}`);
    return;
  }
  return transporter.sendMail({
    from: process.env.SMTP_FROM || '"Event Platform" <no-reply@eventplatform.com>',
    to,
    subject,
    html,
  });
}
