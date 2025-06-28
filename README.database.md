# 데이터베이스 테이블 구조

이 문서는 Prisma schema.prisma를 기준으로 생성되는 주요 테이블과 각 테이블의 필드 정보를 정리한 문서입니다.

---

## 1. User (회원)
| 필드명      | 타입         | 설명                                 |
|-------------|--------------|--------------------------------------|
| id          | String (PK)  | 고유 식별자                          |
| email       | String?      | 이메일(이메일/소셜 공통, unique)     |
| nickname    | String?      | 닉네임(선택)                         |
| password    | String?      | 이메일 가입 시 비밀번호(해시)         |
| provider    | AuthProvider | 가입 방식(EMAIL/KAKAO/GOOGLE/NAVER)  |
| providerId  | String?      | 소셜 가입 시 소셜 고유 ID            |
| createdAt   | DateTime     | 생성일                               |
| updatedAt   | DateTime     | 수정일                               |

---

## 2. RecommendationHistory (추천 내역)
| 필드명      | 타입         | 설명                                 |
|-------------|--------------|--------------------------------------|
| id          | String (PK)  | 고유 식별자                          |
| round       | Int?         | 회차 정보                            |
| numbers     | Json         | 추천된 번호들(5세트)                 |
| type        | RecommendationType | 추천 타입(FREE/PREMIUM)         |
| conditions  | Json?        | 사용자 입력 조건                     |
| imageData   | Json?        | 이미지에서 추출한 번호 정보          |
| gptModel    | String       | 사용된 GPT 모델                      |
| createdAt   | DateTime     | 생성일                               |
| updatedAt   | DateTime     | 수정일                               |

---

## 3. RecommendationReview (추천 회고)
| 필드명           | 타입         | 설명                                 |
|------------------|--------------|--------------------------------------|
| id               | String (PK)  | 고유 식별자                          |
| recommendationId | String       | 추천 내역 ID (FK)                    |
| winningNumbers   | Json         | 실제 당첨번호                        |
| matchedCounts    | Json         | 각 세트별 맞은 개수                  |
| reviewText       | String       | GPT가 생성한 회고문                  |
| analysisPrompt   | String       | 분석에 사용된 프롬프트               |
| createdAt        | DateTime     | 생성일                               |
| updatedAt        | DateTime     | 수정일                               |

---

## 4. WinningNumbers (당첨번호)
| 필드명            | 타입     | 설명               |
|-------------------|----------|--------------------|
| id                | String   | 고유 식별자        |
| round             | Int      | 당첨회차           |
| numbers           | Json     | 당첨번호(보너스 포함) |
| bonusNumber       | Int      | 보너스추첨번호     |
| firstWinningAmount| BigInt   | 1등 당첨금         |
| drawDate          | DateTime | 추첨일             |
| createdAt         | DateTime | 생성일             |
| updatedAt         | DateTime | 수정일             |

---

## 5. ApiUsage (API 사용 이력)
| 필드명      | 타입         | 설명                                 |
|-------------|--------------|--------------------------------------|
| id          | String (PK)  | 고유 식별자                          |
| endpoint    | String       | API 엔드포인트                       |
| gptModel    | String?      | 사용된 GPT 모델                      |
| tokenUsed   | Int?         | 사용된 토큰 수                       |
| cost        | Float?       | 비용(USD)                            |
| responseTime| Int?         | 응답 시간(ms)                        |
| success     | Boolean      | 성공 여부                            |
| errorMessage| String?      | 에러 메시지                          |
| userIp      | String?      | 사용자 IP                            |
| createdAt   | DateTime     | 생성일                               |

---

## 6. IPLimitRecord (IP별 요청 제한)
| 필드명           | 타입         | 설명                                 |
|------------------|--------------|--------------------------------------|
| id               | String (PK)  | 고유 식별자                          |
| ipAddress        | String       | IP 주소(Unique)                      |
| lastRequestDate  | String       | YYYY-MM-DD 형식                      |
| requestCount     | Int          | 해당 날짜의 요청 횟수                |
| createdAt        | DateTime     | 생성일                               |
| updatedAt        | DateTime     | 수정일                               |

---

## 7. Enum 정의

### AuthProvider
- EMAIL
- KAKAO
- GOOGLE
- NAVER

### RecommendationType
- FREE
- PREMIUM 