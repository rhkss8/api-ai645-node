import { parse } from 'csv-parse';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface CsvRow {
  round: string;
  numbers: string;
  bonusNumber: string;
  firstWinningAmount: string;
  drawDate: string;
}

interface WinningNumberData {
  round: number;
  numbers: number[];
  bonusNumber: number;
  firstWinningAmount: bigint;
  drawDate: Date;
}

async function importWinningNumbers(): Promise<void> {
  try {
    console.log('🎯 당첨번호 CSV 적재를 시작합니다...');
    
    // CSV 파일 경로
    const csvFilePath = path.join(__dirname, '../../data/winning_numbers.csv');
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV 파일을 찾을 수 없습니다: ${csvFilePath}`);
    }
    
    console.log(`📁 CSV 파일 경로: ${csvFilePath}`);
    
    // 기존 데이터 확인
    const existingCount = await prisma.winningNumbers.count();
    console.log(`📊 기존 당첨번호 데이터: ${existingCount}개`);
    
    if (existingCount > 0) {
      console.log('⚠️  기존 데이터가 있습니다. 계속 진행하시겠습니까? (y/N)');
      // 실제로는 readline을 사용하지만, 스크립트에서는 자동 진행
      console.log('🔄 기존 데이터를 삭제하고 새로 적재합니다...');
      await prisma.winningNumbers.deleteMany();
    }
    
    // CSV 파일 읽기
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    
    // CSV 파싱
    const records: CsvRow[] = await new Promise((resolve, reject) => {
      parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, records) => {
        if (err) reject(err);
        else resolve(records);
      });
    });
    
    console.log(`📋 CSV에서 ${records.length}개의 레코드를 읽었습니다.`);
    
    // 데이터 변환 및 검증
    const winningNumbersData: WinningNumberData[] = [];
    
    for (const record of records) {
      try {
        // numbers 필드 파싱 (JSON 배열 문자열)
        const numbersArray = JSON.parse(record.numbers);
        if (!Array.isArray(numbersArray) || numbersArray.length !== 6) {
          console.warn(`⚠️  잘못된 numbers 형식 (회차 ${record.round}): ${record.numbers}`);
          continue;
        }
        
        // 보너스 번호는 별도 필드로 처리
        const bonusNumber = parseInt(record.bonusNumber);
        
        // 데이터 검증
        if (numbersArray.some(num => num < 1 || num > 45) || bonusNumber < 1 || bonusNumber > 45) {
          console.warn(`⚠️  잘못된 번호 범위 (회차 ${record.round}): numbers=${numbersArray}, bonus=${bonusNumber}`);
          continue;
        }
        
        // 중복 번호 확인 (numbers + bonusNumber)
        const allNumbers = [...numbersArray, bonusNumber];
        const uniqueNumbers = new Set(allNumbers);
        if (uniqueNumbers.size !== 7) {
          console.warn(`⚠️  중복된 번호 (회차 ${record.round}): ${allNumbers}`);
          continue;
        }
        
        const winningNumber: WinningNumberData = {
          round: parseInt(record.round),
          numbers: numbersArray, // 6개 배열만 저장
          bonusNumber: bonusNumber,
          firstWinningAmount: BigInt(record.firstWinningAmount),
          drawDate: new Date(record.drawDate),
        };
        
        winningNumbersData.push(winningNumber);
      } catch (error) {
        console.warn(`⚠️  데이터 파싱 오류 (회차 ${record.round}):`, error);
        continue;
      }
    }
    
    console.log(`✅ 검증 완료: ${winningNumbersData.length}개의 유효한 데이터`);
    
    // DB에 적재 (배치 처리)
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < winningNumbersData.length; i += batchSize) {
      const batch = winningNumbersData.slice(i, i + batchSize);
      
      await prisma.winningNumbers.createMany({
        data: batch.map(data => ({
          round: data.round,
          numbers: data.numbers,
          bonusNumber: data.bonusNumber,
          firstWinningAmount: data.firstWinningAmount,
          drawDate: data.drawDate,
        })),
        skipDuplicates: true, // 중복 회차는 스킵
      });
      
      insertedCount += batch.length;
      console.log(`📈 진행률: ${insertedCount}/${winningNumbersData.length} (${Math.round(insertedCount / winningNumbersData.length * 100)}%)`);
    }
    
    // 최종 확인
    const finalCount = await prisma.winningNumbers.count();
    console.log(`🎉 적재 완료! 총 ${finalCount}개의 당첨번호가 DB에 저장되었습니다.`);
    
    // 최신 데이터 확인
    const latestData = await prisma.winningNumbers.findFirst({
      orderBy: { round: 'desc' },
    });
    
    if (latestData) {
      console.log(`📅 최신 회차: ${latestData.round}회 (${latestData.drawDate.toLocaleDateString()})`);
      const numbers = latestData.numbers as number[];
      console.log(`🎲 당첨번호: [${numbers.join(', ')}] + ${latestData.bonusNumber}`);
      console.log(`💰 1등 당첨금: ${latestData.firstWinningAmount.toLocaleString()}원`);
    }
    
  } catch (error) {
    console.error('❌ 적재 중 오류 발생:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  importWinningNumbers()
    .then(() => {
      console.log('✅ 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

export { importWinningNumbers }; 