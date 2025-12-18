class Reschedule {
  constructor(rescheduleId, appointmentId, patientId, serviceId, notes, confirmation = 'Pending') {
    this.rescheduleId = rescheduleId;
    this.appointmentId = appointmentId;
    this.patientId = patientId;
    this.serviceId = serviceId;
    this.notes = notes;
    this.confirmation = confirmation;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  validate() {
    const errors = [];
    if (!this.appointmentId) errors.push('Appointment ID is required');
    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.serviceId) errors.push('Service ID is required');
    if (!this.notes || this.notes.trim() === '') errors.push('Notes are required');
    const validConfirmations = ['Pending', 'Declined', 'Confirmed'];
    if (this.confirmation && !validConfirmations.includes(this.confirmation)) {
      errors.push('Confirmation must be Pending, Declined, or Confirmed');
    }
    return errors;
  }
}

module.exports = Reschedule;
