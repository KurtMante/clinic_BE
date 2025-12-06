const feedbackRepository = require('../repositories/FeedbackRepository');
const patientRepository = require('../repositories/PatientRepository');
const Feedback = require('../models/Feedback');

class FeedbackService {
  async getAllFeedback() {
    try {
      return await feedbackRepository.findAll();
    } catch (error) {
      console.error('Service error getting all feedback:', error);
      throw new Error('Failed to retrieve feedback');
    }
  }

  async getFeedbackById(feedbackId) {
    try {
      const feedback = await feedbackRepository.findById(feedbackId);
      if (!feedback) {
        throw new Error(`Feedback with ID ${feedbackId} not found`);
      }
      return feedback;
    } catch (error) {
      console.error('Service error getting feedback by ID:', error);
      throw error;
    }
  }

  async getFeedbackByPatientId(patientId) {
    try {
      const patient = await patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }
      return await feedbackRepository.findByPatientId(patientId);
    } catch (error) {
      console.error('Service error getting feedback by patient ID:', error);
      throw error;
    }
  }

  async getFeedbackByRating(rating) {
    try {
      if (!rating || rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      return await feedbackRepository.findByRating(rating);
    } catch (error) {
      console.error('Service error getting feedback by rating:', error);
      throw error;
    }
  }

  async createFeedback(feedbackData) {
    try {
      if (!feedbackData) {
        throw new Error('Feedback data is required');
      }
      
      if (!feedbackData.patientId) {
        throw new Error('Patient ID is required');
      }
      
      if (!feedbackData.rating || feedbackData.rating < 1 || feedbackData.rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      if (!feedbackData.comment || feedbackData.comment.trim() === '') {
        throw new Error('Comment is required');
      }

      const patient = await patientRepository.findById(feedbackData.patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${feedbackData.patientId} not found`);
      }

      const feedback = new Feedback(
        null,
        feedbackData.patientId,
        parseInt(feedbackData.rating),
        feedbackData.comment.trim(),
        feedbackData.isAnonymous || false,
        feedbackData.serviceId || null // <-- Add this line
      );

      const validationErrors = feedback.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      return await feedbackRepository.save({
        patientId: feedback.patientId,
        rating: feedback.rating,
        comment: feedback.comment,
        isAnonymous: feedback.isAnonymous,
        serviceId: feedback.serviceId // <-- Add this line
      });
    } catch (error) {
      console.error('Service error creating feedback:', error);
      throw error;
    }
  }

  async updateFeedback(feedbackId, feedbackData) {
    try {
      await this.getFeedbackById(feedbackId);
      
      if (feedbackData.rating !== undefined) {
        if (feedbackData.rating < 1 || feedbackData.rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
      }

      if (feedbackData.comment !== undefined) {
        if (!feedbackData.comment || feedbackData.comment.trim() === '') {
          throw new Error('Comment cannot be empty');
        }
      }

      return await feedbackRepository.update(feedbackId, feedbackData);
    } catch (error) {
      console.error('Service error updating feedback:', error);
      throw error;
    }
  }

  async deleteFeedback(feedbackId) {
    try {
      await this.getFeedbackById(feedbackId);
      const success = await feedbackRepository.deleteById(feedbackId);
      if (!success) {
        throw new Error('Failed to delete feedback');
      }
      return { message: 'Feedback deleted successfully' };
    } catch (error) {
      console.error('Service error deleting feedback:', error);
      throw error;
    }
  }

  async getAverageRating() {
    try {
      const result = await feedbackRepository.getAverageRating();
      return {
        averageRating: result.averageRating ? parseFloat(result.averageRating).toFixed(2) : 0,
        totalFeedback: result.totalFeedback || 0
      };
    } catch (error) {
      console.error('Service error getting average rating:', error);
      throw error;
    }
  }
}

module.exports = new FeedbackService();
