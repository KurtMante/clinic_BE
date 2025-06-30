class Reminder {
  constructor(reminderId, patientId, appointmentId, serviceName, preferredDateTime, message, isRead = false) {
    this.reminderId = reminderId;
    this.patientId = patientId;
    this.appointmentId = appointmentId;
    this.serviceName = serviceName;
    this.preferredDateTime = preferredDateTime;
    this.message = message;
    this.isRead = isRead; // boolean: 0 = unread, 1 = read
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Validation method
  validate() {
    const errors = [];
    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.appointmentId) errors.push('Appointment ID is required');
    if (!this.serviceName || this.serviceName.trim() === '') errors.push('Service name is required');
    if (!this.preferredDateTime) errors.push('Preferred date and time is required');
    if (!this.message || this.message.trim() === '') errors.push('Message is required');
    return errors;
  }
}

module.exports = Reminder;
