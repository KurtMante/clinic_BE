const express = require('express');
const feedbackController = require('../controllers/FeedbackController');

const router = express.Router();

// GET all feedback
router.get('/', feedbackController.getAllFeedback);

// GET feedback statistics
router.get('/stats/average', feedbackController.getAverageRating);

// GET feedback by patient ID
router.get('/patient/:patientId', feedbackController.getFeedbackByPatientId);

// GET feedback by rating
router.get('/rating/:rating', feedbackController.getFeedbackByRating);

// GET feedback by ID
router.get('/:feedbackId', feedbackController.getFeedbackById);

// POST create new feedback
router.post('/', feedbackController.createFeedback);

// PUT update feedback
router.put('/:feedbackId', feedbackController.updateFeedback);

// DELETE feedback
router.delete('/:feedbackId', feedbackController.deleteFeedback);

module.exports = router;
router.put('/:feedbackId', feedbackController.updateFeedback);

// DELETE feedback
router.delete('/:feedbackId', feedbackController.deleteFeedback);

module.exports = router;
