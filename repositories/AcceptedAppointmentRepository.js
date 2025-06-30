const { pool } = require('../config/database');

class AcceptedAppointmentRepository {
  async findAll() {
    try {
      const query = `
        SELECT aa.*, 
               p.firstName, p.lastName, p.email,
               ms.serviceName, ms.price
        FROM accepted_appointments aa
        LEFT JOIN patients p ON aa.patientId = p.patientId
        LEFT JOIN medical_services ms ON aa.serviceId = ms.serviceId
        ORDER BY aa.acceptedAppointmentId DESC
      `;
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Error finding all accepted appointments:', error);
      throw error;
    }
  }

  async findById(acceptedAppointmentId) {
    try {
      const query = `
        SELECT aa.*, 
               p.firstName, p.lastName, p.email,
               ms.serviceName, ms.price
        FROM accepted_appointments aa
        LEFT JOIN patients p ON aa.patientId = p.patientId
        LEFT JOIN medical_services ms ON aa.serviceId = ms.serviceId
        WHERE aa.acceptedAppointmentId = ?
      `;
      const [rows] = await pool.execute(query, [acceptedAppointmentId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding accepted appointment by ID:', error);
      throw error;
    }
  }

  async findByAppointmentId(appointmentId) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM accepted_appointments WHERE appointmentId = ?', 
        [appointmentId]
      );
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding accepted appointment by appointment ID:', error);
      throw error;
    }
  }

  async findByPatientId(patientId) {
    try {
      const query = `
        SELECT aa.*, ms.serviceName, ms.price
        FROM accepted_appointments aa
        LEFT JOIN medical_services ms ON aa.serviceId = ms.serviceId
        WHERE aa.patientId = ?
        ORDER BY aa.acceptedAppointmentId DESC
      `;
      const [rows] = await pool.execute(query, [patientId]);
      return rows;
    } catch (error) {
      console.error('Error finding accepted appointments by patient ID:', error);
      throw error;
    }
  }

  async findByAttendanceStatus(isAttended) {
    try {
      const query = `
        SELECT aa.*, 
               p.firstName, p.lastName, p.email,
               ms.serviceName, ms.price
        FROM accepted_appointments aa
        LEFT JOIN patients p ON aa.patientId = p.patientId
        LEFT JOIN medical_services ms ON aa.serviceId = ms.serviceId
        WHERE aa.isAttended = ?
        ORDER BY aa.preferredDateTime ASC
      `;
      const [rows] = await pool.execute(query, [isAttended]);
      return rows;
    } catch (error) {
      console.error('Error finding accepted appointments by attendance status:', error);
      throw error;
    }
  }

  async save(acceptedAppointmentData) {
    try {
      console.log('Repository saving accepted appointment data:', acceptedAppointmentData);
      
      const query = `
        INSERT INTO accepted_appointments (
          appointmentId, patientId, serviceId, preferredDateTime, 
          symptom, isAttended, createdAt, updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const values = [
        acceptedAppointmentData.appointmentId || null,
        acceptedAppointmentData.patientId || null,
        acceptedAppointmentData.serviceId || null,
        acceptedAppointmentData.preferredDateTime || null,
        acceptedAppointmentData.symptom || null,
        acceptedAppointmentData.isAttended || 0
      ];
      
      const [result] = await pool.execute(query, values);
      return this.findById(result.insertId);
    } catch (error) {
      console.error('Error saving accepted appointment:', error);
      throw error;
    }
  }

  async updateAttendanceStatus(acceptedAppointmentId, isAttended) {
    try {
      const query = `
        UPDATE accepted_appointments 
        SET isAttended = ?, updatedAt = NOW() 
        WHERE acceptedAppointmentId = ?
      `;
      await pool.execute(query, [isAttended, acceptedAppointmentId]);
      return this.findById(acceptedAppointmentId);
    } catch (error) {
      console.error('Error updating attendance status:', error);
      throw error;
    }
  }

  async deleteById(acceptedAppointmentId) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM accepted_appointments WHERE acceptedAppointmentId = ?', 
        [acceptedAppointmentId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting accepted appointment:', error);
      throw error;
    }
  }

  async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS accepted_appointments (
          acceptedAppointmentId INT AUTO_INCREMENT PRIMARY KEY,
          appointmentId INT NOT NULL UNIQUE,
          patientId INT NOT NULL,
          serviceId INT NOT NULL,
          preferredDateTime DATETIME NOT NULL,
          symptom TEXT NOT NULL,
          isAttended BOOLEAN DEFAULT 0 NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (appointmentId) REFERENCES appointments(appointmentId) ON DELETE CASCADE,
          FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
          FOREIGN KEY (serviceId) REFERENCES medical_services(serviceId) ON DELETE RESTRICT
        )
      `;
      await pool.execute(query);
      console.log('Accepted appointments table created/verified');
    } catch (error) {
      console.error('Error creating accepted appointments table:', error);
      throw error;
    }
  }
}

module.exports = new AcceptedAppointmentRepository();
