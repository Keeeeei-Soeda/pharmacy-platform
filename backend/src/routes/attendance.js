const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { requireAuth } = require('../middleware/auth');

// POST /api/attendance/checkin - 出勤記録
router.post('/checkin', requireAuth, attendanceController.checkIn);

// POST /api/attendance/checkout - 退勤記録
router.post('/checkout', requireAuth, attendanceController.checkOut);

// GET /api/attendance/today - 当日の勤怠状況
router.get('/today', requireAuth, attendanceController.getTodayStatus);

// GET /api/attendance/monthly - 月次勤怠サマリー
router.get('/monthly', requireAuth, attendanceController.getMonthlySummary);

module.exports = router;