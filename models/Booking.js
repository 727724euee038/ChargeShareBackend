const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    charger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Charger',
      required: true,
    },
    bookingDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Please specify booking date'],
    },
    startTime: {
      type: String, // Format: HH:MM
      required: [true, 'Please specify start time'],
    },
    endTime: {
      type: String, // Format: HH:MM
      required: [true, 'Please specify end time'],
    },
    totalHours: {
      type: Number,
      required: [true, 'Total hours is required'],
      min: [0.5, 'Minimum booking duration is 0.5 hours'],
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0,
    },
    vehicleInfo: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
