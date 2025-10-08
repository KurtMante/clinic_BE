const Patient = require('../models/Patient');
const sendEmail = require('../utils/sendEmail'); // You need to implement this utility

// POST /api/patients/send-reset-link
exports.sendResetLink = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  // Optionally check if email exists
  const patient = await Patient.findOne({ email });
  if (!patient) {
    // For security, respond as if email was sent
    return res.json({ message: 'If the email exists, a reset link was sent.' });
  }

  // Compose reset link (no token)
  const resetLink = `http://localhost:3001/reset?email=${encodeURIComponent(email)}`;

  // Send email (implement sendEmail)
  await sendEmail(email, 'Reset your password', `Click here to reset: ${resetLink}`);

  res.json({ message: 'If the email exists, a reset link was sent.' });
};

// POST /api/patients/reset-password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Missing fields.' });

  const patient = await Patient.findOne({ email });
  if (!patient) return res.status(404).json({ error: 'User not found.' });

  patient.password = newPassword; // Hash in production!
  await patient.save();

  res.json({ message: 'Password reset successful.' });
};