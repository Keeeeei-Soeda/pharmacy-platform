# 🚀 Cursorで自動コミットする方法

## ✅ 設定完了！

以下の方法で、簡単にコミットできるようになりました。

---

## 📋 方法1: Cursorのタスク機能を使用（推奨）

### 使い方

1. **Cmd+Shift+P** (Mac) または **Ctrl+Shift+P** (Windows) を押す
2. 「**Tasks: Run Task**」と入力して選択
3. 以下のいずれかを選択：
   - **Quick Commit**: コミットメッセージを入力してコミット
   - **Quick Commit (Auto Message)**: 自動メッセージでコミット

### ショートカット設定（オプション）

1. **Cmd+K, Cmd+S** (Mac) または **Ctrl+K, Ctrl+S** (Windows) でキーボードショートカットを開く
2. 「**Tasks: Run Task**」を検索
3. ショートカットを設定（例: **Cmd+Shift+C**）

---

## 📋 方法2: ターミナルでスクリプトを実行

### 基本的な使い方

```bash
# プロジェクトルートで実行
./quick-commit.sh "コミットメッセージ"
```

### 例

```bash
./quick-commit.sh "✨ 日給設定機能の実装完了"
./quick-commit.sh "🐛 バグ修正"
./quick-commit.sh "📝 ドキュメント更新"
```

### デフォルトメッセージでコミット

```bash
./quick-commit.sh
# → "実装内容の更新" というメッセージでコミット
```

---

## 📋 方法3: Gitエイリアスを使用

### 使い方

```bash
# プロジェクトルートで実行
git qc "コミットメッセージ"
```

### 例

```bash
git qc "✨ 新機能の実装"
git qc "🐛 バグ修正"
```

---

## 📋 方法4: Cursorの統合ターミナルを使用

1. **Ctrl+`** (バッククォート) でターミナルを開く
2. 以下のコマンドを実行：

```bash
# 方法A: スクリプトを使用
./quick-commit.sh "コミットメッセージ"

# 方法B: Gitエイリアスを使用
git qc "コミットメッセージ"

# 方法C: 通常のコマンド
git add .
git commit -m "コミットメッセージ"
```

---

## 🎯 推奨ワークフロー

### 実装完了後

1. 動作確認が完了したら
2. **Cmd+Shift+P** → **Tasks: Run Task** → **Quick Commit**
3. コミットメッセージを入力
4. Enter でコミット完了！

### 頻繁にコミットする場合

- **Cmd+Shift+P** → **Tasks: Run Task** → **Quick Commit (Auto Message)**
- または、ターミナルで `./quick-commit.sh`

---

## ⚙️ カスタマイズ

### コミットメッセージのデフォルトを変更

`.vscode/tasks.json` の `"default"` を変更：

```json
{
  "id": "commitMessage",
  "default": "あなたのデフォルトメッセージ"
}
```

### スクリプトをカスタマイズ

`quick-commit.sh` を編集して、追加の処理を追加できます：

```bash
# 例: コミット前にlintを実行
npm run lint
git add .
git commit -m "$COMMIT_MESSAGE"
```

---

## 🛡️ 安全機能

### コミット前の確認

現在の変更を確認：

```bash
# 方法1: Git Status
git status

# 方法2: Cursorのタスク
Cmd+Shift+P → Tasks: Run Task → Git Status
```

### コミット履歴の確認

```bash
git log --oneline -10
```

---

## 💡 便利なTips

### 1. コミットメッセージのテンプレート

よく使うメッセージをエイリアスに追加：

```bash
git config --local alias.feat '!f() { git add . && git commit -m "✨ $1"; }; f'
git config --local alias.fix '!f() { git add . && git commit -m "🐛 $1"; }; f'
git config --local alias.docs '!f() { git add . && git commit -m "📝 $1"; }; f'
```

使い方：
```bash
git feat "新機能の実装"
git fix "バグ修正"
git docs "ドキュメント更新"
```

### 2. コミットとプッシュを同時に

```bash
git config --local alias.qcp '!f() { git add . && git commit -m "$1" && git push; }; f'
```

使い方：
```bash
git qcp "コミットメッセージ"
```

---

## ⚠️ 注意事項

1. **コミット前に動作確認**
   - 自動コミットは便利ですが、動作確認は必須です

2. **コミットメッセージは具体的に**
   - 後で変更履歴を確認しやすくするため

3. **大きな変更は分割**
   - 関連する変更をまとめてコミット

---

## 🎉 これで準備完了！

これで、Cursorから簡単にコミットできるようになりました。

**おすすめの使い方**：
- 実装完了 → **Cmd+Shift+P** → **Quick Commit** → メッセージ入力 → Enter

