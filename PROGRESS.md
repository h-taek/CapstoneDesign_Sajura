# 사주라 프로젝트 진행 현황

---

## 1. 전체 단계

| 단계 | 내용 | 상태 |
|------|------|------|
| 1. 요구사항 정의 | requirements.md, usecase_spec.md | ✅ 완료 |
| 2. 기능·API·DB·백엔드·AI 설계 | docs/spec/ 전체 | ⬜ 진행 중 |
| 3. 리서치 | 기술 조사·레퍼런스 분석 (docs/research/) | ⬜ 예정 |
| 4. 구현 계획 | 단계별 작업·순서·역할 분담 (docs/plan/) | ⬜ 예정 |
| 5. 구현 | spec/ 기준으로 개발 진행 | ⬜ 예정 |
| 6. 테스트 & 배포 | | ⬜ 예정 |

---

## 2. 작업 흐름

```
docs/research/   → 구현 전 조사 (기술 조사, 레퍼런스 분석 등)
      ↓
docs/plan/       → 구현 계획 (단계별 작업, 순서, 역할 분담)
      ↓
구현             → docs/spec/ 문서를 기준으로 개발 진행
```

- `research/`와 `plan/`의 파일명은 담당자가 자유롭게 정한다 (예: `research_lightgbm.md`, `plan_sprint1.md`)
- 조사 중인 내용은 `research/`, 미래 계획은 `plan/`, 확정된 사실만 `spec/`에 담는다
- 다음 작업의 컨텍스트와 진입점은 `HANDOFF.md` 참고

---

## 3. 정책 결정 이력

새로운 진행 방향, 기술 결정, 구조 변경 등 팀 전체에 영향을 주는 결정을 기록한다.

| 날짜 | 결정 내용 |
|------|----------|
| 2026-05-07 | 문서 구조 재편: docs/spec/, docs/research/, docs/plan/ 분리 |
| 2026-05-07 | research → plan 흐름으로 구현 작업 진행하기로 확정 |

---

## 4. 문서 수정 이력

spec/ 문서 작성·수정 내용을 날짜 역순으로 기록한다.

### 2026-05-07 (5차)

01~09 전체 일관성 검증 수행 (06_ai 제외). 37개 세부 항목 검토, 불일치 5건 수정.

- E-1 (`erd.md`): `inventory_items ||--o{ recipe_ingredients` 중복 선언 제거 → `recipe_ingredients }o--|| inventory_items`(FK 방향) 단일 표현으로 정리
- E-2 (`sequence.md` 섹션 2): 존재하지 않는 `POST /api/auth/register` 호출 제거 → 사업자번호+매장 정보를 `PATCH /api/store` 단일 호출로 통합
- E-3 (`sequence.md` 섹션 2): POS 연동 엔드포인트 `POST /api/store/pos/link` → `POST /api/store/pos`로 수정
- E-4 (`sequence.md` 섹션 4): 추천발주 엔드포인트 `GET /api/orders/recommendations` → `GET /api/orders/recommend`, `PATCH /api/orders/recommendations/{id}` → `PATCH /api/orders/recommend`로 수정
- E-5 (`api_spec.md`, `service_design.md`): 데이터 내보내기·삭제(GDPR) 항목에 "MVP 제외 — 2단계 구현 예정" 주석 추가

### 2026-05-07 (4차)

09_mvp 작성 수행 (`mvp_scope.md` 전면 재작성).

- MVP 목표·1차 검증 업종(주점)·포함/제외 기능·고도화 로드맵·데모 시나리오·성공 기준·데이터 확보 방식·역할 분담 정의

### 2026-05-07 (3차)

08_nonfunctional 전체 작성 (`security.md`, `performance.md`).

- `security.md`: Firebase 제거 → Authlib OAuth 2.0 기준 재작성, 토큰 정책·개인정보 수집 항목·암호화 적용 대상·접근 통제 레이어·감사 로그 대상 추가
- `performance.md`: API별 목표 응답 시간·동시 사용자 기준·캐싱·배치 SLA·Playwright 타임아웃 추가

### 2026-05-07 (2차)

07_flow 전체 작성 (`user_flow.md`, `sequence.md`).

- `user_flow.md`: POS 연동 분기·쿠팡 자동화 실패 분기·온보딩 흐름·화면 IA 등 섹션 9~15 추가
- `sequence.md`: 소셜 로그인·수요예측·발주 시퀀스 전면 재작성, 야간 배치·FIFO·소비기한·Refresh Token 갱신 시퀀스 추가

### 2026-05-07 (1차)

01~05 비판적 일관성 검토. C-series 5건·S-series 6건 발견 및 수정.

- C-1: `coupang_url`/`last_price`가 `inventory_item_sites` JOIN 결과임을 `api_spec.md`, `schema.md`, `service_design.md`에 명시
- C-2: `disposal_logs`에 `user_id` 컬럼 추가 (`schema.md`, `erd.md`, `service_design.md`)
- C-3: `order_recommendations`에 `target_date DATE NOT NULL` 컬럼 추가 (`schema.md`)
- C-4: 쿠팡 자동화가 발주 확정과 독립된 별도 호출임을 `service_design.md` 섹션 6에 명시
- C-5: `DataService` 클래스 및 `export_data`, `delete_data` 메서드 추가 (`service_design.md`)
- S-1~S-6: ERD 관계 추가, 온보딩 출력 정리, 엔드포인트 추가, 단가 조회 흐름·파이프라인 실행 흐름 명시

### 2026-05-06

- `api_spec.md`: 메뉴 API 예시에 `use_inventory_deduction` 필드 추가
- `service_design.md`: 서비스 호출 흐름 섹션 추가 (PosService → SaleService → InventoryService 등)
