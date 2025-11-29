const Schedule = require('../models/Schedule');
const scheduleRepository = require('../repositories/ScheduleRepository');

const validatePayload = ({ status, start_time, end_time }) => {
  const allowed = ['AVAILABLE', 'UNAVAILABLE', 'HALF_DAY', 'DAY_OFF'];
  if (status && !allowed.includes(status)) return 'Invalid status';
  if (['AVAILABLE', 'HALF_DAY'].includes(status)) {
    if (!start_time || !end_time) return 'start_time and end_time required for this status';
    if (start_time >= end_time) return 'start_time must be before end_time';
  }
  if (['UNAVAILABLE', 'DAY_OFF'].includes(status)) {
    // times should be null for these
  }
  return null;
};

exports.getAllSchedules = async (req, res) => {
  try {
    const data = await scheduleRepository.findAll();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.upsertSchedule = async (req, res) => {
  const { weekday } = req.params;
  const { status, start_time, end_time, notes, notify } = req.body;

  try {
    const sched = new Schedule(
      null,
      Number(weekday),
      status,
      start_time || null,
      end_time || null,
      notes || null,
      notify !== undefined ? !!notify : true
    );
    const saved = await scheduleRepository.upsert(sched);
    res.json(saved);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.markStatus = async (req, res) => {
  const { weekday } = req.params;
  const { status, start_time, end_time } = req.body;
  try {
    const saved = await scheduleRepository.updateStatus(
      Number(weekday),
      status,
      start_time || null,
      end_time || null
    );
    res.json(saved);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.addNote = async (req, res) => {
  const { weekday } = req.params;
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'note required' });

  try {
    const saved = await scheduleRepository.appendNote(Number(weekday), note);
    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
