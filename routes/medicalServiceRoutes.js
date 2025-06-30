const express = require('express');
const medicalServiceController = require('../controllers/MedicalServiceController');

const router = express.Router();

// GET all medical services
router.get('/', medicalServiceController.getAllMedicalServices);

// GET medical service by ID
router.get('/:serviceId', medicalServiceController.getMedicalServiceById);

// POST create new medical service
router.post('/', medicalServiceController.createMedicalService);

// PUT update medical service
router.put('/:serviceId', medicalServiceController.updateMedicalService);

// DELETE medical service
router.delete('/:serviceId', medicalServiceController.deleteMedicalService);

module.exports = router;
