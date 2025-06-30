const reminderService = require('../services/ReminderService');

class ReminderController {
  async getAllReminders(req, res) {
    try {
      const reminders = await reminderService.getAllReminders();
      res.status(200).json(reminders);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getReminderById(req, res) {
    try {
      const reminder = await reminderService.getReminderById(req.params.reminderId);
      res.status(200).json(reminder);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getRemindersByPatientId(req, res) {
    try {
      const reminders = await reminderService.getRemindersByPatientId(req.params.patientId);
      res.status(200).json(reminders);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getUnreadRemindersByPatientId(req, res) {
    try {
      const reminders = await reminderService.getUnreadRemindersByPatientId(req.params.patientId);
      res.status(200).json(reminders);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const reminder = await reminderService.markAsRead(req.params.reminderId);
      res.status(200).json(reminder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markAsUnread(req, res) {
    try {
      const reminder = await reminderService.markAsUnread(req.params.reminderId);
      res.status(200).json(reminder);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteReminder(req, res) {
    try {
      const result = await reminderService.deleteReminder(req.params.reminderId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new ReminderController();
