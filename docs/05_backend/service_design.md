# Backend 서비스 설계서

## 현재 작성 가능 범위

Backend는 FastAPI 기반 API 서버이며, Controller / Service / Model 3계층 구조를 적용한다.

## 1. Backend 기술 스택

- FastAPI
- Playwright
- MySQL 연동
- Firebase Auth 토큰 처리
- Authlib 기반 카카오 OAuth 처리

## 2. 계층 구조

### 2.1 Controller

- HTTP 요청 수신
- 파라미터 파싱 및 검증
- JSON 응답 직렬화
- 에러 핸들링

### 2.2 Service

- 비즈니스 로직 실행
- 메뉴 중복 검증
- 재고 폐기 수량 검증
- ML 예측 호출
- SHAP 생성
- 트랜잭션 관리
- 권한 검사
- 로깅

### 2.3 Model

- 데이터 정의
- DB 쿼리
- CRUD
- ORM 매핑
- 캐시 조회 및 저장

## 3. 확인 가능한 서비스 책임

### 3.1 Auth 관련 책임

- Firebase Google 인증 토큰 수신
- 카카오 OAuth 처리
- 회원 존재 여부 조회
- 신규 회원 저장

### 3.2 Menu 관련 책임

- 메뉴 목록 조회
- 메뉴명 중복 검증
- 메뉴 등록
- 메뉴 수정
- 메뉴 삭제
- 레시피 저장/수정/삭제

### 3.3 Inventory 관련 책임

- 재고 조회
- 재고 등록
- 재고 수정
- 폐기 요청 수량 검증
- 폐기 가능 시 재고 차감
- 폐기 불가 시 오류 반환

### 3.4 Sales 관련 책임

- POS 판매 데이터 저장
- 기간별 판매 데이터 조회
- 판매 상세 조회

### 3.5 Prediction 관련 책임

- 저장된 수요예측 조회
- 저장된 결과가 없을 경우 AI Server 직접 호출
- 예측 결과 저장
- SHAP 기반 근거 생성 또는 조회

PredictionService는 예측 생성과 조회 책임이 함께 있어 책임 과다 가능성이 있다.

### 3.6 Order 관련 책임

- 추천발주 조회
- 점주 수정안 저장
- 발주 확정
- 발주 내역 저장
- OrderApprovalLog 기록

### 3.7 Playwright 자동화 책임

- 쿠팡 장바구니 자동 담기 수행
- 완료 응답 반환
- 실제 결제는 쿠팡에서 진행되도록 안내

## 4. 개선 방향

- PredictionService 분리
- 캐싱 도입
- 이벤트 기반 아키텍처 고려
- 추천 사이트 연동 실패에 대한 재시도/큐잉 정책 필요
- OrderApprovalService와 PaymentService의 책임 경계 명확화 필요

## 추가 작업 필요 항목

- 서비스 클래스 목록 정의 필요
- 서비스별 메서드 시그니처 정의 필요
- 트랜잭션 경계 정의 필요
- 권한 검사 정책 정의 필요
- 에러 코드 체계 정의 필요
- 캐시 계층 설계 필요
- Playwright 자동화 실패 처리 정책 정의 필요
- AI Server와 Backend 간 인터페이스 정의 필요

