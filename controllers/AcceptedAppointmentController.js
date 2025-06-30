const acceptedAppointmentService = require('../services/AcceptedAppointmentService');

class AcceptedAppointmentController {
  // GET /api/accepted-appointments
  async getAllAcceptedAppointments(req, res) {
    try {
      const acceptedAppointments = await acceptedAppointmentService.getAllAcceptedAppointments();
      res.status(200).json(acceptedAppointments);
    } catch (error) {
      console.error('Controller error getting all accepted appointments:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve accepted appointments',
        details: error.message 
      });
    }
  }

  // GET /api/accepted-appointments/:acceptedAppointmentId
  async getAcceptedAppointmentById(req, res) {
    try {
      const acceptedAppointmentId = req.params.acceptedAppointmentId;
      const acceptedAppointment = await acceptedAppointmentService.getAcceptedAppointmentById(acceptedAppointmentId);
      res.status(200).json(acceptedAppointment);
    } catch (error) {
      console.error('Controller error getting accepted appointment by ID:', error);
      res.status(404).json({ 
        error: 'Accepted appointment not found',
        details: error.message 
      });
    }
  }

  // GET /api/accepted-appointments/patient/:patientId
  async getAcceptedAppointmentsByPatientId(req, res) {
    try {
      const patientId = req.params.patientId;
      const acceptedAppointments = await acceptedAppointmentService.getAcceptedAppointmentsByPatientId(patientId);
      res.status(200).json(acceptedAppointments);
    } catch (error) {
      console.error('Controller error getting accepted appointments by patient ID:', error);
      res.status(404).json({ 
        error: 'No accepted appointments found for this patient',
        details: error.message 
      });
    }
  }

  // GET /api/accepted-appointments/pending
  async getPendingAppointments(req, res) {
    try {
      const pendingAppointments = await acceptedAppointmentService.getPendingAppointments();
      res.status(200).json(pendingAppointments);
    } catch (error) {
      console.error('Controller error getting pending appointments:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve pending appointments',
        details: error.message 
      });
    }
  }

  // GET /api/accepted-appointments/attended
  async getAttendedAppointments(req, res) {
    try {
      const attendedAppointments = await acceptedAppointmentService.getAttendedAppointments();
      res.status(200).json(attendedAppointments);
    } catch (error) {
      console.error('Controller error getting attended appointments:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve attended appointments',
        details: error.message 
      });
    }
  }

  // POST /api/accepted-appointments/accept/:appointmentId
  async acceptAppointment(req, res) {
    try {
      const appointmentId = req.params.appointmentId;
      const acceptedAppointment = await acceptedAppointmentService.createAcceptedAppointment(appointmentId);
      res.status(201).json(acceptedAppointment);
    } catch (error) {
      console.error('Controller error accepting appointment:', error);
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT /api/accepted-appointments/:acceptedAppointmentId/attend
  async markAsAttended(req, res) {
    try {
      const acceptedAppointmentId = req.params.acceptedAppointmentId;
      const updatedAppointment = await acceptedAppointmentService.markAsAttended(acceptedAppointmentId);
      res.status(200).json(updatedAppointment);
    } catch (error) {
      console.error('Controller error marking as attended:', error);
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT /api/accepted-appointments/:acceptedAppointmentId/not-attend
  async markAsNotAttended(req, res) {
    try {
      const acceptedAppointmentId = req.params.acceptedAppointmentId;
      const updatedAppointment = await acceptedAppointmentService.markAsNotAttended(acceptedAppointmentId);
      res.status(200).json(updatedAppointment);
    } catch (error) {
      console.error('Controller error marking as not attended:', error);
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // DELETE /api/accepted-appointments/:acceptedAppointmentId
  async deleteAcceptedAppointment(req, res) {
    try {
      const acceptedAppointmentId = req.params.acceptedAppointmentId;
      const result = await acceptedAppointmentService.deleteAcceptedAppointment(acceptedAppointmentId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Controller error deleting accepted appointment:', error);
      res.status(404).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AcceptedAppointmentController();
