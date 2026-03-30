const nodemailer = require('nodemailer');

const sendEmail = async ({ email, subject, html, attachments = [] }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SEND_EMAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: subject,
    html: html,
    attachments: attachments,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
