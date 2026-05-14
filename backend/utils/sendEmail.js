const nodemailer = require('nodemailer');

/**
 * Send an email using configured SMTP settings.
 * Relies on process.env.SMTP_USER and process.env.SMTP_PASS
 */
const sendEmail = async ({ to, subject, html }) => {
  try {


    // We default to Gmail settings, but they can be overridden in .env
    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `RMS Unified <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} [MessageId: ${info.messageId}]`);
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
};

module.exports = sendEmail;
