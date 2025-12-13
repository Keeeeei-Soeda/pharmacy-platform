const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// 通知一覧を取得
router.get('/', authenticateToken, getNotifications);

// 未読通知の数を取得
router.get('/unread-count', authenticateToken, getUnreadCount);

// 通知を既読にする
router.patch('/:id/read', authenticateToken, markAsRead);

// すべての通知を既読にする
router.patch('/mark-all-read', authenticateToken, markAllAsRead);

// 通知を削除
router.delete('/:id', authenticateToken, deleteNotification);

module.exports = router;

