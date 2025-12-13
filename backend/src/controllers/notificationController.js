const prisma = require('../database/prisma');

// 通知一覧を取得
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0, isRead } = req.query;

    const where = { user_id: userId };
    if (isRead !== undefined) {
      where.is_read = isRead === 'true';
    }

    const notifications = await prisma.notifications.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const unreadCount = await prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    res.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: '通知の取得に失敗しました' });
  }
};

// 未読通知の数を取得
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;

    const count = await prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false
      }
    });

    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: '未読数の取得に失敗しました' });
  }
};

// 通知を既読にする
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await prisma.notifications.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: '通知が見つかりません' });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({ error: 'この通知にアクセスする権限がありません' });
    }

    await prisma.notifications.update({
      where: { id },
      data: {
        is_read: true,
        read_at: new Date()
      }
    });

    res.json({ message: '通知を既読にしました' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: '既読処理に失敗しました' });
  }
};

// すべての通知を既読にする
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        is_read: false
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    });

    res.json({ message: 'すべての通知を既読にしました' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: '一括既読処理に失敗しました' });
  }
};

// 通知を削除
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await prisma.notifications.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: '通知が見つかりません' });
    }

    if (notification.user_id !== userId) {
      return res.status(403).json({ error: 'この通知を削除する権限がありません' });
    }

    await prisma.notifications.delete({
      where: { id }
    });

    res.json({ message: '通知を削除しました' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: '通知の削除に失敗しました' });
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};

