const reminderService = require('../services/ReminderService');

class ReminderController {
  async getAllReminders(req, res) {
    try {
      const data = await reminderService.getAllReminders();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }

  async getReminderById(req, res) {
    try {
      const id = Number(req.params.reminderId);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid reminderId' });
      }
      const reminder = await reminderService.getReminderById(id);
      res.json(reminder);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  }

  // GET /api/reminders/patient/:patientId
  async getRemindersByPatientId(req, res) {
    try {
      const { patientId } = req.params;
      const data = await reminderService.getRemindersByPatientId(patientId);
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  async getUnreadRemindersByPatientId(req, res) {
    try {
      const { patientId } = req.params;
      const data = await reminderService.getUnreadRemindersByPatientId(patientId);
      res.json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  async createReminder(req, res) {
    try {
      const reminder = await reminderService.createReminder(req.body);
      res.status(201).json(reminder);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const updated = await reminderService.markAsRead(req.params.reminderId);
      res.json(updated);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  }

  async markAsUnread(req, res) {
    try {
      const updated = await reminderService.markAsUnread(req.params.reminderId);
      res.json(updated);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  }

  async deleteReminder(req, res) {
    try {
      const result = await reminderService.deleteReminder(req.params.reminderId);
      res.json(result);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  }
}

module.exports = new ReminderController();
