const adminService = require('../services/AdminService');

class AdminController {
  // GET /api/admins
  async getAllAdmins(req, res) {
    try {
      const admins = await adminService.getAllAdmins();
      res.json(admins);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // GET /api/admins/:adminId
  async getAdminById(req, res) {
    try {
      const admin = await adminService.getAdminById(req.params.adminId);
      res.json(admin);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // POST /api/admins
  async createAdmin(req, res) {
    try {
      const admin = await adminService.createAdmin(req.body);
      res.status(201).json(admin);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // PUT /api/admins/:adminId
  async updateAdmin(req, res) {
    try {
      const admin = await adminService.updateAdmin(req.params.adminId, req.body);
      res.json(admin);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // DELETE /api/admins/:adminId
  async deleteAdmin(req, res) {
    try {
      const result = await adminService.deleteAdmin(req.params.adminId);
      res.json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // POST /api/admins/login
  async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Email and password are required' 
        });
      }

      const admin = await adminService.loginAdmin(email, password);
      res.status(200).json({
        message: 'Admin login successful',
        admin: admin
      });
    } catch (error) {
      res.status(401).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // PUT /api/admins/:adminId/change-password
  async changePassword(req, res) {
    try {
      const { adminId } = req.params;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ 
          error: 'Old password and new password are required' 
        });
      }

      const admin = await adminService.changePassword(adminId, oldPassword, newPassword);
      res.status(200).json({
        message: 'Password changed successfully',
        admin: admin
      });
    } catch (error) {
      res.status(400).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new AdminController();
