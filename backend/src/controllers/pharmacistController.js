const { v4: uuidv4 } = require('uuid');
const pool = require('../database/connection');

// 薬剤師プロフィール作成
const createProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      firstName,
      lastName,
      firstNameKana,
      lastNameKana,
      birthDate,
      gender,
      phone,
      postalCode,
      prefecture,
      city,
      address,
      nearestStation,
      licenseNumber,
      licenseIssuedDate,
      graduationUniversity,
      graduationYear,
      experienceYears,
      specialties,
      bio
    } = req.body;

    // 必須フィールドチェック
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        error: '姓名は必須です' 
      });
    }

    // 既存プロフィールチェック
    const existingProfile = await pool.query(
      'SELECT id FROM pharmacist_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length > 0) {
      return res.status(409).json({ 
        error: 'プロフィールは既に作成されています' 
      });
    }

    // プロフィール作成
    const newProfile = await pool.query(
      `INSERT INTO pharmacist_profiles (
        id, user_id, first_name, last_name, first_name_kana, last_name_kana,
        birth_date, gender, phone, postal_code, prefecture, city, address,
        nearest_station, license_number, license_issued_date, graduation_university,
        graduation_year, experience_years, specialties, bio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        uuidv4(), userId, firstName, lastName, firstNameKana, lastNameKana,
        birthDate, gender, phone, postalCode, prefecture, city, address,
        nearestStation, licenseNumber, licenseIssuedDate, graduationUniversity,
        graduationYear, experienceYears, specialties, bio
      ]
    );

    const profile = newProfile.rows[0];

    res.status(201).json({
      message: '薬剤師プロフィールが作成されました',
      profile: {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        prefecture: profile.prefecture,
        city: profile.city,
        experienceYears: profile.experience_years,
        specialties: profile.specialties,
        createdAt: profile.created_at
      }
    });

  } catch (error) {
    console.error('Create pharmacist profile error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 薬剤師プロフィール取得
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const profileResult = await pool.query(
      'SELECT * FROM pharmacist_profiles WHERE user_id = $1',
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
        firstName: profile.first_name,
        lastName: profile.last_name,
        firstNameKana: profile.first_name_kana,
        lastNameKana: profile.last_name_kana,
        birthDate: profile.birth_date,
        gender: profile.gender,
        phone: profile.phone,
        postalCode: profile.postal_code,
        prefecture: profile.prefecture,
        city: profile.city,
        address: profile.address,
        nearestStation: profile.nearest_station,
        licenseNumber: profile.license_number,
        licenseIssuedDate: profile.license_issued_date,
        graduationUniversity: profile.graduation_university,
        graduationYear: profile.graduation_year,
        experienceYears: profile.experience_years,
        specialties: profile.specialties,
        bio: profile.bio,
        // 新規追加フィールド
        age: profile.age,
        licenseAcquiredYear: profile.license_acquired_year,
        certifiedPharmacistQualifications: profile.certified_pharmacist_qualifications,
        otherQualifications: profile.other_qualifications,
        workExperienceMonths: profile.work_experience_months,
        workExperienceTypes: profile.work_experience_types,
        mainJobExperiences: profile.main_job_experiences,
        specialtyFields: profile.specialty_fields,
        pharmacySystemsExperience: profile.pharmacy_systems_experience,
        specialNotes: profile.special_notes,
        selfIntroduction: profile.self_introduction,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Get pharmacist profile error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 薬剤師プロフィール更新
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    // プロフィール存在確認
    const existingProfile = await pool.query(
      'SELECT id FROM pharmacist_profiles WHERE user_id = $1',
      [userId]
    );

    if (existingProfile.rows.length === 0) {
      return res.status(404).json({ 
        error: 'プロフィールが見つかりません' 
      });
    }

    // 更新可能フィールドのマッピング
    const fieldMapping = {
      firstName: 'first_name',
      lastName: 'last_name',
      firstNameKana: 'first_name_kana',
      lastNameKana: 'last_name_kana',
      birthDate: 'birth_date',
      gender: 'gender',
      phone: 'phone',
      postalCode: 'postal_code',
      prefecture: 'prefecture',
      city: 'city',
      address: 'address',
      nearestStation: 'nearest_station',
      licenseNumber: 'license_number',
      licenseIssuedDate: 'license_issued_date',
      graduationUniversity: 'graduation_university',
      graduationYear: 'graduation_year',
      experienceYears: 'experience_years',
      specialties: 'specialties',
      bio: 'bio',
      // 新規追加フィールド
      age: 'age',
      licenseAcquiredYear: 'license_acquired_year',
      certifiedPharmacistQualifications: 'certified_pharmacist_qualifications',
      otherQualifications: 'other_qualifications',
      workExperienceMonths: 'work_experience_months',
      workExperienceTypes: 'work_experience_types',
      mainJobExperiences: 'main_job_experiences',
      specialtyFields: 'specialty_fields',
      pharmacySystemsExperience: 'pharmacy_systems_experience',
      specialNotes: 'special_notes',
      selfIntroduction: 'self_introduction'
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
      UPDATE pharmacist_profiles 
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
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone,
        prefecture: profile.prefecture,
        city: profile.city,
        experienceYears: profile.experience_years,
        updatedAt: profile.updated_at
      }
    });

  } catch (error) {
    console.error('Update pharmacist profile error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  createProfile,
  getProfile,
  updateProfile
};
