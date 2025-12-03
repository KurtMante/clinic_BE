const appointmentService = require('../services/AppointmentService');
const scheduleRepository = require('../repositories/ScheduleRepository');

async function assertDoctorAvailable(preferredDateTime, isWalkIn = false) {
  // Skip availability check for walk-in patients during business hours
  if (isWalkIn) {
    return; // Allow walk-ins anytime (staff is registering them in person)
  }

  const d = new Date(preferredDateTime);
  if (isNaN(d)) throw new Error('Invalid preferredDateTime');

  // JS getDay(): 0=Sun ... 6=Sat; schedule uses 0=Mon so remap
  const jsWeekday = d.getDay();
  const weekday = (jsWeekday + 6) % 7; // Sun(0)->6, Mon(1)->0 ... Sat(6)->5

  const sched = await scheduleRepository.findByWeekday(weekday);
  if (!sched) return; // No schedule restriction

  const status = (sched.status || '').toUpperCase();
  if (['UNAVAILABLE', 'DAY_OFF'].includes(status)) {
    throw new Error('Doctor not available on selected day.');
  }

  // Handle both startTime/endTime (class) or start_time/end_time (raw row)
  const start = sched.startTime || sched.start_time;
  const end = sched.endTime || sched.end_time;

  if (['AVAILABLE', 'HALF_DAY'].includes(status) && start && end) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const current = `${hh}:${mm}`;
    const startHHMM = start.slice(0, 5);
    const endHHMM = end.slice(0, 5);
    if (current < startHHMM || current > endHHMM) {
      throw new Error(`Time outside available window (${startHHMM} - ${endHHMM}).`);
    }
  }
}

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
      const { patientId, serviceId, preferredDateTime, symptom, status, isWalkIn } = req.body;

      // Validate required fields
      if (!patientId) {
        return res.status(400).json({ error: 'Patient ID is required' });
      }
      if (!serviceId) {
        return res.status(400).json({ error: 'Service ID is required' });
      }
      if (!preferredDateTime) {
        return res.status(400).json({ error: 'Preferred date/time is required' });
      }

      // Check doctor availability (skip for walk-ins)
      await assertDoctorAvailable(preferredDateTime, isWalkIn);

      console.log('=== APPOINTMENT CONTROLLER CREATE DEBUG ===');
      console.log('Request body:', req.body);
      console.log('============================================');

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          error: 'Request body is empty',
          hint: 'Make sure to send JSON data with patientId, serviceId, preferredDateTime, and symptom' 
        });
      }

      const appointment = await appointmentService.createAppointment({
        patientId,
        serviceId,
        preferredDateTime,
        symptom,
        status,
        isWalkIn  // PASS THIS
      });
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

module.exports = new AppointmentController();
