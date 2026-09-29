const Charger = require('../models/Charger');
const Booking = require('../models/Booking');

// @desc    Create a new charger listing
// @route   POST /api/chargers
// @access  Private (Seller, Admin)
const createCharger = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      chargerType,
      chargingSpeed,
      pricePerHour,
      availableDays,
      startTime,
      endTime,
      contactPhone,
    } = req.body;

    if (!title || !description || !location || !chargerType || !chargingSpeed || !pricePerHour || !contactPhone) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const charger = await Charger.create({
      owner: req.user._id,
      title,
      description,
      location,
      chargerType,
      chargingSpeed,
      pricePerHour: Number(pricePerHour),
      availableDays: availableDays && availableDays.length > 0 ? availableDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      startTime: startTime || '08:00',
      endTime: endTime || '22:00',
      contactPhone,
    });

    res.status(201).json({ success: true, data: charger });
  } catch (error) {
    console.error('Create charger error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all public chargers with search & filters
// @route   GET /api/chargers
// @access  Public
const getAllChargers = async (req, res) => {
  try {
    const { keyword, chargerType, maxPrice } = req.query;

    let query = { status: 'active' };

    // Search keyword in title or location or description
    if (keyword && keyword.trim() !== '') {
      const regex = new RegExp(keyword.trim(), 'i');
      query.$or = [{ title: regex }, { location: regex }, { description: regex }];
    }

    // Filter by charger type
    if (chargerType && chargerType !== 'all') {
      query.chargerType = chargerType;
    }

    // Filter by max price per hour
    if (maxPrice && !isNaN(maxPrice)) {
      query.pricePerHour = { $lte: Number(maxPrice) };
    }

    const chargers = await Charger.find(query)
      .populate('owner', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: chargers.length, data: chargers });
  } catch (error) {
    console.error('Get all chargers error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single charger by ID
// @route   GET /api/chargers/:id
// @access  Public
const getChargerById = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id).populate('owner', 'name email phone');

    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger listing not found' });
    }

    res.json({ success: true, data: charger });
  } catch (error) {
    console.error('Get charger by ID error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current seller's own chargers
// @route   GET /api/chargers/my-chargers
// @access  Private (Seller, Admin)
const getMyChargers = async (req, res) => {
  try {
    const chargers = await Charger.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: chargers.length, data: chargers });
  } catch (error) {
    console.error('Get my chargers error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update charger listing
// @route   PUT /api/chargers/:id
// @access  Private (Owner, Admin)
const updateCharger = async (req, res) => {
  try {
    let charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger listing not found' });
    }

    // Check ownership unless admin
    if (charger.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this charger listing' });
    }

    charger = await Charger.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: charger });
  } catch (error) {
    console.error('Update charger error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete charger listing
// @route   DELETE /api/chargers/:id
// @access  Private (Owner, Admin)
const deleteCharger = async (req, res) => {
  try {
    const charger = await Charger.findById(req.params.id);

    if (!charger) {
      return res.status(404).json({ success: false, message: 'Charger listing not found' });
    }

    // Check ownership unless admin
    if (charger.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this charger listing' });
    }

    // Safety check: prevent deletion if active/accepted bookings exist
    const activeBookings = await Booking.find({
      charger: req.params.id,
      status: { $in: ['Pending', 'Accepted'] },
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete listing. There are ${activeBookings.length} pending or accepted bookings associated with this charger.`,
      });
    }

    await Charger.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Charger listing removed successfully' });
  } catch (error) {
    console.error('Delete charger error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCharger,
  getAllChargers,
  getChargerById,
  getMyChargers,
  updateCharger,
  deleteCharger,
};
