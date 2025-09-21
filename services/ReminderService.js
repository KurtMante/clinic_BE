const reminderRepository = require('../repositories/ReminderRepository');
const patientRepository = require('../repositories/PatientRepository');
const appointmentRepository = require('../repositories/AppointmentRepository');
const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const Reminder = require('../models/Reminder');
const { pool } = require('../config/database');

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
    try {
      const patient = await patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }
      return await reminderRepository.findByPatientId(patientId);
    } catch (error) {
      console.error('Service error getting reminders by patient ID:', error);
      throw error;
    }
  }

  async getUnreadRemindersByPatientId(patientId) {
    try {
      const patient = await patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(`Patient with ID ${patientId} not found`);
      }
      return await reminderRepository.findUnreadByPatientId(patientId);
    } catch (error) {
      console.error('Service error getting unread reminders by patient ID:', error);
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
    if (!patientId || !message) throw new Error('patientId and message are required');

    let dt = null;
    if (preferredDateTime) {
      const d = new Date(preferredDateTime);
      if (isNaN(d)) throw new Error('Invalid preferredDateTime');
      dt = d.toISOString().slice(0, 19).replace('T', ' ');
    }

    const [result] = await pool.execute(
      `INSERT INTO Reminders (patientId, appointmentId, serviceName, preferredDateTime, message, isRead, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, FALSE, NOW(), NOW())`,
      [patientId, appointmentId, serviceName, dt, message]
    );

    const [rows] = await pool.execute('SELECT * FROM Reminders WHERE reminderId = ?', [result.insertId]);
    return rows[0];
  }

  async markAsRead(reminderId) {
    try {
      const reminder = await this.getReminderById(reminderId);
      
      if (reminder.isRead === 1) {
        throw new Error('This reminder has already been marked as read');
      }

      return await reminderRepository.update(reminderId, { isRead: true });
    } catch (error) {
      console.error('Service error marking reminder as read:', error);
      throw error;
    }
  }

  async markAsUnread(reminderId) {
    try {
      const reminder = await this.getReminderById(reminderId);
      
      if (reminder.isRead === 0) {
        throw new Error('This reminder is already marked as unread');
      }

      return await reminderRepository.update(reminderId, { isRead: false });
    } catch (error) {
      console.error('Service error marking reminder as unread:', error);
      throw error;
    }
  }

  async deleteReminder(reminderId) {
    try {
      await this.getReminderById(reminderId);
      const success = await reminderRepository.deleteById(reminderId);
      if (!success) {
        throw new Error('Failed to delete reminder');
      }
      return { message: 'Reminder deleted successfully' };
    } catch (error) {
      console.error('Service error deleting reminder:', error);
      throw error;
    }
  }
}

module.exports = new ReminderService();
