const staffRepository = require('../repositories/StaffRepository');
const Staff = require('../models/Staff');
const { sendEmail } = require('./EmailService'); // added

class StaffService {
  async getAllStaff() {
    return await staffRepository.findAll();
  }

  async getStaffById(staffId) {
    const staff = await staffRepository.findById(staffId);
    if (!staff) {
      throw new Error(`Staff with staffId ${staffId} not found`);
    }
    return staff;
  }

  async createStaff(staffData) {
    // Validate required fields
    if (!staffData.password) {
      throw new Error('Password is required');
    }

    // Check if email already exists
    const existingStaff = await staffRepository.findByEmail(staffData.email);
    if (existingStaff) {
      throw new Error('Staff with this email already exists');
    }

    // Validate staff data
    const tempStaff = new Staff(
      null, 
      staffData.firstName, 
      staffData.lastName, 
      staffData.email, 
      staffData.phone,
      staffData.dateOfBirth,
      staffData.emergencyContactName,
      staffData.emergencyContactRelationship,
      staffData.emergencyContactPhone1,
      staffData.emergencyContactPhone2,
      staffData.streetAddress,
      staffData.barangay,
      staffData.municipality,
      staffData.password
    );
    const validationErrors = tempStaff.validate();
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    const saved = await staffRepository.save(staffData);
    if (saved?.email) {
      sendEmail({
        toEmail: saved.email,
        subject: 'Welcome to Clinic System',
        text: `Hi ${saved.firstName || ''}, your staff account has been created.`,
        html: `<p>Hi ${saved.firstName || ''},<br>Your staff account has been created.</p>`
      });
    }
    return saved;
  }

  async loginStaff(email, password) {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const staff = await staffRepository.findByEmailAndPassword(email, password);
    if (!staff) {
      throw new Error('Invalid email or password');
    }

    // Remove password from response for security
    const { password: _, ...staffWithoutPassword } = staff;
    return staffWithoutPassword;
  }

  async changePassword(staffId, oldPassword, newPassword) {
    if (!oldPassword || !newPassword) {
      throw new Error('Old password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    const existingStaff = await this.getStaffById(staffId);
    
    // Verify old password
    if (existingStaff.password !== oldPassword) {
      throw new Error('Invalid old password');
    }

    const updatedStaff = await staffRepository.update(staffId, { password: newPassword });
    
    // Remove password from response
    const { password: _, ...staffWithoutPassword } = updatedStaff;
    if (staffWithoutPassword.email) {
      sendEmail({
        toEmail: staffWithoutPassword.email,
        subject: 'Password Changed',
        text: 'Your password was changed successfully.',
        html: '<p>Your password was changed successfully.</p>'
      });
    }
    return staffWithoutPassword;
  }

  async updateStaff(staffId, staffData) {
    const existingStaff = await this.getStaffById(staffId);
    
    // Check if email is being changed and if it conflicts
    if (staffData.email && staffData.email !== existingStaff.email) {
      const emailExists = await staffRepository.findByEmail(staffData.email);
      if (emailExists) {
        throw new Error('Email already exists for another staff member');
      }
    }

    const updatedStaff = await staffRepository.update(staffId, staffData);
    if (!updatedStaff) {
      throw new Error(`Failed to update staff with staffId ${staffId}`);
    }
    return updatedStaff;
  }

  async softDeleteStaff(staffId, deletedByStaffId) {
  // Use your staff repository or db connection here
  await staffRepository.softDelete(staffId, deletedByStaffId);
}

  async deleteStaff(staffId) {
    const success = await staffRepository.deleteById(staffId);
    if (!success) {
      throw new Error(`Staff with staffId ${staffId} not found`);
    }
    return { message: 'Staff deleted successfully' };
  }
}



module.exports = new StaffService();
