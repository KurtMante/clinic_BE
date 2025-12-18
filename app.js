// This file is not needed if server.js is your main entry point.
// You can remove or ignore this file.

const express = require('express');
const app = express();
const rescheduleRoutes = require('./routes/rescheduleRoutes');

app.use('/api/reschedules', rescheduleRoutes);

// Reschedule an appointment
app.post('/:appointmentId', async (req, res) => {
  try {
    const appointmentId = req.params.appointmentId;
    const { preferredDateTime, symptom, status } = req.body;

    // Validate required fields
    if (!preferredDateTime) {
      return res.status(400).json({ error: 'Preferred date/time is required' });
    }

    // Check doctor availability for the new schedule
    await assertDoctorAvailable(preferredDateTime);

    const updatedAppointment = await appointmentService.updateAppointment(appointmentId, {
      preferredDateTime,
      symptom,
      status
    });

    res.status(200).json(updatedAppointment);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(400).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;