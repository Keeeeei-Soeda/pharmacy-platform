const express = require('express');
const crypto = require('crypto');
const lineBotController = require('../controllers/lineBotController');

const router = express.Router();

// LINE署名検証ミドルウェア（修正版）
const validateSignature = (req, res, next) => {
  try {
    const signature = req.get('X-Line-Signature');
    
    // 開発環境でのデバッグ情報
    if (process.env.NODE_ENV === 'development') {
      console.log('=== LINE Webhook Debug ===');
      console.log('Signature:', signature);
      console.log('Channel Secret:', process.env.LINE_BOT_CHANNEL_SECRET?.substring(0, 10) + '...');
      console.log('Body:', JSON.stringify(req.body));
    }
    
    if (!signature) {
      console.error('❌ No signature in request');
      return res.status(401).json({ error: 'No signature' });
    }

    // リクエストボディを文字列化（重要：rawBodyを使用する必要がある）
    const body = JSON.stringify(req.body);
    
    const expectedSignature = crypto
      .createHmac('SHA256', process.env.LINE_BOT_CHANNEL_SECRET)
      .update(body)
      .digest('base64');

    const actualSignature = signature.replace('SHA256=', '');

    if (process.env.NODE_ENV === 'development') {
      console.log('Expected Signature:', expectedSignature.substring(0, 20) + '...');
      console.log('Actual Signature:', actualSignature.substring(0, 20) + '...');
      console.log('Match:', expectedSignature === actualSignature);
    }

    if (actualSignature !== expectedSignature) {
      console.error('❌ Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('✅ Signature validation passed');
    next();
  } catch (error) {
    console.error('Signature validation error:', error);
    res.status(500).json({ error: 'Signature validation failed' });
  }
};

// 開発環境での署名検証スキップ（一時的）
const validateSignatureDev = (req, res, next) => {
  if (process.env.NODE_ENV === 'development' && process.env.SKIP_SIGNATURE_CHECK === 'true') {
    console.log('⚠️  Skipping signature validation (development mode)');
    return next();
  }
  return validateSignature(req, res, next);
};

// POST /api/line/webhook - LINE Bot Webhook
router.post('/webhook', validateSignatureDev, lineBotController.handleWebhook);

// GET /api/line/test - テスト用エンドポイント
router.get('/test', (req, res) => {
  res.json({
    message: 'LINE Bot API is running',
    timestamp: new Date().toISOString(),
    env: {
      channelSecretSet: !!process.env.LINE_BOT_CHANNEL_SECRET,
      accessTokenSet: !!process.env.LINE_BOT_ACCESS_TOKEN
    }
  });
});

module.exports = router;