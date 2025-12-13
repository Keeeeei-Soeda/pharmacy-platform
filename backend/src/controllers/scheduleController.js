const prisma = require('../database/prisma');
const { mapWorkSchedule } = require('../utils/dto');

const parseTime = (timeStr) => {
  if (!timeStr) return null;
  // "HH:mm" を想定
  if (typeof timeStr === 'string' && /^\d{2}:\d{2}$/.test(timeStr)) {
    return new Date(`1970-01-01T${timeStr}:00`);
  }
  // 既にDateの場合など
  return new Date(timeStr);
};

// 勤務スケジュール作成（薬局用）
const createSchedule = async (req, res) => {
  try {
    const pharmacyUserId = req.user.userId;
    const { contractId, workDate, scheduledStartTime, scheduledEndTime, breakTimeMinutes, notes } = req.body;

    // 契約の所有権確認
    const contract = await prisma.work_contracts.findUnique({
      where: { id: contractId },
      include: {
        pharmacy_profiles: {
          select: { user_id: true }
        }
      }
    });

    if (!contract || contract.pharmacy_profiles.user_id !== pharmacyUserId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({ error: 'アクティブな契約のみスケジュールを作成できます' });
    }

    // 同じ日付のスケジュールが既に存在するか確認
    const existingSchedule = await prisma.work_schedules.findUnique({
      where: {
        contract_id_work_date: {
          contract_id: contractId,
          work_date: new Date(workDate)
        }
      }
    });

    if (existingSchedule) {
      return res.status(400).json({ error: 'この日付のスケジュールは既に存在します' });
    }

    const schedule = await prisma.work_schedules.create({
      data: {
        contract_id: contractId,
        work_date: new Date(workDate),
        scheduled_start_time: parseTime(scheduledStartTime),
        scheduled_end_time: parseTime(scheduledEndTime),
        break_time_minutes: breakTimeMinutes || 60,
        notes
      }
    });

    res.status(201).json({ message: '勤務スケジュールを作成しました', schedule: mapWorkSchedule(schedule) });

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ error: '勤務スケジュールの作成に失敗しました' });
  }
};

// 契約に紐づくスケジュール一覧取得
const getSchedulesByContract = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    const { contractId } = req.params;
    const { startDate, endDate } = req.query;

    // 契約の取得と権限確認
    const contract = await prisma.work_contracts.findUnique({
      where: { id: contractId },
      include: {
        pharmacy_profiles: {
          select: { user_id: true }
        },
        pharmacist_profiles: {
          select: { user_id: true }
        }
      }
    });

    if (!contract) {
      return res.status(404).json({ error: '契約が見つかりません' });
    }

    // 権限チェック
    const hasPermission = 
      (userType === 'pharmacy' && contract.pharmacy_profiles.user_id === userId) ||
      (userType === 'pharmacist' && contract.pharmacist_profiles.user_id === userId);

    if (!hasPermission) {
      return res.status(403).json({ error: '権限がありません' });
    }

    // スケジュール取得条件
    const where = { contract_id: contractId };
    
    if (startDate || endDate) {
      where.work_date = {};
      if (startDate) where.work_date.gte = new Date(startDate);
      if (endDate) where.work_date.lte = new Date(endDate);
    }

    const schedules = await prisma.work_schedules.findMany({
      where,
      orderBy: { work_date: 'asc' },
      include: {
        attendance_records: {
          select: {
            id: true,
            actual_start_time: true,
            actual_end_time: true,
            total_work_minutes: true,
            overtime_minutes: true,
            is_approved: true
          }
        }
      }
    });

    res.json({ schedules: schedules.map(mapWorkSchedule) });

  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'スケジュールの取得に失敗しました' });
  }
};

