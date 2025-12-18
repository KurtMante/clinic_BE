const RescheduleService = require('../services/RescheduleService');

class RescheduleController {
  async createReschedule(req, res) {
    try {
      const reschedule = await RescheduleService.createReschedule(req.body);
      res.status(201).json(reschedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllReschedules(req, res) {
    try {
      const reschedules = await RescheduleService.getAllReschedules();
      res.status(200).json(reschedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRescheduleById(req, res) {
    try {
      const reschedule = await RescheduleService.getRescheduleById(req.params.rescheduleId);
      res.status(200).json(reschedule);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateReschedule(req, res) {
    try {
      const reschedule = await RescheduleService.updateReschedule(req.params.rescheduleId, req.body);
      res.status(200).json(reschedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteReschedule(req, res) {
    try {
      const result = await RescheduleService.deleteReschedule(req.params.rescheduleId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getReschedulesByPatientId(req, res) {
    try {
      const reschedules = await RescheduleService.getReschedulesByPatientId(req.params.patientId);
      res.status(200).json(reschedules);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new RescheduleController();
