const express = require('express');
const reminderController = require('../controllers/ReminderController');

const router = express.Router();

// GET all reminders
router.get('/', reminderController.getAllReminders);

// GET reminders by patient ID
router.get('/patient/:patientId', reminderController.getRemindersByPatientId);

// GET unread reminders by patient ID
router.get('/patient/:patientId/unread', reminderController.getUnreadRemindersByPatientId);

// PUT mark reminder as read
router.put('/:reminderId/read', reminderController.markAsRead);

// PUT mark reminder as unread
router.put('/:reminderId/unread', reminderController.markAsUnread);

// GET reminder by ID
router.get('/:reminderId', reminderController.getReminderById);

// DELETE reminder
router.delete('/:reminderId', reminderController.deleteReminder);

module.exports = router;
