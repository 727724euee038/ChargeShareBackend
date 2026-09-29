const User = require('../models/User');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');

// @desc    Get dashboard statistics for Admin
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalChargers = await Charger.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
    const acceptedBookings = await Booking.countDocuments({ status: 'Accepted' });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalChargers,
        totalBookings,
        pendingBookings,
        acceptedBookings,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all registered users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Get admin users error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user by ID
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent admin from deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot delete their own account' });
    }

    // Cleanup user's chargers and bookings
    await Charger.deleteMany({ owner: user._id });
    await Booking.deleteMany({ user: user._id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User and associated data removed' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all chargers for admin
// @route   GET /api/admin/chargers
// @access  Private (Admin)
const getAllChargersAdmin = async (req, res) => {
  try {
    const chargers = await Charger.find()
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: chargers.length, data: chargers });
  } catch (error) {
    console.error('Admin get chargers error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete charger for admin
// @route   DELETE /api/admin/chargers/:id
// @access  Private (Admin)
const deleteChargerAdmin = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id);
    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger listing not found' });
    }

    await Booking.deleteMany({ charger: req.params.id });
    await Charger.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Charger listing deleted by admin' });
  } catch (error) {
    console.error('Admin delete charger error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all bookings for admin
// @route   GET /api/admin/bookings
// @access  Private (Admin)
const getAllBookingsAdmin = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'name email phone')
      .populate('charger', 'title location pricePerHour chargerType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('Admin get bookings error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete booking for admin
// @route   DELETE /api/admin/bookings/:id
// @access  Private (Admin)
const deleteBookingAdmin = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Booking removed successfully' });
  } catch (error) {
    console.error('Admin delete booking error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  deleteUser,
  getAllChargersAdmin,
  deleteChargerAdmin,
  getAllBookingsAdmin,
  deleteBookingAdmin,
};
