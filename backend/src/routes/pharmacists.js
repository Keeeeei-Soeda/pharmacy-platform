const express = require('express');
const router = express.Router();
const pharmacistController = require('../controllers/pharmacistController');
const { requirePharmacist } = require('../middleware/auth');

// POST /api/pharmacists/profile - 薬剤師プロフィール作成
router.post('/profile', requirePharmacist, pharmacistController.createProfile);

// GET /api/pharmacists/profile - 薬剤師プロフィール取得
router.get('/profile', requirePharmacist, pharmacistController.getProfile);

// PUT /api/pharmacists/profile - 薬剤師プロフィール更新
router.put('/profile', requirePharmacist, pharmacistController.updateProfile);

module.exports = router;
