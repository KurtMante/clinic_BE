module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Schedule', {
    weekday: { 
      type: DataTypes.TINYINT, 
      allowNull: false,
      validate: { min: 0, max: 6 }
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'UNAVAILABLE', 'HALF_DAY', 'DAY_OFF'),
      defaultValue: 'AVAILABLE'
    },
    start_time: { type: DataTypes.TIME, allowNull: true },
    end_time: { type: DataTypes.TIME, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    notify: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'schedule',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['weekday'] }]
  });
};

class Schedule {
  static allowedStatuses = ['AVAILABLE', 'UNAVAILABLE', 'HALF_DAY', 'DAY_OFF'];

  constructor(
    scheduleId,
    weekday,
    status = 'AVAILABLE',
    startTime = null,
    endTime = null,
    notes = null,
    notify = true,
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.scheduleId = scheduleId;
    this.weekday = weekday;
    this.status = status;
    this.startTime = startTime;
    this.endTime = endTime;
    this.notes = notes;
    this.notify = notify;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  validate() {
    const errors = [];
    if (this.weekday === undefined || this.weekday === null) errors.push('weekday required');
    if (this.weekday < 0 || this.weekday > 6) errors.push('weekday must be 0-6');
    if (!Schedule.allowedStatuses.includes(this.status)) errors.push('invalid status');
    if (['AVAILABLE','HALF_DAY'].includes(this.status)) {
      if (!this.startTime || !this.endTime) errors.push('startTime and endTime required for status');
      if (this.startTime && this.endTime && this.startTime >= this.endTime) errors.push('startTime must be before endTime');
    }
    if (['UNAVAILABLE','DAY_OFF'].includes(this.status)) {
      if (this.startTime || this.endTime) errors.push('times must be null for status');
    }
    return errors;
  }

  static fromRow(row) {
    if (!row) return null;
    return new Schedule(
      row.id,
      row.weekday,
      row.status,
      row.start_time,
      row.end_time,
      row.notes,
      row.notify === 1 || row.notify === true,
      row.created_at,
      row.updated_at
    );
  }
}

module.exports = Schedule;
