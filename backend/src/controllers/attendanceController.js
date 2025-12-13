const { v4: uuidv4 } = require('uuid');
const pool = require('../database/connection');

// 出勤記録
const checkIn = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // 既に出勤済みかチェック
    const existingRecord = await pool.query(
      'SELECT * FROM attendance_logs WHERE user_id = $1 AND log_date = $2',
      [userId, today]
    );

    if (existingRecord.rows.length > 0 && existingRecord.rows[0].check_in_time) {
      return res.status(400).json({ 
        error: '本日は既に出勤済みです',
        checkInTime: existingRecord.rows[0].check_in_time
      });
    }

    const checkInTime = new Date();

    // 出勤記録作成または更新
    let result;
    if (existingRecord.rows.length > 0) {
      result = await pool.query(
        'UPDATE attendance_logs SET check_in_time = $1, notes = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [checkInTime, notes, 'working', existingRecord.rows[0].id]
      );
    } else {
      result = await pool.query(
        `INSERT INTO attendance_logs (id, user_id, log_date, check_in_time, notes, status) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [uuidv4(), userId, today, checkInTime, notes, 'working']
      );
    }

    const record = result.rows[0];

    res.json({
      message: '出勤記録を登録しました',
      attendance: {
        id: record.id,
        checkInTime: record.check_in_time,
        date: record.log_date,
        status: record.status
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 退勤記録
const checkOut = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notes } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // 当日の出勤記録を取得
    const attendanceRecord = await pool.query(
      'SELECT * FROM attendance_logs WHERE user_id = $1 AND log_date = $2',
      [userId, today]
    );

    if (attendanceRecord.rows.length === 0) {
      return res.status(400).json({ 
        error: '出勤記録が見つかりません' 
      });
    }

    const record = attendanceRecord.rows[0];

    if (!record.check_in_time) {
      return res.status(400).json({ 
        error: '出勤打刻を先に行ってください' 
      });
    }

    if (record.check_out_time) {
      return res.status(400).json({ 
        error: '本日は既に退勤済みです',
        checkOutTime: record.check_out_time
      });
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(record.check_in_time);
    
    // 勤務時間計算（分単位）
    const workMinutes = Math.floor((checkOutTime - checkInTime) / (1000 * 60));
    const breakMinutes = record.break_minutes || 0;
    const actualWorkMinutes = Math.max(0, workMinutes - breakMinutes);

    // 退勤記録更新
    const updatedRecord = await pool.query(
      `UPDATE attendance_logs 
       SET check_out_time = $1, work_minutes = $2, notes = COALESCE(notes, '') || $3, 
           status = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 RETURNING *`,
      [checkOutTime, actualWorkMinutes, notes ? '\n退勤時: ' + notes : '', 'completed', record.id]
    );

    const finalRecord = updatedRecord.rows[0];

    res.json({
      message: '退勤記録を登録しました',
      attendance: {
        id: finalRecord.id,
        checkInTime: finalRecord.check_in_time,
        checkOutTime: finalRecord.check_out_time,
        workMinutes: finalRecord.work_minutes,
        workHours: (finalRecord.work_minutes / 60).toFixed(2),
        date: finalRecord.log_date,
        status: finalRecord.status
      }
    });

  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 当日の勤怠状況取得
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split('T')[0];

    const result = await pool.query(
      'SELECT * FROM attendance_logs WHERE user_id = $1 AND log_date = $2',
      [userId, today]
    );

    if (result.rows.length === 0) {
      return res.json({
        status: 'not_started',
        message: '本日の勤務はまだ開始されていません'
      });
    }

    const record = result.rows[0];
    let status = 'not_started';
    let message = '';

    if (record.check_in_time && !record.check_out_time) {
      status = 'working';
      const currentTime = new Date();
      const checkInTime = new Date(record.check_in_time);
      const workingMinutes = Math.floor((currentTime - checkInTime) / (1000 * 60));
      message = `勤務中（${Math.floor(workingMinutes / 60)}時間${workingMinutes % 60}分経過）`;
    } else if (record.check_in_time && record.check_out_time) {
      status = 'completed';
      message = `勤務完了（${Math.floor(record.work_minutes / 60)}時間${record.work_minutes % 60}分）`;
    }

    res.json({
      status,
      message,
      attendance: {
        id: record.id,
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time,
        workMinutes: record.work_minutes,
        date: record.log_date
      }
    });

  } catch (error) {
    console.error('Get today status error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 月次勤怠サマリー
const getMonthlySummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { year, month } = req.query;
    
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    // 月次の勤怠記録を取得
    const records = await pool.query(
      `SELECT * FROM attendance_logs 
       WHERE user_id = $1 AND EXTRACT(YEAR FROM log_date) = $2 AND EXTRACT(MONTH FROM log_date) = $3
       ORDER BY log_date`,
      [userId, targetYear, targetMonth]
    );

    const attendanceRecords = records.rows;
    let totalWorkMinutes = 0;
    let totalWorkDays = 0;

    attendanceRecords.forEach(record => {
      if (record.work_minutes) {
        totalWorkMinutes += record.work_minutes;
        totalWorkDays += 1;
      }
    });

    const totalWorkHours = (totalWorkMinutes / 60).toFixed(2);

    res.json({
      summary: {
        year: targetYear,
        month: targetMonth,
        totalWorkDays,
        totalWorkMinutes,
        totalWorkHours,
        averageWorkMinutesPerDay: totalWorkDays > 0 ? Math.round(totalWorkMinutes / totalWorkDays) : 0
      },
      records: attendanceRecords.map(record => ({
        date: record.log_date,
        checkInTime: record.check_in_time,
        checkOutTime: record.check_out_time,
        workMinutes: record.work_minutes,
        workHours: record.work_minutes ? (record.work_minutes / 60).toFixed(2) : null,
        status: record.status
      }))
    });

  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMonthlySummary
};
