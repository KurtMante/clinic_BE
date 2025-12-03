const appointmentRepository = require('../repositories/AppointmentRepository');
const patientRepository = require('../repositories/PatientRepository');
const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const Appointment = require('../models/Appointment');
const { sendEmail } = require('./EmailService');

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
      const { patientId, serviceId, preferredDateTime, symptom, status, isWalkIn } = appointmentData;

      // Validate required fields
      if (!patientId) throw new Error('Patient ID is required');
      if (!serviceId) throw new Error('Service ID is required');
      if (!preferredDateTime) throw new Error('Preferred date/time is required');

      const appointmentTime = new Date(preferredDateTime);
      const currentTime = new Date();

      // Check if patient is a walk-in (by role or flag)
      const patient = await patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }
      const isWalkInPatient = isWalkIn || patient.role === 'Walkin';

      // Skip past/future validation for walk-in patients
      if (!isWalkInPatient) {
        console.log('Current time:', currentTime.toISOString());
        console.log('Appointment time:', appointmentTime.toISOString());
        console.log('Is in past?', appointmentTime < currentTime);

        const bufferMs = 60 * 1000; // 1 minute buffer
        if (appointmentTime.getTime() < currentTime.getTime() - bufferMs) {
          throw new Error(
            `Appointment cannot be scheduled in the past or too soon. ` +
            `Current time: ${currentTime.toLocaleString()}, ` +
            `Requested time: ${appointmentTime.toLocaleString()}`
          );
        }
      }

      // Validate service exists
      const service = await medicalServiceRepository.findById(serviceId);
      if (!service) {
        throw new Error(`Medical service with ID ${serviceId} not found`);
      }

      // Check for global time slot conflicts (any patient)
      const timeSlotConflicts = await appointmentRepository.findAppointmentsByTimeSlot(
        preferredDateTime
      );

      if (timeSlotConflicts.length > 0) {
        const conflictTime = new Date(timeSlotConflicts[0].preferredDateTime);
        throw new Error(
          `This time slot is already booked. There is an appointment at ${conflictTime.toLocaleString()}. ` +
          `Each appointment requires a 1-hour time slot. Please choose a different time.`
        );
      }

      // Check for patient-specific conflicts
      const patientConflicts = await appointmentRepository.findConflictingAppointments(
        patientId,
        preferredDateTime
      );

      if (patientConflicts.length > 0) {
        const conflictTime = new Date(patientConflicts[0].preferredDateTime);
        throw new Error(
          `Patient already has an appointment at ${conflictTime.toLocaleString()}. ` +
          `Each appointment requires a 1-hour time slot. Please choose a different time.`
        );
      }

      // Create and validate model
      const appointment = new Appointment(
        null,
        patientId,
        serviceId,
        preferredDateTime,
        symptom.trim(),
        status || 'Pending'
      );

      const validationErrors = appointment.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Save to database
      const savedAppointment = await appointmentRepository.save({
        patientId,
        serviceId,
        preferredDateTime,
        symptom: symptom.trim(),
        status: status || 'Pending'
      });

      // Send email notification
      try {
        if (patient?.email) {
          const subject = `Appointment Created (ID: ${savedAppointment.appointmentId})`;
          const text = `Your appointment is pending on ${savedAppointment.preferredDateTime}.`;
          const html = `
            <h3>Appointment Created</h3>
            <p>Hi ${patient.firstName || 'Patient'},</p>
            <p>Your appointment (ID <strong>${savedAppointment.appointmentId}</strong>) has been created with status <strong>${savedAppointment.status}</strong>.</p>
            <p><strong>Date/Time:</strong> ${savedAppointment.preferredDateTime}</p>
            <p><strong>Reason:</strong> ${savedAppointment.symptom}</p>
            <p>We will notify you when it is accepted.</p>
          `;
          sendEmail({ toEmail: patient.email, toName: patient.firstName || '', subject, text, html });
        }
      } catch (e) {
        console.warn('Create appointment email skipped:', e.message);
      }

      return savedAppointment;
    } catch (error) {
      console.error('Service error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(appointmentId, appointmentData) {
    try {
      const existingAppointment = await this.getAppointmentById(appointmentId);

      // Validate status if being updated
      if (appointmentData.status !== undefined) {
        const validStatuses = ['Pending', 'Accepted', 'Declined'];
        if (!validStatuses.includes(appointmentData.status)) {
          throw new Error('Status must be one of: Pending, Accepted, or Declined');
        }
      }

      // Validate foreign key references if being updated
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

        const appointmentDate = new Date(newDateTime);
        if (isNaN(appointmentDate.getTime())) {
          throw new Error('Invalid date and time format. Use YYYY-MM-DD HH:MM:SS');
        }

        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

        if (appointmentDate <= fiveMinutesFromNow) {
          throw new Error(`Appointment cannot be scheduled in the past or too soon. Current time: ${now.toLocaleString()}, Requested time: ${appointmentDate.toLocaleString()}`);
        }

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

      // Check for patient-specific conflicts
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

      // Email notification on status or datetime change
      try {
        if (appointmentData.status || appointmentData.preferredDateTime) {
          const patient = await patientRepository.findById(updatedAppointment.patientId);
          if (patient?.email) {
            const subject = `Appointment Updated (ID: ${appointmentId})`;
            const changes = [];
            if (appointmentData.status) changes.push(`Status: ${appointmentData.status}`);
            if (appointmentData.preferredDateTime) changes.push(`Date/Time: ${appointmentData.preferredDateTime}`);
            const text = `Your appointment ${appointmentId} was updated. ${changes.join(' | ')}`;
            const html = `
              <h3>Appointment Updated</h3>
              <p>Hi ${patient.firstName || 'Patient'},</p>
              <p>Your appointment (ID <strong>${appointmentId}</strong>) has been updated.</p>
              <p>${changes.map(c => `<div>${c}</div>`).join('')}</p>
            `;
            sendEmail({ toEmail: patient.email, toName: patient.firstName || '', subject, text, html });
          }
        }
      } catch (e) {
        console.warn('Update appointment email skipped:', e.message);
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Service error updating appointment:', error);
      throw error;
    }
  }

  async deleteAppointment(appointmentId) {
    try {
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
