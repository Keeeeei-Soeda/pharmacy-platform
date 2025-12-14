const prisma = require('../database/prisma');
const { mapMessageThread, mapMessage } = require('../utils/dto');

// 通知作成ヘルパー関数
const createNotification = async (userId, type, title, message, relatedId = null, actionUrl = null) => {
  try {
    await prisma.notifications.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId,
        action_url: actionUrl
      }
    });
  } catch (error) {
    console.error('Notification creation error:', error);
  }
};

// メッセージ送信
const sendMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { threadId, content } = req.body;

    // 必須フィールドの検証
    if (!threadId || !content || content.trim() === '') {
      return res.status(400).json({ error: 'スレッドIDとメッセージ内容は必須です' });
    }

    // スレッドが存在し、アクセス権限があるか確認
    const thread = await prisma.message_threads.findUnique({
      where: { id: threadId },
      include: {
        job_applications: {
          include: {
            pharmacist_profiles: { select: { user_id: true, first_name: true, last_name: true } },
            job_postings: {
              include: {
                pharmacy_profiles: { select: { user_id: true, pharmacy_name: true } }
              }
            },
            message_threads: { select: { id: true } }
          }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'メッセージスレッドが見つかりません' });
    }

    // アクセス権限チェック（応募者または薬局）
    const isPharmacist = thread.job_applications?.pharmacist_profiles?.user_id === userId;
    const isPharmacy = thread.job_applications?.job_postings?.pharmacy_profiles?.user_id === userId;

    if (!isPharmacist && !isPharmacy) {
      return res.status(403).json({ error: 'このスレッドにアクセスする権限がありません' });
    }

    // メッセージ作成
    const message = await prisma.messages.create({
      data: {
        thread_id: threadId,
        sender_id: userId,
        content: content.trim()
      },
      include: {
        users: { select: { id: true, email: true, user_type: true } }
      }
    });

    // スレッドの更新日時を更新
    await prisma.message_threads.update({
      where: { id: threadId },
      data: {
        updated_at: new Date()
      }
    });

    // 相手に通知
    const recipientId = isPharmacist
      ? thread.job_applications.job_postings.pharmacy_profiles.user_id
      : thread.job_applications.pharmacist_profiles.user_id;

    const senderName = isPharmacist
      ? `${thread.job_applications.pharmacist_profiles.last_name} ${thread.job_applications.pharmacist_profiles.first_name}`
      : thread.job_applications.job_postings.pharmacy_profiles.pharmacy_name;

    await createNotification(
      recipientId,
      'message_received',
      '新しいメッセージ',
      `${senderName}さんからメッセージが届きました`,
      thread.job_applications.id,
      isPharmacist ? `/pharmacy/messages/${threadId}` : `/pharmacist/messages/${threadId}`
    );

    res.status(201).json({
      message: 'メッセージを送信しました',
      data: mapMessage(message)
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// スレッドのメッセージ一覧取得
const getMessagesByThread = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { threadId } = req.params;

    // スレッドが存在し、アクセス権限があるか確認
    const thread = await prisma.message_threads.findUnique({
      where: { id: threadId },
      include: {
        job_applications: {
          include: {
            pharmacist_profiles: { select: { user_id: true, first_name: true, last_name: true, profile_image_url: true } },
            job_postings: {
              include: {
                pharmacy_profiles: { select: { user_id: true, pharmacy_name: true, profile_image_url: true } }
              }
            }
          }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'メッセージスレッドが見つかりません' });
    }

    // アクセス権限チェック
    const isPharmacist = thread.job_applications?.pharmacist_profiles?.user_id === userId;
    const isPharmacy = thread.job_applications?.job_postings?.pharmacy_profiles?.user_id === userId;

    if (!isPharmacist && !isPharmacy) {
      return res.status(403).json({ error: 'このスレッドにアクセスする権限がありません' });
    }

    // メッセージ一覧取得
    const messages = await prisma.messages.findMany({
      where: { thread_id: threadId },
      orderBy: {
        created_at: 'asc'
      },
      include: {
        users: { select: { id: true, email: true, user_type: true } }
      }
    });

    // 自分宛ての未読メッセージを既読にする
    await prisma.messages.updateMany({
      where: {
        thread_id: threadId,
        sender_id: {
          not: userId
        },
        is_read: false
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    });

    res.json({
      thread: mapMessageThread(thread),
      messages: messages.map(mapMessage)
    });

  } catch (error) {
    console.error('Get messages by thread error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 自分のメッセージスレッド一覧取得
const getMyThreads = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    let threads;

    if (userType === 'pharmacist') {
      // 薬剤師の場合：自分が応募した求人のスレッド
      const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
        where: { user_id: userId }
      });

      if (!pharmacistProfile) {
        return res.json({ threads: [] });
      }

      threads = await prisma.message_threads.findMany({
        where: {
          is_active: true,
          job_applications: { pharmacist_id: pharmacistProfile.id }
        },
        orderBy: {
          updated_at: 'desc'
        },
        include: {
          job_applications: {
            include: {
              job_postings: {
                select: {
                  id: true,
                  title: true,
                  pharmacy_profiles: {
                    select: {
                      pharmacy_name: true,
                      profile_image_url: true,
                      user_id: true
                    }
                  }
                }
              },
              pharmacist_profiles: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  profile_image_url: true,
                  user_id: true
                }
              }
            }
          },
          messages: {
            orderBy: {
              created_at: 'desc'
            },
            take: 1,
            select: {
              id: true,
              thread_id: true,
              content: true,
              created_at: true,
              sender_id: true,
              is_read: true
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  sender_id: {
                    not: userId
                  },
                  is_read: false
                }
              }
            }
          }
        }
      });
    } else {
      // 薬局の場合：自分の求人への応募のスレッド
      const pharmacyProfiles = await prisma.pharmacy_profiles.findMany({
        where: { user_id: userId },
        select: { id: true }
      });

      const pharmacyIds = pharmacyProfiles.map(p => p.id);

      if (pharmacyIds.length === 0) {
        return res.json({ threads: [] });
      }

      threads = await prisma.message_threads.findMany({
        where: {
          is_active: true,
          job_applications: {
            job_postings: { pharmacy_id: { in: pharmacyIds } }
          }
        },
        orderBy: {
          updated_at: 'desc'
        },
        include: {
          job_applications: {
            include: {
              pharmacist_profiles: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  profile_image_url: true,
                  user_id: true
                }
              },
              job_postings: {
                select: {
                  id: true,
                  title: true,
                  pharmacy_profiles: {
                    select: {
                      pharmacy_name: true,
                      profile_image_url: true,
                      user_id: true
                    }
                  }
                }
              }
            }
          },
          messages: {
            orderBy: {
              created_at: 'desc'
            },
            take: 1,
            select: {
              id: true,
              thread_id: true,
              content: true,
              created_at: true,
              sender_id: true,
              is_read: true
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  sender_id: {
                    not: userId
                  },
                  is_read: false
                }
              }
            }
          }
        }
      });
    }

    res.json({ threads: threads.map(mapMessageThread) });

  } catch (error) {
    console.error('Get my threads error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 未読メッセージ数取得
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;

    let unreadCount;

    if (userType === 'pharmacist') {
      // 薬剤師の場合
      const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
        where: { user_id: userId }
      });

      if (!pharmacistProfile) {
        return res.json({ unreadCount: 0 });
      }

      unreadCount = await prisma.messages.count({
        where: {
          message_threads: { job_applications: { pharmacist_id: pharmacistProfile.id } },
          sender_id: {
            not: userId
          },
          is_read: false
        }
      });
    } else {
      // 薬局の場合
      const pharmacyProfiles = await prisma.pharmacy_profiles.findMany({
        where: { user_id: userId },
        select: { id: true }
      });

      const pharmacyIds = pharmacyProfiles.map(p => p.id);

      if (pharmacyIds.length === 0) {
        return res.json({ unreadCount: 0 });
      }

      unreadCount = await prisma.messages.count({
        where: {
          message_threads: {
            job_applications: { job_postings: { pharmacy_id: { in: pharmacyIds } } }
          },
          sender_id: {
            not: userId
          },
          is_read: false
        }
      });
    }

    res.json({ unreadCount });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// メッセージを既読にする
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { threadId } = req.params;

    // スレッドへのアクセス権限確認
    const thread = await prisma.message_threads.findUnique({
      where: { id: threadId },
      include: {
        job_applications: {
          include: {
            pharmacist_profiles: { select: { user_id: true } },
            job_postings: {
              include: {
                pharmacy_profiles: { select: { user_id: true } }
              }
            }
          }
        }
      }
    });

    if (!thread) {
      return res.status(404).json({ error: 'メッセージスレッドが見つかりません' });
    }

    const isPharmacist = thread.job_applications?.pharmacist_profiles?.user_id === userId;
    const isPharmacy = thread.job_applications?.job_postings?.pharmacy_profiles?.user_id === userId;

    if (!isPharmacist && !isPharmacy) {
      return res.status(403).json({ error: 'このスレッドにアクセスする権限がありません' });
    }

    // 自分宛ての未読メッセージを既読にする
    const result = await prisma.messages.updateMany({
      where: {
        thread_id: threadId,
        sender_id: {
          not: userId
        },
        is_read: false
      },
      data: {
        is_read: true,
        read_at: new Date()
      }
    });

    res.json({
      message: 'メッセージを既読にしました',
      updatedCount: result.count
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  sendMessage,
  getMessagesByThread,
  getMyThreads,
  getUnreadCount,
  markAsRead
};

