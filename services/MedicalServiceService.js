const medicalServiceRepository = require('../repositories/MedicalServiceRepository');
const MedicalService = require('../models/MedicalService');

class MedicalServiceService {
  async getAllMedicalServices() {
    try {
      return await medicalServiceRepository.findAll();
    } catch (error) {
      console.error('Service error getting all medical services:', error);
      throw new Error('Failed to retrieve medical services');
    }
  }

  async getMedicalServiceById(serviceId) {
    try {
      const service = await medicalServiceRepository.findById(serviceId);
      if (!service) {
        throw new Error(`Medical service with ID ${serviceId} not found`);
      }
      return service;
    } catch (error) {
      console.error('Service error getting medical service by ID:', error);
      throw error;
    }
  }

  async createMedicalService(serviceData) {
    try {
      console.log('Service received data:', serviceData);
      
      // Basic validation
      if (!serviceData) {
        throw new Error('Service data is required');
      }
      
      if (!serviceData.serviceName || serviceData.serviceName.trim() === '') {
        throw new Error('Service name is required');
      }
      
      if (!serviceData.price || isNaN(serviceData.price) || serviceData.price <= 0) {
        throw new Error('Valid price greater than 0 is required');
      }

      // Check for duplicate service name
      const existingService = await medicalServiceRepository.findByName(serviceData.serviceName.trim());
      if (existingService) {
        throw new Error('A medical service with this name already exists');
      }

      // Create and validate model
      const medicalService = new MedicalService(
        null,
        serviceData.serviceName.trim(),
        parseFloat(serviceData.price)
      );

      const validationErrors = medicalService.validate();
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Save to database
      const savedService = await medicalServiceRepository.save({
        serviceName: medicalService.serviceName,
        price: medicalService.price
      });

      return savedService;
    } catch (error) {
      console.error('Service error creating medical service:', error);
      throw error;
    }
  }

  async updateMedicalService(serviceId, serviceData) {
    try {
      // Check if service exists
      await this.getMedicalServiceById(serviceId);

      // Validate updated data
      if (serviceData.serviceName !== undefined) {
        if (!serviceData.serviceName || serviceData.serviceName.trim() === '') {
          throw new Error('Service name cannot be empty');
        }
        
        // Check for duplicate name
        const existingService = await medicalServiceRepository.findByName(serviceData.serviceName.trim());
        if (existingService && existingService.serviceId != serviceId) {
          throw new Error('A medical service with this name already exists');
        }
      }

      if (serviceData.price !== undefined) {
        if (!serviceData.price || isNaN(serviceData.price) || serviceData.price <= 0) {
          throw new Error('Price must be greater than 0');
        }
      }

      const updatedService = await medicalServiceRepository.update(serviceId, serviceData);
      return updatedService;
    } catch (error) {
      console.error('Service error updating medical service:', error);
      throw error;
    }
  }

  async deleteMedicalService(serviceId) {
    try {
      // Check if service exists
      await this.getMedicalServiceById(serviceId);

      const success = await medicalServiceRepository.deleteById(serviceId);
      if (!success) {
        throw new Error('Failed to delete medical service');
      }
      
      return { message: 'Medical service deleted successfully' };
    } catch (error) {
      console.error('Service error deleting medical service:', error);
      throw error;
    }
  }
}

module.exports = new MedicalServiceService();
