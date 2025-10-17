const reminderRepository = require('../repositories/ReminderRepository');
const patientRepository = require('../repositories/PatientRepository');
const appointmentRepository = require('../repositories/AppointmentRepository');
const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const Reminder = require('../models/Reminder');
const { pool } = require('../config/database');
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
    if (!patientId) throw new Error('patientId required');
    return reminderRepository.findByPatientId(patientId);
  }

  async getUnreadRemindersByPatientId(patientId) {
    if (!patientId) throw new Error('patientId required');
    return reminderRepository.findUnreadByPatientId(patientId);
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
        false // isRead = false
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
        isRead: reminder.isRead
      });

      console.log('Reminder created successfully:', savedReminder.reminderId);
      return savedReminder;
    } catch (error) {
      console.error('Service error creating reminder for accepted appointment:', error);
      throw error;
    }
  }

  async createReminder({ patientId, appointmentId = null, serviceName = null, preferredDateTime = null, message }) {
    try {
      const missing = [];
      if (!patientId) missing.push('patientId');
      if (!message) missing.push('message');
      // If you REALLY want to require appointment-based reminders, uncomment:
      // if (!appointmentId) missing.push('appointmentId');
      if (missing.length) {
        throw new Error('Missing required field(s): ' + missing.join(', '));
      }

      // Fetch patient (single query) for validation + email
      const patient = await patientRepository.findById(patientId);
      if (!patient) throw new Error(`Patient ${patientId} not found`);

      // Normalize & validate datetime if provided
      let dt = null;
      if (preferredDateTime) {
        if (preferredDateTime.includes('T')) {
          const d = new Date(preferredDateTime);
            if (isNaN(d)) throw new Error('Invalid preferredDateTime');
          dt = d.toISOString().slice(0, 19).replace('T', ' ');
        } else {
          // Basic format check YYYY-MM-DD HH:mm:ss
          if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(preferredDateTime)) {
            throw new Error('preferredDateTime must be YYYY-MM-DD HH:mm:ss');
          }
          dt = preferredDateTime;
        }
      }

      const reminder = await reminderRepository.save({
        patientId,
        appointmentId,
        serviceName,
        preferredDateTime: dt,
        message,
        isRead: 0
      });

      // sends email to patient if email exists
      if (patient.email) {
        const subjectParts = ['Reminder'];
        if (serviceName) subjectParts.push(serviceName);
        if (dt) subjectParts.push('(' + dt + ')');
        const subject = subjectParts.join(' ');

        const html = `
          <h3>Reminder</h3>
          <p>${message}</p>
          ${serviceName ? `<p><strong>Service:</strong> ${serviceName}</p>` : ''}
          ${dt ? `<p><strong>Date/Time:</strong> ${dt}</p>` : ''}
        `;

        sendEmail({
          toEmail: patient.email,
          toName: patient.firstName || '',
          subject,
          text: message,
          html
        });
      } else {
        console.warn(`Reminder email skipped: patient ${patientId} has no email`);
      }

      return reminder;
    } catch (err) {
      console.error('createReminder error:', err.message);
      throw err;
    }
  }

  async markAsRead(reminderId) {
    const reminder = await reminderRepository.findById(reminderId);
    if (!reminder) throw new Error('Reminder not found');
    if (reminder.isRead) return reminder;
    return reminderRepository.update(reminderId, { isRead: 1 });
  }

  async markAsUnread(reminderId) {
    const reminder = await reminderRepository.findById(reminderId);
    if (!reminder) throw new Error('Reminder not found');
    if (!reminder.isRead) return reminder;
    return reminderRepository.update(reminderId, { isRead: 0 });
  }

  async deleteReminder(reminderId) {
    const existing = await reminderRepository.findById(reminderId);
    if (!existing) throw new Error('Reminder not found');
    await reminderRepository.delete(reminderId);
    return { message: 'Reminder deleted' };
  }
}

module.exports = new ReminderService();
