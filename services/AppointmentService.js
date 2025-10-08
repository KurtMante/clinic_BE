const appointmentRepository = require('../repositories/AppointmentRepository');
const patientRepository = require('../repositories/PatientRepository');
const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const Appointment = require('../models/Appointment');
const { sendSms } = require('./SmsService');

class AppointmentService {
  async getAllAppointments() {
    try {
      return await appointmentRepository.findAll();
    } catch (error) {
      console.error('Service error getting all appointments:', error);
      throw new Error('Failed to retrieve appointments');
    }
  }

  async getAppointmentById(appointmentId) {
    try {
      const appointment = await appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }
      return appointment;
    } catch (error) {
      console.error('Service error getting appointment by ID:', error);
      throw error;
    }
  }

  async getAppointmentsByPatientId(patientId) {
    try {
      // Verify patient exists
      const patient = await patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }
      
      return await appointmentRepository.findByPatientId(patientId);
    } catch (error) {
      console.error('Service error getting appointments by patient ID:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData) {
    try {
      console.log('Appointment service received data:', appointmentData);
      
      // Basic validation
      if (!appointmentData) {
        throw new Error('Appointment data is required');
      }
      
      if (!appointmentData.patientId) {
        throw new Error('Patient ID is required');
      }
      
      if (!appointmentData.serviceId) {
        throw new Error('Service ID is required');
      }
      
      if (!appointmentData.preferredDateTime) {
        throw new Error('Preferred date and time is required');
      }
      
      if (!appointmentData.symptom || appointmentData.symptom.trim() === '') {
        throw new Error('Symptom is required');
      }

      // Validate status if provided
      if (appointmentData.status) {
        const validStatuses = ['Pending', 'Accepted', 'Declined'];
        if (!validStatuses.includes(appointmentData.status)) {
          throw new Error('Status must be one of: Pending, Accepted, or Declined');
        }
      }

      // Validate date and time format
      const appointmentDate = new Date(appointmentData.preferredDateTime);
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid date and time format. Use YYYY-MM-DD HH:MM:SS');
      }

      // Check if appointment is in the past (with a 5-minute buffer for processing)
      const now = new Date();
      const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
      
      console.log('Current time:', now.toISOString());
      console.log('Appointment time:', appointmentDate.toISOString());
      console.log('Is in past?', appointmentDate <= fiveMinutesFromNow);
      
      if (appointmentDate <= fiveMinutesFromNow) {
        throw new Error(`Appointment cannot be scheduled in the past or too soon. Current time: ${now.toLocaleString()}, Requested time: ${appointmentDate.toLocaleString()}`);
      }

      // Validate foreign key references
      const patient = await patientRepository.findById(appointmentData.patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${appointmentData.patientId} not found`);
      }

      const service = await medicalServiceRepository.findById(appointmentData.serviceId);
      if (!service) {
        throw new Error(`Medical service with ID ${appointmentData.serviceId} not found`);
      }

      // Check for global time slot conflicts (any patient)
      const timeSlotConflicts = await appointmentRepository.findAppointmentsByTimeSlot(
        appointmentData.preferredDateTime
      );

      if (timeSlotConflicts.length > 0) {
        const conflictTime = new Date(timeSlotConflicts[0].preferredDateTime);
        throw new Error(
          `This time slot is already booked. There is an appointment at ${conflictTime.toLocaleString()}. ` +
          `Each appointment requires a 1-hour time slot. Please choose a different time.`
        );
      }

      // Check for patient-specific conflicts (redundant but keeping for clarity)
      const patientConflicts = await appointmentRepository.findConflictingAppointments(
        appointmentData.patientId, 
        appointmentData.preferredDateTime
      );

      if (patientConflicts.length > 0) {
        const conflictTime = new Date(patientConflicts[0].preferredDateTime);
        throw new Error(
          `Patient already has an appointment at ${conflictTime.toLocaleString()}. ` +
          `Each appointment requires a 1-hour time slot. Please choose a different time.`
        );
      }

      // Create and validate model (status defaults to 'Pending' if not provided)
      const appointment = new Appointment(
        null,
        appointmentData.patientId,
        appointmentData.serviceId,
        appointmentData.preferredDateTime,
        appointmentData.symptom.trim(),
        appointmentData.status || 'Pending'
      );

      const validationErrors = appointment.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Save to database
      const savedAppointment = await appointmentRepository.save({
        patientId: appointment.patientId,
        serviceId: appointment.serviceId,
        preferredDateTime: appointment.preferredDateTime,
        symptom: appointment.symptom,
        status: appointment.status
      });

      // Fetch patient (adjust method name if different)
      try {
        const patient = await patientRepository.findById
          ? await patientRepository.findById(savedAppointment.patientId)
          : (await patientRepository.getPatientById(savedAppointment.patientId));

        const phone = patient?.phone;
        const dt = savedAppointment.preferredDateTime;
        const msg = `Appointment booked (ID: ${savedAppointment.appointmentId}) on ${dt} for service ${savedAppointment.serviceId}.`;
        sendSms(phone, msg).catch(e => console.warn('SMS send failed:', e.message));
      } catch (e) {
        console.warn('SMS skipped (patient lookup failed):', e.message);
      }

      return savedAppointment;
    } catch (error) {
      console.error('Service error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId, appointmentData) {
    try {
      // Check if appointment exists
      const existingAppointment = await this.getAppointmentById(appointmentId);

      // Validate status if being updated
      if (appointmentData.status !== undefined) {
        const validStatuses = ['Pending', 'Accepted', 'Declined'];
        if (!validStatuses.includes(appointmentData.status)) {
          throw new Error('Status must be one of: Pending, Accepted, or Declined');
        }
      }

      // Validate foreign key references if they're being updated
      if (appointmentData.patientId !== undefined) {
        const patient = await patientRepository.findById(appointmentData.patientId);
        if (!patient) {
          throw new Error(`Patient with ID ${appointmentData.patientId} not found`);
        }
      }

      if (appointmentData.serviceId !== undefined) {
        const service = await medicalServiceRepository.findById(appointmentData.serviceId);
        if (!service) {
          throw new Error(`Medical service with ID ${appointmentData.serviceId} not found`);
        }
      }

      // Check for time conflicts if date/time is being updated
      if (appointmentData.preferredDateTime !== undefined) {
        const newDateTime = appointmentData.preferredDateTime;

        // Validate date and time format
        const appointmentDate = new Date(newDateTime);
        if (isNaN(appointmentDate.getTime())) {
          throw new Error('Invalid date and time format. Use YYYY-MM-DD HH:MM:SS');
        }

        // Check if appointment is in the past (with a 5-minute buffer)
        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
        
        if (appointmentDate <= fiveMinutesFromNow) {
          throw new Error(`Appointment cannot be scheduled in the past or too soon. Current time: ${now.toLocaleString()}, Requested time: ${appointmentDate.toLocaleString()}`);
        }

        // Check for global time slot conflicts (excluding current appointment)
        const timeSlotConflicts = await appointmentRepository.findAppointmentsByTimeSlot(
          newDateTime,
          appointmentId
        );

        if (timeSlotConflicts.length > 0) {
          const conflictTime = new Date(timeSlotConflicts[0].preferredDateTime);
          throw new Error(
            `This time slot is already booked. There is an appointment at ${conflictTime.toLocaleString()}. ` +
            `Each appointment requires a 1-hour time slot. Please choose a different time.`
          );
        }
      }

      // Check for patient-specific conflicts if patient or time is being updated
      if (appointmentData.preferredDateTime !== undefined || appointmentData.patientId !== undefined) {
        const newDateTime = appointmentData.preferredDateTime || existingAppointment.preferredDateTime;
        const newPatientId = appointmentData.patientId || existingAppointment.patientId;

        const patientConflicts = await appointmentRepository.findConflictingAppointments(
          newPatientId, 
          newDateTime,
          appointmentId
        );

        if (patientConflicts.length > 0) {
          const conflictTime = new Date(patientConflicts[0].preferredDateTime);
          throw new Error(
            `Patient already has an appointment at ${conflictTime.toLocaleString()}. ` +
            `Each appointment requires a 1-hour time slot. Please choose a different time.`
          );
        }
      }

      const updatedAppointment = await appointmentRepository.update(appointmentId, appointmentData);

      // Optional: notify if status or datetime changed
      try {
        if (appointmentData.status || appointmentData.preferredDateTime) {
          const patient = await patientRepository.findById
            ? await patientRepository.findById(updatedAppointment.patientId)
            : (await patientRepository.getPatientById(updatedAppointment.patientId));
          const phone = patient?.phone;
          const msg = `Appointment ${appointmentId} updated: `
            + (appointmentData.status ? `status=${appointmentData.status} ` : '')
            + (appointmentData.preferredDateTime ? `date=${appointmentData.preferredDateTime}` : '');
          sendSms(phone, msg.trim()).catch(e => console.warn('SMS send failed:', e.message));
        }
      } catch (e) {
        console.warn('SMS update notice skipped:', e.message);
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Service error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(appointmentId) {
    try {
      // Check if appointment exists
      await this.getAppointmentById(appointmentId);

      const success = await appointmentRepository.deleteById(appointmentId);
      if (!success) {
        throw new Error('Failed to delete appointment');
      }
      
      return { message: 'Appointment deleted successfully' };
    } catch (error) {
      console.error('Service error deleting appointment:', error);
      throw error;
    }
  }
}

module.exports = new AppointmentService();
