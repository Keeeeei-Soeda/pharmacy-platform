const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const { responseCaseMiddleware } = require('./middleware/responseCase');
const pool = require('./database/connection');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3005',
    'http://localhost:3006',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// レスポンスは常に camelCase に統一
app.use(responseCaseMiddleware);

// ルート
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pharmacy Platform API',
    version: '1.0.0',
    status: 'OK'
  });
});

// ヘルスチェックエンドポイント（PM2監視用）
app.get('/health', async (req, res) => {
  try {
    // データベース接続チェック
    await pool.query('SELECT 1');
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message,
      database: 'disconnected'
    });
  }
});

// APIヘルスチェック（より詳細）
app.get('/api/health', async (req, res) => {
  try {
    // データベース接続チェック
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
      database: {
        status: 'connected',
        latency: `${dbLatency}ms`
      },
      nodeVersion: process.version,
      platform: process.platform
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: error.message,
      database: {
        status: 'disconnected'
      }
    });
  }
});

// APIルート
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pharmacists', require('./routes/pharmacists'));
app.use('/api/pharmacies', require('./routes/pharmacies'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/structured-messages', require('./routes/structuredMessages'));
app.use('/api/platform-fees', require('./routes/platformFees'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));

// エラーハンドリング
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404ハンドリング
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;
