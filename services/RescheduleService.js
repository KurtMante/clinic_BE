const Reschedule = require('../models/Reschedule');
const RescheduleRepository = require('../repositories/RescheduleRepository');

const RescheduleService = {
  async createReschedule(data) {
    const reschedule = new Reschedule(
      null,
      data.appointmentId,
      data.patientId,
      data.serviceId,
      data.notes,
      data.confirmation
    );
    const errors = reschedule.validate();
    if (errors.length) throw new Error(errors.join(', '));
    return await RescheduleRepository.create(reschedule);
  },

  async getAllReschedules() {
    return await RescheduleRepository.findAll();
  },

  async getRescheduleById(rescheduleId) {
    const reschedule = await RescheduleRepository.findById(rescheduleId);
    if (!reschedule) throw new Error('Reschedule not found');
    return reschedule;
  },

  async getReschedulesByPatientId(patientId) {
    return await RescheduleRepository.findByPatientId(patientId);
  },

  async updateReschedule(rescheduleId, data) {
    return await RescheduleRepository.update(rescheduleId, data);
  },

  async deleteReschedule(rescheduleId) {
    return await RescheduleRepository.delete(rescheduleId);
  }
};

module.exports = RescheduleService;
