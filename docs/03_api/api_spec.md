# API 명세서

## 현재 작성 가능 범위

기술 문서에는 Backend가 FastAPI 기반 API 서버이며, Controller / Service / Model 3계층 구조를 적용한다는 내용이 있다.

### 1. Backend 역할

- API 요청 처리
- HTTP 요청 수신
- 파라미터 파싱 및 검증
- 응답 직렬화(JSON)
- 에러 핸들링
- 서비스 계층 로직 호출
- DB 접근
- ML 예측 호출
- SHAP 생성
- 트랜잭션 관리
- 권한 검사
- 로깅
- Playwright를 통한 쿠팡 장바구니 자동 담기 수행

### 2. API가 필요한 기능 범위

- 인증 토큰 전달 및 회원 조회/생성
- 매장 정보 저장
- POS 연동 정보 저장
- 메뉴 목록 조회
- 메뉴 등록/수정/삭제
- 레시피 저장/수정/삭제
- 재고 목록 조회
- 재고 등록/수정
- 재고 폐기 처리
- 판매 데이터 기간별 조회
- 판매 데이터 상세 조회
- 수요예측 결과 조회
- 저장된 예측 결과가 없을 경우 AI Server 직접 호출
- 추천발주 조회
- 추천발주 수정안 저장
- 발주 확정 및 발주 내역 저장
- Playwright 쿠팡 장바구니 자동 담기 요청
- 데이터 다운로드
- 데이터 삭제 요청

### 3. 인터페이스 표준

- REST API
- JSON
- OAuth 2.0
- OpenAPI(Swagger) 자동 문서화

### 4. POS 공통 스키마 예시

```json
{
  "timestamp": "...",
  "item_id": "...",
  "qty": "...",
  "unit": "kg"
}
```

## 추가 작업 필요 항목

- API endpoint 정의 필요
- HTTP method 정의 필요
- Request/Response 구조 정의 필요
- 인증 헤더 구조 정의 필요
- 공통 오류 응답 형식 정의 필요
- 상태 코드 정의 필요
- 페이지네이션/정렬/필터 규칙 정의 필요
- 파일 업로드 API 명세 정의 필요
- AI Server 연동 API 명세 정의 필요
- Playwright 자동화 API 명세 정의 필요
- OpenAPI 문서 생성 기준 정의 필요

