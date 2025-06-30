const appointmentService = require('../services/AppointmentService');

class AppointmentController {
  // GET /api/appointments
  async getAllAppointments(req, res) {
    try {
      const appointments = await appointmentService.getAllAppointments();
      res.status(200).json(appointments);
    } catch (error) {
      console.error('Controller error getting all appointments:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve appointments',
        details: error.message 
      });
    }
  }

  // GET /api/appointments/:appointmentId
  async getAppointmentById(req, res) {
    try {
      const appointmentId = req.params.appointmentId;
      const appointment = await appointmentService.getAppointmentById(appointmentId);
      res.status(200).json(appointment);
    } catch (error) {
      console.error('Controller error getting appointment by ID:', error);
      res.status(404).json({ 
        error: 'Appointment not found',
        details: error.message 
      });
    }
  }

  // GET /api/appointments/patient/:patientId
  async getAppointmentsByPatientId(req, res) {
    try {
      const patientId = req.params.patientId;
      const appointments = await appointmentService.getAppointmentsByPatientId(patientId);
      res.status(200).json(appointments);
    } catch (error) {
      console.error('Controller error getting appointments by patient ID:', error);
      res.status(404).json({ 
        error: 'Patient not found or no appointments',
        details: error.message 
      });
    }
  }

  // POST /api/appointments
  async createAppointment(req, res) {
    try {
      console.log('=== APPOINTMENT CONTROLLER CREATE DEBUG ===');
      console.log('Request body:', req.body);
      console.log('============================================');

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          error: 'Request body is empty',
          hint: 'Make sure to send JSON data with patientId, serviceId, preferredDateTime, and symptom' 
        });
      }

      const appointment = await appointmentService.createAppointment(req.body);
      res.status(201).json(appointment);
    } catch (error) {
      console.error('Controller error creating appointment:', error);
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT /api/appointments/:appointmentId
  async updateAppointment(req, res) {
    try {
      const appointmentId = req.params.appointmentId;
      const appointment = await appointmentService.updateAppointment(appointmentId, req.body);
      res.status(200).json(appointment);
    } catch (error) {
      console.error('Controller error updating appointment:', error);
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // DELETE /api/appointments/:appointmentId
  async deleteAppointment(req, res) {
    try {
      const appointmentId = req.params.appointmentId;
      const result = await appointmentService.deleteAppointment(appointmentId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Controller error deleting appointment:', error);
      res.status(404).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AppointmentController();
