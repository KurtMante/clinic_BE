const acceptedAppointmentRepository = require('../repositories/AcceptedAppointmentRepository');
const appointmentRepository = require('../repositories/AppointmentRepository');
const patientRepository = require('../repositories/PatientRepository');
const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const { sendSms } = require('./SmsService');
const AcceptedAppointment = require('../models/AcceptedAppointment');
const reminderService = require('./ReminderService');

class AcceptedAppointmentService {
  async getAllAcceptedAppointments() {
    try {
      return await acceptedAppointmentRepository.findAll();
    } catch (error) {
      console.error('Service error getting all accepted appointments:', error);
      throw new Error('Failed to retrieve accepted appointments');
    }
  }

  async getAcceptedAppointmentById(acceptedAppointmentId) {
    try {
      const acceptedAppointment = await acceptedAppointmentRepository.findById(acceptedAppointmentId);
      if (!acceptedAppointment) {
        throw new Error(`Accepted appointment with ID ${acceptedAppointmentId} not found`);
      }
      return acceptedAppointment;
    } catch (error) {
      console.error('Service error getting accepted appointment by ID:', error);
      throw error;
    }
  }

  async getAcceptedAppointmentsByPatientId(patientId) {
    try {
      return await acceptedAppointmentRepository.findByPatientId(patientId);
    } catch (error) {
      console.error('Service error getting accepted appointments by patient ID:', error);
      throw error;
    }
  }

  async getPendingAppointments() {
    try {
      return await acceptedAppointmentRepository.findByAttendanceStatus(0);
    } catch (error) {
      console.error('Service error getting pending appointments:', error);
      throw error;
    }
  }

  async getAttendedAppointments() {
    try {
      return await acceptedAppointmentRepository.findByAttendanceStatus(1);
    } catch (error) {
      console.error('Service error getting attended appointments:', error);
      throw error;
    }
  }

  async createAcceptedAppointment(appointmentId) {
    try {
      // Get the original appointment
      const originalAppointment = await appointmentRepository.findById(appointmentId);
      if (!originalAppointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }

      // Check if appointment is already accepted
      const existingAccepted = await acceptedAppointmentRepository.findByAppointmentId(appointmentId);
      if (existingAccepted) {
        throw new Error('This appointment has already been accepted');
      }

      // Create accepted appointment
      const acceptedAppointmentData = {
        appointmentId: originalAppointment.appointmentId,
        patientId: originalAppointment.patientId,
        serviceId: originalAppointment.serviceId,
        preferredDateTime: originalAppointment.preferredDateTime,
        symptom: originalAppointment.symptom,
        isAttended: 0
      };

      // Update original appointment status to 'Accepted'
      await appointmentRepository.update(appointmentId, { status: 'Accepted' });

      // Save to accepted appointments table
      const savedAcceptedAppointment = await acceptedAppointmentRepository.save(acceptedAppointmentData);

      // Create reminder for the accepted appointment
      try {
        await reminderService.createReminderForAcceptedAppointment(appointmentId);
        console.log('Reminder created for accepted appointment:', appointmentId);
      } catch (reminderError) {
        console.error('Failed to create reminder for accepted appointment:', reminderError.message);
        // Don't throw error here, as the accepted appointment was created successfully
      }

      return savedAcceptedAppointment;
    } catch (error) {
      console.error('Service error creating accepted appointment:', error);
      throw error;
    }
  }

  async markAsAttended(acceptedAppointmentId) {
    try {
      const acceptedAppointment = await this.getAcceptedAppointmentById(acceptedAppointmentId);
      
      if (acceptedAppointment.isAttended === 1) {
        throw new Error('This appointment has already been marked as attended');
      }

      return await acceptedAppointmentRepository.updateAttendanceStatus(acceptedAppointmentId, 1);
    } catch (error) {
      console.error('Service error marking appointment as attended:', error);
      throw error;
    }
  }

