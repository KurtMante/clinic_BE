const express = require('express');
const reminderController = require('../controllers/ReminderController');
const router = express.Router();

// Specific parameterized routes first
router.get('/patient/:patientId/unread', reminderController.getUnreadRemindersByPatientId);
router.get('/patient/:patientId', reminderController.getRemindersByPatientId);

// Collection routes
router.get('/', reminderController.getAllReminders);
router.post('/', reminderController.createReminder);

// Single reminder routes
router.get('/:reminderId', reminderController.getReminderById);
router.put('/:reminderId/read', reminderController.markAsRead);
router.put('/:reminderId/unread', reminderController.markAsUnread);
router.delete('/:reminderId', reminderController.deleteReminder);

module.exports = router;
