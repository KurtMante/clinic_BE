const { pool } = require('../config/database');
const Admin = require('../models/Admin');

class AdminRepository {
  async findAll() {
    const [rows] = await pool.execute('SELECT * FROM admins ORDER BY adminId DESC');
    return rows;
  }

  async findById(adminId) {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE adminId = ?', [adminId]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const [rows] = await pool.execute('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async save(adminData) {
    const query = `
      INSERT INTO admins (
        firstName, lastName, email, phone, dateOfBirth,
        emergencyContactName, emergencyContactRelationship, 
        emergencyContactPhone1, emergencyContactPhone2,
        streetAddress, barangay, municipality, password, role,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    const values = [
      adminData.firstName || null,
      adminData.lastName || null,
      adminData.email || null,
      adminData.phone || null,
      adminData.dateOfBirth || null,
      adminData.emergencyContactName || null,
      adminData.emergencyContactRelationship || null,
      adminData.emergencyContactPhone1 || null,
      adminData.emergencyContactPhone2 || null,
      adminData.streetAddress || null,
      adminData.barangay || null,
      adminData.municipality || null,
      adminData.password || null,
      adminData.role || 'Admin'
    ];
    
    const [result] = await pool.execute(query, values);
    return this.findById(result.insertId);
  }

  async findByEmailAndPassword(email, password) {
    const [rows] = await pool.execute(
      'SELECT * FROM admins WHERE email = ? AND password = ?', 
      [email, password]
    );
    return rows[0] || null;
  }

  async update(adminId, adminData) {
    const fields = [];
    const values = [];
    
    Object.keys(adminData).forEach(key => {
      if (adminData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(adminData[key]);
      }
    });
    
    if (fields.length === 0) return null;
    
    fields.push('updatedAt = NOW()');
    values.push(adminId);
    
    const query = `UPDATE admins SET ${fields.join(', ')} WHERE adminId = ?`;
    await pool.execute(query, values);
    
    return this.findById(adminId);
  }

  async deleteById(adminId) {
    const [result] = await pool.execute('DELETE FROM admins WHERE adminId = ?', [adminId]);
    return result.affectedRows > 0;
  }

  async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS admins (
          adminId INT AUTO_INCREMENT PRIMARY KEY,
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
          role ENUM('Admin', 'SuperAdmin') DEFAULT 'Admin' NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `;
      await pool.execute(query);
      console.log('Admins table created/verified');
    } catch (error) {
      console.error('Error creating admins table:', error);
      throw error;
    }
  }
}

module.exports = new AdminRepository();
