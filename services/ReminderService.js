const reminderRepository = require('../repositories/ReminderRepository');
const patientRepository = require('../repositories/PatientRepository');
const appointmentRepository = require('../repositories/AppointmentRepository');
const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const Reminder = require('../models/Reminder');
const { sendEmail } = require('./EmailService');

// Helper to convert MySQL datetime string → JS Date in Manila time
function toManilaDate(mysqlDatetime) {
  const [datePart, timePart] = mysqlDatetime.split(' ');
  return new Date(`${datePart}T${timePart}+08:00`);
}

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
      if (!reminder) throw new Error(`Reminder with ID ${reminderId} not found`);
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

  // FIXED VERSION: NO UTC CONVERSION
  async createReminderForAcceptedAppointment(appointmentId) {
    try {
      const appointment = await appointmentRepository.findById(appointmentId);
      if (!appointment) throw new Error('Appointment not found');

      const service = await medicalServiceRepository.findById(appointment.serviceId);
      if (!service) throw new Error('Service not found');

      const existingReminder = await reminderRepository.findByAppointmentId(appointmentId);
      if (existingReminder) throw new Error('Reminder already exists for this appointment');

      // FIX: Treat datetime as Manila (+08:00)
      const appointmentDate = toManilaDate(appointment.preferredDateTime);

      const formattedDate = appointmentDate.toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        timeZone: 'Asia/Manila'
      });

      const formattedTime = appointmentDate.toLocaleTimeString('en-PH', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      });

      const patient = await patientRepository.findById(appointment.patientId);

      const message = `Dear ${patient.firstName || ''} ${patient.lastName || ''},\n\nThis is a friendly reminder about your upcoming appointment.\n\n📅 Date: ${formattedDate}\n⏰ Time: ${formattedTime}\n🏥 Service: ${service.serviceName}\n\nPlease arrive 10-15 minutes before your scheduled time. If you need to reschedule or cancel, please contact us as soon as possible.\n\nThank you for choosing our clinic!\n\nBest regards,\nClinic Management Team`;

      // FIX: Save datetime EXACTLY as stored in DB
      const reminder = new Reminder(
        null,
        appointment.patientId,
        appointmentId,
        service.serviceName,
        appointment.preferredDateTime,
        message,
        false
      );

      await reminderRepository.save(reminder);
      await sendEmail(patient.email, 'Appointment Reminder', message);

      return reminder;
    } catch (error) {
      console.error('Service error creating reminder for accepted appointment:', error);
      throw error;
    }
  }

  // FIXED createReminder() timezone handling
  async createReminder(data) {
    try {
      const { patientId, appointmentId, serviceId, serviceName, message, preferredDateTime, isRead } = data;

      if (!patientId) throw new Error('Patient ID is required');
      if (!message) throw new Error('Message is required');

      const patient = await patientRepository.findById(patientId);
      if (!patient) throw new Error(`Patient with ID ${patientId} not found`);

      // FIX: Normalize datetime without converting timezone
      let normalizedDateTime = null;
      if (preferredDateTime) {
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(preferredDateTime)) {
          normalizedDateTime = preferredDateTime; // Already correct format
        } else {
          const d = new Date(preferredDateTime);
          if (isNaN(d)) throw new Error('Invalid preferredDateTime');
          const local = new Date(d.getTime() + 8 * 60 * 60 * 1000); // adjust if needed
          normalizedDateTime = local.toISOString().slice(0, 19).replace("T", " ");
        }
      }

      let resolvedServiceName = serviceName || null;

      if (serviceId && !resolvedServiceName) {
        const service = await medicalServiceRepository.findById(serviceId);
        if (service) resolvedServiceName = service.serviceName;
      }

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
      if (validationErrors.length > 0) throw new Error(`Validation failed: ${validationErrors.join(', ')}`);

      const savedReminder = await reminderRepository.save({
        patientId: reminder.patientId,
        appointmentId: reminder.appointmentId,
        serviceName: reminder.serviceName,
        preferredDateTime: reminder.preferredDateTime,
        message: reminder.message,
        isRead: reminder.isRead ? 1 : 0
      });

      try {
        if (patient.email) {
          sendEmail({
            toEmail: patient.email,
            toName: patient.firstName || '',
            subject: `Reminder ${resolvedServiceName || ''}`,
            text: message,
            html: `
              <h3>Reminder</h3>
              <p>Hi ${patient.firstName || 'Patient'},</p>
              <p>${message}</p>
              ${resolvedServiceName ? `<p><strong>Service:</strong> ${resolvedServiceName}</p>` : ''}
              ${normalizedDateTime ? `<p><strong>Date/Time:</strong> ${normalizedDateTime}</p>` : ''}
            `
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
      if (!reminder) throw new Error(`Reminder with ID ${reminderId} not found`);
      if (reminder.isRead) return reminder;
      return await reminderRepository.update(reminderId, { isRead: 1 });
    } catch (error) {
      console.error('Service error marking reminder as read:', error);
      throw error;
    }
  }

  async markAsUnread(reminderId) {
    try {
      const reminder = await reminderRepository.findById(reminderId);
      if (!reminder) throw new Error(`Reminder with ID ${reminderId} not found`);
      if (!reminder.isRead) return reminder;
      return await reminderRepository.update(reminderId, { isRead: 0 });
    } catch (error) {
      console.error('Service error marking reminder as unread:', error);
      throw error;
    }
  }

  async deleteReminder(reminderId) {
    try {
      const existing = await reminderRepository.findById(reminderId);
      if (!existing) throw new Error(`Reminder with ID ${reminderId} not found`);
      await reminderRepository.delete(reminderId);
      return { message: 'Reminder deleted successfully' };
    } catch (error) {
      console.error('Service error deleting reminder:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService();
