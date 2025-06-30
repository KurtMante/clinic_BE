const patientService = require('../services/PatientService');

class PatientController {
  // GET /api/patients
  async getAllPatients(req, res) {
    try {
      const patients = await patientService.getAllPatients();
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/patients/:patientId
  async getPatientById(req, res) {
    try {
      const patient = await patientService.getPatientById(req.params.patientId);
      res.json(patient);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // POST /api/patients
  async createPatient(req, res) {
    try {
      const patient = await patientService.createPatient(req.body);
      res.status(201).json(patient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/patients/:patientId
  async updatePatient(req, res) {
    try {
      const patient = await patientService.updatePatient(req.params.patientId, req.body);
      res.json(patient);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/patients/:patientId
  async deletePatient(req, res) {
    try {
      const result = await patientService.deletePatient(req.params.patientId);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // POST /api/patients/login
  async loginPatient(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const patient = await patientService.loginPatient(email, password);
      res.status(200).json({
        message: 'Login successful',
        patient: patient
      });
    } catch (error) {
      res.status(401).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT /api/patients/:patientId/change-password
  async changePassword(req, res) {
    try {
      const { patientId } = req.params;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Old password and new password are required' 
        });
      }

      const patient = await patientService.changePassword(patientId, oldPassword, newPassword);
      res.status(200).json({
        message: 'Password changed successfully',
        patient: patient
      });
    } catch (error) {
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new PatientController();
