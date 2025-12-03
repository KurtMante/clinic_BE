const reminderRepository = require('../repositories/ReminderRepository');
const patientRepository = require('../repositories/PatientRepository');
const appointmentRepository = require('../repositories/AppointmentRepository');
const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const Reminder = require('../models/Reminder');
const { sendEmail } = require('./EmailService');

class ReminderService {
  async getAllReminders() {
    try {
      return await reminderRepository.findAll();
    } catch (error) {
      console.error('Service error getting all reminders:', error);
      throw new Error('Failed to retrieve reminders');
    }
  }

  async getReminderById(reminderId) {
    try {
      const reminder = await reminderRepository.findById(reminderId);
      if (!reminder) {
        throw new Error(`Reminder with ID ${reminderId} not found`);
      }
      return reminder;
    } catch (error) {
      console.error('Service error getting reminder by ID:', error);
      throw error;
    }
  }

  async getRemindersByPatientId(patientId) {
    if (!patientId) throw new Error('Patient ID is required');
    try {
      return await reminderRepository.findByPatientId(patientId);
    } catch (error) {
      console.error('Service error getting reminders by patient ID:', error);
      throw error;
    }
  }

  async getUnreadRemindersByPatientId(patientId) {
    if (!patientId) throw new Error('Patient ID is required');
    try {
      return await reminderRepository.findUnreadByPatientId(patientId);
    } catch (error) {
      console.error('Service error getting unread reminders:', error);
      throw error;
    }
  }

  async createReminderForAcceptedAppointment(appointmentId) {
    try {
      console.log('Creating reminder for accepted appointment:', appointmentId);

      // Get appointment details
      const appointment = await appointmentRepository.findById(appointmentId);
      if (!appointment) {
        throw new Error(`Appointment with ID ${appointmentId} not found`);
      }

      // Get service details
      const service = await medicalServiceRepository.findById(appointment.serviceId);
      if (!service) {
        throw new Error(`Medical service with ID ${appointment.serviceId} not found`);
      }

      // Check if reminder already exists for this appointment
      const existingReminder = await reminderRepository.findByAppointmentId(appointmentId);
      if (existingReminder) {
        console.log('Reminder already exists for this appointment');
        return existingReminder;
      }

      // Format the appointment date and time
      const appointmentDate = new Date(appointment.preferredDateTime);
      const formattedDate = appointmentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Create reminder message
      const message = `Reminder: You have a ${service.serviceName} appointment on ${formattedDate} at ${formattedTime} with Dr. Wahing. Please arrive 10 minutes early.`;

      // Create and validate reminder
      const reminder = new Reminder(
        null,
        appointment.patientId,
        appointmentId,
        service.serviceName,
        appointment.preferredDateTime,
        message,
        false
      );

      const validationErrors = reminder.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Save to database
      const savedReminder = await reminderRepository.save({
        patientId: reminder.patientId,
        appointmentId: reminder.appointmentId,
        serviceName: reminder.serviceName,
        preferredDateTime: reminder.preferredDateTime,
        message: reminder.message,
        isRead: reminder.isRead ? 1 : 0
      });

      // Send email notification
      try {
        const patient = await patientRepository.findById(appointment.patientId);
        if (patient?.email) {
          const subject = `Appointment Reminder - ${service.serviceName}`;
          const html = `
            <h3>Appointment Reminder</h3>
            <p>Hi ${patient.firstName || 'Patient'},</p>
            <p>${message}</p>
            <p><strong>Service:</strong> ${service.serviceName}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Time:</strong> ${formattedTime}</p>
          `;
          sendEmail({
            toEmail: patient.email,
            toName: patient.firstName || '',
            subject,
            text: message,
            html
          });
        }
      } catch (e) {
        console.warn('Reminder email skipped:', e.message);
      }

      console.log('Reminder created successfully:', savedReminder.reminderId);
      return savedReminder;
    } catch (error) {
      console.error('Service error creating reminder for accepted appointment:', error);
      throw error;
    }
  }

