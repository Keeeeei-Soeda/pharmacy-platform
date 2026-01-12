const prisma = require('../database/prisma');

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

// 応募機能（薬剤師のみ）
const applyToJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { jobPostingId, coverLetter } = req.body;

    // 必須フィールドの検証
    if (!jobPostingId) {
      return res.status(400).json({ error: '求人IDは必須です' });
    }

    // 薬剤師プロフィールを取得、存在しない場合は自動作成
    let pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId }
    });

    if (!pharmacistProfile) {
      // 基本的なプロフィールを自動作成
      pharmacistProfile = await prisma.pharmacist_profiles.create({
        data: {
          user_id: userId,
          first_name: '名前',
          last_name: '姓',
          experience_years: 0,
          specialties: [],
          has_drivers_license: false,
          has_home_care_experience: false
        }
      });
      console.log('Auto-created pharmacist profile for user:', userId);
    }

    // 求人が存在し、応募可能か確認
    const jobPosting = await prisma.job_postings.findUnique({
      where: { id: jobPostingId },
      include: {
        pharmacy_profiles: {
          select: {
            user_id: true,
            pharmacy_name: true
          }
        }
      }
    });

    if (!jobPosting) {
      return res.status(404).json({ error: '求人が見つかりません' });
    }

    if (jobPosting.status !== 'active') {
      return res.status(400).json({ error: 'この求人は現在応募を受け付けていません' });
    }

    // 応募期限チェック
    if (jobPosting.application_deadline && new Date(jobPosting.application_deadline) < new Date()) {
      return res.status(400).json({ error: '応募期限が過ぎています' });
    }

    // 応募上限チェック
    if (jobPosting.max_applicants && (jobPosting.current_applicants || 0) >= jobPosting.max_applicants) {
      return res.status(400).json({ error: '応募人数が上限に達しています' });
    }

    // 既に応募済みかチェック
    const existingApplication = await prisma.job_applications.findUnique({
      where: {
        job_posting_id_pharmacist_id: {
          job_posting_id: jobPostingId,
          pharmacist_id: pharmacistProfile.id
        }
      }
    });

    if (existingApplication) {
      return res.status(400).json({ error: 'この求人には既に応募済みです' });
    }

    // 応募作成（トランザクション）
    const result = await prisma.$transaction(async (tx) => {
      // 応募作成
      const application = await tx.job_applications.create({
        data: {
          job_posting_id: jobPostingId,
          pharmacist_id: pharmacistProfile.id,
          cover_letter: coverLetter || null,
          status: 'pending'
        },
        include: {
          job_postings: {
            select: {
              id: true,
              title: true,
              description: true,
              pharmacy_profiles: {
                select: {
                  id: true,
                  user_id: true,
                  pharmacy_name: true
                }
              }
            }
          },
          pharmacist_profiles: {
            select: {
              id: true,
              first_name: true,
              last_name: true
            }
          }
        }
      });

      // 求人の応募者数をインクリメント
      await tx.job_postings.update({
        where: { id: jobPostingId },
        data: {
          current_applicants: {
            increment: 1
          }
        }
      });

      // メッセージスレッド作成
      const thread = await tx.message_threads.create({
        data: {
          application_id: application.id
        }
      });

      return { application, thread };
    });

    // 薬局に通知
    await createNotification(
      jobPosting.pharmacy_profiles.user_id,
      'application_received',
      '新しい応募がありました',
      `${result.application.pharmacist_profiles.last_name} ${result.application.pharmacist_profiles.first_name}さんが「${jobPosting.title}」に応募しました`,
      result.application.id,
      `/pharmacy/applications/${result.application.id}`
    );

    // フロントが期待する形に整形（api-client側でsnake_case→camelCaseされる前提）
    const formattedApplication = {
      ...result.application,
      jobPosting: result.application.job_postings
        ? {
            ...result.application.job_postings,
            pharmacy: result.application.job_postings.pharmacy_profiles
          }
        : null,
      pharmacist: result.application.pharmacist_profiles || null,
      messageThread: result.thread ? { id: result.thread.id } : null
    };

    res.status(201).json({
      message: '応募しました',
      application: formattedApplication
    });

  } catch (error) {
    console.error('Apply to job error:', error);
    
    // ユニーク制約違反のエラーハンドリング
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'この求人には既に応募済みです' });
    }
    
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 自分の応募一覧取得（薬剤師用）
const getMyApplications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    // 薬剤師プロフィールを取得
    const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId }
    });

    if (!pharmacistProfile) {
      return res.json({ applications: [] });
    }

    // 検索条件
    const where = {
      pharmacist_id: pharmacistProfile.id
    };

    if (status) {
      where.status = status;
    }

    // 応募一覧取得
    const applications = await prisma.job_applications.findMany({
      where,
      orderBy: {
        applied_at: 'desc'
      },
      include: {
        job_postings: {
          select: {
            id: true,
            title: true,
            employment_type: true,
            min_hourly_rate: true,
            max_hourly_rate: true,
            work_location: true,
            status: true,
            pharmacy_profiles: {
              select: {
                pharmacy_name: true,
                prefecture: true,
                city: true
              }
            }
          }
        },
        message_threads: {
          select: {
            id: true,
            _count: {
              select: {
                messages: {
                  where: {
                    is_read: false,
                    sender_id: {
                      not: userId
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    res.json({ applications });

  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 薬局への応募一覧取得（薬局用）
const getApplicationsForPharmacy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, jobPostingId } = req.query;

    // 自分の薬局プロフィールを取得
    const pharmacyProfiles = await prisma.pharmacy_profiles.findMany({
      where: { user_id: userId },
      select: { id: true }
    });

    const pharmacyIds = pharmacyProfiles.map(p => p.id);

    if (pharmacyIds.length === 0) {
      return res.json({ applications: [] });
    }

    // 検索条件
    const where = {
      job_postings: {
        pharmacy_id: {
          in: pharmacyIds
        }
      }
    };

    if (status) {
      where.status = status;
    }

    if (jobPostingId) {
      where.job_posting_id = jobPostingId;
    }

    // 応募一覧取得
    const applications = await prisma.job_applications.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { applied_at: 'desc' }
      ],
      include: {
        pharmacist_profiles: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            experience_years: true,
            specialties: true,
            profile_image_url: true,
            phone: true,
            has_drivers_license: true,
            has_home_care_experience: true,
            // 新規追加フィールド
            age: true,
            graduation_university: true,
            graduation_year: true,
            license_acquired_year: true,
            certified_pharmacist_qualifications: true,
            other_qualifications: true,
            work_experience_months: true,
            work_experience_types: true,
            main_job_experiences: true,
            specialty_fields: true,
            pharmacy_systems_experience: true,
            special_notes: true,
            self_introduction: true,
            users: {
              select: {
                email: true
              }
            }
          }
        },
        job_postings: {
          select: {
            id: true,
            title: true,
            employment_type: true,
            pharmacy_profiles: {
              select: {
                pharmacy_name: true
              }
            }
          }
        },
        message_threads: {
          select: {
            id: true,
            _count: {
              select: {
                messages: {
                  where: {
                    is_read: false,
                    sender_id: {
                      not: userId
                    }
                  }
                }
              }
            }
          }
        },
        work_contracts: {
          select: {
            id: true,
            platform_fee_status: true,
            personal_info_disclosed: true
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 1
        }
      }
    });

    // 個人情報開示制御：手数料未払いの場合は個人情報をマスク
    const processedApplications = applications.map(app => {
      const contract = app.work_contracts && app.work_contracts.length > 0 ? app.work_contracts[0] : null;
      const isPersonalInfoDisclosed = contract && contract.personal_info_disclosed;

      // 手数料が支払い済みでない場合は個人情報をマスク
      if (!isPersonalInfoDisclosed) {
        return {
          ...app,
          pharmacist_profiles: {
            ...app.pharmacist_profiles,
            first_name: app.pharmacist_profiles.first_name ? app.pharmacist_profiles.first_name.charAt(0) + '◯◯' : '◯◯◯',
            last_name: app.pharmacist_profiles.last_name ? app.pharmacist_profiles.last_name.charAt(0) + '◯◯' : '◯◯◯',
            phone: '***-****-****',
            users: {
              email: '*****@*****.***'
            }
          }
        };
      }

      return app;
    });

    res.json({ applications: processedApplications });

  } catch (error) {
    console.error('Get applications for pharmacy error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 応募詳細取得
const getApplicationById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const application = await prisma.job_applications.findUnique({
      where: { id },
      include: {
        pharmacist_profiles: {
          include: {
            users: {
              select: {
                email: true
              }
            }
          }
        },
        job_postings: {
          include: {
            pharmacy_profiles: {
              select: {
                user_id: true,
                pharmacy_name: true,
                phone: true,
                address: true
              }
            }
          }
        },
        message_threads: {
          select: {
            id: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    // アクセス権限チェック（応募者本人または薬局）
    const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId }
    });

    const isApplicant = pharmacistProfile && pharmacistProfile.id === application.pharmacistId;
    const isPharmacy = application.job_postings.pharmacy_profiles.user_id === userId;

    if (!isApplicant && !isPharmacy) {
      return res.status(403).json({ error: 'この応募情報にアクセスする権限がありません' });
    }

    res.json({ application });

  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 応募承認（薬局のみ）
const acceptApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { notes } = req.body;

    // 応募を取得
    const application = await prisma.job_applications.findUnique({
      where: { id },
      include: {
        job_postings: {
          include: {
            pharmacy_profiles: {
              select: {
                user_id: true,
                pharmacy_name: true
              }
            }
          }
        },
        pharmacist_profiles: {
          include: {
            users: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    // 権限チェック（Prisma生データはsnake_case）
    if (application.job_postings.pharmacy_profiles.user_id !== userId) {
      return res.status(403).json({ error: 'この応募を承認する権限がありません' });
    }

    // ステータスチェック
    if (application.status === 'accepted') {
      return res.status(400).json({ error: 'この応募は既に承認されています' });
    }

    if (application.status === 'rejected') {
      return res.status(400).json({ error: '不採用にした応募は承認できません' });
    }

    // 応募承認
    const updatedApplication = await prisma.job_applications.update({
      where: { id },
      data: {
        status: 'accepted',
        reviewed_at: new Date(),
        decision_made_at: new Date(),
        notes
      }
    });

    // 薬剤師に通知
    await createNotification(
      application.pharmacist_profiles.users.id,
      'application_status_changed',
      '応募が承認されました',
      `「${application.job_postings.title}」の応募が承認されました。メッセージで詳細を確認してください。`,
      id,
      `/pharmacist/applications/${id}`
    );

    res.json({
      message: '応募を承認しました',
      application: updatedApplication
    });

  } catch (error) {
    console.error('Accept application error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 応募拒否（薬局のみ）
const rejectApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { rejectionReason, notes } = req.body;

    // 応募を取得
    const application = await prisma.job_applications.findUnique({
      where: { id },
      include: {
        job_postings: {
          include: {
            pharmacy_profiles: {
              select: {
                user_id: true,
                pharmacy_name: true
              }
            }
          }
        },
        pharmacist_profiles: {
          include: {
            users: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    // 権限チェック（Prisma生データはsnake_case）
    if (application.job_postings.pharmacy_profiles.user_id !== userId) {
      return res.status(403).json({ error: 'この応募を拒否する権限がありません' });
    }

    // ステータスチェック
    if (application.status === 'rejected') {
      return res.status(400).json({ error: 'この応募は既に不採用にされています' });
    }

    if (application.status === 'accepted') {
      return res.status(400).json({ error: '承認済みの応募は不採用にできません' });
    }

    // 応募拒否
    const updatedApplication = await prisma.job_applications.update({
      where: { id },
      data: {
        status: 'rejected',
        reviewed_at: new Date(),
        decision_made_at: new Date(),
        rejectionReason,
        notes
      }
    });

    // 薬剤師に通知
    await createNotification(
      application.pharmacist_profiles.users.id,
      'application_status_changed',
      '応募結果のお知らせ',
      `「${application.job_postings.title}」の選考結果をご確認ください。`,
      id,
      `/pharmacist/applications/${id}`
    );

    res.json({
      message: '応募を不採用にしました',
      application: updatedApplication
    });

  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 応募取り下げ（薬剤師のみ）
const withdrawApplication = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // 薬剤師プロフィールを取得
    const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId }
    });

    if (!pharmacistProfile) {
      return res.status(403).json({ error: '薬剤師プロフィールが見つかりません' });
    }

    // 応募を取得
    const application = await prisma.job_applications.findUnique({
      where: { id },
      include: {
        job_postings: {
          include: {
            pharmacy_profiles: {
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    // 権限チェック
    if (application.pharmacistId !== pharmacistProfile.id) {
      return res.status(403).json({ error: 'この応募を取り下げる権限がありません' });
    }

    // ステータスチェック
    if (application.status === 'accepted') {
      return res.status(400).json({ error: '承認済みの応募は取り下げできません' });
    }

    if (application.status === 'withdrawn') {
      return res.status(400).json({ error: 'この応募は既に取り下げられています' });
    }

    // 応募取り下げ
    const updatedApplication = await prisma.job_applications.update({
      where: { id },
      data: {
        status: 'withdrawn'
      }
    });

    // 薬局に通知
    await createNotification(
      application.job_postings.pharmacy_profiles.user_id,
      'application_status_changed',
      '応募が取り下げられました',
      `「${application.job_postings.title}」への応募が取り下げられました。`,
      id,
      `/pharmacy/applications/${id}`
    );

    res.json({
      message: '応募を取り下げました',
      application: updatedApplication
    });

  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  applyToJob,
  getMyApplications,
  getApplicationsForPharmacy,
  getApplicationById,
  acceptApplication,
  rejectApplication,
  withdrawApplication
};

