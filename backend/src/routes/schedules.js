const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticateToken, requireUserType } = require('../middleware/auth');

// 薬局が勤務スケジュールを作成
router.post(
  '/',
  authenticateToken,
  requireUserType(['pharmacy']),
  scheduleController.createSchedule
);

// 薬局が一括で勤務スケジュールを作成
router.post(
  '/bulk',
  authenticateToken,
  requireUserType(['pharmacy']),
  scheduleController.createBulkSchedules
);

// 契約に紐づくスケジュール一覧を取得（薬局・薬剤師両方）
router.get(
  '/contract/:contractId',
  authenticateToken,
  scheduleController.getSchedulesByContract
);

// 薬剤師の全スケジュールを取得
router.get(
  '/pharmacist/my',
  authenticateToken,
  requireUserType(['pharmacist']),
  scheduleController.getPharmacistSchedules
);

// 薬局の全スケジュールを取得
router.get(
  '/pharmacy/my',
  authenticateToken,
  requireUserType(['pharmacy']),
  scheduleController.getPharmacySchedules
);

// 薬局がスケジュールを更新
router.patch(
  '/:id',
  authenticateToken,
  requireUserType(['pharmacy']),
  scheduleController.updateSchedule
);

// 薬局がスケジュールを削除
router.delete(
  '/:id',
  authenticateToken,
  requireUserType(['pharmacy']),
  scheduleController.deleteSchedule
);

module.exports = router;

