const express = require('express');
const router = express.Router();
const pharmacyController = require('../controllers/pharmacyController');
const { requirePharmacy } = require('../middleware/auth');

// POST /api/pharmacies/profile - 薬局プロフィール作成
router.post('/profile', requirePharmacy, pharmacyController.createProfile);

// GET /api/pharmacies/profile - 薬局プロフィール取得
router.get('/profile', requirePharmacy, pharmacyController.getProfile);

// PUT /api/pharmacies/profile - 薬局プロフィール更新
router.put('/profile', requirePharmacy, pharmacyController.updateProfile);

module.exports = router;
