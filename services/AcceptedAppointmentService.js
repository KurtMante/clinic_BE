const acceptedAppointmentRepository = require('../repositories/AcceptedAppointmentRepository');
const appointmentRepository = require('../repositories/AppointmentRepository');
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
}

module.exports = new AcceptedAppointmentService();
