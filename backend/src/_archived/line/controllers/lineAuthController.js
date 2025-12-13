const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../database/connection');

// LINE Login URL生成
const getLoginUrl = (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINE_LOGIN_CHANNEL_ID,
    redirect_uri: process.env.LINE_LOGIN_CALLBACK_URL,
    state: state,
    scope: 'profile openid',
    nonce: nonce
  });

  const loginUrl = `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  
  res.json({ loginUrl });
};

// LINE Callback処理
const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Access Token取得
    const tokenResponse = await axios.post('https://api.line.me/oauth2/v2.1/token', {
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: process.env.LINE_LOGIN_CALLBACK_URL,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token } = tokenResponse.data;

    // ユーザー情報取得
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const lineProfile = profileResponse.data;
    const { userId: lineUserId, displayName } = lineProfile;

    // 既存ユーザーチェック
    let userResult = await pool.query(
      'SELECT * FROM users WHERE line_user_id = $1',
      [lineUserId]
    );

    let user;
    let isNewUser = false;

    if (userResult.rows.length === 0) {
      // 新規ユーザー作成
      const newUserResult = await pool.query(
        `INSERT INTO users (id, email, password_hash, user_type, line_user_id, auth_provider, is_verified) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [uuidv4(), `${lineUserId}@line.temp`, '', 'pharmacist', lineUserId, 'line', true]
      );
      user = newUserResult.rows[0];
      isNewUser = true;
    } else {
      user = userResult.rows[0];
    }

    // JWT トークン生成
    const token = jwt.sign(
      { userId: user.id, userType: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: isNewUser ? 'LINE アカウントで新規登録しました' : 'LINE でログインしました',
      user: {
        id: user.id,
        userType: user.user_type,
        authProvider: 'line',
        isVerified: true,
        isNewUser
      },
      token,
      lineProfile: {
        displayName,
        lineUserId
      }
    });

  } catch (error) {
    console.error('LINE callback error:', error);
    res.status(500).json({ error: 'LINE 認証でエラーが発生しました' });
  }
};

module.exports = {
  getLoginUrl,
  handleCallback
};