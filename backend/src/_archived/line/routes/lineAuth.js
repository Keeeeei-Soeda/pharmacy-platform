const express = require('express');
const router = express.Router();
const lineAuthController = require('../controllers/lineAuthController');

// GET /api/auth/line - LINE Login URL取得
router.get('/line', lineAuthController.getLoginUrl);

// GET /api/auth/line/callback - LINE認証コールバック
router.get('/line/callback', lineAuthController.handleCallback);

module.exports = router;