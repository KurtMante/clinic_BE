const { pool } = require('../config/database');
const Reminder = require('../models/Reminder');

class ReminderRepository {
  async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS reminders (
        reminderId INT AUTO_INCREMENT PRIMARY KEY,
        patientId INT NOT NULL,
        appointmentId INT NULL,
        serviceName VARCHAR(255) NULL,
        preferredDateTime DATETIME NULL,
        message TEXT NOT NULL,
        isRead TINYINT(1) NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
        FOREIGN KEY (appointmentId) REFERENCES appointments(appointmentId) ON DELETE SET NULL
      );
    `;
    try {
      await pool.query(sql);
      console.log('Reminders table created/verified');
    } catch (error) {
      console.error('Error creating reminders table:', error);
      throw error;
    }
  }

  async findAll() {
    try {
      const [rows] = await pool.query('SELECT * FROM reminders ORDER BY createdAt DESC');
      return rows.map(Reminder.fromRow);
    } catch (error) {
      console.error('Error finding all reminders:', error);
      throw error;
    }
  }

  async findById(reminderId) {
    try {
      const [rows] = await pool.query('SELECT * FROM reminders WHERE reminderId = ?', [reminderId]);
      return Reminder.fromRow(rows[0]);
    } catch (error) {
      console.error('Error finding reminder by ID:', error);
      throw error;
    }
  }

  async findByPatientId(patientId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reminders WHERE patientId = ? ORDER BY createdAt DESC',
        [patientId]
      );
      return rows.map(Reminder.fromRow);
    } catch (error) {
      console.error('Error finding reminders by patient ID:', error);
      throw error;
    }
  }

  async findUnreadByPatientId(patientId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reminders WHERE patientId = ? AND isRead = 0 ORDER BY createdAt DESC',
        [patientId]
      );
      return rows.map(Reminder.fromRow);
    } catch (error) {
      console.error('Error finding unread reminders:', error);
      throw error;
    }
  }

  async findByAppointmentId(appointmentId) {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM reminders WHERE appointmentId = ?',
        [appointmentId]
      );
      return Reminder.fromRow(rows[0]);
    } catch (error) {
      console.error('Error finding reminder by appointment ID:', error);
      throw error;
    }
  }

  async save(reminderData) {
    try {
      const { patientId, appointmentId, serviceName, preferredDateTime, message, isRead } = reminderData;

      const [result] = await pool.query(
        `INSERT INTO reminders (patientId, appointmentId, serviceName, preferredDateTime, message, isRead)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [patientId, appointmentId || null, serviceName || null, preferredDateTime || null, message, isRead || 0]
      );

      return await this.findById(result.insertId);
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  }

  async update(reminderId, updateData) {
    try {
      const fields = [];
      const values = [];

      if (updateData.isRead !== undefined) {
        fields.push('isRead = ?');
        values.push(updateData.isRead);
      }
      if (updateData.message !== undefined) {
        fields.push('message = ?');
        values.push(updateData.message);
      }
      if (updateData.serviceName !== undefined) {
        fields.push('serviceName = ?');
        values.push(updateData.serviceName);
      }
      if (updateData.preferredDateTime !== undefined) {
        fields.push('preferredDateTime = ?');
        values.push(updateData.preferredDateTime);
      }

      if (fields.length === 0) {
        return await this.findById(reminderId);
      }

      values.push(reminderId);

      await pool.query(
        `UPDATE reminders SET ${fields.join(', ')} WHERE reminderId = ?`,
        values
      );

      return await this.findById(reminderId);
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async delete(reminderId) {
    try {
      const [result] = await pool.query('DELETE FROM reminders WHERE reminderId = ?', [reminderId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }
}

module.exports = new ReminderRepository();
