-- 기존 당첨번호 데이터에 기본값 설정
UPDATE "winning_numbers" 
SET 
  "bonusNumber" = 1,
  "firstWinningAmount" = 1000000000
WHERE "bonusNumber" IS NULL OR "firstWinningAmount" IS NULL; 