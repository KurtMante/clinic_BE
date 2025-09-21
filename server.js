const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const patientRepository = require('./repositories/PatientRepository');
const medicalServiceRepository = require('./repositories/MedicalServiceRepository');
const appointmentRepository = require('./repositories/AppointmentRepository');
const acceptedAppointmentRepository = require('./repositories/AcceptedAppointmentRepository');
const feedbackRepository = require('./repositories/FeedbackRepository');
const staffRepository = require('./repositories/StaffRepository');
const reminderRepository = require('./repositories/ReminderRepository');
const adminRepository = require('./repositories/AdminRepository');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Request body:', req.body);
  }
  next();
});

// Routes
const patientRoutes = require('./routes/patientRoutes');
const medicalServiceRoutes = require('./routes/medicalServiceRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const acceptedAppointmentRoutes = require('./routes/acceptedAppointmentRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const staffRoutes = require('./routes/staffRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/patients', patientRoutes);
app.use('/api/medical-services', medicalServiceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/accepted-appointments', acceptedAppointmentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admins', adminRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Clinic Backend API is running!',
    timestamp: new Date().toISOString()
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await testConnection();
    await patientRepository.createTable();
    await medicalServiceRepository.createTable();
    await appointmentRepository.createTable();
    await acceptedAppointmentRepository.createTable();
    await feedbackRepository.createTable();
    await staffRepository.createTable();
    await reminderRepository.createTable();
    await adminRepository.createTable();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Test the API at: http://localhost:${PORT}/api/admins`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
