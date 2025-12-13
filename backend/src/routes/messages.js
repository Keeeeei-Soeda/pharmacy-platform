const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

// 全て認証が必要（薬剤師・薬局両方がアクセス可能）

// POST /api/messages - メッセージ送信
router.post('/', requireAuth, messageController.sendMessage);

// GET /api/messages/threads - 自分のメッセージスレッド一覧
router.get('/threads', requireAuth, messageController.getMyThreads);

// GET /api/messages/unread-count - 未読メッセージ数取得
router.get('/unread-count', requireAuth, messageController.getUnreadCount);

// GET /api/messages/thread/:threadId - スレッドのメッセージ一覧取得
router.get('/thread/:threadId', requireAuth, messageController.getMessagesByThread);

// PATCH /api/messages/thread/:threadId/read - メッセージを既読にする
router.patch('/thread/:threadId/read', requireAuth, messageController.markAsRead);

module.exports = router;



