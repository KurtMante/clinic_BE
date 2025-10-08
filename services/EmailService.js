const nodemailer = require('nodemailer');

const {
  GMAIL_USER,
  GMAIL_APP_PASSWORD,
  EMAIL_FROM_NAME
} = process.env;

let transporter = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
  });
}

function isConfigured() {
  return !!transporter;
}

async function sendEmail({ toEmail, subject, text, html }) {
  if (!isConfigured()) {
    console.warn('Email skipped: Gmail not configured');
    return;
  }
  if (!toEmail) {
    console.warn('Email skipped: missing toEmail');
    return;
  }
  const mail = {
    from: `"${EMAIL_FROM_NAME || 'Clinic'}" <${GMAIL_USER}>`,
    to: toEmail,
    subject,
    text: text || (html ? html.replace(/<[^>]+>/g, '') : ''),
    html: html || `<p>${text}</p>`
  };
  try {
    const info = await transporter.sendMail(mail);
    console.log('Email sent id:', info.messageId);
    return info;
  } catch (e) {
    console.warn('Email send failed:', e.message);
  }
}

module.exports = { sendEmail, isConfigured };