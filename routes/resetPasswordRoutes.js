const express = require('express');
const router = express.Router();
const ResetPasswordController = require('../controllers/ResetPasswordController');

router.post('/send-reset-link', ResetPasswordController.sendResetLink);
router.post('/reset-password', ResetPasswordController.resetPassword);

module.exports = router;