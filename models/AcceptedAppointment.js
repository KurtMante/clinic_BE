class AcceptedAppointment {
  constructor(acceptedAppointmentId, appointmentId, patientId, serviceId, preferredDateTime, symptom, isAttended = 0) {
    this.acceptedAppointmentId = acceptedAppointmentId;
    this.appointmentId = appointmentId;
    this.patientId = patientId;
    this.serviceId = serviceId;
    this.preferredDateTime = preferredDateTime;
    this.symptom = symptom;
    this.isAttended = isAttended; // 0 = not attended, 1 = attended
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Validation method
  validate() {
    const errors = [];
    if (!this.appointmentId) errors.push('Appointment ID is required');
    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.serviceId) errors.push('Service ID is required');
    if (!this.preferredDateTime) errors.push('Preferred date and time is required');
    if (!this.symptom || this.symptom.trim() === '') errors.push('Symptom is required');
    if (this.isAttended !== 0 && this.isAttended !== 1) errors.push('isAttended must be 0 or 1');
    return errors;
  }
}

module.exports = AcceptedAppointment;
