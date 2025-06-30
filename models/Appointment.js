class Appointment {
  constructor(appointmentId, patientId, serviceId, preferredDateTime, symptom, status = 'Pending') {
    this.appointmentId = appointmentId;
    this.patientId = patientId;
    this.serviceId = serviceId;
    this.preferredDateTime = preferredDateTime;
    this.symptom = symptom;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Validation method
  validate() {
    const errors = [];
    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.serviceId) errors.push('Service ID is required');
    if (!this.preferredDateTime) errors.push('Preferred date and time is required');
    if (!this.symptom || this.symptom.trim() === '') errors.push('Symptom is required');
    
    // Validate status
    const validStatuses = ['Pending', 'Accepted', 'Declined'];
    if (this.status && !validStatuses.includes(this.status)) {
      errors.push('Status must be one of: Pending, Accepted, or Declined');
    }
    
    return errors;
  }
}

module.exports = Appointment;
