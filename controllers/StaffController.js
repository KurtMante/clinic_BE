const staffService = require('../services/StaffService');

class StaffController {
  // GET /api/staff
  async getAllStaff(req, res) {
    try {
      const staff = await staffService.getAllStaff();
      res.json(staff);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/staff/:staffId
  async getStaffById(req, res) {
    try {
      const staff = await staffService.getStaffById(req.params.staffId);
      res.json(staff);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // POST /api/staff
  async createStaff(req, res) {
    try {
      const staff = await staffService.createStaff(req.body);
      res.status(201).json(staff);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/staff/:staffId
  async updateStaff(req, res) {
    try {
      const staff = await staffService.updateStaff(req.params.staffId, req.body);
      res.json(staff);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/staff/:staffId
  async deleteStaff(req, res) {
    const { staffId } = req.params;
    const deletedByStaffId = req.body.deletedByStaffId; // Pass from frontend

    try {
      await staffService.softDeleteStaff(staffId, deletedByStaffId);
      res.json({ message: 'Staff soft deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to soft delete staff' });
    }
  }

  // POST /api/staff/login
  async loginStaff(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const staff = await staffService.loginStaff(email, password);
      res.status(200).json({
        message: 'Login successful',
        staff: staff
      });
    } catch (error) {
      res.status(401).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT /api/staff/:staffId/change-password
  async changePassword(req, res) {
    try {
      const { staffId } = req.params;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Old password and new password are required' 
        });
      }

      const staff = await staffService.changePassword(staffId, oldPassword, newPassword);
      res.status(200).json({
        message: 'Password changed successfully',
        staff: staff
      });
    } catch (error) {
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new StaffController();