  async createReminder(data) {
    try {
      const { patientId, appointmentId, serviceId, serviceName, message, preferredDateTime, isRead } = data;

      // Validate required fields
      if (!patientId) throw new Error('Patient ID is required');
      if (!message) throw new Error('Message is required');

      // Validate patient exists
      const patient = await patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }

      // Normalize datetime if provided
      let normalizedDateTime = null;
      if (preferredDateTime) {
        if (preferredDateTime.includes('T')) {
          const d = new Date(preferredDateTime);
          if (isNaN(d)) throw new Error('Invalid preferredDateTime');
          normalizedDateTime = d.toISOString().slice(0, 19).replace('T', ' ');
        } else {
          if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(preferredDateTime)) {
            throw new Error('preferredDateTime must be YYYY-MM-DD HH:mm:ss');
          }
          normalizedDateTime = preferredDateTime;
        }
      }

      // Resolve service name if serviceId provided
      let resolvedServiceName = serviceName || null;
      if (serviceId && !resolvedServiceName) {
        const service = await medicalServiceRepository.findById(serviceId);
        if (service) {
          resolvedServiceName = service.serviceName;
        }
      }

      // Create and validate reminder model
      const reminder = new Reminder(
        null,
        patientId,
        appointmentId || null,
        resolvedServiceName,
        normalizedDateTime,
        message,
        isRead ? true : false
      );

      const validationErrors = reminder.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Save to database
      const savedReminder = await reminderRepository.save({
        patientId: reminder.patientId,
        appointmentId: reminder.appointmentId,
        serviceName: reminder.serviceName,
        preferredDateTime: reminder.preferredDateTime,
        message: reminder.message,
        isRead: reminder.isRead ? 1 : 0
      });

      // Send email notification
      try {
        if (patient.email) {
          const subjectParts = ['Reminder'];
          if (resolvedServiceName) subjectParts.push(resolvedServiceName);
          if (normalizedDateTime) subjectParts.push(`(${normalizedDateTime})`);
          const subject = subjectParts.join(' ');

          const html = `
            <h3>Reminder</h3>
            <p>Hi ${patient.firstName || 'Patient'},</p>
            <p>${message}</p>
            ${resolvedServiceName ? `<p><strong>Service:</strong> ${resolvedServiceName}</p>` : ''}
            ${normalizedDateTime ? `<p><strong>Date/Time:</strong> ${normalizedDateTime}</p>` : ''}
          `;

          sendEmail({
            toEmail: patient.email,
            toName: patient.firstName || '',
            subject,
            text: message,
            html
          });
        }
      } catch (e) {
        console.warn('Reminder email skipped:', e.message);
      }

      return savedReminder;
    } catch (error) {
      console.error('Service error creating reminder:', error);
      throw error;
    }
  }

  async markAsRead(reminderId) {
    try {
      const reminder = await reminderRepository.findById(reminderId);
      if (!reminder) {
        throw new Error(`Reminder with ID ${reminderId} not found`);
      }
      if (reminder.isRead) {
        return reminder;
      }
      return await reminderRepository.update(reminderId, { isRead: 1 });
    } catch (error) {
      console.error('Service error marking reminder as read:', error);
      throw error;
    }
  }

  async markAsUnread(reminderId) {
    try {
      const reminder = await reminderRepository.findById(reminderId);
      if (!reminder) {
        throw new Error(`Reminder with ID ${reminderId} not found`);
      }
      if (!reminder.isRead) {
        return reminder;
      }
      return await reminderRepository.update(reminderId, { isRead: 0 });
    } catch (error) {
      console.error('Service error marking reminder as unread:', error);
      throw error;
    }
  }

  async deleteReminder(reminderId) {
    try {
      const existing = await reminderRepository.findById(reminderId);
      if (!existing) {
        throw new Error(`Reminder with ID ${reminderId} not found`);
      }
      await reminderRepository.delete(reminderId);
      return { message: 'Reminder deleted successfully' };
    } catch (error) {
      console.error('Service error deleting reminder:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService();
