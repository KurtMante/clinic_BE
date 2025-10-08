const axios = require('axios');
const twilio = require('twilio');

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_FROM_NUMBER,
  TELESIGN_CUSTOMER_ID,
  TELESIGN_API_KEY,
  TELESIGN_SENDER_ID,
  TELESIGN_MESSAGE_TYPE
} = process.env;

let client = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

function isConfigured() {
  return !!(TELESIGN_CUSTOMER_ID && TELESIGN_API_KEY);
}

async function sendSms(to, body) {
  if (!client) {
    console.warn('SMS skipped: Twilio credentials missing');
    return;
  }
  if (!to) {
    console.warn('SMS skipped: destination number missing');
    return;
  }
  console.log('Sending SMS to', to, '=>', body);
  try {
    const resp = await client.messages.create({ from: TWILIO_FROM_NUMBER, to, body });
    console.log('Twilio SID:', resp.sid);
    return resp;
  } catch (e) {
    console.warn('SMS send failed:', e.message);
  }
}

async function sendSmsTelesign(to, body) {
  if (!isConfigured()) {
    console.warn('SMS skipped: Telesign credentials missing');
    return;
  }
  if (!to) {
    console.warn('SMS skipped: destination number missing');
    return;
  }

  // Build Basic auth header
  const auth = Buffer.from(`${TELESIGN_CUSTOMER_ID}:${TELESIGN_API_KEY}`).toString('base64');

  const payload = {
    phone_number: to,
    message: body,
    message_type: (TELESIGN_MESSAGE_TYPE || 'ARN')
  };

  if (TELESIGN_SENDER_ID) {
    payload.sender_id = TELESIGN_SENDER_ID;
  }

  console.log(`Sending SMS via Telesign to ${to}`);
  try {
    const resp = await axios.post(
      'https://rest-api.telesign.com/v1/messaging',
      payload,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );
    console.log('Telesign status:', resp.status, resp.data?.reference_id || '');
    return resp.data;
  } catch (e) {
    const detail = e.response?.data || e.message;
    console.warn('Telesign send failed:', detail);
  }
}

module.exports = { sendSms, sendSmsTelesign, isConfigured };