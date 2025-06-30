const express = require('express');
const acceptedAppointmentController = require('../controllers/AcceptedAppointmentController');

const router = express.Router();

// GET all accepted appointments
router.get('/', acceptedAppointmentController.getAllAcceptedAppointments);

// GET pending appointments (not attended)
router.get('/pending', acceptedAppointmentController.getPendingAppointments);

// GET attended appointments
router.get('/attended', acceptedAppointmentController.getAttendedAppointments);

// GET accepted appointments by patient ID
router.get('/patient/:patientId', acceptedAppointmentController.getAcceptedAppointmentsByPatientId);

// POST accept an appointment (move from appointments to accepted_appointments)
router.post('/accept/:appointmentId', acceptedAppointmentController.acceptAppointment);

// PUT mark appointment as attended
router.put('/:acceptedAppointmentId/attend', acceptedAppointmentController.markAsAttended);

// PUT mark appointment as not attended
router.put('/:acceptedAppointmentId/not-attend', acceptedAppointmentController.markAsNotAttended);

// GET accepted appointment by ID
router.get('/:acceptedAppointmentId', acceptedAppointmentController.getAcceptedAppointmentById);

// DELETE accepted appointment
router.delete('/:acceptedAppointmentId', acceptedAppointmentController.deleteAcceptedAppointment);

module.exports = router;
