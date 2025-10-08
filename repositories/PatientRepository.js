const { pool } = require('../config/database');
const Patient = require('../models/Patient');

class PatientRepository {
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM patients ORDER BY patientId DESC');
    return rows;
  }

  async findById(patientId) {
    const [rows] = await pool.execute('SELECT * FROM patients WHERE patientId = ?', [patientId]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM patients WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async save(patientData) {
    const query = `
      INSERT INTO patients (
        firstName, lastName, email, phone, dateOfBirth,
        emergencyContactName, emergencyContactRelationship, 
        emergencyContactPhone1, emergencyContactPhone2,
        streetAddress, barangay, municipality, password, role,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
      patientData.firstName,
      patientData.lastName,
      patientData.email,
      patientData.phone,
      patientData.dateOfBirth,
      patientData.emergencyContactName,
      patientData.emergencyContactRelationship,
      patientData.emergencyContactPhone1,
      patientData.emergencyContactPhone2,
      patientData.streetAddress,
      patientData.barangay,
      patientData.municipality,
      patientData.password,
      patientData.role || 'Patient'
    ];
    
    const [result] = await pool.execute(query, values);
    return this.findById(result.insertId);
  }

  async findByEmailAndPassword(email, password) {
    const [rows] = await pool.execute(
      'SELECT * FROM patients WHERE email = ? AND password = ?', 
      [email, password]
    );
    return rows[0] || null;
  }

  async update(patientId, patientData) {
    const fields = [];
    const values = [];
    
    Object.keys(patientData).forEach(key => {
      if (patientData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(patientData[key]);
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = NOW()');
    values.push(patientId);
    
    const query = `UPDATE patients SET ${fields.join(', ')} WHERE patientId = ?`;
    await pool.execute(query, values);
    
    return this.findById(patientId);
  }

  async deleteById(patientId) {
    const [result] = await pool.execute('DELETE FROM patients WHERE patientId = ?', [patientId]);
    return result.affectedRows > 0;
  }

  async createTable() {
    try {
      // First create the table with basic structure
      const basicQuery = `
        CREATE TABLE IF NOT EXISTS patients (
          patientId INT AUTO_INCREMENT PRIMARY KEY,
          firstName VARCHAR(100) NOT NULL,
          lastName VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20) NOT NULL,
          dateOfBirth DATE,
          emergencyContactName VARCHAR(200),
          emergencyContactRelationship VARCHAR(100),
          emergencyContactPhone1 VARCHAR(20),
          emergencyContactPhone2 VARCHAR(20),
          streetAddress VARCHAR(255),
          barangay VARCHAR(100),
          municipality VARCHAR(100),
          password VARCHAR(255) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      await pool.execute(basicQuery);
      
      // Then add role column if it doesn't exist
      try {
        await pool.execute(`
          ALTER TABLE patients 
          ADD COLUMN role ENUM('Patient', 'Admin', 'Walkin') DEFAULT 'Patient' NOT NULL
        `);
        console.log('Added role column to patients table');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('Role column already exists');
          
          // Try to modify existing column to include 'Walkin'
          try {
            await pool.execute(`
              ALTER TABLE patients 
              MODIFY COLUMN role ENUM('Patient', 'Admin', 'Walkin') DEFAULT 'Patient' NOT NULL
            `);
            console.log('Updated role column to include Walkin');
          } catch (modifyError) {
            console.log('Role column modification may have failed or Walkin already exists');
          }
        } else {
          throw error;
        }
      }
      
      console.log('Patients table created/verified');
    } catch (error) {
      console.error('Error creating patients table:', error);
      throw error;
    }
  }

  async updatePassword(email, newPassword) {
    // WARNING: In production, hash the password before saving!
    await pool.execute(
      'UPDATE patients SET password = ? WHERE email = ?',
      [newPassword, email]
    );
  }
}

module.exports = new PatientRepository();
