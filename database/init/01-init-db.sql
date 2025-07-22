-- PostgreSQL 초기화 스크립트
-- 이 스크립트는 PostgreSQL 컨테이너가 처음 시작될 때 실행됩니다.

-- 데이터베이스 설정
CREATE DATABASE IF NOT EXISTS main;
\c main;

-- 확장 기능 활성화 (필요시)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 권한 설정
GRANT ALL PRIVILEGES ON DATABASE main TO postgres;

-- 스키마 설정
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 로그 메시지
DO $$
BEGIN
    RAISE NOTICE 'PostgreSQL 초기화 완료 - 데이터베이스: main';
END $$; 