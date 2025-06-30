class Feedback {
  constructor(feedbackId, patientId, rating, comment, isAnonymous = false) {
    this.feedbackId = feedbackId;
    this.patientId = patientId;
    this.rating = rating; // 1-5 star rating
    this.comment = comment;
    this.isAnonymous = isAnonymous; // boolean: 0 = not anonymous, 1 = anonymous
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
