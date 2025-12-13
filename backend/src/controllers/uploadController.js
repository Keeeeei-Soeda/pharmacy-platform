const prisma = require('../database/prisma');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer設定：ファイルの保存先と命名規則
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/licenses');
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // ファイル名: user-{userId}-{type}-{timestamp}.{拡張子}
    const userId = req.user.userId;
    const type = req.body.type || 'license'; // license or registration
    const ext = path.extname(file.originalname);
    const filename = `user-${userId}-${type}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

// ファイルフィルター：PDFのみ許可
const fileFilter = (req, file, cb) => {
  // 許可する拡張子（PDFのみ）
  const allowedExtensions = /\.pdf$/i;
  // 許可するMIMEタイプ（PDFのみ）
  const allowedMimeTypes = ['application/pdf'];

  const extname = allowedExtensions.test(path.extname(file.originalname));
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  console.log('File filter check:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    extname,
    mimetypeCheck: mimetype
  });

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    const errorMsg = 'PDF形式のみアップロード可能です。JPGやPNGの場合は、PDFに変換してからアップロードしてください。';
    console.error('File filter rejected:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      message: errorMsg
    });
    cb(new Error(errorMsg));
  }
};

// Multerインスタンス
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB制限
  fileFilter: fileFilter
}).single('file'); // 'file'はフォームのフィールド名

// 証明書アップロード
const uploadLicense = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'ファイルがアップロードされていません' });
    }

    try {
      const userId = req.user.userId;
      const type = req.body.type; // 'license' or 'registration'

      if (!type || !['license', 'registration'].includes(type)) {
        return res.status(400).json({ error: 'typeは"license"または"registration"を指定してください' });
      }

      // 薬剤師プロフィールを取得
      const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
        where: { user_id: userId }
      });

      if (!pharmacistProfile) {
        return res.status(404).json({ error: '薬剤師プロフィールが見つかりません' });
      }

      // 古いファイルがあれば削除
      const fieldName = type === 'license' ? 'license_file_path' : 'registration_file_path';
      const uploadedAtFieldName = type === 'license' ? 'license_uploaded_at' : 'registration_uploaded_at';
      const oldFilePath = pharmacistProfile[fieldName];
      if (oldFilePath) {
        const oldFileFullPath = path.join(__dirname, '../../', oldFilePath);
        if (fs.existsSync(oldFileFullPath)) {
          fs.unlinkSync(oldFileFullPath);
        }
      }

      // ファイルパスを相対パスで保存
      const relativePath = `uploads/licenses/${req.file.filename}`;

      // データベースを更新（Prismaはスネークケースでアクセス）
      const updateData = {
        [fieldName]: relativePath,
        [uploadedAtFieldName]: new Date()
      };

      const updatedProfile = await prisma.pharmacist_profiles.update({
        where: { id: pharmacistProfile.id },
        data: updateData
      });

      res.json({
        message: '証明書をアップロードしました',
        file: {
          filename: req.file.filename,
          path: relativePath,
          size: req.file.size,
          uploadedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Database update error:', error);
      // エラーが発生したらアップロードしたファイルを削除
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: '証明書のアップロードに失敗しました' });
    }
  });
};

// 証明書ファイルを取得（認証必須）
const getLicenseFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.user.userId;
    const userType = req.user.userType;

    // ファイルパスを構築
    const filePath = path.join(__dirname, '../../uploads/licenses', filename);

    // ファイルが存在するか確認
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'ファイルが見つかりません' });
    }

    // ファイル名からuser IDを抽出
    const fileUserId = filename.split('-')[1];

    // 権限チェック：自分のファイルまたは薬局・運営者（将来的にadminタイプを追加）
    // 現時点では薬局も確認できるようにする
    const isOwner = fileUserId === userId;
    const isPharmacyOrAdmin = userType === 'pharmacy' || userType === 'admin';
    
    if (!isOwner && !isPharmacyOrAdmin) {
      return res.status(403).json({ error: 'このファイルにアクセスする権限がありません' });
    }

    // ファイルを送信
    res.sendFile(filePath);

  } catch (error) {
    console.error('Get license file error:', error);
    res.status(500).json({ error: 'ファイルの取得に失敗しました' });
  }
};

// 薬剤師の証明書情報を取得
const getLicenseInfo = async (req, res) => {
  try {
    const userId = req.user.userId;

    const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId },
      select: {
        license_file_path: true,
        registration_file_path: true,
        license_uploaded_at: true,
        registration_uploaded_at: true,
        verification_status: true,
        verified_at: true
      }
    });

    if (!pharmacistProfile) {
      return res.status(404).json({ error: '薬剤師プロフィールが見つかりません' });
    }

    res.json({
      license: {
        uploaded: !!pharmacistProfile.license_file_path,
        path: pharmacistProfile.license_file_path,
        uploadedAt: pharmacistProfile.license_uploaded_at
      },
      registration: {
        uploaded: !!pharmacistProfile.registration_file_path,
        path: pharmacistProfile.registration_file_path,
        uploadedAt: pharmacistProfile.registration_uploaded_at
      },
      verificationStatus: pharmacistProfile.verification_status,
      verifiedAt: pharmacistProfile.verified_at
    });

  } catch (error) {
    console.error('Get license info error:', error);
    res.status(500).json({ error: '証明書情報の取得に失敗しました' });
  }
};

// 証明書を削除
const deleteLicense = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type } = req.params; // 'license' or 'registration'

    if (!['license', 'registration'].includes(type)) {
      return res.status(400).json({ error: 'typeは"license"または"registration"を指定してください' });
    }

    const pharmacistProfile = await prisma.pharmacist_profiles.findFirst({
      where: { user_id: userId }
    });

    if (!pharmacistProfile) {
      return res.status(404).json({ error: '薬剤師プロフィールが見つかりません' });
    }

    const fieldName = type === 'license' ? 'license_file_path' : 'registration_file_path';
    const uploadedAtFieldName = type === 'license' ? 'license_uploaded_at' : 'registration_uploaded_at';
    const filePath = pharmacistProfile[fieldName];

    if (!filePath) {
      return res.status(404).json({ error: '削除する証明書がありません' });
    }

    // ファイルを削除
    const fullPath = path.join(__dirname, '../../', filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    // データベースを更新
    const updateData = {
      [fieldName]: null,
      [uploadedAtFieldName]: null
    };

    await prisma.pharmacist_profiles.update({
      where: { id: pharmacistProfile.id },
      data: updateData
    });

    res.json({ message: '証明書を削除しました' });

  } catch (error) {
    console.error('Delete license error:', error);
    res.status(500).json({ error: '証明書の削除に失敗しました' });
  }
};

module.exports = {
  uploadLicense,
  getLicenseFile,
  getLicenseInfo,
  deleteLicense
};

