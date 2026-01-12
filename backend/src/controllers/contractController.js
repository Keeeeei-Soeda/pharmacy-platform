const prisma = require('../database/prisma');
const { mapWorkContract } = require('../utils/dto');
const { generateWorkNoticePDF } = require('../utils/pdfGenerator');

// 労働条件通知書テンプレート生成
const generateWorkNotice = (contract, pharmacy, pharmacist, jobPosting) => {
  const today = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                労働条件通知書
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

発行日: ${today}
契約番号: ${contract.id}

【雇用主】
薬局名: ${pharmacy.pharmacy_name}
所在地: ${pharmacy.prefecture} ${pharmacy.city}

【労働者】
氏名: ${pharmacist.last_name} ${pharmacist.first_name}

【労働条件】
1. 契約期間
   開始日: ${contract.contract_start_date?.toLocaleDateString('ja-JP') || '別途調整'}
   終了日: ${contract.contract_end_date?.toLocaleDateString('ja-JP') || '別途調整'}

2. 就業場所
   ${pharmacy.pharmacy_name}
   ${pharmacy.prefecture} ${pharmacy.city}

3. 業務内容
   ${jobPosting.description || '薬剤師業務全般'}

4. 就業時間
   ${jobPosting.work_hours_start ? `${new Date(jobPosting.work_hours_start).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}` : '09:00'} ～ 
   ${jobPosting.work_hours_end ? `${new Date(jobPosting.work_hours_end).toLocaleTimeString('ja-JP', {hour: '2-digit', minute: '2-digit'})}` : '18:00'}
   休憩時間: ${jobPosting.break_time_minutes || 60}分

5. 勤務日
   ${jobPosting.work_days?.join('、') || '別途調整'}

6. 賃金
   時給: ${jobPosting.min_hourly_rate || '別途調整'}円
   ${jobPosting.max_hourly_rate ? `～ ${jobPosting.max_hourly_rate}円` : ''}
   支払日: 毎月末締め、翌月25日払い

7. 交通費
   ${jobPosting.transportation_allowance ? '実費支給' : '支給なし'}

8. その他の労働条件
   ${jobPosting.benefits?.join('、') || 'なし'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

上記の条件で労働契約を締結することに同意します。

`;
};

// 薬局側: 採用意向を送信（契約オファー作成）
const sendJobOffer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { applicationId, startDate, endDate, notes } = req.body;

    // 応募情報を取得
    const application = await prisma.job_applications.findUnique({
      where: { id: applicationId },
      include: {
        job_postings: {
          include: {
            pharmacy_profiles: true
          }
        },
        pharmacist_profiles: {
          include: {
            users: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ error: '応募が見つかりません' });
    }

    // 権限チェック: 薬局の所有者か確認
    if (application.job_postings.pharmacy_profiles.user_id !== userId) {
      return res.status(403).json({ error: 'この応募に対する権限がありません' });
    }

    // 既存の契約オファーがあるかチェック
    const existingContract = await prisma.work_contracts.findFirst({
      where: {
        application_id: applicationId,
        status: { in: ['pending', 'active'] }
      }
    });

    if (existingContract) {
      return res.status(400).json({ error: '既にオファーを送信済みです' });
    }

    // 応募が未承認の場合は自動的に承認する
    if (application.status !== 'accepted') {
      await prisma.job_applications.update({
        where: { id: applicationId },
        data: { 
          status: 'accepted',
          reviewed_at: new Date()
        }
      });
    }

    // 契約オファー作成
    const contract = await prisma.work_contracts.create({
      data: {
        application_id: applicationId,
        pharmacy_id: application.job_postings.pharmacy_id,
        pharmacist_id: application.pharmacist_id,
        status: 'pending',
        offer_sent_at: new Date(),
        contract_start_date: startDate ? new Date(startDate) : null,
        contract_end_date: endDate ? new Date(endDate) : null,
        terms: notes || '労働条件は別途通知書をご確認ください',
      },
      include: {
        pharmacy_profiles: true,
        pharmacist_profiles: {
          include: {
            users: true
          }
        },
        job_applications: {
          include: {
            job_postings: {
              include: {
                pharmacy_profiles: true
              }
            }
          }
        }
      }
    });

    // 薬剤師に通知
    try {
      await prisma.notifications.create({
        data: {
          user_id: application.pharmacist_profiles.users.id,
          type: 'contract_offer',
          title: '採用オファーが届きました',
          message: `${application.job_postings.pharmacy_profiles.pharmacy_name}から採用のオファーが届きました。ご確認ください。`,
          related_id: contract.id,
          action_url: `/pharmacist/contracts/${contract.id}`
        }
      });
    } catch (notificationError) {
      // 通知の作成に失敗してもメインの処理は成功とする
      console.error('Failed to create notification:', notificationError);
    }

    res.json({
      message: '採用オファーを送信しました',
      contract
    });

  } catch (error) {
    console.error('Send job offer error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: '採用オファーの送信に失敗しました',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 薬剤師側: 契約オファーを承諾
const acceptJobOffer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // 契約オファーを取得
    const contract = await prisma.work_contracts.findUnique({
      where: { id },
      include: {
        pharmacist_profiles: {
          include: {
            users: true
          }
        },
        pharmacy_profiles: true,
        job_applications: {
          include: {
            job_postings: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '契約が見つかりません' });
    }

    // 権限チェック
    if (contract.pharmacist_profiles.users.id !== userId) {
      return res.status(403).json({ error: 'この契約に対する権限がありません' });
    }

    // 既に処理済みか確認
    if (contract.status !== 'pending') {
      return res.status(400).json({ error: 'この契約は既に処理済みです' });
    }

    // 労働条件通知書を生成（テキスト形式 - 後方互換性のため保持）
    const workNotice = generateWorkNotice(
      contract,
      contract.pharmacy_profiles,
      contract.pharmacist_profiles,
      contract.job_applications.job_postings
    );

    console.log('Contract job posting:', contract.job_applications.job_postings);
    console.log('Daily rate from job posting:', contract.job_applications.job_postings.daily_rate);
    console.log('Scheduled work days from job posting:', contract.job_applications.job_postings.scheduled_work_days);

    // 労働条件通知書PDFを生成
    let workNoticePDF = null;
    try {
      workNoticePDF = await generateWorkNoticePDF({
        contractId: contract.id,
        pharmacyName: contract.pharmacy_profiles.pharmacy_name,
        pharmacyAddress: `${contract.pharmacy_profiles.prefecture || ''} ${contract.pharmacy_profiles.city || ''}`.trim(),
        pharmacistName: `${contract.pharmacist_profiles.last_name} ${contract.pharmacist_profiles.first_name}`,
        startDate: contract.initial_work_date || contract.start_date || new Date(),
        workDays: contract.work_days || 30,
        jobDescription: contract.job_applications?.job_postings?.description || '調剤業務、服薬指導等',
        workHours: contract.job_applications?.job_postings?.work_hours || '薬局と協議の上決定'
      });
      console.log('Work notice PDF generated:', workNoticePDF);
    } catch (pdfError) {
      console.error('Failed to generate work notice PDF:', pdfError);
      // PDF生成失敗してもメインの処理は継続
    }

    // 契約を承諾し、スケジュールを自動作成
    const updatedContract = await prisma.$transaction(async (tx) => {
      // 契約を承諾
      const acceptedContract = await tx.work_contracts.update({
        where: { id },
        data: {
          status: 'active',
          accepted_at: new Date(),
          terms: workNotice,
          work_notice_url: workNoticePDF ? workNoticePDF.url : null,
          daily_rate: contract.job_applications?.job_postings?.daily_rate || 25000,
          scheduled_work_days: contract.job_applications?.job_postings?.scheduled_work_days || []
        }
      });

      // スケジュールを自動作成
      const jobPosting = contract.job_applications.job_postings;
      if (
        acceptedContract.contract_start_date &&
        acceptedContract.contract_end_date &&
        jobPosting.scheduled_work_days &&
        jobPosting.scheduled_work_days.length > 0
      ) {
        const startDate = new Date(acceptedContract.contract_start_date);
        const endDate = new Date(acceptedContract.contract_end_date);
        const schedulesToCreate = [];

        // 開始日から終了日まで、指定された曜日のスケジュールを作成
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayOfWeek = d.getDay();
          
          if (jobPosting.scheduled_work_days.includes(dayOfWeek)) {
            schedulesToCreate.push({
              contract_id: acceptedContract.id,
              work_date: new Date(d),
              scheduled_start_time: jobPosting.work_hours_start || new Date('1970-01-01T09:00:00'),
              scheduled_end_time: jobPosting.work_hours_end || new Date('1970-01-01T18:00:00'),
              break_time_minutes: jobPosting.break_time_minutes || 60,
              notes: '契約開始時に自動作成されたスケジュール'
            });
          }
        }

        // 一括作成（既存のスケジュールはスキップ）
        for (const scheduleData of schedulesToCreate) {
          try {
            await tx.work_schedules.create({
              data: scheduleData
            });
          } catch (error) {
            // 既に存在する場合はスキップ
            if (error.code !== 'P2002') {
              throw error
            }
          }
        }

        console.log(`Created ${schedulesToCreate.length} work schedules for contract ${acceptedContract.id}`);
      }

      return acceptedContract;
    });

    // レスポンス用に再取得（リレーションを含めた形にする）
    const contractForResponse = await prisma.work_contracts.findUnique({
      where: { id },
      include: {
        pharmacy_profiles: true,
        pharmacist_profiles: true,
        job_applications: {
          include: {
            pharmacist_profiles: true,
            job_postings: { include: { pharmacy_profiles: true } },
            message_threads: true
          }
        }
      }
    });

    // 薬局に通知
    try {
      await prisma.notifications.create({
        data: {
          user_id: contract.pharmacy_profiles.user_id,
          type: 'contract_signed',
          title: '契約が成立しました',
          message: `${contract.pharmacist_profiles.last_name} ${contract.pharmacist_profiles.first_name}さんが契約を承諾しました。`,
          related_id: contract.id,
          action_url: `/pharmacy/contracts/${contract.id}`
        }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    res.json({
      message: '契約を承諾しました',
      contract: mapWorkContract(contractForResponse || updatedContract),
      workNotice,
      workNoticePDF: workNoticePDF ? {
        url: workNoticePDF.url,
        fileName: workNoticePDF.fileName
      } : null
    });

  } catch (error) {
    console.error('Accept job offer error:', error);
    res.status(500).json({ error: '契約の承諾に失敗しました' });
  }
};

// 薬剤師側: 契約オファーを辞退
const rejectJobOffer = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { reason } = req.body;

    // 契約オファーを取得
    const contract = await prisma.work_contracts.findUnique({
      where: { id },
      include: {
        pharmacist_profiles: { select: { user_id: true, first_name: true, last_name: true } },
        pharmacy_profiles: { select: { user_id: true } },
        job_applications: { include: { message_threads: true } }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '契約が見つかりません' });
    }

    // 権限チェック
    if (contract.pharmacist_profiles.user_id !== userId) {
      return res.status(403).json({ error: 'この契約に対する権限がありません' });
    }

    // 既に処理済みか確認
    if (contract.status !== 'pending') {
      return res.status(400).json({ error: 'この契約は既に処理済みです' });
    }

    console.log('Contract application:', contract.job_applications);
    console.log('Message threads:', contract.job_applications?.message_threads);

    // トランザクションで契約辞退とメッセージスレッド非表示を実行
    const result = await prisma.$transaction(async (tx) => {
      // 契約を辞退
      const updatedContract = await tx.work_contracts.update({
        where: { id },
        data: {
          status: 'rejected',
          rejected_at: new Date(),
          terms: reason || '薬剤師により辞退されました'
        }
      });

      // メッセージスレッドを非表示にする（配列の最初の要素を取得）
    const messageThreads = contract.job_applications?.message_threads;
      if (messageThreads && messageThreads.length > 0) {
        console.log('Hiding message thread:', messageThreads[0].id);
        await tx.message_threads.update({
          where: { id: messageThreads[0].id },
          data: {
            is_active: false
          }
        });
      } else {
        console.log('No message thread to hide');
      }

      return updatedContract;
    });

    // 薬局に通知
    try {
      await prisma.notifications.create({
        data: {
          user_id: contract.pharmacy_profiles.user_id,
          type: 'contract_rejected',
          title: '契約が辞退されました',
          message: `${contract.pharmacist_profiles.last_name} ${contract.pharmacist_profiles.first_name}さんが契約を辞退しました。`,
          related_id: contract.id,
          action_url: `/pharmacy/applications`
        }
      });
    } catch (notificationError) {
      console.error('Failed to create notification:', notificationError);
    }

    const contractForResponse = await prisma.work_contracts.findUnique({
      where: { id },
      include: {
        pharmacy_profiles: true,
        pharmacist_profiles: true,
        job_applications: {
          include: {
            pharmacist_profiles: true,
            job_postings: { include: { pharmacy_profiles: true } },
            message_threads: true
          }
        }
      }
    });

    res.json({
      message: '契約を辞退しました',
      contract: mapWorkContract(contractForResponse || result)
    });

  } catch (error) {
    console.error('Reject job offer error:', error);
    res.status(500).json({ error: '契約の辞退に失敗しました' });
  }
};

// 契約一覧取得（薬剤師用）
const getPharmacistContracts = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 薬剤師プロフィールを取得
    const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId }
    });

    if (!pharmacistProfile) {
      return res.json({ contracts: [] });
    }

    // 契約一覧を取得
    const contracts = await prisma.work_contracts.findMany({
      where: {
        pharmacist_id: pharmacistProfile.id
      },
      include: {
        pharmacy_profiles: true,
        pharmacist_profiles: true,
        job_applications: {
          include: {
            pharmacist_profiles: true,
            job_postings: { include: { pharmacy_profiles: true } },
            message_threads: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ contracts: contracts.map(mapWorkContract) });

  } catch (error) {
    console.error('Get pharmacist contracts error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: '契約の取得に失敗しました' });
  }
};

// 契約一覧取得（薬局用）
const getPharmacyContracts = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 薬局プロフィールを取得
    const pharmacyProfiles = await prisma.pharmacy_profiles.findMany({
      where: { user_id: userId }
    });

    if (pharmacyProfiles.length === 0) {
      return res.json({ contracts: [] });
    }

    const pharmacyIds = pharmacyProfiles.map(p => p.id);

    // 契約一覧を取得
    const contracts = await prisma.work_contracts.findMany({
      where: {
        pharmacy_id: { in: pharmacyIds }
      },
      include: {
        pharmacy_profiles: true,
        pharmacist_profiles: true,
        job_applications: {
          include: {
            pharmacist_profiles: true,
            job_postings: { include: { pharmacy_profiles: true } },
            message_threads: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ contracts: contracts.map(mapWorkContract) });

  } catch (error) {
    console.error('Get pharmacy contracts error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: '契約の取得に失敗しました' });
  }
};

// 契約詳細取得
const getContractDetail = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const contract = await prisma.work_contracts.findUnique({
      where: { id },
      include: {
        pharmacy_profiles: true,
        pharmacist_profiles: true,
        job_applications: {
          include: {
            pharmacist_profiles: true,
            job_postings: { include: { pharmacy_profiles: true } },
            message_threads: true
          }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '契約が見つかりません' });
    }

    // 権限チェック
    if (
      contract.pharmacy_profiles.user_id !== userId &&
      contract.pharmacist_profiles.user_id !== userId
    ) {
      return res.status(403).json({ error: 'この契約を閲覧する権限がありません' });
    }

    res.json({ contract: mapWorkContract(contract) });

  } catch (error) {
    console.error('Get contract detail error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: '契約の取得に失敗しました' });
  }
};

module.exports = {
  sendJobOffer,
  acceptJobOffer,
  rejectJobOffer,
  getPharmacistContracts,
  getPharmacyContracts,
  getContractDetail
};

