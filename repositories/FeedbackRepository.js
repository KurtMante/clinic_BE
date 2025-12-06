const { pool } = require('../config/database');

class FeedbackRepository {
  async findAll() {
    try {
      const [rows] = await pool.query(`
        SELECT f.*, s.serviceName
        FROM feedback f
        LEFT JOIN medical_services s ON f.serviceId = s.serviceId
        ORDER BY f.createdAt DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error finding all feedback:', error);
      throw error;
    }
  }

  async findById(feedbackId) {
    try {
      const query = `
        SELECT f.*, 
               p.firstName, p.lastName, p.email
        FROM feedback f
        LEFT JOIN patients p ON f.patientId = p.patientId
        WHERE f.feedbackId = ?
      `;
      const [rows] = await pool.execute(query, [feedbackId]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error finding feedback by ID:', error);
      throw error;
    }
  }

  async findByPatientId(patientId) {
    try {
      const query = `
        SELECT f.*
        FROM feedback f
        WHERE f.patientId = ?
        ORDER BY f.feedbackId DESC
      `;
      const [rows] = await pool.execute(query, [patientId]);
      return rows;
    } catch (error) {
      console.error('Error finding feedback by patient ID:', error);
      throw error;
    }
  }

  async findByRating(rating) {
    try {
      const query = `
        SELECT f.*, 
               p.firstName, p.lastName, p.email
        FROM feedback f
        LEFT JOIN patients p ON f.patientId = p.patientId
        WHERE f.rating = ?
        ORDER BY f.feedbackId DESC
      `;
      const [rows] = await pool.execute(query, [rating]);
      return rows;
    } catch (error) {
      console.error('Error finding feedback by rating:', error);
      throw error;
    }
  }

  async save(feedbackData) {
    try {
      const query = `
        INSERT INTO feedback (patientId, rating, comment, isAnonymous, serviceId, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const values = [
        feedbackData.patientId || null,
        feedbackData.rating || null,
        feedbackData.comment || null,
        feedbackData.isAnonymous ? 1 : 0,
        feedbackData.serviceId || null
      ];
      
      const [result] = await pool.execute(query, values);
      return this.findById(result.insertId);
    } catch (error) {
      console.error('Error saving feedback:', error);
      throw error;
    }
  }

  async update(feedbackId, feedbackData) {
    try {
      const fields = [];
      const values = [];
      
      if (feedbackData.patientId !== undefined) {
        fields.push('patientId = ?');
        values.push(feedbackData.patientId);
      }
      
      if (feedbackData.rating !== undefined) {
        fields.push('rating = ?');
        values.push(feedbackData.rating);
      }
      
      if (feedbackData.comment !== undefined) {
        fields.push('comment = ?');
        values.push(feedbackData.comment);
      }
      
      if (feedbackData.isAnonymous !== undefined) {
        fields.push('isAnonymous = ?');
        values.push(feedbackData.isAnonymous ? 1 : 0);
      }
      
      if (feedbackData.serviceId !== undefined) {
        fields.push('serviceId = ?');
        values.push(feedbackData.serviceId);
      }
      
      if (fields.length === 0) return null;
      
      fields.push('updatedAt = NOW()');
      values.push(feedbackId);
      
      const query = `UPDATE feedback SET ${fields.join(', ')} WHERE feedbackId = ?`;
      await pool.execute(query, values);
      
      return this.findById(feedbackId);
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  async deleteById(feedbackId) {
    try {
      const [result] = await pool.execute('DELETE FROM feedback WHERE feedbackId = ?', [feedbackId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  async createTable() {
    try {
      const query = `
        CREATE TABLE IF NOT EXISTS feedback (
          feedbackId INT AUTO_INCREMENT PRIMARY KEY,
          patientId INT NOT NULL,
          rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
          comment TEXT NOT NULL,
          isAnonymous BOOLEAN DEFAULT FALSE NOT NULL,
          serviceId INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (patientId) REFERENCES patients(patientId) ON DELETE CASCADE,
          FOREIGN KEY (serviceId) REFERENCES services(serviceId) ON DELETE SET NULL
        )
      `;
      await pool.execute(query);
      console.log('Feedback table created/verified');
    } catch (error) {
      console.error('Error creating feedback table:', error);
      throw error;
    }
  }
}

module.exports = new FeedbackRepository();