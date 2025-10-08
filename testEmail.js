require('dotenv').config();
const { sendEmail } = require('./services/EmailService');

async function main() {
  const toEmail = process.argv[2];
  const subject = process.argv[3] || 'Test Email';
  const body = process.argv.slice(4).join(' ') || 'Test body from Clinic backend';

  if (!toEmail) {
    console.error('Usage: node testEmail.js recipient@example.com "Subject" "Message body"');
    process.exit(1);
  }

  console.log('Sending test email...');
  await sendEmail({
    toEmail,
    subject,
    text: body,
    html: `<p>${body}</p>`
  });
  console.log('Done (check inbox).');
}

main().catch(e => {
  console.error('Failed:', e);
  process.exit(1);
});