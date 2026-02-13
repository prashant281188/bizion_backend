import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* =====================================================
   SEND EMAIL
===================================================== */

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {

  transporter.verify((err, success) => {
  if (err) {
    console.error(err);
  } else {
    console.log("SMTP Ready");
  }
});
  await transporter.sendMail({
    from: `"Bizion Admin" <${process.env.SMTP_FROM}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
