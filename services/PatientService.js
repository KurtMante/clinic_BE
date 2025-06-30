const patientRepository = require('../repositories/PatientRepository');
const Patient = require('../models/Patient');

class PatientService {
  async getAllPatients() {
    return await patientRepository.findAll();
  }

  async getPatientById(patientId) {
    const patient = await patientRepository.findById(patientId);
    if (!patient) {
      throw new Error(`Patient with patientId ${patientId} not found`);
    }
    return patient;
  }

  async createPatient(patientData) {
    // Validate required fields
    if (!patientData.password) {
      throw new Error('Password is required');
    }

    // Validate role if provided
    if (patientData.role) {
      const validRoles = ['Patient', 'Admin', 'Walkin'];
      if (!validRoles.includes(patientData.role)) {
        throw new Error('Role must be either Patient, Admin, or Walkin');
      }
    }

    // Check if email already exists
    const existingPatient = await patientRepository.findByEmail(patientData.email);
    if (existingPatient) {
      throw new Error('Patient with this email already exists');
    }

    // Validate patient data
    const tempPatient = new Patient(
      null, 
      patientData.firstName, 
      patientData.lastName, 
      patientData.email, 
      patientData.phone,
      patientData.dateOfBirth,
      patientData.emergencyContactName,
      patientData.emergencyContactRelationship,
      patientData.emergencyContactPhone1,
      patientData.emergencyContactPhone2,
      patientData.streetAddress,
      patientData.barangay,
      patientData.municipality,
      patientData.password,
      patientData.role || 'Patient'
    );
    const validationErrors = tempPatient.validate();
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    return await patientRepository.save(patientData);
  }

  async loginPatient(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const patient = await patientRepository.findByEmailAndPassword(email, password);
    if (!patient) {
      throw new Error('Invalid email or password');
    }

    // Remove password from response for security
    const { password: _, ...patientWithoutPassword } = patient;
    return patientWithoutPassword;
  }

  async changePassword(patientId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new Error('Old password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const existingPatient = await this.getPatientById(patientId);
    
    // Verify old password
    if (existingPatient.password !== oldPassword) {
      throw new Error('Invalid old password');
    }

    const updatedPatient = await patientRepository.update(patientId, { password: newPassword });
    
    // Remove password from response
    const { password: _, ...patientWithoutPassword } = updatedPatient;
    return patientWithoutPassword;
  }

  async updatePatient(patientId, patientData) {
    const existingPatient = await this.getPatientById(patientId);
    
    // Validate role if being updated
    if (patientData.role !== undefined) {
      const validRoles = ['Patient', 'Admin', 'Walkin'];
      if (!validRoles.includes(patientData.role)) {
        throw new Error('Role must be either Patient, Admin, or Walkin');
      }
    }
    
    // Check if email is being changed and if it conflicts
    if (patientData.email && patientData.email !== existingPatient.email) {
      const emailExists = await patientRepository.findByEmail(patientData.email);
      if (emailExists) {
        throw new Error('Email already exists for another patient');
      }
    }

    const updatedPatient = await patientRepository.update(patientId, patientData);
    if (!updatedPatient) {
      throw new Error(`Failed to update patient with patientId ${patientId}`);
    }
    return updatedPatient;
  }

  async deletePatient(patientId) {
    const success = await patientRepository.deleteById(patientId);
    if (!success) {
      throw new Error(`Patient with patientId ${patientId} not found`);
    }
    return { message: 'Patient deleted successfully' };
  }
}

module.exports = new PatientService();
