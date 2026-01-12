const prisma = require('../database/prisma');

/**
 * プラットフォーム手数料コントローラー
 * 手数料の管理、支払い確認、個人情報開示の制御
 */

// 薬局の手数料一覧を取得
const getPharmacyFees = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ユーザーの薬局プロフィールを取得
    const pharmacyProfile = await prisma.pharmacy_profiles.findFirst({
      where: {
        users: {
          id: userId
        }
      }
    });

    if (!pharmacyProfile) {
      return res.status(404).json({ error: '薬局プロフィールが見つかりません' });
    }

    // 手数料レコードを取得
    const fees = await prisma.platform_fees.findMany({
      where: {
        pharmacy_id: pharmacyProfile.id
      },
      include: {
        work_contracts: {
          include: {
            job_postings: {
              select: {
                title: true,
                work_location: true
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
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({
      fees
    });

  } catch (error) {
    console.error('Get pharmacy fees error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 特定の手数料詳細を取得
const getFeeDetail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { feeId } = req.params;

    // 手数料レコードを取得
    const fee = await prisma.platform_fees.findUnique({
      where: { id: feeId },
      include: {
        work_contracts: {
          include: {
            job_postings: {
              select: {
                title: true,
                description: true,
                work_location: true,
                daily_rate: true,
                contract_duration_days: true
              }
            },
            pharmacist_profiles: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone: true,
                users: {
                  select: {
                    email: true
                  }
                }
              }
            },
            pharmacy_profiles: {
              include: {
                users: true
              }
            }
          }
        }
      }
    });

    if (!fee) {
      return res.status(404).json({ error: '手数料レコードが見つかりません' });
    }

    // 権限確認（薬局または管理者のみ）
    if (fee.work_contracts.pharmacy_profiles.users.id !== userId) {
      return res.status(403).json({ error: 'この手数料にアクセスする権限がありません' });
    }

    res.json({
      fee
    });

  } catch (error) {
    console.error('Get fee detail error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 手数料の支払いを確認（管理者のみ）
const confirmPayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { invoiceUrl } = req.body;

    // 手数料レコードを取得
    const fee = await prisma.platform_fees.findUnique({
      where: { id: feeId },
      include: {
        work_contracts: true
      }
    });

    if (!fee) {
      return res.status(404).json({ error: '手数料レコードが見つかりません' });
    }

    // 手数料ステータスを更新
    const updatedFee = await prisma.platform_fees.update({
      where: { id: feeId },
      data: {
        status: 'paid',
        paid_at: new Date(),
        invoice_url: invoiceUrl || undefined
      }
    });

    // 契約のplatform_fee_statusも更新
    await prisma.work_contracts.update({
      where: { id: fee.contract_id },
      data: {
        platform_fee_status: 'paid',
        personal_info_disclosed: true,
        disclosed_at: new Date()
      }
    });

    res.json({
      message: '支払いを確認しました。個人情報が開示されました。',
      fee: updatedFee
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 手数料の支払い期限が過ぎているものを取得
const getOverdueFees = async (req, res) => {
  try {
    const now = new Date();

    const overdueFees = await prisma.platform_fees.findMany({
      where: {
        status: 'pending',
        payment_deadline: {
          lt: now
        }
      },
      include: {
        work_contracts: {
          include: {
            pharmacy_profiles: {
              select: {
                pharmacy_name: true,
                phone: true
              }
            },
            pharmacist_profiles: {
              select: {
                first_name: true,
                last_name: true
              }
            }
          }
        }
      },
      orderBy: {
        payment_deadline: 'asc'
      }
    });

    res.json({
      overdueFees
    });

  } catch (error) {
    console.error('Get overdue fees error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 手数料ステータスを更新（管理者用）
const updateFeeStatus = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { status } = req.body;

    // 有効なステータスチェック
    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    const updatedFee = await prisma.platform_fees.update({
      where: { id: feeId },
      data: {
        status: status,
        ...(status === 'paid' ? { paid_at: new Date() } : {})
      }
    });

    // paid になった場合は契約も更新
    if (status === 'paid') {
      await prisma.work_contracts.update({
        where: { id: updatedFee.contract_id },
        data: {
          platform_fee_status: 'paid',
          personal_info_disclosed: true,
          disclosed_at: new Date()
        }
      });
    }

    res.json({
      message: 'ステータスを更新しました',
      fee: updatedFee
    });

  } catch (error) {
    console.error('Update fee status error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// すべての手数料を取得（管理者用）
const getAllFees = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = status ? { status } : {};

    const [fees, total] = await Promise.all([
      prisma.platform_fees.findMany({
        where,
        include: {
          work_contracts: {
            include: {
              pharmacy_profiles: {
                select: {
                  pharmacy_name: true
                }
              },
              pharmacist_profiles: {
                select: {
                  first_name: true,
                  last_name: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take
      }),
      prisma.platform_fees.count({ where })
    ]);

    res.json({
      fees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get all fees error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  getPharmacyFees,
  getFeeDetail,
  confirmPayment,
  getOverdueFees,
  updateFeeStatus,
  getAllFees
};

