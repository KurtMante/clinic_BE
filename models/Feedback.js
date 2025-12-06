class Feedback {
  constructor(feedbackId, patientId, rating, comment, isAnonymous = false, serviceId = null) {
    this.feedbackId = feedbackId;
    this.patientId = patientId;
    this.rating = rating;
    this.comment = comment;
    this.isAnonymous = isAnonymous;
    this.serviceId = serviceId; // <-- Add this line
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Validation method
  validate() {
    const errors = [];
    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.rating || this.rating < 1 || this.rating > 5) errors.push('Rating must be between 1 and 5');
    if (!this.comment || this.comment.trim() === '') errors.push('Comment is required');
    return errors;
  }
}

module.exports = Feedback;
