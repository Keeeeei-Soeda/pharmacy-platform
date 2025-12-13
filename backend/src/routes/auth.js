const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// POST /api/auth/register - ユーザー登録
router.post('/register', validateRegistration, authController.register);

// POST /api/auth/login - ログイン
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me - 現在のユーザー情報取得（認証必要）
router.get('/me', requireAuth, authController.getMe);

// POST /api/auth/logout - ログアウト
router.post('/logout', (req, res) => {
  res.json({
    message: 'ログアウトしました。クライアント側でトークンを削除してください。'
  });
});

module.exports = router;