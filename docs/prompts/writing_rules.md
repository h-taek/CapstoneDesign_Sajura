# 설계 문서 작성 규칙

> 이 문서는 모든 설계 문서 작업 전 반드시 읽는다.
> CLAUDE.md에서 자동으로 참조된다.

---

## 핵심 원칙: 사실은 한 곳에만 정의한다

같은 내용을 두 문서에 따로 쓰는 순간 불일치가 시작된다.
한 문서에서 **정의**하고, 나머지는 **참조**만 한다.

### 사실 종류별 정의 위치 (SSOT 테이블)

| 사실 종류 | 정의 위치 | 다른 문서에서 처리 방법 |
|----------|-----------|------------------------|
| 프로젝트 목표·고객·기능·비기능 요구사항 | `requirements.md` | 재기술 금지, "requirements.md 기준" 인용 |
| 유즈케이스·액터 관계·UC별 조건 | `usecase_spec.md` | 재기술 금지, "usecase_spec.md 기준" 인용 |
| 기능 분류·베이스라인 모델 순서·추천발주 단계 정책 | `feature_list.md` | 재기술 금지, "feature_list.md 기준" 인용 |
| 비즈니스 규칙 (신뢰도 기준, FIFO 로직, 인증·알림 정책) | `feature_spec.md` | 해당 규칙이 나오면 "feature_spec.md 기준" 인용 |
| API 요청/응답 구조·상태코드·페이지네이션 규약 | `api_spec.md` | "api_spec.md 기준" 메모만. 구조 재기술 금지 |
| AI Server API 계약 | `api_spec.md` (AI Server 섹션) | `ml_pipeline.md`, `model_spec.md`는 재정의 금지 |
| DB 테이블 컬럼·타입·FK·인덱스 | `schema.md` | 컬럼명·타입을 독립적으로 다시 쓰지 않음 |
| 서비스 클래스·메서드 시그니처·기술스택 | `service_design.md` | api_spec·feature_spec 결정을 반영할 뿐, 독립 정의 금지 |
| 파이프라인 단계·입출력·전처리 로직·배치 실행 시각 | `ml_pipeline.md` | 다른 문서는 참조만, 배치 시각 재정의 금지 |
| ML 모델 입력피처·출력 정의·XAI 설계·베이스라인 순서 | `model_spec.md` | feature_spec·api_spec 결정 반영만, 독립 정의 금지 |
| API SLA·배치 SLA·Playwright 타임아웃 기준 | `performance.md` | 다른 문서는 참조만 |
| 토큰 정책·암호화 방식·접근통제·감사로그 항목 | `security.md` | 다른 문서는 참조만. feature_spec 인증 섹션은 security.md 참조 |
| MVP 포함/제외 기능·성공기준·로드맵·개발역할 | `mvp_scope.md` | 다른 문서는 참조만 |

---

## 작업 전 체크리스트 (3단계)

### BEFORE — 쓰기 전

- [ ] 작업 대상 문서의 **핸드오프 문서** 또는 관련 **handoff.md**를 먼저 읽는다
  - 06_ai 작업 시 → `docs/prompts/06_ai_handoff.md`
- [ ] SSOT 테이블을 보고, 지금 쓰려는 내용이 어느 문서에서 정의된 것인지 확인한다
- [ ] 정의 문서가 다른 곳에 있으면 해당 문서를 먼저 읽는다

### DURING — 쓰는 중

- [ ] 새 사실을 기술할 때: 이미 다른 문서에 있는 내용을 **그대로 재기술**하지 않는다
  - 재기술이 필요하면 `> 기준: schema.md 3.16` 형태로 출처를 명시한다
- [ ] 한 문서를 바꾸면: SSOT 테이블에서 같은 사실을 참조하는 다른 문서도 **즉시 함께** 수정한다
  - "나중에 수정" → 거의 반드시 누락된다
- [ ] 제안할 때는 **추가/제외 추천 항목을 항상 함께** 제시한다

### AFTER — 쓴 뒤

- [ ] `docs/prompts/consistency_check.md` 검증 기록 섹션에 날짜·수정 내용을 기록한다
- [ ] 새로운 결정이 생겼으면 체크리스트에 새 항목을 추가한다
- [ ] 해당 영역 handoff 문서가 있으면 함께 업데이트한다

---

## 변경 시 연동 수정이 필요한 파일 맵

아래 파일을 수정할 때 함께 확인해야 하는 파일 목록이다.

### requirements.md 수정 시
→ `feature_list.md` (기능 목록과 범위 일치 확인)
→ `mvp_scope.md` (MVP 포함/제외 범위 일치 확인)

### usecase_spec.md 수정 시
→ `feature_spec.md` (UC 흐름과 비즈니스 규칙 일치 확인)
→ `user_flow.md` (UX 흐름과 일치 확인)

