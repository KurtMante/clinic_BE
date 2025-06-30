const express = require('express');
const staffController = require('../controllers/StaffController');

const router = express.Router();

router.get('/', staffController.getAllStaff);
router.get('/:staffId', staffController.getStaffById);
router.post('/', staffController.createStaff);
router.put('/:staffId', staffController.updateStaff);
router.delete('/:staffId', staffController.deleteStaff);

// POST login staff
router.post('/login', staffController.loginStaff);

// PUT change password
router.put('/:staffId/change-password', staffController.changePassword);

module.exports = router;
