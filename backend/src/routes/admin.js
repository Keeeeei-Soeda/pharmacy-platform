const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireUserType } = require('../middleware/auth');

// すべてのルートで運営者権限が必要
// 将来的に admin ユーザータイプを追加する予定

// 統計情報取得
router.get(
  '/statistics',
  authenticateToken,
  // requireUserType(['admin']), // 運営者権限チェック（将来実装）
  adminController.getStatistics
);

// 薬剤師一覧取得
router.get(
  '/pharmacists',
  authenticateToken,
  // requireUserType(['admin']),
  adminController.getPharmacists
);

// 薬剤師詳細取得
router.get(
  '/pharmacists/:id',
  authenticateToken,
  // requireUserType(['admin']),
  adminController.getPharmacistDetail
);

// 本人確認承認
router.post(
  '/pharmacists/:id/approve',
  authenticateToken,
  // requireUserType(['admin']),
  adminController.approveVerification
);

// 本人確認却下
router.post(
  '/pharmacists/:id/reject',
  authenticateToken,
  // requireUserType(['admin']),
  adminController.rejectVerification
);

// 本人確認リセット
router.post(
  '/pharmacists/:id/reset',
  authenticateToken,
  // requireUserType(['admin']),
  adminController.resetVerification
);

module.exports = router;



