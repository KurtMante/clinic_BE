const { pool } = require('../config/database');
const Schedule = require('../models/Schedule');

class ScheduleRepository {
  async createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS schedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        weekday TINYINT NOT NULL UNIQUE,
        status ENUM('AVAILABLE','UNAVAILABLE','HALF_DAY','DAY_OFF') NOT NULL DEFAULT 'AVAILABLE',
        start_time TIME NULL,
        end_time TIME NULL,
        notes TEXT NULL,
        notify TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CHECK (weekday BETWEEN 0 AND 6)
      );
    `;
    await pool.query(sql);

    const [rows] = await pool.query('SELECT COUNT(*) AS cnt FROM schedule');
    if (rows[0].cnt === 0) {
      await pool.query(
        'INSERT INTO schedule (weekday,status,start_time,end_time,notes,notify) VALUES ?',
        [[
          [0,'AVAILABLE','08:00:00','17:00:00',null,1],
          [1,'AVAILABLE','08:00:00','17:00:00',null,1],
          [2,'AVAILABLE','08:00:00','17:00:00',null,1],
          [3,'AVAILABLE','08:00:00','17:00:00',null,1],
            [4,'AVAILABLE','08:00:00','17:00:00',null,1],
          [5,'HALF_DAY','08:00:00','12:00:00',null,1],
          [6,'DAY_OFF',null,null,null,1]
        ]]
      );
    }
  }

  async findAll() {
    const [rows] = await pool.query('SELECT * FROM schedule ORDER BY weekday ASC');
    return rows.map(Schedule.fromRow);
  }

  async findByWeekday(weekday) {
    const [rows] = await pool.query('SELECT * FROM schedule WHERE weekday = ?', [weekday]);
    return Schedule.fromRow(rows[0]);
  }

  async upsert(schedule) {
    const errors = schedule.validate();
    if (errors.length) throw new Error(errors.join(', '));

    const existing = await this.findByWeekday(schedule.weekday);
    if (!existing) {
      const insertSql = `
        INSERT INTO schedule (weekday,status,start_time,end_time,notes,notify)
        VALUES (?,?,?,?,?,?)
      `;
      const params = [
        schedule.weekday,
        schedule.status,
        schedule.startTime,
        schedule.endTime,
        schedule.notes,
        schedule.notify ? 1 : 0
      ];
      const [res] = await pool.query(insertSql, params);
      schedule.scheduleId = res.insertId;
      return schedule;
    } else {
      const updateSql = `
        UPDATE schedule
        SET status = ?, start_time = ?, end_time = ?, notes = ?, notify = ?
        WHERE weekday = ?
      `;
      const params = [
        schedule.status,
        schedule.startTime,
        schedule.endTime,
        schedule.notes,
        schedule.notify ? 1 : 0,
        schedule.weekday
      ];
      await pool.query(updateSql, params);
      return this.findByWeekday(schedule.weekday);
    }
  }

  async updateStatus(weekday, status, startTime, endTime) {
    const sched = new Schedule(null, weekday, status, startTime, endTime);
    const errors = sched.validate();
    if (errors.length) throw new Error(errors.join(', '));

    const existing = await this.findByWeekday(weekday);
    if (!existing) {
      return this.upsert(sched);
    } else {
      await pool.query(
        'UPDATE schedule SET status = ?, start_time = ?, end_time = ? WHERE weekday = ?',
        [status, startTime, endTime, weekday]
      );
      return this.findByWeekday(weekday);
    }
  }

  async appendNote(weekday, note) {
    const existing = await this.findByWeekday(weekday);
    if (!existing) {
      const sched = new Schedule(null, weekday, 'AVAILABLE', null, null, note);
      return this.upsert(sched);
    }
    const newNotes = existing.notes ? `${existing.notes}\n${note}` : note;
    await pool.query('UPDATE schedule SET notes = ? WHERE weekday = ?', [newNotes, weekday]);
    return this.findByWeekday(weekday);
  }
}

module.exports = new ScheduleRepository();