  async markAsNotAttended(acceptedAppointmentId) {
    try {
      const acceptedAppointment = await this.getAcceptedAppointmentById(acceptedAppointmentId);
      
      if (acceptedAppointment.isAttended === 0) {
        throw new Error('This appointment is already marked as not attended');
      }

      return await acceptedAppointmentRepository.updateAttendanceStatus(acceptedAppointmentId, 0);
    } catch (error) {
      console.error('Service error marking appointment as not attended:', error);
      throw error;
    }
  }

  async deleteAcceptedAppointment(acceptedAppointmentId) {
    try {
      await this.getAcceptedAppointmentById(acceptedAppointmentId);
      
      const success = await acceptedAppointmentRepository.deleteById(acceptedAppointmentId);
      if (!success) {
        throw new Error('Failed to delete accepted appointment');
      }
      
      return { message: 'Accepted appointment deleted successfully' };
    } catch (error) {
      console.error('Service error deleting accepted appointment:', error);
      throw error;
    }
  }

  async acceptAppointment(appointmentId) {
    // 1. Get original appointment
    const appointment = await appointmentRepository.findById
      ? await appointmentRepository.findById(appointmentId)
      : await appointmentRepository.getAppointmentById(appointmentId);
    if (!appointment) throw new Error('Appointment not found');
    if (appointment.status && appointment.status.toLowerCase() === 'accepted') {
      throw new Error('Appointment already accepted');
    }

    // 2. Get service details
    let service = null;
    if (appointment.serviceId) {
      service = await medicalServiceRepository.findById
        ? await medicalServiceRepository.findById(appointment.serviceId)
        : null;
    }

    // 3. Create accepted appointment record
    const accepted = await acceptedAppointmentRepository.save({
      appointmentId: appointment.appointmentId,
      patientId: appointment.patientId,
      serviceId: appointment.serviceId,
      preferredDateTime: appointment.preferredDateTime,
      symptom: appointment.symptom,
      isAttended: 0
    });

    // 4. Update original appointment status (if repository has a method; else run raw)
    if (appointmentRepository.updateStatus) {
      await appointmentRepository.updateStatus(appointmentId, 'accepted');
    } else if (appointmentRepository.update) {
      await appointmentRepository.update(appointmentId, { status: 'accepted' });
    }

    // 5. Fetch patient for phone
    const patient = await patientRepository.findById
      ? await patientRepository.findById(appointment.patientId)
      : await patientRepository.getPatientById(appointment.patientId);

    // 6. Send SMS (non-blocking)
    if (patient && patient.phone) {
      const dateStr = new Date(appointment.preferredDateTime)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 16);
      const svcName = service?.serviceName || 'your service';
      const msg = `Your appointment (${appointment.appointmentId}) for ${svcName} on ${dateStr} has been accepted.`;
      sendSms(patient.phone, msg).catch(e =>
        console.warn('Failed to send accept SMS:', e.message)
      );
    }

    return accepted;
  }

  async setAttendance(acceptedAppointmentId, isAttended) {
    const updated = await acceptedAppointmentRepository.updateAttendanceStatus(
      acceptedAppointmentId,
      isAttended ? 1 : 0
    );

    // Notify patient (optional)
    try {
      const patient = await patientRepository.findById
        ? await patientRepository.findById(updated.patientId)
        : await patientRepository.getPatientById(updated.patientId);
      if (patient?.phone) {
        const msg = isAttended
          ? `Thank you for attending appointment ${updated.appointmentId}.`
          : `You were marked absent for appointment ${updated.appointmentId}. Contact us to reschedule.`;
        sendSms(patient.phone, msg).catch(e =>
          console.warn('Failed to send attendance SMS:', e.message)
        );
      }
    } catch (e) {
      console.warn('Attendance SMS skipped:', e.message);
    }

    return updated;
  }
}

module.exports = new AcceptedAppointmentService();
