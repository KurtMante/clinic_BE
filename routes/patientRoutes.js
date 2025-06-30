const express = require('express');
const patientController = require('../controllers/PatientController');

const router = express.Router();

router.get('/', patientController.getAllPatients);
router.get('/:patientId', patientController.getPatientById);
router.post('/', patientController.createPatient);
router.put('/:patientId', patientController.updatePatient);
router.delete('/:patientId', patientController.deletePatient);

// POST login patient
router.post('/login', patientController.loginPatient);

// PUT change password
router.put('/:patientId/change-password', patientController.changePassword);

module.exports = router;
