const jwt = require('jsonwebtoken');
const pool = require('../database/connection');

// JWT トークン認証ミドルウェア
const authenticateToken = async (req, res, next) => {
  try {
    // Authorization ヘッダーからトークンを取得
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'アクセストークンが必要です' 
      });
    }

    // JWT トークンを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ユーザーがまだ存在するかチェック
    const userResult = await pool.query(
      'SELECT id, email, user_type, is_verified FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        error: 'ユーザーが見つかりません' 
      });
    }

    // リクエストオブジェクトにユーザー情報を追加
    req.user = {
      userId: decoded.userId,
      userType: decoded.userType,
      email: userResult.rows[0].email,
      isVerified: userResult.rows[0].is_verified
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        error: '無効なトークンです' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        error: 'トークンの有効期限が切れています' 
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'サーバーエラーが発生しました' 
    });
  }
};

// ユーザータイプチェックミドルウェア
const requireUserType = (allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: 'このリソースにアクセスする権限がありません' 
      });
    }
    next();
  };
};

// 認証済みユーザーのみアクセス可能
const requireAuth = authenticateToken;

// 薬剤師のみアクセス可能
const requirePharmacist = [authenticateToken, requireUserType(['pharmacist'])];

// 薬局のみアクセス可能
const requirePharmacy = [authenticateToken, requireUserType(['pharmacy'])];

module.exports = {
  authenticateToken,
  requireUserType,
  requireAuth,
  requirePharmacist,
  requirePharmacy
};
