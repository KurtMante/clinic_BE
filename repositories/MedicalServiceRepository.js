const { pool } = require('../config/database');

class MedicalServiceRepository {
  async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM medical_services ORDER BY serviceId DESC');
      return rows;
    } catch (error) {
      console.error('Error finding all medical services:', error);
      throw error;
    }
  }

  async findById(serviceId) {
    try {
      const [rows] = await pool.execute('SELECT * FROM medical_services WHERE serviceId = ?', [serviceId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding medical service by ID:', error);
      throw error;
    }
  }

  async findByName(serviceName) {
    try {
      const [rows] = await pool.execute('SELECT * FROM medical_services WHERE serviceName = ?', [serviceName]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding medical service by name:', error);
      throw error;
    }
  }

  async save(serviceData) {
    try {
      console.log('Repository saving data:', serviceData);
      
      const query = `
        INSERT INTO medical_services (serviceName, price, createdAt, updatedAt)
        VALUES (?, ?, NOW(), NOW())
      `;
      
      const serviceName = serviceData.serviceName || null;
      const price = serviceData.price || null;
      
      console.log('Executing query with values:', [serviceName, price]);
      
      const [result] = await pool.execute(query, [serviceName, price]);
      return this.findById(result.insertId);
    } catch (error) {
      console.error('Error saving medical service:', error);
      throw error;
    }
  }

  async update(serviceId, serviceData) {
    try {
      const fields = [];
      const values = [];
      
      if (serviceData.serviceName !== undefined) {
        fields.push('serviceName = ?');
        values.push(serviceData.serviceName);
      }
      
      if (serviceData.price !== undefined) {
        fields.push('price = ?');
        values.push(serviceData.price);
      }
      
      if (fields.length === 0) return null;
      
      fields.push('updatedAt = NOW()');
      values.push(serviceId);
      
      const query = `UPDATE medical_services SET ${fields.join(', ')} WHERE serviceId = ?`;
      await pool.execute(query, values);
      
      return this.findById(serviceId);
    } catch (error) {
      console.error('Error updating medical service:', error);
      throw error;
    }
  }

  async deleteById(serviceId) {
    try {
      const [result] = await pool.execute('DELETE FROM medical_services WHERE serviceId = ?', [serviceId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting medical service:', error);
      throw error;
    }
  }

  async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS medical_services (
          serviceId INT AUTO_INCREMENT PRIMARY KEY,
          serviceName VARCHAR(200) NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      await pool.execute(query);
      console.log('Medical services table created/verified');
    } catch (error) {
      console.error('Error creating medical services table:', error);
      throw error;
    }
  }
}

module.exports = new MedicalServiceRepository();
