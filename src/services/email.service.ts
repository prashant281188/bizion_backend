import nodemailer from "nodemailer";
import { ENV } from "../config/env";

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_SECURE,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS,
  },
});

export async function sendEmail(options: { to: string; subject: string; html: string }) {
  await transporter.sendMail({
    from: `"Bizion" <${ENV.SMTP_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
