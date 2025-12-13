const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { requireAuth, requirePharmacist, requirePharmacy } = require('../middleware/auth');

// 薬剤師専用エンドポイント
// POST /api/applications - 求人に応募
router.post('/', requirePharmacist, applicationController.applyToJob);

// GET /api/applications/my - 自分の応募一覧
router.get('/my', requirePharmacist, applicationController.getMyApplications);

// PATCH /api/applications/:id/withdraw - 応募取り下げ
router.patch('/:id/withdraw', requirePharmacist, applicationController.withdrawApplication);

// 薬局専用エンドポイント
// GET /api/applications - 薬局への応募一覧
router.get('/', requirePharmacy, applicationController.getApplicationsForPharmacy);

// PATCH /api/applications/:id/accept - 応募承認
router.patch('/:id/accept', requirePharmacy, applicationController.acceptApplication);

// PATCH /api/applications/:id/reject - 応募拒否
router.patch('/:id/reject', requirePharmacy, applicationController.rejectApplication);

// 共通エンドポイント（薬剤師・薬局両方）
// GET /api/applications/:id - 応募詳細取得
router.get('/:id', requireAuth, applicationController.getApplicationById);

module.exports = router;



