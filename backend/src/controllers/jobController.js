const prisma = require('../database/prisma');
const { mapJobPosting } = require('../utils/dto');

// 求人作成（薬局のみ）
const createJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      pharmacy_id: requestedPharmacyId,
      title,
      description,
      employmentType,
      minHourlyRate,
      maxHourlyRate,
      dailyRate,
      monthlySalaryMin,
      monthlySalaryMax,
      workLocation,
      workDays,
      scheduledWorkDays,
      workHoursStart,
      workHoursEnd,
      suggestedStartDate,
      contractDurationDays,
      breakTimeMinutes,
      transportationAllowance,
      parkingAvailable,
      uniformProvided,
      requirements,
      benefits,
      applicationDeadline,
      maxApplicants,
      preferredSchedule
    } = req.body;

    // 必須フィールドの検証
    if (!title || !employmentType) {
      return res.status(400).json({ 
        error: 'タイトルと雇用形態は必須です' 
      });
    }

    // 薬局プロフィールを取得（リクエストで指定されていればそれを使用、なければユーザーの最初の薬局を使用）
    let pharmacyProfile;
    
    if (requestedPharmacyId && requestedPharmacyId !== 'temp-pharmacy-id') {
      // 指定された薬局プロフィールが自分のものか確認
      pharmacyProfile = await prisma.pharmacy_profiles.findFirst({
        where: {
          id: requestedPharmacyId,
          user_id: userId
        }
      });
    } else {
      // ユーザーの薬局プロフィールを取得（最初の1件）
      pharmacyProfile = await prisma.pharmacy_profiles.findFirst({
        where: {
          user_id: userId
        }
      });
    }

    if (!pharmacyProfile) {
      // 薬局プロフィールが存在しない場合、基本的なプロフィールを自動作成
      pharmacyProfile = await prisma.pharmacy_profiles.create({
        data: {
          user_id: userId,
          pharmacy_name: '薬局名未設定',
          prefecture: '都道府県未設定',
          city: '市区町村未設定'
        }
      });
      
      console.log('Auto-created pharmacy profile for user:', userId);
    }

    const pharmacyId = pharmacyProfile.id;

    // 時給を時刻型に変換（HH:mm形式の文字列を受け取る想定）
    const parseTime = (timeStr) => {
      if (!timeStr) return null;
      return new Date(`1970-01-01T${timeStr}:00`);
    };

    // 求人作成
    const newJob = await prisma.job_postings.create({
      data: {
        pharmacy_id: pharmacyId,
        title,
        description,
        employment_type: employmentType,
        min_hourly_rate: minHourlyRate ? parseInt(minHourlyRate) : null,
        max_hourly_rate: maxHourlyRate ? parseInt(maxHourlyRate) : null,
        daily_rate: dailyRate ? parseInt(dailyRate) : null,
        monthly_salary_min: monthlySalaryMin ? parseInt(monthlySalaryMin) : null,
        monthly_salary_max: monthlySalaryMax ? parseInt(monthlySalaryMax) : null,
        work_location: workLocation,
        work_days: workDays || [],
        scheduled_work_days: scheduledWorkDays || [],
        work_hours_start: parseTime(workHoursStart),
        work_hours_end: parseTime(workHoursEnd),
        suggested_start_date: suggestedStartDate ? new Date(suggestedStartDate) : null,
        contract_duration_days: contractDurationDays ? parseInt(contractDurationDays) : 30,
        break_time_minutes: breakTimeMinutes ? parseInt(breakTimeMinutes) : null,
        transportation_allowance: transportationAllowance || false,
        parking_available: parkingAvailable || false,
        uniform_provided: uniformProvided || false,
        requirements,
        benefits: benefits || [],
        application_deadline: applicationDeadline ? new Date(applicationDeadline) : null,
        status: 'active', // デフォルトで公開
        max_applicants: maxApplicants ? parseInt(maxApplicants) : null,
        current_applicants: 0,
        preferred_schedule: preferredSchedule
      },
      include: {
        pharmacy_profiles: {
          select: {
            id: true,
            pharmacy_name: true,
            prefecture: true,
            city: true
          }
        }
      }
    });

    res.status(201).json({
      message: '求人を作成しました',
      job: mapJobPosting(newJob)
    });

  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 求人一覧取得（薬剤師用・検索機能付き）
