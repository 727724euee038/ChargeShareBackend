const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting ChargeShare E2E Backend Verification ---');

  // 1. Health check
  const health = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET',
  });
  console.log('1. Health Check:', health.status === 200 ? 'PASS' : 'FAIL', health.data.message);

  // 2. Login as EV Driver (Arun Patel)
  const userLogin = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'arun.user@chargeshare.com', password: 'user123' }
  );
  console.log('2. EV User Login:', userLogin.status === 200 ? 'PASS' : 'FAIL', 'User:', userLogin.data?.data?.name);
  const userToken = userLogin.data.data.token;

  // 3. Login as Charger Host (Rajesh Kumar)
  const sellerLogin = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'rajesh.seller@chargeshare.com', password: 'seller123' }
  );
  console.log('3. Seller Login:', sellerLogin.status === 200 ? 'PASS' : 'FAIL', 'Host:', sellerLogin.data?.data?.name);
  const sellerToken = sellerLogin.data.data.token;

  // 4. Login as Admin
  const adminLogin = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: 'admin@chargeshare.com', password: 'admin123' }
  );
  console.log('4. Admin Login:', adminLogin.status === 200 ? 'PASS' : 'FAIL', 'Admin:', adminLogin.data?.data?.name);
  const adminToken = adminLogin.data.data.token;

  // 5. Query Chargers with filter
  const chargersRes = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/chargers?keyword=Koramangala',
    method: 'GET',
  });
  console.log('5. Search Chargers by keyword:', chargersRes.status === 200 ? 'PASS' : 'FAIL', `Found: ${chargersRes.data.count}`);
  const targetCharger = chargersRes.data.data[0];

  // 6. Create Booking Request as EV User
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const dateStr = tomorrow.toISOString().split('T')[0];

  const bookingRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    },
    {
      chargerId: targetCharger._id,
      bookingDate: dateStr,
      startTime: '10:00',
      endTime: '12:00',
      vehicleInfo: 'Tata Nexon EV Max',
      notes: 'Need full top-up',
    }
  );
  console.log('6. Create Booking Request:', bookingRes.status === 201 ? 'PASS' : 'FAIL', `Status: ${bookingRes.data?.data?.status}, Amount: ₹${bookingRes.data?.data?.totalAmount}`);
  const newBookingId = bookingRes.data?.data?._id;

  // 7. Seller accepts the booking
  const acceptRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/bookings/${newBookingId}/status`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sellerToken}`,
      },
    },
    { status: 'Accepted' }
  );
  console.log('7. Seller Accepts Booking:', acceptRes.status === 200 ? 'PASS' : 'FAIL', `New Status: ${acceptRes.data?.data?.status}`);

  // 8. Test Conflict Detection (overlapping slot request for same charger and date)
  const conflictRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/bookings',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
    },
    {
      chargerId: targetCharger._id,
      bookingDate: dateStr,
      startTime: '11:00', // Overlaps with 10:00 - 12:00
      endTime: '13:00',
      vehicleInfo: 'MG ZS EV',
    }
  );
  console.log(
    '8. Conflict Detection Prevention:',
    conflictRes.status === 400 ? 'PASS (Successfully blocked conflict)' : 'FAIL',
    `Message: ${conflictRes.data?.message}`
  );

  // 9. Admin Stats Check
  const adminStats = await request({
    host: 'localhost',
    port: 5000,
    path: '/api/admin/stats',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('9. Admin Stats Verification:', adminStats.status === 200 ? 'PASS' : 'FAIL', adminStats.data?.data);

  // 10. Frontend Availability Check
  const frontendCheck = await request({
    host: 'localhost',
    port: 5173,
    path: '/',
    method: 'GET',
  });
  console.log('10. Frontend Dev Server Check (Port 5173):', frontendCheck.status === 200 ? 'PASS' : 'FAIL');

  console.log('--- E2E Verification Finished Successfully ---');
}

runTests().catch(console.error);
