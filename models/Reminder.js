class Reminder {
  constructor(reminderId, patientId, appointmentId, serviceName, preferredDateTime, message, isRead = false, createdAt = new Date(), updatedAt = new Date()) {
    this.reminderId = reminderId;
    this.patientId = patientId;
    this.appointmentId = appointmentId;
    this.serviceName = serviceName;
    this.preferredDateTime = preferredDateTime;
    this.message = message;
    this.isRead = isRead;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validation method
  validate() {
    const errors = [];
    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.message || this.message.trim() === '') errors.push('Message is required');
    // appointmentId, serviceName, preferredDateTime are optional for custom reminders
    return errors;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Reminder(
      row.reminderId,
      row.patientId,
      row.appointmentId,
      row.serviceName,
      row.preferredDateTime,
      row.message,
      row.isRead === 1 || row.isRead === true,
      row.createdAt,
      row.updatedAt
    );
  }
}

module.exports = Reminder;
