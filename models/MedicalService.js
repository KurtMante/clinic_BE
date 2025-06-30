class MedicalService {
  constructor(serviceId, serviceName, price) {
    this.serviceId = serviceId;
    this.serviceName = serviceName;
    this.price = price;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Simple validation
  validate() {
    const errors = [];
    if (!this.serviceName || this.serviceName.trim() === '') {
      errors.push('Service name is required');
    }
    if (!this.price || this.price <= 0) {
      errors.push('Price must be greater than 0');
    }
    return errors;
  }
}

module.exports = MedicalService;
