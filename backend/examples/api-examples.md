# 로또 번호 추천 API 사용 예제

## 서버 상태 확인

### Health Check
```bash
curl -X GET http://localhost:3350/health | jq
```

**응답 예시:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "database": "connected",
  "environment": "development",
  "version": "1.0.0"
}
```

### 기본 정보
```bash
curl -X GET http://localhost:3350/ | jq
```

## 1. 무료 번호 추천 API

### 기본 추천
```bash
curl -X POST http://localhost:3350/api/recommend/free \
  -H "Content-Type: application/json" \
  -d '{}' | jq
```

### 조건부 추천
```bash
curl -X POST http://localhost:3350/api/recommend/free \
  -H "Content-Type: application/json" \
  -d '{
    "round": 1105,
    "conditions": {
      "excludeNumbers": [1, 2, 3],
      "includeNumbers": [7, 14],
      "recentPurchases": [
        [5, 12, 19, 26, 33, 40],
        [2, 8, 15, 22, 29, 36]
      ],
      "preferences": "홀수 번호를 선호합니다"
    }
  }' | jq
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "rec_abc123",
    "type": "FREE",
    "round": 1105,
    "numbers": [
      [7, 14, 21, 28, 35, 42],
      [1, 8, 15, 22, 29, 36],
      [3, 10, 17, 24, 31, 38],
      [5, 12, 19, 26, 33, 40],
      [9, 16, 23, 30, 37, 44]
    ],
    "gptModel": "gpt-3.5-turbo",
    "createdAt": "2024-01-20T10:30:00.000Z"
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 2. 프리미엄 번호 추천 API

### 기본 프리미엄 추천
```bash
curl -X POST http://localhost:3350/api/recommend/premium \
  -H "Content-Type: application/json" \
  -d '{
    "round": 1105,
    "conditions": {
      "preferences": "고급 분석을 통한 추천을 원합니다"
    }
  }' | jq
```

### 이미지 포함 프리미엄 추천
```bash
curl -X POST http://localhost:3350/api/recommend/premium \
  -H "Content-Type: multipart/form-data" \
  -F "image=@lottery_numbers.jpg" \
  -F "data={\"round\": 1105, \"conditions\": {\"preferences\": \"이미지의 번호를 참고해주세요\"}}" | jq
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "rec_premium_xyz789",
    "type": "PREMIUM",
    "round": 1105,
    "numbers": [
      [6, 13, 20, 27, 34, 41],
      [2, 11, 18, 25, 32, 39],
      [4, 9, 16, 23, 30, 45],
      [1, 12, 17, 24, 31, 38],
      [5, 14, 19, 26, 33, 42]
    ],
    "imageData": {
      "numbers": [6, 13, 20, 27, 34, 41],
      "confidence": 92,
      "extractedText": "6 13 20 27 34 41"
    },
    "gptModel": "gpt-4o",
    "createdAt": "2024-01-20T10:30:00.000Z"
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 3. 이미지 번호 추출 API

```bash
curl -X POST http://localhost:3350/api/image/extract \
  -H "Content-Type: multipart/form-data" \
  -F "image=@lottery_ticket.jpg" | jq
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "numbers": [7, 14, 21, 28, 35, 42],
    "confidence": 95,
    "extractedText": "7 14 21 28 35 42",
    "notes": "로또 용지에서 선택된 번호를 명확하게 인식했습니다."
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 4. 당첨번호 매칭 회고 API

```bash
curl -X POST http://localhost:3350/api/review/generate \
  -H "Content-Type: application/json" \
  -d '{
    "recommendationId": "rec_abc123",
    "winningNumbers": [3, 7, 14, 21, 35, 42, 28]
  }' | jq
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "id": "review_def456",
    "recommendationId": "rec_abc123",
    "winningNumbers": [3, 7, 14, 21, 35, 42, 28],
    "matchedCounts": [4, 2, 3, 1, 2],
    "reviewText": "이번 추천에서는 첫 번째 세트가 4개 맞아 4등에 해당하는 좋은 결과를 보였습니다. 특히 7, 14, 21, 35번이 정확히 예측되었으며, 이는 홀수와 7의 배수 패턴이 적중했음을 의미합니다. 하지만 다른 세트들의 매칭률이 낮은 것은 번호 분산이 부족했기 때문으로 분석됩니다. 다음 추천에서는 구간별 분포를 더욱 균등하게 하고, 연속번호 조합을 줄이는 것이 좋겠습니다.",
    "createdAt": "2024-01-20T10:30:00.000Z"
  },
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## 5. 추천 내역 조회

### 특정 추천 조회
```bash
curl -X GET http://localhost:3350/api/recommendations/rec_abc123 | jq
```

### 최근 추천 목록
```bash
curl -X GET http://localhost:3350/api/recommendations?page=1&limit=10 | jq
```

### 특정 회차 추천 조회
```bash
curl -X GET http://localhost:3350/api/recommendations?round=1105 | jq
```

## 6. 당첨번호 관리

### 당첨번호 추가 (관리자용)
```bash
curl -X POST http://localhost:3350/api/winning-numbers \
  -H "Content-Type: application/json" \
  -d '{
    "round": 1105,
    "numbers": [3, 7, 14, 21, 35, 42, 28],
    "drawDate": "2024-01-20T20:00:00.000Z"
  }' | jq
```

### 최신 당첨번호 조회
```bash
curl -X GET http://localhost:3350/api/winning-numbers/latest | jq
```

## 오류 처리 예시

### 잘못된 요청
```bash
curl -X POST http://localhost:3350/api/recommend/free \
  -H "Content-Type: application/json" \
  -d '{
    "conditions": {
      "excludeNumbers": [1, 2, 3, 46, 47]
    }
  }' | jq
```

**오류 응답:**
```json
{
  "success": false,
  "error": "잘못된 번호가 포함되어 있습니다. 번호는 1-45 사이여야 합니다.",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 서버 오류
```json
{
  "success": false,
  "error": "서버 내부 오류가 발생했습니다.",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

## Postman Collection

위의 모든 API를 Postman에서 테스트할 수 있도록 컬렉션 파일을 제공합니다:

1. Postman 실행
2. Import > Raw Text
3. 위의 curl 명령어들을 Postman 형식으로 변환하여 사용

## Rate Limiting

API는 사용량 제한이 있습니다:
- 무료 API: 분당 10회
- 프리미엄 API: 분당 5회
- 이미지 추출: 분당 3회 