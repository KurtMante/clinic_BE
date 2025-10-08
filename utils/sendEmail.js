const { sendEmail: sendRealEmail } = require('../services/EmailService');

module.exports = async function sendEmail(to, subject, text) {
  // Use the EmailService to send the email
  await sendRealEmail({ toEmail: to, subject, text });
};