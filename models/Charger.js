const mongoose = require('mongoose');

const chargerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a charger title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please add the location / address'],
      trim: true,
    },
    chargerType: {
      type: String,
      required: [true, 'Please specify charger type'],
      enum: ['Type 2 (AC)', 'CCS2 (DC Fast)', 'GB/T (DC)', '16A 3-Pin Socket'],
    },
    chargingSpeed: {
      type: String,
      required: [true, 'Please specify charging speed (e.g., 7.4 kW, 22 kW)'],
      trim: true,
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Please specify price per hour'],
      min: [1, 'Price per hour must be at least 1'],
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    startTime: {
      type: String,
      required: [true, 'Please specify available start time (e.g., 08:00)'],
      default: '08:00',
    },
    endTime: {
      type: String,
      required: [true, 'Please specify available end time (e.g., 22:00)'],
      default: '22:00',
    },
    contactPhone: {
      type: String,
      required: [true, 'Please specify contact phone number'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Charger', chargerSchema);
