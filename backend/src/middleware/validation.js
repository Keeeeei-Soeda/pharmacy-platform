// 入力値検証ミドルウェア

// メールアドレス形式チェック
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// パスワード強度チェック
const validatePassword = (password) => {
  // 最低8文字、英数字を含む
  if (password.length < 8) {
    return { isValid: false, message: 'パスワードは8文字以上である必要があります' };
  }
  
  if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(password)) {
    return { isValid: false, message: 'パスワードは英字と数字を含む必要があります' };
  }
  
  return { isValid: true };
};

// 登録時のバリデーション
const validateRegistration = (req, res, next) => {
  const { email, password, userType } = req.body;
  
  // メールアドレスチェック
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      error: '有効なメールアドレスを入力してください' 
    });
  }
  
  // パスワードチェック
  if (!password) {
    return res.status(400).json({ 
      error: 'パスワードは必須です' 
    });
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    return res.status(400).json({ 
      error: passwordValidation.message 
    });
  }
  
  // ユーザータイプチェック
  if (!userType || !['pharmacist', 'pharmacy'].includes(userType)) {
    return res.status(400).json({ 
      error: 'ユーザータイプは pharmacist または pharmacy を選択してください' 
    });
  }
  
  next();
};

// ログイン時のバリデーション
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      error: '有効なメールアドレスを入力してください' 
    });
  }
  
  if (!password) {
    return res.status(400).json({ 
      error: 'パスワードを入力してください' 
    });
  }
  
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateEmail,
  validatePassword
};