// 薬剤師の全スケジュール取得（全契約分）
const getPharmacistSchedules = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // 薬剤師プロフィール取得
    const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId }
    });

    if (!pharmacistProfile) {
      return res.status(404).json({ error: '薬剤師プロフィールが見つかりません' });
    }

    // アクティブな契約のIDを取得
    const activeContracts = await prisma.work_contracts.findMany({
      where: {
        pharmacist_id: pharmacistProfile.id,
        status: 'active'
      },
      select: { id: true }
    });

    const contractIds = activeContracts.map(c => c.id);

    if (contractIds.length === 0) {
      return res.json({ schedules: [] });
    }

    // スケジュール取得条件
    const where = { contract_id: { in: contractIds } };
    
    if (startDate || endDate) {
      where.work_date = {};
      if (startDate) where.work_date.gte = new Date(startDate);
      if (endDate) where.work_date.lte = new Date(endDate);
    }

    const schedules = await prisma.work_schedules.findMany({
      where,
      orderBy: { work_date: 'asc' },
      include: {
        work_contracts: {
          include: {
            pharmacy_profiles: { select: { pharmacy_name: true, prefecture: true, city: true } },
            pharmacist_profiles: { select: { first_name: true, last_name: true } }
          }
        },
        attendance_records: {
          select: {
            id: true,
            actual_start_time: true,
            actual_end_time: true,
            total_work_minutes: true,
            overtime_minutes: true,
            is_approved: true
          }
        }
      }
    });

    res.json({ schedules: schedules.map(mapWorkSchedule) });

  } catch (error) {
    console.error('Get pharmacist schedules error:', error);
    res.status(500).json({ error: 'スケジュールの取得に失敗しました' });
  }
};

// 薬局の全スケジュール取得（全契約分）
const getPharmacySchedules = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { startDate, endDate } = req.query;

    // 薬局プロフィール取得
    const pharmacyProfiles = await prisma.pharmacy_profiles.findMany({
      where: { user_id: userId },
      select: { id: true }
    });

    const pharmacyIds = pharmacyProfiles.map(p => p.id);

    if (pharmacyIds.length === 0) {
      return res.status(404).json({ error: '薬局プロフィールが見つかりません' });
    }

    // アクティブな契約のIDを取得
    const activeContracts = await prisma.work_contracts.findMany({
      where: {
        pharmacy_id: { in: pharmacyIds },
        status: 'active'
      },
      select: { id: true }
    });

    const contractIds = activeContracts.map(c => c.id);

    if (contractIds.length === 0) {
      return res.json({ schedules: [] });
    }

    // スケジュール取得条件
    const where = { contract_id: { in: contractIds } };
    
    if (startDate || endDate) {
      where.work_date = {};
      if (startDate) where.work_date.gte = new Date(startDate);
      if (endDate) where.work_date.lte = new Date(endDate);
    }

    const schedules = await prisma.work_schedules.findMany({
      where,
      orderBy: { work_date: 'asc' },
      include: {
        work_contracts: {
          include: {
            pharmacist_profiles: { select: { first_name: true, last_name: true } },
            pharmacy_profiles: { select: { pharmacy_name: true, prefecture: true, city: true } }
          }
        },
        attendance_records: {
          select: {
            id: true,
            actual_start_time: true,
            actual_end_time: true,
            total_work_minutes: true,
            overtime_minutes: true,
            is_approved: true
          }
        }
      }
    });

    res.json({ schedules: schedules.map(mapWorkSchedule) });

  } catch (error) {
    console.error('Get pharmacy schedules error:', error);
    res.status(500).json({ error: 'スケジュールの取得に失敗しました' });
  }
};

// スケジュール更新（薬局用）
const updateSchedule = async (req, res) => {
  try {
    const pharmacyUserId = req.user.userId;
    const { id } = req.params;
    const { scheduledStartTime, scheduledEndTime, breakTimeMinutes, notes } = req.body;

    // スケジュール取得と権限確認
    const schedule = await prisma.work_schedules.findUnique({
      where: { id },
      include: {
        work_contracts: {
          include: {
            pharmacy_profiles: {
              select: { user_id: true }
            }
          }
        }
      }
    });

    if (!schedule || schedule.work_contracts.pharmacy_profiles.user_id !== pharmacyUserId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    const updateData = {};
    if (scheduledStartTime !== undefined) updateData.scheduled_start_time = parseTime(scheduledStartTime);
    if (scheduledEndTime !== undefined) updateData.scheduled_end_time = parseTime(scheduledEndTime);
    if (breakTimeMinutes !== undefined) updateData.break_time_minutes = breakTimeMinutes;
    if (notes !== undefined) updateData.notes = notes;

    const updatedSchedule = await prisma.work_schedules.update({
      where: { id },
      data: updateData
    });

    res.json({ message: 'スケジュールを更新しました', schedule: mapWorkSchedule(updatedSchedule) });

  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'スケジュールの更新に失敗しました' });
  }
};

