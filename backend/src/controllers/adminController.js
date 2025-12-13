const prisma = require('../database/prisma');

// 薬剤師一覧取得（運営用）
const getPharmacists = async (req, res) => {
  try {
    const { status, search } = req.query;

    // フィルター条件
    const where = {};
    
    if (status && status !== 'all') {
      where.verification_status = status;
    }

    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { license_number: { contains: search } }
      ];
    }

    const pharmacists = await prisma.pharmacist_profiles.findMany({
      where,
      include: {
        users: {
          select: {
            email: true,
            created_at: true
          }
        }
      },
      orderBy: [
        { verification_status: 'asc' }, // pending を最初に
        { created_at: 'desc' }
      ]
    });

    res.json({
      total: pharmacists.length,
      pharmacists
    });

  } catch (error) {
    console.error('Get pharmacists error:', error);
    res.status(500).json({ error: '薬剤師一覧の取得に失敗しました' });
  }
};

// 薬剤師詳細取得（運営用）
const getPharmacistDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const pharmacist = await prisma.pharmacist_profiles.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            email: true,
            created_at: true,
            last_login: true
          }
        },
        job_applications: {
          include: {
            job_postings: {
              include: {
                pharmacy_profiles: {
                  select: {
                    pharmacy_name: true
                  }
                }
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 5
        },
        work_contracts: {
          include: {
            pharmacy_profiles: {
              select: {
                pharmacy_name: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          take: 5
        }
      }
    });

    if (!pharmacist) {
      return res.status(404).json({ error: '薬剤師が見つかりません' });
    }

    res.json(pharmacist);

  } catch (error) {
    console.error('Get pharmacist detail error:', error);
    res.status(500).json({ error: '薬剤師詳細の取得に失敗しました' });
  }
};

// 本人確認を承認
const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body; // 現スキーマに保存先がないため、現状は利用しない
    const adminId = req.user.userId; // 将来拡張用

    const pharmacist = await prisma.pharmacist_profiles.findUnique({
      where: { id }
    });

    if (!pharmacist) {
      return res.status(404).json({ error: '薬剤師が見つかりません' });
    }

    // 証明書が両方アップロードされているか確認
    if (!pharmacist.license_file_path || !pharmacist.registration_file_path) {
      return res.status(400).json({ 
        error: '証明書が両方アップロードされていません' 
      });
    }

    const updatedPharmacist = await prisma.pharmacist_profiles.update({
      where: { id },
      data: {
        verification_status: 'approved',
        verified_at: new Date()
      }
    });

    res.json({
      message: '本人確認を承認しました',
      pharmacist: updatedPharmacist
    });

  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ error: '承認処理に失敗しました' });
  }
};

// 本人確認を却下
const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId; // 将来拡張用

    if (!reason) {
      return res.status(400).json({ error: '却下理由を入力してください' });
    }

    const pharmacist = await prisma.pharmacist_profiles.findUnique({
      where: { id }
    });

    if (!pharmacist) {
      return res.status(404).json({ error: '薬剤師が見つかりません' });
    }

    const updatedPharmacist = await prisma.pharmacist_profiles.update({
      where: { id },
      data: {
        verification_status: 'rejected',
        verified_at: new Date()
      }
    });

    res.json({
      message: '本人確認を却下しました',
      pharmacist: {
        id: updatedPharmacist.id,
        verification_status: updatedPharmacist.verificationStatus,
        verifiedAt: updatedPharmacist.verifiedAt
      }
    });

  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ error: '却下処理に失敗しました' });
  }
};

// 本人確認をリセット（再審査用）
const resetVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const pharmacist = await prisma.pharmacist_profiles.findUnique({
      where: { id }
    });

    if (!pharmacist) {
      return res.status(404).json({ error: '薬剤師が見つかりません' });
    }

    const updatedPharmacist = await prisma.pharmacist_profiles.update({
      where: { id },
      data: {
        verification_status: 'pending',
        verifiedBy: null,
        verifiedAt: null,
        verificationNotes: null
      }
    });

    res.json({
      message: '本人確認ステータスをリセットしました',
      pharmacist: {
        id: updatedPharmacist.id,
        verification_status: updatedPharmacist.verificationStatus
      }
    });

  } catch (error) {
    console.error('Reset verification error:', error);
    res.status(500).json({ error: 'リセット処理に失敗しました' });
  }
};

// 統計情報取得
const getStatistics = async (req, res) => {
  try {
    const [
      totalPharmacists,
      pendingCount,
      approvedCount,
      rejectedCount
    ] = await Promise.all([
      prisma.pharmacist_profiles.count(),
      prisma.pharmacist_profiles.count({ where: { verification_status: 'pending' } }),
      prisma.pharmacist_profiles.count({ where: { verification_status: 'approved' } }),
      prisma.pharmacist_profiles.count({ where: { verification_status: 'rejected' } })
    ]);

    res.json({
      total: totalPharmacists,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: '統計情報の取得に失敗しました' });
  }
};

module.exports = {
  getPharmacists,
  getPharmacistDetail,
  approveVerification,
  rejectVerification,
  resetVerification,
  getStatistics
};



