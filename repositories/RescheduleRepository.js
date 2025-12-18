const { pool } = require('../config/database');

const TABLE = 'reschedules';

const RescheduleRepository = {
  async create(reschedule) {
    const [result] = await pool.query(
      `INSERT INTO ${TABLE} (appointmentId, patientId, serviceId, notes, confirmation, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        reschedule.appointmentId,
        reschedule.patientId,
        reschedule.serviceId,
        reschedule.notes,
        reschedule.confirmation,
        reschedule.createdAt,
        reschedule.updatedAt
      ]
    );
    return { ...reschedule, rescheduleId: result.insertId };
  },

  async findAll() {
    const [rows] = await pool.query(`SELECT * FROM ${TABLE}`);
    return rows;
  },

  async findById(rescheduleId) {
    const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE rescheduleId = ?`, [rescheduleId]);
    return rows[0];
  },

  async findByPatientId(patientId) {
    const [rows] = await pool.query(`SELECT * FROM ${TABLE} WHERE patientId = ?`, [patientId]);
    return rows;
  },

  async update(rescheduleId, data) {
    const fields = [];
    const values = [];
    for (const key in data) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
    values.push(rescheduleId);
    await pool.query(
      `UPDATE ${TABLE} SET ${fields.join(', ')}, updatedAt = NOW() WHERE rescheduleId = ?`,
      values
    );
    return this.findById(rescheduleId);
  },

  async delete(rescheduleId) {
    await pool.query(`DELETE FROM ${TABLE} WHERE rescheduleId = ?`, [rescheduleId]);
    return { message: 'Reschedule deleted' };
  },

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        rescheduleId INT AUTO_INCREMENT PRIMARY KEY,
        appointmentId INT NOT NULL,
        patientId INT NOT NULL,
        serviceId INT NOT NULL,
        notes TEXT,
        confirmation VARCHAR(20) DEFAULT 'Pending',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        -- Add any necessary foreign key constraints here
      )
    `;
    await pool.query(query);
  }
};

module.exports = RescheduleRepository;
