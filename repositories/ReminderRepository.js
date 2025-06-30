const { pool } = require('../config/database');

class ReminderRepository {
  async findAll() {
    try {
      const query = `
        SELECT r.*, 
               p.firstName, p.lastName, p.email
        FROM reminders r
        LEFT JOIN patients p ON r.patientId = p.patientId
        ORDER BY r.reminderId DESC
      `;
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Error finding all reminders:', error);
      throw error;
    }
  }

  async findById(reminderId) {
    try {
      const query = `
        SELECT r.*, 
               p.firstName, p.lastName, p.email
        FROM reminders r
        LEFT JOIN patients p ON r.patientId = p.patientId
        WHERE r.reminderId = ?
      `;
      const [rows] = await pool.execute(query, [reminderId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding reminder by ID:', error);
      throw error;
    }
  }

  async findByPatientId(patientId) {
    try {
      const query = `
        SELECT r.*
        FROM reminders r
        WHERE r.patientId = ?
        ORDER BY r.reminderId DESC
      `;
      const [rows] = await pool.execute(query, [patientId]);
      return rows;
    } catch (error) {
      console.error('Error finding reminders by patient ID:', error);
      throw error;
    }
  }

  async findByAppointmentId(appointmentId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM reminders WHERE appointmentId = ?', 
        [appointmentId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding reminder by appointment ID:', error);
      throw error;
    }
  }

  async findUnreadByPatientId(patientId) {
    try {
      const query = `
        SELECT r.*
        FROM reminders r
        WHERE r.patientId = ? AND r.isRead = 0
        ORDER BY r.reminderId DESC
      `;
      const [rows] = await pool.execute(query, [patientId]);
      return rows;
    } catch (error) {
      console.error('Error finding unread reminders by patient ID:', error);
      throw error;
    }
  }

  async save(reminderData) {
    try {
      const query = `
        INSERT INTO reminders (patientId, appointmentId, serviceName, preferredDateTime, message, isRead, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const values = [
        reminderData.patientId || null,
        reminderData.appointmentId || null,
        reminderData.serviceName || null,
        reminderData.preferredDateTime || null,
        reminderData.message || null,
        reminderData.isRead ? 1 : 0
      ];
      
      const [result] = await pool.execute(query, values);
      return this.findById(result.insertId);
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error;
    }
  }

  async update(reminderId, reminderData) {
    try {
      const fields = [];
      const values = [];
      
      if (reminderData.message !== undefined) {
        fields.push('message = ?');
        values.push(reminderData.message);
      }
      
      if (reminderData.isRead !== undefined) {
        fields.push('isRead = ?');
        values.push(reminderData.isRead ? 1 : 0);
      }
      
      if (fields.length === 0) return null;
      
      fields.push('updatedAt = NOW()');
      values.push(reminderId);
      
      const query = `UPDATE reminders SET ${fields.join(', ')} WHERE reminderId = ?`;
      await pool.execute(query, values);
      
      return this.findById(reminderId);
    } catch (error) {
      console.error('Error updating reminder:', error);
      throw error;
    }
  }

  async deleteById(reminderId) {
    try {
      const [result] = await pool.execute('DELETE FROM reminders WHERE reminderId = ?', [reminderId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      throw error;
    }
  }

  async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS reminders (
          reminderId INT AUTO_INCREMENT PRIMARY KEY,
          patientId INT NOT NULL,
          appointmentId INT NOT NULL,
          serviceName VARCHAR(200) NOT NULL,
          preferredDateTime DATETIME NOT NULL,
          message TEXT NOT NULL,
          isRead BOOLEAN DEFAULT FALSE NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
          FOREIGN KEY (appointmentId) REFERENCES appointments(appointmentId) ON DELETE CASCADE
        )
      `;
      await pool.execute(query);
      console.log('Reminders table created/verified');
    } catch (error) {
      console.error('Error creating reminders table:', error);
      throw error;
    }
  }
}

module.exports = new ReminderRepository();