const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      employmentType,
      prefecture,
      minHourlyRate,
      maxHourlyRate,
      searchQuery
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // 検索条件を構築
    const where = {
      status: 'active', // 公開中のみ
      AND: [
        {
          OR: [
            { application_deadline: null }, // 期限なし
            { application_deadline: { gte: new Date() } } // または期限が過ぎていない
          ]
        }
      ]
    };

    // 雇用形態フィルター
    if (employmentType) {
      where.employment_type = employmentType;
    }

    // 都道府県フィルター
    if (prefecture) {
      where.pharmacy_profiles = {
        prefecture: prefecture
      };
    }

    // 時給フィルター
    if (minHourlyRate) {
      where.min_hourly_rate = {
        gte: parseInt(minHourlyRate)
      };
    }

    if (maxHourlyRate) {
      where.max_hourly_rate = {
        lte: parseInt(maxHourlyRate)
      };
    }

    // キーワード検索（タイトルまたは説明文）
    if (searchQuery) {
      where.AND.push({
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      });
    }

    // 求人一覧取得
    const [jobs, total] = await Promise.all([
      prisma.job_postings.findMany({
        where,
        skip,
        take,
        orderBy: {
          created_at: 'desc'
        },
        include: {
          pharmacy_profiles: {
            select: {
              id: true,
              pharmacy_name: true,
              prefecture: true,
              city: true,
              nearest_station: true,
              profile_image_url: true
            }
          },
          _count: {
            select: {
              job_applications: true
            }
          }
        }
      }),
      prisma.job_postings.count({ where })
    ]);

    res.json({
      jobs: jobs.map(mapJobPosting),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 自分の薬局の求人一覧取得（薬局用）
const getMyJobs = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status, pharmacyId } = req.query;

    // 自分の薬局プロフィールを取得
    const pharmacyProfiles = await prisma.pharmacy_profiles.findMany({
      where: {
        user_id: userId
      },
      select: {
        id: true
      }
    });

    const pharmacyIds = pharmacyProfiles.map(p => p.id);

    if (pharmacyIds.length === 0) {
      return res.json({ jobs: [] });
    }

    // 検索条件
    const where = {
      pharmacy_id: {
        in: pharmacyId ? [pharmacyId] : pharmacyIds
      }
    };

    if (status) {
      where.status = status;
    }

    // 求人一覧取得
    const jobs = await prisma.job_postings.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
      include: {
        pharmacy_profiles: {
          select: {
            id: true,
            pharmacy_name: true,
            prefecture: true,
            city: true
          }
        },
        _count: {
          select: {
            job_applications: true
          }
        }
      }
    });

    res.json({ jobs: jobs.map(mapJobPosting) });

  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 求人詳細取得
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await prisma.job_postings.findUnique({
      where: { id },
      include: {
        pharmacy_profiles: {
          select: {
            id: true,
            pharmacy_name: true,
            pharmacy_name_kana: true,
            phone: true,
            prefecture: true,
            city: true,
            address: true,
            nearest_station: true,
            business_hours_start: true,
            business_hours_end: true,
            closed_days: true,
            established_date: true,
            daily_prescription_count: true,
            staff_count: true,
            description: true,
            features: true,
            facilities: true,
            website_url: true,
            profile_image_url: true
          }
        },
        _count: {
          select: {
            job_applications: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ error: '求人が見つかりません' });
    }

    res.json({ job: mapJobPosting(job) });

  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 求人更新（薬局のみ）
const updateJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    // 求人が存在し、自分の薬局のものか確認
    const existingJob = await prisma.job_postings.findUnique({
      where: { id },
      include: {
        pharmacy_profiles: {
          select: {
            user_id: true
          }
        }
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: '求人が見つかりません' });
    }

    if (existingJob.pharmacy_profiles.user_id !== userId) {
      return res.status(403).json({ error: 'この求人を更新する権限がありません' });
    }

    // 時給を時刻型に変換
    const parseTime = (timeStr) => {
      if (!timeStr) return undefined;
      return new Date(`1970-01-01T${timeStr}:00`);
    };

    // 更新データを準備
    const data = {};
    
    if (updateData.title !== undefined) data.title = updateData.title;
    if (updateData.description !== undefined) data.description = updateData.description;
    if (updateData.employmentType !== undefined) data.employment_type = updateData.employmentType;
    if (updateData.minHourlyRate !== undefined) data.min_hourly_rate = parseInt(updateData.minHourlyRate);
    if (updateData.maxHourlyRate !== undefined) data.max_hourly_rate = parseInt(updateData.maxHourlyRate);
    if (updateData.monthlySalaryMin !== undefined) data.monthly_salary_min = parseInt(updateData.monthlySalaryMin);
    if (updateData.monthlySalaryMax !== undefined) data.monthly_salary_max = parseInt(updateData.monthlySalaryMax);
    if (updateData.workLocation !== undefined) data.work_location = updateData.workLocation;
    if (updateData.workDays !== undefined) data.work_days = updateData.workDays;
    if (updateData.workHoursStart !== undefined) data.work_hours_start = parseTime(updateData.workHoursStart);
    if (updateData.workHoursEnd !== undefined) data.work_hours_end = parseTime(updateData.workHoursEnd);
    if (updateData.breakTimeMinutes !== undefined) data.break_time_minutes = parseInt(updateData.breakTimeMinutes);
    if (updateData.transportationAllowance !== undefined) data.transportation_allowance = updateData.transportationAllowance;
    if (updateData.parkingAvailable !== undefined) data.parking_available = updateData.parkingAvailable;
    if (updateData.uniformProvided !== undefined) data.uniform_provided = updateData.uniformProvided;
    if (updateData.requirements !== undefined) data.requirements = updateData.requirements;
    if (updateData.benefits !== undefined) data.benefits = updateData.benefits;
    if (updateData.applicationDeadline !== undefined) {
      data.application_deadline = updateData.applicationDeadline ? new Date(updateData.applicationDeadline) : null;
    }
    if (updateData.maxApplicants !== undefined) data.max_applicants = parseInt(updateData.maxApplicants);
    if (updateData.preferredSchedule !== undefined) data.preferred_schedule = updateData.preferredSchedule;

    // 求人更新
    const updatedJob = await prisma.job_postings.update({
      where: { id },
      data,
      include: {
        pharmacy_profiles: {
          select: {
            id: true,
            pharmacy_name: true,
            prefecture: true,
            city: true
          }
        }
      }
    });

    res.json({
      message: '求人を更新しました',
      job: mapJobPosting(updatedJob)
    });

  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 求人ステータス変更（薬局のみ）
const updateJobStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    // ステータス検証
    const validStatuses = ['draft', 'active', 'paused', 'closed', 'expired'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    // 求人が存在し、自分の薬局のものか確認
    const existingJob = await prisma.job_postings.findUnique({
      where: { id },
      include: {
        pharmacy_profiles: {
          select: {
            user_id: true
          }
        }
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: '求人が見つかりません' });
    }

    if (existingJob.pharmacy_profiles.user_id !== userId) {
      return res.status(403).json({ error: 'この求人のステータスを変更する権限がありません' });
    }

    // ステータス更新
    const updatedJob = await prisma.job_postings.update({
      where: { id },
      data: { status }
    });

    res.json({
      message: '求人ステータスを更新しました',
      job: updatedJob
    });

  } catch (error) {
    console.error('Update job status error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 求人削除（薬局のみ）
const deleteJob = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // 求人が存在し、自分の薬局のものか確認
    const existingJob = await prisma.job_postings.findUnique({
      where: { id },
      include: {
        pharmacy_profiles: {
          select: {
            user_id: true
          }
        },
        _count: {
          select: {
            job_applications: true
          }
        }
      }
    });

    if (!existingJob) {
      return res.status(404).json({ error: '求人が見つかりません' });
    }

    if (existingJob.pharmacy_profiles.user_id !== userId) {
      return res.status(403).json({ error: 'この求人を削除する権限がありません' });
    }

    // 応募がある場合は警告
    if (existingJob._count.applications > 0) {
      return res.status(400).json({ 
        error: 'この求人には応募者がいるため削除できません。ステータスを「終了」に変更してください。' 
      });
    }

    // 求人削除
    await prisma.job_postings.delete({
      where: { id }
    });

    res.json({ message: '求人を削除しました' });

  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  createJob,
  getJobs,
  getMyJobs,
  getJobById,
  updateJob,
  updateJobStatus,
  deleteJob
};

