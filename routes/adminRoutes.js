const express = require('express');
const adminController = require('../controllers/AdminController');

const router = express.Router();

router.get('/', adminController.getAllAdmins);
router.get('/:adminId', adminController.getAdminById);
router.post('/', adminController.createAdmin);
router.put('/:adminId', adminController.updateAdmin);
router.delete('/:adminId', adminController.deleteAdmin);

// POST login admin
router.post('/login', adminController.loginAdmin);

// PUT change password
router.put('/:adminId/change-password', adminController.changePassword);

module.exports = router;
