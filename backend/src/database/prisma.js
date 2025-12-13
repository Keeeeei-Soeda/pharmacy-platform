// 共有Prismaクライアントインスタンス
// すべてのコントローラーでこのファイルからPrismaをインポートすること

const { PrismaClient } = require('@prisma/client');

// シングルトンパターンでPrismaクライアントを管理
if (!global.prisma) {
  global.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
  
  // データベース接続を確認（非同期だがexportはブロックしない）
  global.prisma.$connect()
    .then(() => {
      console.log('✅ Prisma Client initialized successfully');
    })
    .catch((error) => {
      console.error('❌ Prisma Client initialization failed:', error);
      process.exit(1);
    });
}

module.exports = global.prisma;