// スケジュール削除（薬局用）
const deleteSchedule = async (req, res) => {
  try {
    const pharmacyUserId = req.user.userId;
    const { id } = req.params;

    // スケジュール取得と権限確認
    const schedule = await prisma.work_schedules.findUnique({
      where: { id },
      include: {
        work_contracts: {
          include: {
            pharmacy_profiles: {
              select: { user_id: true }
            }
          }
        },
        attendance_records: true
      }
    });

    if (!schedule || schedule.work_contracts.pharmacy_profiles.user_id !== pharmacyUserId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    // 勤怠記録がある場合は削除不可
    if (schedule.attendance_records && schedule.attendance_records.length > 0) {
      return res.status(400).json({ error: '勤怠記録が存在するスケジュールは削除できません' });
    }

    await prisma.work_schedules.delete({
      where: { id }
    });

    res.json({ message: 'スケジュールを削除しました' });

  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'スケジュールの削除に失敗しました' });
  }
};

// 一括スケジュール作成（薬局用）- 繰り返しパターンで複数日分を一度に作成
const createBulkSchedules = async (req, res) => {
  try {
    const pharmacyUserId = req.user.userId;
    const { contractId, startDate, endDate, weekdays, scheduledStartTime, scheduledEndTime, breakTimeMinutes, notes } = req.body;

    // 契約の所有権確認
    const contract = await prisma.work_contracts.findUnique({
      where: { id: contractId },
      include: {
        pharmacy_profiles: {
          select: { user_id: true }
        }
      }
    });

    if (!contract || contract.pharmacy_profiles.user_id !== pharmacyUserId) {
      return res.status(403).json({ error: '権限がありません' });
    }

    if (contract.status !== 'active') {
      return res.status(400).json({ error: 'アクティブな契約のみスケジュールを作成できます' });
    }

    // 日付の範囲を生成
    const start = new Date(startDate);
    const end = new Date(endDate);
    const schedulesToCreate = [];

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      
      // weekdays配列に含まれる曜日のみスケジュールを作成
      if (weekdays.includes(dayOfWeek)) {
        schedulesToCreate.push({
          contract_id: contractId,
          work_date: new Date(d),
          scheduled_start_time: parseTime(scheduledStartTime),
          scheduled_end_time: parseTime(scheduledEndTime),
          break_time_minutes: breakTimeMinutes || 60,
          notes
        });
      }
    }

    if (schedulesToCreate.length === 0) {
      return res.status(400).json({ error: '作成するスケジュールがありません' });
    }

    // 一括作成（既存のスケジュールはスキップ）
    const createdSchedules = [];
    for (const scheduleData of schedulesToCreate) {
      try {
        const schedule = await prisma.work_schedules.create({
          data: scheduleData
        });
        createdSchedules.push(schedule);
      } catch (error) {
        // 既に存在する場合はスキップ
        if (error.code === 'P2002') {
          console.log(`Schedule for ${scheduleData.work_date} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }

    res.status(201).json({ 
      message: `${createdSchedules.length}件の勤務スケジュールを作成しました`, 
      schedules: createdSchedules.map(mapWorkSchedule)
    });

  } catch (error) {
    console.error('Create bulk schedules error:', error);
    res.status(500).json({ error: '一括スケジュール作成に失敗しました' });
  }
};

module.exports = {
  createSchedule,
  getSchedulesByContract,
  getPharmacistSchedules,
  getPharmacySchedules,
  updateSchedule,
  deleteSchedule,
  createBulkSchedules
};



