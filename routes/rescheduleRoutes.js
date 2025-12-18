const express = require('express');
const router = express.Router();
const RescheduleController = require('../controllers/RescheduleController');

// POST create reschedule
router.post('/', RescheduleController.createReschedule);

// GET all reschedules
router.get('/', RescheduleController.getAllReschedules);

// GET reschedule by ID
router.get('/:rescheduleId', RescheduleController.getRescheduleById);

// PUT update reschedule
router.put('/:rescheduleId', RescheduleController.updateReschedule);

// DELETE reschedule
router.delete('/:rescheduleId', RescheduleController.deleteReschedule);

// GET reschedules by patientId
router.get('/patient/:patientId', RescheduleController.getReschedulesByPatientId);

module.exports = router;
