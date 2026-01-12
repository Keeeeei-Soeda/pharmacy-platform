const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getPharmacyFees,
  getFeeDetail,
  confirmPayment,
  getOverdueFees,
  updateFeeStatus,
  getAllFees
} = require('../controllers/platformFeeController');

// すべてのルートで認証が必要
router.use(authenticateToken);

// 薬局の手数料一覧を取得
router.get('/my-fees', getPharmacyFees);

// 特定の手数料詳細を取得
router.get('/:feeId', getFeeDetail);

// 手数料の支払いを確認（管理者のみ）
router.post('/:feeId/confirm-payment', confirmPayment);

// 手数料ステータスを更新（管理者用）
router.patch('/:feeId/status', updateFeeStatus);

// 手数料の支払い期限が過ぎているものを取得（管理者用）
router.get('/admin/overdue', getOverdueFees);

// すべての手数料を取得（管理者用）
router.get('/admin/all', getAllFees);

module.exports = router;

