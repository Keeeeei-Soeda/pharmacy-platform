const express = require('express');
const router = express.Router();
const jobController = require('../controllers/jobController');
const { requireAuth, requirePharmacy } = require('../middleware/auth');

// 公開エンドポイント（認証必要だが、薬剤師も閲覧可能）
// GET /api/jobs - 求人一覧取得（薬剤師用・検索機能付き）
router.get('/', requireAuth, jobController.getJobs);

// GET /api/jobs/:id - 求人詳細取得
router.get('/:id', requireAuth, jobController.getJobById);

// 薬局専用エンドポイント
// GET /api/jobs/my-jobs - 自分の薬局の求人一覧
router.get('/my/list', requirePharmacy, jobController.getMyJobs);

// POST /api/jobs - 求人作成
router.post('/', requirePharmacy, jobController.createJob);

// PUT /api/jobs/:id - 求人更新
router.put('/:id', requirePharmacy, jobController.updateJob);

// PATCH /api/jobs/:id/status - 求人ステータス変更
router.patch('/:id/status', requirePharmacy, jobController.updateJobStatus);

// DELETE /api/jobs/:id - 求人削除
router.delete('/:id', requirePharmacy, jobController.deleteJob);

module.exports = router;



