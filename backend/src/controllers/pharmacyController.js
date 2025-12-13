const { v4: uuidv4 } = require('uuid');
const pool = require('../database/connection');

// 薬局プロフィール作成
const createProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      pharmacyName,
      pharmacyNameKana,
      representativeName,
      phone,
      fax,
      postalCode,
      prefecture,
      city,
      address,
      nearestStation,
      businessHoursStart,
      businessHoursEnd,
      closedDays,
      establishedDate,
      dailyPrescriptionCount,
      staffCount,
      description,
      features,
      facilities,
      websiteUrl
    } = req.body;

    // 必須フィールドチェック
    if (!pharmacyName) {
      return res.status(400).json({ 
        error: '薬局名は必須です' 
      });
    }

    // 既存プロフィールチェック
    const existingProfile = await pool.query(
      'SELECT id FROM pharmacy_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({ 
        error: 'プロフィールは既に作成されています' 
      });
    }

    // プロフィール作成
    const newProfile = await pool.query(
      `INSERT INTO pharmacy_profiles (
        id, user_id, pharmacy_name, pharmacy_name_kana, representative_name,
        phone, fax, postal_code, prefecture, city, address, nearest_station,
        business_hours_start, business_hours_end, closed_days, established_date,
        daily_prescription_count, staff_count, description, features, facilities, website_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *`,
      [
        uuidv4(), userId, pharmacyName, pharmacyNameKana, representativeName,
        phone, fax, postalCode, prefecture, city, address, nearestStation,
        businessHoursStart, businessHoursEnd, closedDays, establishedDate,
        dailyPrescriptionCount, staffCount, description, features, facilities, websiteUrl
      ]
    );

    const profile = newProfile.rows[0];

    res.status(201).json({
      message: '薬局プロフィールが作成されました',
      profile: {
        id: profile.id,
        pharmacyName: profile.pharmacy_name,
        phone: profile.phone,
        prefecture: profile.prefecture,
        city: profile.city,
        businessHoursStart: profile.business_hours_start,
        businessHoursEnd: profile.business_hours_end,
        createdAt: profile.created_at
      }
    });

  } catch (error) {
    console.error('Create pharmacy profile error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 薬局プロフィール取得
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profileResult = await pool.query(
      'SELECT * FROM pharmacy_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'プロフィールが見つかりません' 
      });
    }

    const profile = profileResult.rows[0];

    res.json({
      profile: {
        id: profile.id,
        pharmacyName: profile.pharmacy_name,
        pharmacyNameKana: profile.pharmacy_name_kana,
        representativeName: profile.representative_name,
        phone: profile.phone,
        fax: profile.fax,
        postalCode: profile.postal_code,
        prefecture: profile.prefecture,
        city: profile.city,
        address: profile.address,
        nearestStation: profile.nearest_station,
        businessHoursStart: profile.business_hours_start,
        businessHoursEnd: profile.business_hours_end,
        closedDays: profile.closed_days,
        establishedDate: profile.established_date,
        dailyPrescriptionCount: profile.daily_prescription_count,
        staffCount: profile.staff_count,
        description: profile.description,
        features: profile.features,
        facilities: profile.facilities,
        websiteUrl: profile.website_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Get pharmacy profile error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 薬局プロフィール更新
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // プロフィール存在確認
    const existingProfile = await pool.query(
      'SELECT id FROM pharmacy_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      return res.status(404).json({ 
        error: 'プロフィールが見つかりません' 
      });
    }

    // 更新可能フィールドのマッピング
    const fieldMapping = {
      pharmacyName: 'pharmacy_name',
      pharmacyNameKana: 'pharmacy_name_kana',
      representativeName: 'representative_name',
      phone: 'phone',
      fax: 'fax',
      postalCode: 'postal_code',
      prefecture: 'prefecture',
      city: 'city',
      address: 'address',
      nearestStation: 'nearest_station',
      businessHoursStart: 'business_hours_start',
      businessHoursEnd: 'business_hours_end',
      closedDays: 'closed_days',
      establishedDate: 'established_date',
      dailyPrescriptionCount: 'daily_prescription_count',
      staffCount: 'staff_count',
      description: 'description',
      features: 'features',
      facilities: 'facilities',
      websiteUrl: 'website_url'
    };

    // 動的UPDATE文の構築
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (fieldMapping[key]) {
        updateFields.push(`${fieldMapping[key]} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: '更新可能なフィールドが指定されていません' 
      });
    }

    values.push(userId);
    const updateQuery = `
      UPDATE pharmacy_profiles 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${paramCount}
      RETURNING *
    `;

    const updatedProfile = await pool.query(updateQuery, values);
    const profile = updatedProfile.rows[0];

    res.json({
      message: 'プロフィールが更新されました',
      profile: {
        id: profile.id,
        pharmacyName: profile.pharmacy_name,
        phone: profile.phone,
        prefecture: profile.prefecture,
        city: profile.city,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Update pharmacy profile error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile
};
