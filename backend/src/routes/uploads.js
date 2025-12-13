const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateToken, requireUserType } = require('../middleware/auth');

// 証明書アップロード（薬剤師のみ）
router.post(
  '/license',
  authenticateToken,
  requireUserType(['pharmacist']),
  uploadController.uploadLicense
);

// 証明書情報取得（薬剤師のみ）
router.get(
  '/license/info',
  authenticateToken,
  requireUserType(['pharmacist']),
  uploadController.getLicenseInfo
);

// 証明書ファイル取得（認証必須）
router.get(
  '/license/:filename',
  authenticateToken,
  uploadController.getLicenseFile
);

// 証明書削除（薬剤師のみ）
router.delete(
  '/license/:type',
  authenticateToken,
  requireUserType(['pharmacist']),
  uploadController.deleteLicense
);

module.exports = router;



