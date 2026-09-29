const express = require('express');
const router = express.Router();
const {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllChargersAdmin,
  deleteChargerAdmin,
  getAllBookingsAdmin,
  deleteBookingAdmin,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require protect and admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.get('/chargers', getAllChargersAdmin);
router.delete('/chargers/:id', deleteChargerAdmin);
router.get('/bookings', getAllBookingsAdmin);
router.delete('/bookings/:id', deleteBookingAdmin);

module.exports = router;
