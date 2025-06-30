const medicalServiceService = require('../services/MedicalServiceService');

class MedicalServiceController {
  // GET /api/medical-services
  async getAllMedicalServices(req, res) {
    try {
      const services = await medicalServiceService.getAllMedicalServices();
      res.status(200).json(services);
    } catch (error) {
      console.error('Controller error getting all medical services:', error);
      res.status(500).json({ 
        error: 'Failed to retrieve medical services',
        details: error.message 
      });
    }
  }

  // GET /api/medical-services/:serviceId
  async getMedicalServiceById(req, res) {
    try {
      const serviceId = req.params.serviceId;
      const service = await medicalServiceService.getMedicalServiceById(serviceId);
      res.status(200).json(service);
    } catch (error) {
      console.error('Controller error getting medical service by ID:', error);
      res.status(404).json({ 
        error: 'Medical service not found',
        details: error.message 
      });
    }
  }

  // POST /api/medical-services
  async createMedicalService(req, res) {
    try {
      console.log('=== CONTROLLER CREATE DEBUG ===');
      console.log('Request body:', req.body);
      console.log('Body type:', typeof req.body);
      console.log('Has serviceName:', 'serviceName' in req.body);
      console.log('Has price:', 'price' in req.body);
      console.log('================================');

      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          error: 'Request body is empty',
          hint: 'Make sure to send JSON data with serviceName and price' 
        });
      }

      const service = await medicalServiceService.createMedicalService(req.body);
      res.status(201).json(service);
    } catch (error) {
      console.error('Controller error creating medical service:', error);
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT /api/medical-services/:serviceId
  async updateMedicalService(req, res) {
    try {
      const serviceId = req.params.serviceId;
      const service = await medicalServiceService.updateMedicalService(serviceId, req.body);
      res.status(200).json(service);
    } catch (error) {
      console.error('Controller error updating medical service:', error);
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // DELETE /api/medical-services/:serviceId
  async deleteMedicalService(req, res) {
    try {
      const serviceId = req.params.serviceId;
      const result = await medicalServiceService.deleteMedicalService(serviceId);
      res.status(200).json(result);
    } catch (error) {
      console.error('Controller error deleting medical service:', error);
      res.status(404).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new MedicalServiceController();
