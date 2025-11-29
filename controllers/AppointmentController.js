const appointmentService = require('../services/AppointmentService');
const scheduleRepository = require('../repositories/ScheduleRepository');

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
      await assertDoctorAvailable(req.body.preferredDateTime);
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
      if (req.body.preferredDateTime) {
        await assertDoctorAvailable(req.body.preferredDateTime);
      }
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

async function assertDoctorAvailable(preferredDateTime) {
  const d = new Date(preferredDateTime);
  if (isNaN(d)) throw new Error('Invalid preferredDateTime');
  // JS getDay(): 0=Sunday .. 6=Saturday; your schedule uses 0=Monday so remap
  const jsWeekday = d.getDay(); // 0 Sun
  const weekday = (jsWeekday + 6) % 7; // converts: Sun(0)->6, Mon(1)->0 ... Sat(6)->5
  const sched = await scheduleRepository.findByWeekday(weekday);
  if (!sched) return;

  const status = (sched.status || '').toUpperCase();
  if (['UNAVAILABLE','DAY_OFF'].includes(status)) {
    throw new Error('Doctor not available on selected day.');
  }

  if (['AVAILABLE','HALF_DAY'].includes(status) && sched.startTime && sched.endTime) {
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const current = `${hh}:${mm}`;
    const start = sched.startTime.slice(0,5); // HH:MM
    const end = sched.endTime.slice(0,5);     // HH:MM
    if (current < start || current > end) {
      throw new Error(`Time outside available window (${start} - ${end}).`);
    }
  }
}

module.exports = new AppointmentController();
