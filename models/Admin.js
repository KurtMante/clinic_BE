class Admin {
  constructor(adminId, firstName, lastName, email, phone, dateOfBirth, emergencyContactName, emergencyContactRelationship, emergencyContactPhone1, emergencyContactPhone2, streetAddress, barangay, municipality, password, role = 'Admin') {
    this.adminId = adminId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.phone = phone;
    this.dateOfBirth = dateOfBirth;
    this.emergencyContactName = emergencyContactName;
    this.emergencyContactRelationship = emergencyContactRelationship;
    this.emergencyContactPhone1 = emergencyContactPhone1;
    this.emergencyContactPhone2 = emergencyContactPhone2;
    this.streetAddress = streetAddress;
    this.barangay = barangay;
    this.municipality = municipality;
    this.password = password;
    this.role = role; // Default role is 'Admin'
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Validation method
  validate() {
    const errors = [];
    if (!this.firstName) errors.push('First name is required');
    if (!this.lastName) errors.push('Last name is required');
    if (!this.email) errors.push('Email is required');
    if (!this.phone) errors.push('Phone number is required');
    if (!this.password || this.password.length < 6) errors.push('Password must be at least 6 characters long');
    
    // Validate role
    const validRoles = ['Admin', 'SuperAdmin'];
    if (this.role && !validRoles.includes(this.role)) {
      errors.push('Role must be either Admin or SuperAdmin');
    }
    
    return errors;
  }
}

module.exports = Admin;
