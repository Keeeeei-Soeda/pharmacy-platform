const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  proposeDates,
  selectDate,
  sendFormalOffer,
  respondToOffer,
  getStructuredMessages
} = require('../controllers/structuredMessageController');

// すべてのルートで認証が必要
router.use(authenticateToken);

// 初回出勤日の候補を提案（薬局側）
router.post('/propose-dates', proposeDates);

// 初回出勤日を選択（薬剤師側）
router.post('/select-date', selectDate);

// 正式オファーを送信（薬局側）
router.post('/formal-offer', sendFormalOffer);

// オファーに対する回答（薬剤師側）
router.post('/respond-offer', respondToOffer);

// 応募に紐づく構造化メッセージを取得
router.get('/application/:applicationId', getStructuredMessages);

module.exports = router;

