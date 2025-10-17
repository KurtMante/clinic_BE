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


  //get/ api/accepted-appointments/:acceptedAppointmentId
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
      const accepted = await acceptedAppointmentService.acceptAppointment(
        req.params.appointmentId
      );
      res.status(201).json(accepted);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  // PUT /api/accepted-appointments/:acceptedAppointmentId/attend
  async markAttended(req, res) {
    try {
      const updated = await acceptedAppointmentService.setAttendance(
        req.params.acceptedAppointmentId,
        true
      );
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  // PUT /api/accepted-appointments/:acceptedAppointmentId/not-attend
  async markNotAttended(req, res) {
    try {
      const updated = await acceptedAppointmentService.setAttendance(
        req.params.acceptedAppointmentId,
        false
      );
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  // DELETE /api/accepted-appointments/:acceptedAppointmentId
  async deleteAcceptedAppointment(req, res) {
    try {
      const id = req.params.acceptedAppointmentId;
      const result = await acceptedAppointmentService.deleteAcceptedAppointment(id);
      res.json(result);
    } catch (e) {
      res.status(404).json({ error: e.message });
    }
  }
}

module.exports = new AcceptedAppointmentController();
