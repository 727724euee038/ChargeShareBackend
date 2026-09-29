const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Charger = require('../models/Charger');
const Booking = require('../models/Booking');

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chargeshare';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing collections
    await Booking.deleteMany();
    await Charger.deleteMany();
    await User.deleteMany();
    console.log('Cleared existing data.');

    // 1. Create Users (User model will trigger bcrypt hash hook on save)
    const adminUser = new User({
      name: 'System Admin',
      email: 'admin@chargeshare.com',
      password: 'admin123',
      phone: '+91 98765 00001',
      role: 'admin',
    });
    await adminUser.save();

    const seller1 = new User({
      name: 'Rajesh Kumar',
      email: 'rajesh.seller@chargeshare.com',
      password: 'seller123',
      phone: '+91 98765 11111',
      role: 'seller',
    });
    await seller1.save();

    const seller2 = new User({
      name: 'Anita Sharma',
      email: 'anita.seller@chargeshare.com',
      password: 'seller123',
      phone: '+91 98765 22222',
      role: 'seller',
    });
    await seller2.save();

    const evUser1 = new User({
      name: 'Arun Patel',
      email: 'arun.user@chargeshare.com',
      password: 'user123',
      phone: '+91 98765 33333',
      role: 'user',
    });
    await evUser1.save();

    const evUser2 = new User({
      name: 'Priya Nair',
      email: 'priya.user@chargeshare.com',
      password: 'user123',
      phone: '+91 98765 44444',
      role: 'user',
    });
    await evUser2.save();

    console.log('Users seeded successfully:');
    console.log('  Admin:   admin@chargeshare.com / admin123');
    console.log('  Seller1: rajesh.seller@chargeshare.com / seller123');
    console.log('  Seller2: anita.seller@chargeshare.com / seller123');
    console.log('  User1:   arun.user@chargeshare.com / user123');
    console.log('  User2:   priya.user@chargeshare.com / user123');

    // 2. Create Realistic Chargers
    const chargers = [
      {
        owner: seller1._id,
        title: 'Koramangala 7.4kW Fast Home Charger',
        description: 'Dedicated residential EV wallbox located in gated villa with CCTV. Easy drive-in access, shaded parking, clean power backup.',
        location: '4th Block, Koramangala, Bengaluru, Karnataka',
        chargerType: 'Type 2 (AC)',
        chargingSpeed: '7.4 kW',
        pricePerHour: 120,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '07:00',
        endTime: '22:00',
        contactPhone: '+91 98765 11111',
      },
      {
        owner: seller2._id,
        title: 'Indiranagar 11kW Smart Wallbox',
        description: 'High quality 11kW AC charger suitable for all modern European and Indian EVs. Located 2 minutes from 100ft Road with convenient parking.',
        location: '12th Main Road, Indiranagar, Bengaluru, Karnataka',
        chargerType: 'Type 2 (AC)',
        chargingSpeed: '11 kW',
        pricePerHour: 150,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '08:00',
        endTime: '21:00',
        contactPhone: '+91 98765 22222',
      },
      {
        owner: seller1._id,
        title: 'HSR Layout 22kW High-Speed CCS2 Station',
        description: 'Private DC fast charger setup at home garage. Ideal for rapid top-ups on long highway trips or city commutes.',
        location: 'Sector 2, HSR Layout, Bengaluru, Karnataka',
        chargerType: 'CCS2 (DC Fast)',
        chargingSpeed: '22 kW',
        pricePerHour: 220,
        availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '06:00',
        endTime: '23:00',
        contactPhone: '+91 98765 11111',
      },
      {
        owner: seller2._id,
        title: 'Whitefield Residential 16A Overnight Point',
        description: 'Safe and budget-friendly 16 Amp 3-pin heavy socket in apartment covered basement with dedicated sub-meter. Ideal for overnight trickle charging.',
        location: 'ECC Road, Whitefield, Bengaluru, Karnataka',
        chargerType: '16A 3-Pin Socket',
        chargingSpeed: '3.3 kW',
        pricePerHour: 75,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '18:00',
        endTime: '23:30',
        contactPhone: '+91 98765 22222',
      },
      {
        owner: seller1._id,
        title: 'Jayanagar Type 2 Rapid Home Port',
        description: 'Clean covered porch parking with Type 2 connector. Wi-Fi and waiting lounge with water available for EV owners.',
        location: '9th Block, Jayanagar, Bengaluru, Karnataka',
        chargerType: 'Type 2 (AC)',
        chargingSpeed: '7.4 kW',
        pricePerHour: 130,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        startTime: '07:00',
        endTime: '21:00',
        contactPhone: '+91 98765 11111',
      },
      {
        owner: seller2._id,
        title: 'Electronic City Phase 1 GB/T Fast Charger',
        description: 'Equipped with GB/T gun suitable for Mahindra eVerito, Tigor EV, and commercial fleet EVs. Dedicated wide ramp access.',
        location: 'Near Wipro Gate 5, Electronic City Phase 1, Bengaluru, Karnataka',
        chargerType: 'GB/T (DC)',
        chargingSpeed: '15 kW',
        pricePerHour: 180,
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        startTime: '08:00',
        endTime: '20:00',
        contactPhone: '+91 98765 22222',
      },
    ];

    const createdChargers = await Charger.insertMany(chargers);
    console.log(`Created ${createdChargers.length} sample chargers.`);

    // 3. Create Sample Bookings
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - 2);
    const pastStr = pastDate.toISOString().split('T')[0];

    const sampleBookings = [
      {
        user: evUser1._id,
        charger: createdChargers[0]._id, // Koramangala 7.4kW
        bookingDate: tomorrowStr,
        startTime: '10:00',
        endTime: '12:00',
        totalHours: 2,
        totalAmount: 240,
        vehicleInfo: 'Tata Nexon EV Max',
        notes: 'Need to charge from 30% to 80% before city trip',
        status: 'Pending',
      },
      {
        user: evUser2._id,
        charger: createdChargers[1]._id, // Indiranagar 11kW
        bookingDate: tomorrowStr,
        startTime: '14:00',
        endTime: '16:30',
        totalHours: 2.5,
        totalAmount: 375,
        vehicleInfo: 'MG ZS EV Excite',
        notes: 'Will arrive on time around 1:55 PM',
        status: 'Accepted',
      },
      {
        user: evUser1._id,
        charger: createdChargers[1]._id, // Indiranagar 11kW
        bookingDate: pastStr,
        startTime: '11:00',
        endTime: '13:00',
        totalHours: 2,
        totalAmount: 300,
        vehicleInfo: 'Tata Nexon EV',
        notes: 'Completed session smoothly',
        status: 'Completed',
      },
    ];

    await Booking.insertMany(sampleBookings);
    console.log('Sample bookings created successfully.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seedData();
