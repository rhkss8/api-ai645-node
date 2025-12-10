require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

// 미들웨어 설정
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 로깅 미들웨어
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// PostgreSQL 연결 설정
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// 데이터베이스 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
});

// Health check 엔드포인트
app.get('/health', async (req, res) => {
  try {
    // 데이터베이스 연결 확인
    const result = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: result.rows[0].now,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check 실패:', error);
    res.status(500).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '🚀 API 44tune Node.js Backend Server',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// API 라우트 예시
app.get('/api', (req, res) => {
  res.json({
    message: 'API 엔드포인트가 정상적으로 작동중입니다.',
    timestamp: new Date().toISOString()
  });
});

// 간단한 데이터베이스 테스트 엔드포인트
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        version() as postgres_version,
        current_database() as database_name,
        current_timestamp as server_time
    `);
    
    res.json({
      message: '데이터베이스 연결 테스트 성공',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('데이터베이스 테스트 실패:', error);
    res.status(500).json({
      message: '데이터베이스 연결 테스트 실패',
      error: error.message
    });
  }
});

// 404 에러 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    message: '요청한 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl,
    method: req.method
  });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'production' ? '오류 정보 숨김' : error.message
  });
});

// 서버 시작
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 서버가 시작되었습니다!
📡 포트: ${PORT}
🌍 환경: ${process.env.NODE_ENV || 'development'}
📍 URL: http://localhost:${PORT}
🏥 Health Check: http://localhost:${PORT}/health
  `);
});

// Graceful shutdown 처리
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    pool.end(() => {
      console.log('데이터베이스 연결이 종료되었습니다.');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    pool.end(() => {
      console.log('데이터베이스 연결이 종료되었습니다.');
      process.exit(0);
    });
  });
});

module.exports = app; 