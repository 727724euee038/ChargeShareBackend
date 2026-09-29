const Booking = require('../models/Booking');
const Charger = require('../models/Charger');

// Helper to convert "HH:MM" string to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Helper to check if two time ranges overlap
// [start1, end1] and [start2, end2]
const hasOverlap = (start1, end1, start2, end2) => {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  return s1 < e2 && s2 < e1;
};

// @desc    Create a new booking request
// @route   POST /api/bookings
// @access  Private (EV User)
const createBooking = async (req, res) => {
  try {
    const { chargerId, bookingDate, startTime, endTime, vehicleInfo, notes } = req.body;

    if (!chargerId || !bookingDate || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please provide charger, date, start time, and end time' });
    }

    const charger = await Charger.findById(chargerId);
    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger listing not found' });
    }

    // Prevent booking own charger
    if (charger.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot book your own charger listing' });
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);

    if (endMin <= startMin) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const durationMinutes = endMin - startMin;
    const totalHours = parseFloat((durationMinutes / 60).toFixed(2));

    if (totalHours < 0.5) {
      return res.status(400).json({ success: false, message: 'Minimum booking duration is 30 minutes' });
    }

    // Check charger's operating hours
    const chargerOpenMin = timeToMinutes(charger.startTime);
    const chargerCloseMin = timeToMinutes(charger.endTime);

    if (startMin < chargerOpenMin || endMin > chargerCloseMin) {
      return res.status(400).json({
        success: false,
        message: `Charger operating hours are ${charger.startTime} to ${charger.endTime}. Your selected slot is outside operating hours.`,
      });
    }

    // Check charger's operating days
    const dateObj = new Date(bookingDate + 'T00:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const requestedDay = dayNames[dateObj.getDay()];

    if (charger.availableDays && charger.availableDays.length > 0 && !charger.availableDays.includes(requestedDay)) {
      return res.status(400).json({
        success: false,
        message: `Charger is not available on ${requestedDay}s. Available days: ${charger.availableDays.join(', ')}`,
      });
    }

    // Conflict detection: Check existing Accepted bookings for this charger on the same date
    const acceptedBookings = await Booking.find({
      charger: chargerId,
      bookingDate: bookingDate,
      status: 'Accepted',
    });

    const conflictingBooking = acceptedBookings.find((b) =>
      hasOverlap(startTime, endTime, b.startTime, b.endTime)
    );

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: `Slot Conflict: This charger already has an accepted booking from ${conflictingBooking.startTime} to ${conflictingBooking.endTime} on ${bookingDate}. Please choose another time.`,
      });
    }

    // Calculate total amount
    const totalAmount = Math.round(totalHours * charger.pricePerHour);

    const booking = await Booking.create({
      user: req.user._id,
      charger: chargerId,
      bookingDate,
      startTime,
      endTime,
      totalHours,
      totalAmount,
      vehicleInfo: vehicleInfo || '',
      notes: notes || '',
      status: 'Pending',
    });

    await booking.populate('charger', 'title location pricePerHour chargerType');

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error('Create booking error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings of the logged-in EV user
// @route   GET /api/bookings/my-bookings
// @access  Private (User)
const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate({
        path: 'charger',
        select: 'title location chargerType chargingSpeed pricePerHour contactPhone owner',
        populate: {
          path: 'owner',
          select: 'name phone email',
        },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('Get user bookings error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booking requests for seller's chargers
// @route   GET /api/bookings/seller-requests
// @access  Private (Seller, Admin)
const getSellerBookings = async (req, res) => {
  try {
    // Find all chargers owned by this seller
    const sellerChargers = await Charger.find({ owner: req.user._id }).select('_id');
    const chargerIds = sellerChargers.map((c) => c._id);

    const bookings = await Booking.find({ charger: { $in: chargerIds } })
      .populate('user', 'name email phone')
      .populate('charger', 'title location pricePerHour chargerType')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.error('Get seller bookings error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Seller accepts or rejects booking
// @route   PUT /api/bookings/:id/status
// @access  Private (Seller, Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Accepted', 'Rejected', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const booking = await Booking.findById(req.params.id).populate('charger');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check if seller owns the charger (or is admin)
    if (booking.charger.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to manage this booking' });
    }

    // If accepting, verify there's no newly conflicting accepted booking
    if (status === 'Accepted') {
      const existingAccepted = await Booking.find({
        charger: booking.charger._id,
        bookingDate: booking.bookingDate,
        status: 'Accepted',
        _id: { $ne: booking._id },
      });

      const conflict = existingAccepted.find((b) =>
        hasOverlap(booking.startTime, booking.endTime, b.startTime, b.endTime)
      );

      if (conflict) {
        return res.status(400).json({
          success: false,
          message: `Cannot accept: Another accepted booking already exists from ${conflict.startTime} to ${conflict.endTime} on ${booking.bookingDate}.`,
        });
      }
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Update booking status error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a pending booking request
// @route   PUT /api/bookings/:id/cancel
// @access  Private (User who booked or Seller/Admin)
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Only user who booked, seller, or admin can cancel
    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an already completed booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error('Cancel booking error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getSellerBookings,
  updateBookingStatus,
  cancelBooking,
};
