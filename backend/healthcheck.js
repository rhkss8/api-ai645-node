#!/usr/bin/env node

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 4000,
  path: '/health',
  timeout: 3000,
  method: 'GET'
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0); // 성공
  } else {
    process.exit(1); // 실패
  }
});

request.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1); // 실패
});

request.on('timeout', () => {
  console.error('Health check timed out');
  request.destroy();
  process.exit(1); // 실패
});

request.end(); 