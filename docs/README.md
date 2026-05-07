# 사주라 문서 가이드

설계 문서를 처음 접하는 팀원, 또는 문서 작업 전 참고해야 할 모든 규칙을 담은 파일이다.

---

## 1. 폴더 구조

```
docs/
├── spec/       설계 산출물 (요구사항 ~ AI 파이프라인)
├── research/   구현 전 조사 및 분석 문서
├── plan/       구현 계획 문서
└── README.md   이 파일
```

### spec/ 문서 목록

| 파일 | 역할 | 정의하는 사실 |
|------|------|--------------|
| `docs/spec/01_requirements/requirements.md` | 요구사항 원본 | 프로젝트 목표·고객·기능·비기능 요구사항 |
| `docs/spec/01_requirements/usecase_spec.md` | 유즈케이스 원본 | 액터 관계, UC별 목적·흐름·조건 |
| `docs/spec/02_feature_design/feature_list.md` | 기능 목록 원본 | 기능 분류, 베이스라인 모델 순서, 추천발주 단계 정책 |
| `docs/spec/02_feature_design/feature_spec.md` | 비즈니스 규칙 원본 | 신뢰도 기준, FIFO 로직, 인증 정책, 알림 정책 |
| `docs/spec/03_api/api_spec.md` | API 계약 원본 | 요청/응답 구조, 상태코드, AI Server API |
| `docs/spec/04_database/schema.md` | DB 구조 원본 | 컬럼명, 타입, FK, 인덱스 |
| `docs/spec/04_database/erd.md` | schema.md 시각화 | schema와 항상 동기화 필요 |
| `docs/spec/05_backend/service_design.md` | 백엔드 구현 설계 | 기술스택, 서비스 클래스·메서드 시그니처 |
| `docs/spec/06_ai/ml_pipeline.md` | AI 파이프라인 원본 | 파이프라인 단계·입출력·전처리·배치 실행 시각 |
| `docs/spec/06_ai/model_spec.md` | ML 모델 설계 원본 | 베이스라인 순서, 입력피처, 출력, XAI 설계 |
| `docs/spec/07_flow/sequence.md` | 시스템 흐름 시각화 | 소셜로그인·수요예측·발주 시퀀스 다이어그램 |
| `docs/spec/07_flow/user_flow.md` | UX 흐름 원본 | 점주 사용 흐름, 화면 IA |
| `docs/spec/08_nonfunctional/performance.md` | 성능 기준 원본 | API SLA, 배치 SLA, Playwright 타임아웃 기준 |
| `docs/spec/08_nonfunctional/security.md` | 보안 정책 원본 | 토큰 정책, 암호화, 접근통제, 감사로그 항목 |
| `docs/spec/09_mvp/mvp_scope.md` | MVP 범위 원본 | 포함/제외 기능, 성공기준, 로드맵, 개발역할 |
| `docs/spec/prompts/consistency_check.md` | 일관성 검증 체크리스트 | 교차 검증 항목 + 수정 기록 |
| `docs/spec/prompts/06_ai_handoff.md` | 06_ai 작업 인수인계 | 01~05 확정 내용 요약 |

---

## 2. 문서 작성 규칙

### 2-1. 일반 원칙

**사실은 한 곳에만 정의한다**

같은 내용을 두 문서에 따로 쓰는 순간 불일치가 시작된다.
한 문서에서 **정의**하고, 나머지는 **참조**만 한다.
재기술이 꼭 필요하면 `> 기준: [파일명 섹션번호]` 형태로 출처를 명시한다.

**폴더별 역할을 지킨다**

| 폴더 | 담아야 할 내용 | 담지 말아야 할 내용 |
|------|--------------|-------------------|
| `spec/` | 확정된 사실 (요구사항, 설계, 계약) | 조사 중인 내용, 미결 사항 |
| `research/` | 조사·분석·비교 결과 | 확정된 설계 사실 (spec/ 참조로 대체) |
| `plan/` | 구현 순서·일정·역할 분담 | 확정된 설계 사실 (spec/ 참조로 대체) |

**한 문서를 바꾸면 연동 문서를 즉시 함께 수정한다**

"나중에 수정"은 거의 반드시 누락된다. spec/ 문서 간 연동 관계는 아래 파일 맵을 참고한다.

### 2-2. 작업 전/중/후 체크리스트

**BEFORE — 시작 전**
- [ ] 작업 대상 문서가 속한 폴더의 역할(spec/research/plan)을 확인한다
- [ ] 쓰려는 내용이 이미 다른 문서에 정의된 사실인지 확인한다
- [ ] 관련 인수인계 문서나 선행 조사 문서가 있으면 먼저 읽는다

**DURING — 작성 중**
- [ ] 다른 문서에 있는 내용을 그대로 재기술하지 않는다
- [ ] 한 문서를 바꾸면 연동 문서도 즉시 함께 수정한다
- [ ] 미결·조사 중인 내용을 spec/에 확정된 것처럼 쓰지 않는다

**AFTER — 작성 후**
- [ ] spec/ 문서를 수정했다면 `PROGRESS.md` 섹션 4 문서 수정 이력에 날짜·수정 내용을 남긴다
- [ ] 새로운 정책·방향 결정이 생겼다면 `PROGRESS.md` 섹션 3 결정 이력 테이블에 추가한다

### 2-3. spec/ 연동 수정 파일 맵

> spec/ 문서 수정 시 함께 확인해야 할 파일 목록이다.

| 수정 파일 | 함께 확인할 파일 |
|----------|----------------|
| `requirements.md` | `feature_list.md`, `mvp_scope.md` |
| `usecase_spec.md` | `feature_spec.md`, `user_flow.md` |
| `feature_list.md` | `feature_spec.md`, `mvp_scope.md` |
| `feature_spec.md` | `api_spec.md`, `security.md`, `user_flow.md`, `requirements.md` |
| `api_spec.md` | `feature_spec.md`, `service_design.md`, `sequence.md`, `spec/prompts/06_ai_handoff.md` |
| `schema.md` | `erd.md`, `service_design.md`, `ml_pipeline.md`, `spec/prompts/06_ai_handoff.md` |
| `erd.md` | `schema.md` |
| `service_design.md` | `api_spec.md`, `sequence.md` |
| `ml_pipeline.md` | `model_spec.md`, `performance.md`, `spec/prompts/06_ai_handoff.md` |
| `model_spec.md` | `ml_pipeline.md`, `feature_list.md`, `spec/prompts/06_ai_handoff.md` |
| `sequence.md` | `feature_spec.md`, `api_spec.md`, `service_design.md` |
| `user_flow.md` | `feature_spec.md`, `usecase_spec.md` |
| `performance.md` | `mvp_scope.md`, `ml_pipeline.md` |
| `security.md` | `feature_spec.md`, `api_spec.md` |
| `mvp_scope.md` | `requirements.md`, `feature_list.md` |
