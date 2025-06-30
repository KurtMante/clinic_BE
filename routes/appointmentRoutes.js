const express = require('express');
const appointmentController = require('../controllers/AppointmentController');

const router = express.Router();

// GET all appointments
router.get('/', appointmentController.getAllAppointments);

// GET appointments by patient ID
router.get('/patient/:patientId', appointmentController.getAppointmentsByPatientId);

// GET appointment by ID
router.get('/:appointmentId', appointmentController.getAppointmentById);

// POST create new appointment
router.post('/', appointmentController.createAppointment);

// PUT update appointment
router.put('/:appointmentId', appointmentController.updateAppointment);

// DELETE appointment
router.delete('/:appointmentId', appointmentController.deleteAppointment);

module.exports = router;
