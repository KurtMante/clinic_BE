const patientRepository = require('../repositories/PatientRepository');
const sendEmail = require('../utils/sendEmail'); // You need to implement this utility

// POST /api/patients/send-reset-link
exports.sendResetLink = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  // Use repository to find patient
  const patient = await patientRepository.findByEmail(email);
  if (!patient) {
    return res.json({ message: 'If the email exists, a reset link was sent.' });
  }

  const resetLink = `https://clinic-fe-z9mz.vercel.app/reset?email=${encodeURIComponent(email)}`;
  await sendEmail(email, 'Reset your password', `Click here to reset: ${resetLink}`);

  res.json({ message: 'If the email exists, a reset link was sent.' });
};

// POST /api/patients/reset-password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ error: 'Missing fields.' });

  const patient = await patientRepository.findByEmail(email);
  if (!patient) return res.status(404).json({ error: 'User not found.' });

  await patientRepository.updatePassword(email, newPassword); // Implement this in your repository

  res.json({ message: 'Password reset successful.' });
};