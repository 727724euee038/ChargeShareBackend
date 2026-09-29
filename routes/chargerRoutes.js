const express = require('express');
const router = express.Router();
const {
  createCharger,
  getAllChargers,
  getChargerById,
  getMyChargers,
  updateCharger,
  deleteCharger,
} = require('../controllers/chargerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getAllChargers)
  .post(protect, authorize('seller', 'admin'), createCharger);

router.get('/my-chargers', protect, authorize('seller', 'admin'), getMyChargers);

router.route('/:id')
  .get(getChargerById)
  .put(protect, authorize('seller', 'admin'), updateCharger)
  .delete(protect, authorize('seller', 'admin'), deleteCharger);

module.exports = router;
