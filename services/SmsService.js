const axios = require('axios');

const {
  TELESIGN_CUSTOMER_ID,
  TELESIGN_API_KEY,
  TELESIGN_SENDER_ID,
  TELESIGN_MESSAGE_TYPE
} = process.env;

function isConfigured() {
  return !!(TELESIGN_CUSTOMER_ID && TELESIGN_API_KEY);
}

function validateE164(num) {
  // Must start with + and 8–15 digits total (E.164 max 15 digits)
  return /^\+[1-9]\d{7,14}$/.test(num);
}

async function sendSms(to, body) {
  if (!isConfigured()) {
    console.warn('Telesign not configured');
    return;
  }
  if (!to) {
    console.warn('Missing destination number');
    return;
  }
  if (!validateE164(to)) {
    console.warn('Invalid E.164 format:', to);
    return;
  }

  const auth = Buffer.from(`${TELESIGN_CUSTOMER_ID}:${TELESIGN_API_KEY}`).toString('base64');
  const params = new URLSearchParams();
  params.append('phone_number', to);
  params.append('message', body);
  params.append('message_type', TELESIGN_MESSAGE_TYPE || 'ARN');
  if (TELESIGN_SENDER_ID) params.append('sender_id', TELESIGN_SENDER_ID);

  console.log('Sending SMS via Telesign to', to);
  try {
    const resp = await axios.post(
      'https://rest-api.telesign.com/v1/messaging',
      params.toString(),
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      }
    );
    console.log('Telesign OK ref:', resp.data?.reference_id);
    return resp.data;
  } catch (e) {
    const data = e.response?.data;
    if (data?.status?.code === 10033) {
      console.warn('SMS skipped: destination not verified for trial (code 10033).');
      return { skipped: true, reason: 'UNVERIFIED_TRIAL_NUMBER' };
    }
    console.warn('Telesign send failed:',
      data ? JSON.stringify(data) : e.message);
  }
}

module.exports = { sendSms, isConfigured };