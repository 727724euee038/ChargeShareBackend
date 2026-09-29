const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getSellerBookings,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('user', 'admin'), createBooking);
router.get('/my-bookings', protect, getUserBookings);
router.get('/seller-requests', protect, authorize('seller', 'admin'), getSellerBookings);
router.put('/:id/status', protect, authorize('seller', 'admin'), updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