### feature_list.md 수정 시
→ `feature_spec.md` (상세 규칙 일치 확인)
→ `mvp_scope.md` (MVP 범위 반영 여부 확인)

### feature_spec.md 수정 시
→ `api_spec.md` (입출력 항목 일치 확인)
→ `security.md` (인증 정책 일치 확인)
→ `user_flow.md` (UX 흐름 반영 확인)
→ `requirements.md` (요구사항과 불일치 없는지 확인)

### api_spec.md 수정 시
→ `feature_spec.md` (입출력 항목 일치 확인)
→ `service_design.md` (메서드 파라미터·반환값 확인)
→ `sequence.md` (시퀀스 다이어그램 흐름 확인)
→ `docs/prompts/06_ai_handoff.md` (AI Server API 섹션 확인)

### schema.md 수정 시
→ `erd.md` (Mermaid 다이어그램 + 관계 구조 텍스트 모두 반영)
→ `service_design.md` (메서드 설명에서 해당 컬럼을 언급하는 곳)
→ `ml_pipeline.md` (파이프라인 입출력 스키마 확인)
→ `docs/prompts/06_ai_handoff.md` (관련 테이블 섹션)

### erd.md 수정 시
→ `schema.md` (FK 제약조건과 일치하는지 확인)

### service_design.md 수정 시
→ `api_spec.md` (메서드 ↔ endpoint 매핑 확인)
→ `sequence.md` (시퀀스 다이어그램 흐름 확인)

### ml_pipeline.md 수정 시
→ `model_spec.md` (모델 입출력·학습 방식 일치 확인)
→ `performance.md` (배치 SLA 일치 확인)
→ `docs/prompts/06_ai_handoff.md` (파이프라인 섹션 확인)

### model_spec.md 수정 시
→ `ml_pipeline.md` (파이프라인 단계와 일치 확인)
→ `feature_list.md` (베이스라인 순서·추천발주 정책 일치 확인)
→ `docs/prompts/06_ai_handoff.md` (모델 섹션 확인)

### sequence.md 수정 시
→ `feature_spec.md` (비즈니스 규칙 반영 확인)
→ `api_spec.md` (엔드포인트 호출 경로 일치 확인)
→ `service_design.md` (서비스 메서드 흐름 일치 확인)

### user_flow.md 수정 시
→ `feature_spec.md` (비즈니스 규칙과 일치 확인)
→ `usecase_spec.md` (UC 흐름과 일치 확인)

### performance.md 수정 시
→ `mvp_scope.md` (성공기준 성능 수치 일치 확인)
→ `ml_pipeline.md` (배치 실행 시각·SLA 일치 확인)

### security.md 수정 시
→ `feature_spec.md` (인증·토큰 정책 일치 확인)
→ `api_spec.md` (인증 헤더·응답 구조 일치 확인)

### mvp_scope.md 수정 시
→ `requirements.md` (요구사항 범위와 일치 확인)
→ `feature_list.md` (기능 목록 범위와 일치 확인)

---

## 자주 발생하는 불일치 패턴 (참고)

| 패턴 | 예시 | 예방법 |
|------|------|--------|
| 컬럼 재기술 불일치 | schema에 user_id 추가 → erd, service_design 미반영 | schema 수정 즉시 erd·service_design 함께 수정 |
| API 응답 필드 누락 | feature_spec에는 pos_mode → api_spec 로그인 응답에 없음 | api_spec이 정의 위치 → feature_spec은 api_spec 참조 |
| 알고리즘 조건 불일치 | feature_spec 신뢰도 기준 3가지 → model_spec에 다른 조건 | feature_spec이 정의 위치 → model_spec은 참조만 |
| 새 엔드포인트 단독 추가 | api_spec에 추가 → service_design 메서드 누락 | 엔드포인트 추가 시 서비스 메서드도 같이 작성 |
| ERD-Schema 비동기 | schema에 컬럼 추가 → mermaid 다이어그램 미반영 | schema DDL 수정 → erd.md 즉시 열어서 확인 |
| 배치 시각 이중 정의 | ml_pipeline.md의 02:00 → performance.md에 별도 시각 기술 | ml_pipeline.md가 정의 위치 → performance.md는 SLA만 기술 |
| 보안 정책 이중 정의 | feature_spec에 토큰 만료 기술 → security.md와 불일치 | security.md가 정의 위치 → feature_spec은 "security.md 기준" 인용 |
| MVP 범위 불일치 | feature_list.md에 기능 추가 → mvp_scope.md 포함 목록 미반영 | feature_list 변경 시 mvp_scope.md 포함/제외 함께 확인 |
| 시퀀스-API 불일치 | api_spec에 엔드포인트 변경 → sequence.md 다이어그램 미반영 | api_spec 수정 시 sequence.md 호출 경로 함께 확인 |
