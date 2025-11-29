const express = require('express');
const controller = require('../controllers/scheduleController');

const router = express.Router();

router.get('/', controller.getAllSchedules);
router.put('/:weekday', controller.upsertSchedule);
router.put('/:weekday/status', controller.markStatus);
router.post('/:weekday/notes', controller.addNote);

module.exports = router;