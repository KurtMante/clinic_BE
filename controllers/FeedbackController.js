const feedbackService = require('../services/FeedbackService');

class FeedbackController {
  async getAllFeedback(req, res) {
    try {
      const feedback = await feedbackService.getAllFeedback();
      res.status(200).json(feedback);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getFeedbackById(req, res) {
    try {
      const feedback = await feedbackService.getFeedbackById(req.params.feedbackId);
      res.status(200).json(feedback);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getFeedbackByPatientId(req, res) {
    try {
      const feedback = await feedbackService.getFeedbackByPatientId(req.params.patientId);
      res.status(200).json(feedback);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getFeedbackByRating(req, res) {
    try {
      const rating = parseInt(req.params.rating);
      const feedback = await feedbackService.getFeedbackByRating(rating);
      res.status(200).json(feedback);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAverageRating(req, res) {
    try {
      const stats = await feedbackService.getAverageRating();
      res.status(200).json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createFeedback(req, res) {
    try {
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          error: 'Request body is empty',
          hint: 'Make sure to send JSON data with patientId, rating, and comment'
        });
      }

      const feedback = await feedbackService.createFeedback(req.body);
      res.status(201).json(feedback);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateFeedback(req, res) {
    try {
      const feedback = await feedbackService.updateFeedback(req.params.feedbackId, req.body);
      res.status(200).json(feedback);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteFeedback(req, res) {
    try {
      const result = await feedbackService.deleteFeedback(req.params.feedbackId);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}

module.exports = new FeedbackController();
