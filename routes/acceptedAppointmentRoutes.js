const express = require('express');
const controller = require('../controllers/AcceptedAppointmentController');

const router = express.Router();

// Accept appointment
router.post('/accept/:appointmentId', controller.acceptAppointment);

// Mark attendance
router.put('/:acceptedAppointmentId/attend', controller.markAttended);
router.put('/:acceptedAppointmentId/not-attend', controller.markNotAttended);

// GET all accepted appointments
router.get('/', controller.getAllAcceptedAppointments);

// GET pending appointments (not attended)
router.get('/pending', controller.getPendingAppointments);

// GET attended appointments
router.get('/attended', controller.getAttendedAppointments);

// GET accepted appointments by patient ID
router.get('/patient/:patientId', controller.getAcceptedAppointmentsByPatientId);

// GET accepted appointment by ID
router.get('/:acceptedAppointmentId', controller.getAcceptedAppointmentById);

// DELETE accepted appointment
router.delete('/:acceptedAppointmentId', controller.deleteAcceptedAppointment);

// ADD THIS LINE for POST /api/accepted-appointments
router.post('/', controller.createAcceptedAppointment);

module.exports = router;
