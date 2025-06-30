const { pool } = require('../config/database');

class AppointmentRepository {
  async findAll() {
    try {
      const query = `
        SELECT a.*, 
               p.firstName, p.lastName, p.email,
               ms.serviceName, ms.price
        FROM appointments a
        LEFT JOIN patients p ON a.patientId = p.patientId
        LEFT JOIN medical_services ms ON a.serviceId = ms.serviceId
        ORDER BY a.appointmentId DESC
      `;
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Error finding all appointments:', error);
      throw error;
    }
  }

  async findById(appointmentId) {
    try {
      const query = `
        SELECT a.*, 
               p.firstName, p.lastName, p.email,
               ms.serviceName, ms.price
        FROM appointments a
        LEFT JOIN patients p ON a.patientId = p.patientId
        LEFT JOIN medical_services ms ON a.serviceId = ms.serviceId
        WHERE a.appointmentId = ?
      `;
      const [rows] = await pool.execute(query, [appointmentId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding appointment by ID:', error);
      throw error;
    }
  }

  async findByPatientId(patientId) {
    try {
      const query = `
        SELECT a.*, ms.serviceName, ms.price
        FROM appointments a
        LEFT JOIN medical_services ms ON a.serviceId = ms.serviceId
        WHERE a.patientId = ?
        ORDER BY a.appointmentId DESC
      `;
      const [rows] = await pool.execute(query, [patientId]);
      return rows;
    } catch (error) {
      console.error('Error finding appointments by patient ID:', error);
      throw error;
    }
  }

  async save(appointmentData) {
    try {
      console.log('Repository saving appointment data:', appointmentData);
      
      const query = `
        INSERT INTO appointments (patientId, serviceId, preferredDateTime, symptom, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const values = [
        appointmentData.patientId || null,
        appointmentData.serviceId || null,
        appointmentData.preferredDateTime || null,
        appointmentData.symptom || null,
        appointmentData.status || 'Pending'
      ];
      
      console.log('Executing appointment query with values:', values);
      
      const [result] = await pool.execute(query, values);
      return this.findById(result.insertId);
    } catch (error) {
      console.error('Error saving appointment:', error);
      throw error;
    }
  }

  async update(appointmentId, appointmentData) {
    try {
      const fields = [];
      const values = [];
      
      if (appointmentData.patientId !== undefined) {
        fields.push('patientId = ?');
        values.push(appointmentData.patientId);
      }
      
      if (appointmentData.serviceId !== undefined) {
        fields.push('serviceId = ?');
        values.push(appointmentData.serviceId);
      }
      
      if (appointmentData.preferredDateTime !== undefined) {
        fields.push('preferredDateTime = ?');
        values.push(appointmentData.preferredDateTime);
      }
      
      if (appointmentData.symptom !== undefined) {
        fields.push('symptom = ?');
        values.push(appointmentData.symptom);
      }
      
      if (appointmentData.status !== undefined) {
        fields.push('status = ?');
        values.push(appointmentData.status);
      }
      
      if (fields.length === 0) return null;
      
      fields.push('updatedAt = NOW()');
      values.push(appointmentId);
      
      const query = `UPDATE appointments SET ${fields.join(', ')} WHERE appointmentId = ?`;
      await pool.execute(query, values);
      
      return this.findById(appointmentId);
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  async deleteById(appointmentId) {
    try {
      const [result] = await pool.execute('DELETE FROM appointments WHERE appointmentId = ?', [appointmentId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      throw error;
    }
  }

  async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS appointments (
          appointmentId INT AUTO_INCREMENT PRIMARY KEY,
          patientId INT NOT NULL,
          serviceId INT NOT NULL,
          preferredDateTime DATETIME NOT NULL,
          symptom TEXT NOT NULL,
          status ENUM('Pending', 'Accepted', 'Declined') DEFAULT 'Pending' NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
          FOREIGN KEY (serviceId) REFERENCES medical_services(serviceId) ON DELETE RESTRICT
        )
      `;
      await pool.execute(query);
      console.log('Appointments table created/verified');
    } catch (error) {
      console.error('Error creating appointments table:', error);
      throw error;
    }
  }

  async findConflictingAppointments(patientId, preferredDateTime, excludeAppointmentId = null) {
    try {
      // Calculate 1 hour before and after the requested time
      const requestedTime = new Date(preferredDateTime);
      const oneHourBefore = new Date(requestedTime.getTime() - 60 * 60 * 1000);
      const oneHourAfter = new Date(requestedTime.getTime() + 60 * 60 * 1000);

      let query = `
        SELECT appointmentId, patientId, serviceId, preferredDateTime, symptom, status
        FROM appointments
        WHERE patientId = ? 
        AND preferredDateTime > ? 
        AND preferredDateTime < ?
      `;
      let params = [patientId, oneHourBefore, oneHourAfter];

      // Exclude current appointment when updating
      if (excludeAppointmentId) {
        query += ' AND appointmentId != ?';
        params.push(excludeAppointmentId);
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error finding conflicting appointments:', error);
      throw error;
    }
  }

  async findAppointmentsByTimeSlot(preferredDateTime, excludeAppointmentId = null) {
    try {
      // Calculate 1 hour before and after the requested time to check for overlaps
      const requestedTime = new Date(preferredDateTime);
      const oneHourBefore = new Date(requestedTime.getTime() - 60 * 60 * 1000);
      const oneHourAfter = new Date(requestedTime.getTime() + 60 * 60 * 1000);

      let query = `
        SELECT appointmentId, patientId, serviceId, preferredDateTime, symptom, status
        FROM appointments
        WHERE preferredDateTime > ? 
        AND preferredDateTime < ?
      `;
      let params = [oneHourBefore, oneHourAfter];

      // Exclude current appointment when updating
      if (excludeAppointmentId) {
        query += ' AND appointmentId != ?';
        params.push(excludeAppointmentId);
      }

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error finding appointments by time slot:', error);
      throw error;
    }
  }
}

module.exports = new AppointmentRepository();
