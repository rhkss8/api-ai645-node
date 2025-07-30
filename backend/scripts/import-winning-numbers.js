#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// CSV 라인을 올바르게 파싱하는 함수
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // 마지막 필드 추가
  result.push(current.trim());
  
  return result;
}

async function importWinningNumbers() {
  console.log('🎯 당첨번호 CSV 파일 import 시작...');

  try {
    // CSV 파일 경로
    const csvPath = path.join(__dirname, '../data/winning_numbers.csv');
    
    // CSV 파일 존재 확인
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV 파일을 찾을 수 없습니다:', csvPath);
      process.exit(1);
    }

    // CSV 파일 읽기
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.trim().split('\n');
    
    // 헤더 제거
    const dataLines = lines.slice(1);
    
    console.log(`📊 총 ${dataLines.length}개의 당첨번호 데이터를 처리합니다...`);

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // 기존 데이터 확인을 위한 회차 목록 조회
    const existingRounds = await prisma.winningNumbers.findMany({
      select: { round: true }
    });
    const existingRoundSet = new Set(existingRounds.map(r => r.round));

    console.log(`📋 기존 데이터: ${existingRounds.length}개`);

    // 각 라인 처리
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const columns = parseCSVLine(line);
      
      if (columns.length < 5) {
        console.warn(`⚠️  라인 ${i + 2}: 데이터 형식 오류, 건너뜀`);
        errors++;
        continue;
      }

      try {
        const round = parseInt(columns[0]);
        const numbers = columns[1].replace(/"/g, ''); // 따옴표 제거
        const bonusNumber = parseInt(columns[2]);
        const firstWinningAmount = parseInt(columns[3]);
        const drawDate = new Date(columns[4]);

        // 회차가 이미 존재하는지 확인
        if (existingRoundSet.has(round)) {
          console.log(`⏭️  회차 ${round}: 이미 존재함, 건너뜀`);
          skipped++;
          continue;
        }

        // 데이터 검증
        if (isNaN(round) || isNaN(bonusNumber) || isNaN(firstWinningAmount)) {
          console.warn(`⚠️  회차 ${round}: 숫자 데이터 오류, 건너뜀`);
          errors++;
          continue;
        }

        if (drawDate.toString() === 'Invalid Date') {
          console.warn(`⚠️  회차 ${round}: 날짜 형식 오류, 건너뜀`);
          errors++;
          continue;
        }

        // 번호 배열 검증
        const numbersArray = JSON.parse(numbers);
        if (!Array.isArray(numbersArray) || numbersArray.length !== 6) {
          console.warn(`⚠️  회차 ${round}: 번호 배열 형식 오류, 건너뜀`);
          errors++;
          continue;
        }

        // 데이터베이스에 삽입
        await prisma.winningNumbers.create({
          data: {
            round,
            numbers,
            bonusNumber,
            drawDate,
            firstWinningAmount: BigInt(firstWinningAmount),
          }
        });

        imported++;
        
        // 진행상황 표시 (100개마다)
        if (imported % 100 === 0) {
          console.log(`📈 진행상황: ${imported}개 import 완료`);
        }

      } catch (error) {
        console.error(`❌ 회차 ${columns[0]}: 처리 오류 -`, error.message);
        errors++;
      }
    }

    console.log('\n🎉 Import 완료!');
    console.log(`✅ 성공: ${imported}개`);
    console.log(`⏭️  건너뜀: ${skipped}개 (이미 존재)`);
    console.log(`❌ 오류: ${errors}개`);
    console.log(`📊 총 처리: ${imported + skipped + errors}개`);

  } catch (error) {
    console.error('❌ Import 중 오류 발생:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  importWinningNumbers()
    .then(() => {
      console.log('✅ Import 스크립트 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import 스크립트 실패:', error);
      process.exit(1);
    });
}

module.exports = { importWinningNumbers }; 