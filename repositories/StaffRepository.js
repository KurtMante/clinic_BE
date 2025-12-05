const { pool } = require('../config/database');
const Staff = require('../models/Staff');

class StaffRepository {
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM staff ORDER BY staffId DESC');
    return rows;
  }

  async findById(staffId) {
    const [rows] = await pool.execute('SELECT * FROM staff WHERE staffId = ?', [staffId]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM staff WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async save(staffData) {
    const query = `
      INSERT INTO staff (
        firstName, lastName, email, phone, dateOfBirth,
        emergencyContactName, emergencyContactRelationship, 
        emergencyContactPhone1, emergencyContactPhone2,
        streetAddress, barangay, municipality, password,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
      staffData.firstName || null,
      staffData.lastName || null,
      staffData.email || null,
      staffData.phone || null,
      staffData.dateOfBirth || null,
      staffData.emergencyContactName || null,
      staffData.emergencyContactRelationship || null,
      staffData.emergencyContactPhone1 || null,
      staffData.emergencyContactPhone2 || null,
      staffData.streetAddress || null,
      staffData.barangay || null,
      staffData.municipality || null,
      staffData.password || null
    ];
    
    const [result] = await pool.execute(query, values);
    return this.findById(result.insertId);
  }

  async findByEmailAndPassword(email, password) {
    const [rows] = await pool.execute(
      'SELECT * FROM staff WHERE email = ? AND password = ?', 
      [email, password]
    );
    return rows[0] || null;
  }

  async update(staffId, staffData) {
    const fields = [];
    const values = [];
    
    Object.keys(staffData).forEach(key => {
      if (staffData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(staffData[key]);
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = NOW()');
    values.push(staffId);
    
    const query = `UPDATE staff SET ${fields.join(', ')} WHERE staffId = ?`;
    await pool.execute(query, values);
    
    return this.findById(staffId);
  }

  async deleteById(staffId) {
    const [result] = await pool.execute('DELETE FROM staff WHERE staffId = ?', [staffId]);
    return result.affectedRows > 0;
  }

  async softDelete(staffId, deletedByStaffId) {
    await pool.query(
      `UPDATE staff SET isDeleted = 1, deletedByStaffId = ?, deletedAt = NOW() WHERE staffId = ?`,
      [deletedByStaffId, staffId]
    );
  }

  async createTable() {
    try {
      // First create the table with basic structure
      const basicQuery = `
        CREATE TABLE IF NOT EXISTS staff (
          staffId INT AUTO_INCREMENT PRIMARY KEY,
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
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      await pool.execute(basicQuery);
      
      // Then add password column if it doesn't exist
      try {
        await pool.execute(`
          ALTER TABLE staff 
          ADD COLUMN password VARCHAR(255) NOT NULL DEFAULT 'defaultpassword'
        `);
        console.log('Added password column to staff table');
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log('Password column already exists in staff table');
        } else {
          throw error;
        }
      }
      
      console.log('Staff table created/verified');
    } catch (error) {
      console.error('Error creating staff table:', error);
      throw error;
    }
  }
}

module.exports = new StaffRepository();
