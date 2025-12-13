const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  sendJobOffer,
  acceptJobOffer,
  rejectJobOffer,
  getPharmacistContracts,
  getPharmacyContracts,
  getContractDetail
} = require('../controllers/contractController');

// 薬局側: 採用オファー送信
router.post('/offer', authenticateToken, sendJobOffer);

// 薬剤師側: オファー承諾
router.post('/:id/accept', authenticateToken, acceptJobOffer);

// 薬剤師側: オファー辞退
router.post('/:id/reject', authenticateToken, rejectJobOffer);

// 契約一覧取得（薬剤師用）
router.get('/pharmacist', authenticateToken, getPharmacistContracts);

// 契約一覧取得（薬局用）
router.get('/pharmacy', authenticateToken, getPharmacyContracts);

// 契約詳細取得
router.get('/:id', authenticateToken, getContractDetail);

module.exports = router;



