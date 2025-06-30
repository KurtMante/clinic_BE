const adminRepository = require('../repositories/AdminRepository');
const Admin = require('../models/Admin');

class AdminService {
  async getAllAdmins() {
    return await adminRepository.findAll();
  }

  async getAdminById(adminId) {
    const admin = await adminRepository.findById(adminId);
    if (!admin) {
      throw new Error(`Admin with adminId ${adminId} not found`);
    }
    return admin;
  }

  async createAdmin(adminData) {
    // Validate required fields
    if (!adminData.password) {
      throw new Error('Password is required');
    }

    // Validate role if provided
    if (adminData.role) {
      const validRoles = ['Admin', 'SuperAdmin'];
      if (!validRoles.includes(adminData.role)) {
        throw new Error('Role must be either Admin or SuperAdmin');
      }
    }

    // Check if email already exists
    const existingAdmin = await adminRepository.findByEmail(adminData.email);
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }

    // Validate admin data
    const tempAdmin = new Admin(
      null, 
      adminData.firstName, 
      adminData.lastName, 
      adminData.email, 
      adminData.phone,
      adminData.dateOfBirth,
      adminData.emergencyContactName,
      adminData.emergencyContactRelationship,
      adminData.emergencyContactPhone1,
      adminData.emergencyContactPhone2,
      adminData.streetAddress,
      adminData.barangay,
      adminData.municipality,
      adminData.password,
      adminData.role || 'Admin'
    );
    const validationErrors = tempAdmin.validate();
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    return await adminRepository.save(adminData);
  }

  async loginAdmin(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const admin = await adminRepository.findByEmailAndPassword(email, password);
    if (!admin) {
      throw new Error('Invalid email or password');
    }

    // Remove password from response for security
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
  }

  async changePassword(adminId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new Error('Old password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const existingAdmin = await this.getAdminById(adminId);
    
    // Verify old password
    if (existingAdmin.password !== oldPassword) {
      throw new Error('Invalid old password');
    }

    const updatedAdmin = await adminRepository.update(adminId, { password: newPassword });
    
    // Remove password from response
    const { password: _, ...adminWithoutPassword } = updatedAdmin;
    return adminWithoutPassword;
  }

  async updateAdmin(adminId, adminData) {
    const existingAdmin = await this.getAdminById(adminId);
    
    // Validate role if being updated
    if (adminData.role !== undefined) {
      const validRoles = ['Admin', 'SuperAdmin'];
      if (!validRoles.includes(adminData.role)) {
        throw new Error('Role must be either Admin or SuperAdmin');
      }
    }
    
    // Check if email is being changed and if it conflicts
    if (adminData.email && adminData.email !== existingAdmin.email) {
      const emailExists = await adminRepository.findByEmail(adminData.email);
      if (emailExists) {
        throw new Error('Email already exists for another admin');
      }
    }

    const updatedAdmin = await adminRepository.update(adminId, adminData);
    if (!updatedAdmin) {
      throw new Error(`Failed to update admin with adminId ${adminId}`);
    }
    return updatedAdmin;
  }

  async deleteAdmin(adminId) {
    const success = await adminRepository.deleteById(adminId);
    if (!success) {
      throw new Error(`Admin with adminId ${adminId} not found`);
    }
    return { message: 'Admin deleted successfully' };
  }
}

module.exports = new AdminService();
