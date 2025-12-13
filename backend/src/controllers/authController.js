const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/connection');
const prisma = require('../database/prisma');

// JWT トークン生成関数
const generateToken = (userId, userType) => {
  return jwt.sign(
    { userId, userType },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ユーザー登録
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      userType, 
      firstName, 
      lastName,
      // 薬局用フィールド
      pharmacyName,
      phone,
      address,
      // 薬剤師用フィールド
      licenseNumber,
      experience
    } = req.body;

    // 入力値検証
    if (!email || !password || !userType) {
      return res.status(400).json({ 
        error: 'メールアドレス、パスワード、ユーザータイプは必須です' 
      });
    }

    if (!['pharmacist', 'pharmacy'].includes(userType)) {
      return res.status(400).json({ 
        error: 'ユーザータイプは pharmacist または pharmacy である必要があります' 
      });
    }

    // 既存ユーザーチェック
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        error: 'このメールアドレスは既に登録されています' 
      });
    }

    // パスワードハッシュ化
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ユーザー作成
    const newUser = await pool.query(
      `INSERT INTO users (id, email, password_hash, user_type, is_verified) 
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, user_type, created_at`,
      [uuidv4(), email, hashedPassword, userType, false]
    );

    const user = newUser.rows[0];

    // ユーザータイプに応じてプロフィールを自動作成
    try {
      if (userType === 'pharmacist') {
        // 薬剤師プロフィールを自動作成
        // 経験年数の変換
        let experienceYears = 0;
        if (experience) {
          if (experience === '1年未満') experienceYears = 0;
          else if (experience === '1-3年') experienceYears = 2;
          else if (experience === '3-5年') experienceYears = 4;
          else if (experience === '5-10年') experienceYears = 7;
          else if (experience === '10年以上') experienceYears = 10;
        }

        // 住所から都道府県を抽出（簡易版）
        let prefecture = null;
        let city = null;
        if (address) {
          const prefectures = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
            '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
            '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
            '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
            '鳥取県', '島根県', '岡山県', '広島県', '山口県',
            '徳島県', '香川県', '愛媛県', '高知県',
            '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
          
          for (const pref of prefectures) {
            if (address.includes(pref)) {
              prefecture = pref;
              const afterPref = address.substring(address.indexOf(pref) + pref.length);
              const cityMatch = afterPref.match(/^(.+?[市区町村])/);
              if (cityMatch) {
                city = cityMatch[1];
              }
              break;
            }
          }
        }

        await prisma.pharmacist_profiles.create({
          data: {
            user_id: user.id,
            first_name: firstName || '名前',
            last_name: lastName || '姓',
            phone: phone || null,
            address: address || null,
            prefecture: prefecture,
            city: city,
            license_number: licenseNumber || null,
            experience_years: experienceYears,
            specialties: [],
            has_drivers_license: false,
            has_home_care_experience: false
          }
        });
        console.log('Auto-created pharmacist profile for user:', user.id);
      } else if (userType === 'pharmacy') {
      // 薬局プロフィールを自動作成
      // 住所から都道府県と市区町村を抽出（簡易版）
      let prefecture = '未設定';
      let city = '未設定';
      if (address) {
        // 都道府県の抽出（簡易的な方法）
        const prefectures = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
          '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
          '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県',
          '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
          '鳥取県', '島根県', '岡山県', '広島県', '山口県',
          '徳島県', '香川県', '愛媛県', '高知県',
          '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
        
        for (const pref of prefectures) {
          if (address.includes(pref)) {
            prefecture = pref;
            // 都道府県の後の部分を市区町村として扱う（簡易版）
            const afterPref = address.substring(address.indexOf(pref) + pref.length);
            const cityMatch = afterPref.match(/^(.+?[市区町村])/);
            if (cityMatch) {
              city = cityMatch[1];
            }
            break;
          }
        }
      }

      await prisma.pharmacy_profiles.create({
        data: {
          user_id: user.id,
          pharmacy_name: pharmacyName || '薬局名未設定',
          phone: phone || null,
          address: address || null,
          prefecture: prefecture,
          city: city
        }
      });
      console.log('Auto-created pharmacy profile for user:', user.id);
      }
    } catch (profileError) {
      console.error('Profile creation error:', profileError);
      console.log('User created but profile creation failed. User can create profile later.');
      // プロフィール作成に失敗しても、ユーザー登録は成功とする
    }

    // JWT トークン生成
    const token = generateToken(user.id, user.user_type);

    res.status(201).json({
      message: 'ユーザー登録が完了しました',
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isVerified: false,
        createdAt: user.created_at
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// ログイン
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 入力値検証
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'メールアドレスとパスワードは必須です' 
      });
    }

    // ユーザー検索
    const userResult = await pool.query(
      'SELECT id, email, password_hash, user_type, is_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'メールアドレスまたはパスワードが正しくありません' 
      });
    }

    const user = userResult.rows[0];

    // パスワード照合
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'メールアドレスまたはパスワードが正しくありません' 
      });
    }

    // 最終ログイン時刻更新
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // JWT トークン生成
    const token = generateToken(user.id, user.user_type);

    res.json({
      message: 'ログインしました',
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

// 現在のユーザー情報取得
const getMe = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await pool.query(
      'SELECT id, email, user_type, is_verified, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const user = userResult.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        userType: user.user_type,
        isVerified: user.is_verified,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'サーバーエラーが発生しました' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
