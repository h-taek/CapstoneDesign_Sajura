# 사주라 프로젝트 진행 현황

---

## 1. 전체 단계

| 단계 | 내용 | 상태 |
|------|------|------|
| 1. 요구사항 정의 | requirements.md, usecase_spec.md | ✅ 완료 |
| 2. 기능·API·DB·백엔드·AI 설계 | docs/spec/ 전체 | ⬜ 진행 중 (backend 완료, AI 진행 중) |
| 3. 리서치 | 기술 조사·레퍼런스 분석 (docs/research/) | ⬜ 진행 중 (backend ✅, frontend ✅, ai 예정) |
| 4. 구현 계획 | 단계별 작업·순서·역할 분담 (docs/plan/) | ✅ 완료 (21차 + 23차 audit) |
| 5. 구현 | spec/ 기준으로 개발 진행 | ⬜ 진행 중 (Phase 2 ✅ + Phase 3 ✅) |
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

- `research/`와 `plan/`의 파일명은 담당자가 자유롭게 정한다
- 조사 중인 내용은 `research/`, 미래 계획은 `plan/`, 확정된 사실만 `spec/`에 담는다
- 다음 작업의 컨텍스트와 진입점은 `HANDOFF.md` 참고

---

## 3. 정책 결정 이력 (요약)

세부 audit 결과는 spec/research 본문에 반영되어 있어 본 표에는 **현재 살아 있는 핵심 결정**만 한 줄로 추상화한다. 신규 결정은 표에 행을 추가하고, 폐기·번복 시 해당 행만 갱신한다. 회차별 상세 변경은 §5 문서 수정 이력의 차수 항목과 git log 참조.

| 영역 | 결정 | 근거 위치 |
|---|---|---|
| 문서 구조 | spec(확정 사실) · research(spec 작성 위한 조사) · plan(구현 계획) 3폴더 분리 + research 하위 backend/frontend/ai 도메인 폴더 | `docs/README.md` |
| spec 폴더 순서 | contract-first / outside-in: 요구사항 → MVP → 기능 → 흐름 → API → DB → Backend → AI → 비기능 | `docs/spec/` 폴더 번호 |
| MVP 데이터 | **CSV-only** (POS API는 [2단계]). 모든 spec에 `[MVP]`/`[2단계]` 라벨 부착 | `docs/spec/02_mvp/mvp_scope.md` |
| 웹 프레임워크 | FastAPI + Pydantic v2 + orjson | `service_design.md` §1 |
| 앱 서버 | dev Uvicorn / prod Gunicorn + uvicorn.workers (워커 4, --max-requests 1000, --preload) | `research/backend/02_app_server.md` |
| 리버스 프록시 | Caddy v2 (TLS 1.3 강제, FE dist를 caddy 이미지에 COPY) | `research/backend/03_reverse_proxy.md` |
| 데이터 계층 | SQLAlchemy 2.x async + aiomysql + PyMySQL(Alembic) + pandas + numpy + datetime+zoneinfo | `service_design.md` §1 |
| 인증·암호화 | Authlib + python-jose + passlib[bcrypt] + cryptography(AES-256-GCM) | `security.md` §2·§4 |
| OAuth 콜백 응답 | 302 Redirect to FE root + Set-Cookie refresh_token (Access Token 본문/URL 미노출, FE 첫 진입에서 `POST /api/auth/refresh`로 동기) | `api_spec.md` §2, `sequence.md` §2 |
| 외부 연동 | httpx + tenacity + aiobreaker + BeautifulSoup4(lxml) + Playwright(Chromium 단일) | `service_design.md` §1 |
| 알림 | 점주 3채널(인앱·Web Push·이메일) — pywebpush + fastapi-mail + `notifications` 테이블. Slack은 운영자 모니터링 전용 | `service_design.md` §4, `schema.md` §3.22~23 |
| 인앱 알림 폴링 | 5분 고정 (코드 상수, 사용자 설정 미노출) + 수동 새로고침 권장 — BE rate limit 보호 | `frontend_design.md`, `research/frontend/06_pwa_push.md` |
| 캐시·관측 | Redis + redis-py(async) + structlog + asgi-correlation-id + Sentry(BE+FE 동일 release `git-<sha>`, PII scrubbing, traces 5%) | `service_design.md` §1, `performance.md` §5 |
| 비동기 작업 분리 | n8n = AI 파이프라인(외부 데이터 수집·AI Server 호출). ARQ cron_jobs = BE 도메인 정기 작업(소비기한 점검 등). BackgroundTasks = 짧은 후처리 | `research/backend/08_async_pipeline.md` §1.4 |
| 알림 송출 단일 경로 | BE `NotificationService.create_and_push`만 사용. n8n은 BE API 트리거만, DB `notifications` 직접 INSERT 금지 | `schema.md` §5 n8n_user 권한 |
| 테스트·품질 | pytest + pytest-asyncio + pytest-cov + factory_boy + Faker + testcontainers + respx + ruff + mypy + bandit + pip-audit + pre-commit | `research/backend/09_testing_quality.md` |
| 배포 | uv + Docker + Docker Compose(V2) 6서비스 + Buildx 멀티아키 + GitHub Actions + Trivy | `research/backend/10_deployment.md` |
| ID·시간·전화 | UUIDv4 + datetime+zoneinfo + phonenumbers NATIONAL 형식 | `schema.md` §3.3 stores |
| Frontend 스택 | React 19 + Vite 6 + TS strict + React Router v7 + Zustand 5(auth 메모리·prefs persist 분리) + TanStack Query v5 + ky 1.x(401 단일 refresh 인터셉터) + openapi-typescript + Tailwind v4 + shadcn/ui + RHF + zod + Recharts + vite-plugin-pwa(injectManifest) + @sentry/react | `frontend_design.md` |
| Git 브랜치 전략 | 장수 5개(`main`·`dev`·`be`·`fe`·`ai`). be+fe → `feat/*` → be/fe → dev → main, AI는 ai → main 직행. main 보호(직접 푸시 금지·PR 필수). 통합 후 5브랜치 동일 commit 정렬 | `README.md` §5 |
| 문서 작업 main 동기화 | main 전용 문서(PROGRESS·docs/spec·docs/plan·루트 README·CLAUDE·AGENTS) 수정 전 `git pull --ff-only origin main` 의무 | `README.md` §5, `CLAUDE.md` 규칙 ④ |
| AI 미확정 항목 | 평가 지표·예측 근거 산출 방법·DNN 도입 여부·학습 데이터 사용 방식·결측 보간·이상치 임계값·신뢰도 임계값·재학습 교체 기준 — AI 팀 확정 시 spec에 직접 반영. spec/plan은 "별도 확정 예정"으로 표기 (30차 research 위임 폐기) | 각 spec 본문 (`08_ai/model_spec.md`, `ml_pipeline.md` 등) |
| AI 일부 확정 (22차) | Regression 방식 + Walk-forward CV + IQR 우선/Z-score 보조(임계 계수 probe 후) + 데이터 누수 방지 원칙. 모델 자체는 미확정 유지 | `08_ai/model_spec.md` §3·§7, `08_ai/ml_pipeline.md` §6 |
| MVP 외부 데이터 (30차 확정) | 03 조사로 확정 — 기상청 단기예보·과거 기상·공휴일·홍익대 학사일정 [필수]; 세담터 유동인구·소상공인 상가정보 [권장]; 배달상권 [선택]. [2단계]: SK 지오비전·ECOS·네이버 데이터랩. 세종 조치원 홍익대 상권 기준 | `08_ai/ml_pipeline.md` §4 + `research/ai/03_external_data_sources.md` |
| 보안 정책 | RBAC MVP 단일 역할 점주 / 감사 로그 1년 보관·`ops_readonly` 조회·append-only / 다중 디바이스 자체 토큰 / 강제 로그아웃 `POST /api/auth/logout-all` 채택 / 결제는 쿠팡 자체 수행(사주라 미경유·미저장) | `security.md` §2·§5, `research/backend/14_security_open_items.md` |
| 데모 시나리오 | 9단계 SSOT — 1.로그인 2.온보딩 3.CSV 4.메뉴·재고·판매 5.n8n야간예측 6.수요예측 7.추천발주 8.대시보드·알림 9.쿠팡자동주문 | `docs/plan/be/phase_13_release.md` |
| OAuth dev 운영 (29차) | (a) 카카오 scope에서 `account_email` 제거 — 동의항목 미검수 환경 대응. (b) fallback 이메일은 `{provider}_{id}@social.example.com` (valid TLD). (c) `UserMeResponse.email`은 `str` (register/login 입력 검증만 `EmailStr`). (d) Vite dev proxy `/api → BE`로 FE/BE 같은 origin 통합 + **OAuth `redirect_uri`도 proxy 경유(`localhost:5173/api/auth/callback/*`)로 통일(34차)** — Safari ITP cross-site cookie 차단 회피. 콜백을 BE:8000으로 직접 보내면 refresh 쿠키가 cross-site로 설정돼 첫 로그인이 차단(2회 클릭 필요)되던 문제 해결. **OAuth 콘솔(Google/Kakao) 승인 redirect URI에도 5173 주소 등록 필요** | `Back/app/api/oauth.py`, `Back/app/schemas/auth.py`, `Front/vite.config.ts`, `.env.example` |
| FE 자체 로그인·회원가입 (29차) | spec(`feature_spec.md` §1.2)·BE(9개 라우터 + auth_test 12개)는 정상이나 27차 phase_03 작성 시 FE 마일스톤이 누락되어 OAuth 화면만 노출. `docs/plan/fe/phase_03_auth.md` M3.F8로 명시화하고 **다음 단계로 즉시 진행**. `dev` 위에서 `feat/fe-register` → `fe` → `dev` 머지 흐름. **main 릴리즈는 전체 phase 완료 후 1회**로 유보 | `docs/plan/fe/phase_03_auth.md` M3.F8, `feature_spec.md` §1.2, `HANDOFF.md` |
| 사업자 검증 = 온보딩 前 독립 게이트 (32차) | 사업자 검증을 회원가입에 묶지 않고 **인증 후·온보딩 진입 전 독립 단계(`/verify-business`, `POST /api/store/business/verify`)**로 분리 — 소셜·이메일 계정 공통 적용(기존엔 이메일 register에만 있어 OAuth 갭). `register`는 email·password·name만 받고 매장 행은 빈 상태로 생성. `stores.business_verified` 플래그 + `business_no`/매장필드 nullable. 검증 실패 시 **계정 유지 + 재검증**(미등록/형식 재입력·휴폐업 안내), 가드가 미검증자 온보딩 차단. 시연용 마스터 코드(`NTS_MASTER_BYPASS_CODE`)로 강제 통과 가능. **33차에서 상태 모델·소유권 검증으로 확장됨** | `feature_spec.md` §1.4, `api_spec.md` §3 등 |
| 사업자 소유권 검증 = NTS + 등록증 + 관리자 승인 (33차) | NTS 조회는 사업자 실재·영업만 확인하고 **소유권은 증명 못 하는 공백**을 보완. ① NTS 즉시 조회 ② **사업자등록증 업로드** → `PENDING` ③ **관리자 승인**(`/admin` 심사) → `VERIFIED`/반려 `REJECTED`. `business_verified`(boolean) → **`business_status` 4단계 enum**. **PENDING부터 온보딩 진입 허용(1-B)**. `users.role`(OWNER/ADMIN) 신설, 관리자 최소 심사(`/api/admin/*`)는 Phase 3 포함·종합 관리도구는 Phase 11로. 등록증 파일은 서버 볼륨 저장(DB엔 경로), ADMIN 가드 하에서만 조회. 마스터 코드→곧바로 VERIFIED | `feature_spec.md` §1.4, `api_spec.md` §2·§3, `schema.md`(users.role·stores.business_status·cert), `service_design.md`(AdminVerificationService), `security.md` §2.4·§4.2·§5.1, `frontend_design.md` §3, `plan/be·fe/phase_03_auth.md`(M3.B8·B9·F9·F10), `plan_gantt.md` |

---

## 4. 개발 이력

구현 phase별 통합·검증 결과 기록. 차수는 §5와 동일하게 PROGRESS 작성 시점 차수.

### Phase 2 — 인프라 부트스트랩 (2026-05-25, 24차)

**3트랙 동시 부트스트랩**

| 트랙 | 산출물 | 머지 |
|---|---|---|
| BE | FastAPI + Alembic + pydantic-settings + structlog/asgi-correlation-id/Sentry 미들웨어 + `GET /health` + schema.md §3 전체 23개 테이블 마이그레이션 | `feat/be-infra-bootstrap` → `be` |
| FE | Vite 6 + React 19 + TS strict + Tailwind v4 + shadcn + TanStack Query v5 + ky 1.x 401 단일 refresh 인터셉터 + openapi-typescript + vite-plugin-pwa + @sentry/react + Biome + Vitest + multistage caddy Dockerfile | `feat/fe-infra-bootstrap` → `fe` |
| AI | FastAPI 빈 스켈레톤 + `GET /ai/health` (`model_loaded=false`) | `feat/ai-infra-bootstrap` → `ai` |

**docker compose 6서비스 stack** — `be · arq-worker · mysql · redis · n8n · caddy`. `docker/` 단일 루트로 통합, compose `context: .` + `dockerfile: docker/<svc>/Dockerfile` 통일.

**검증**: 6/6 컨테이너 healthy + `alembic upgrade head` 23개 테이블 + alembic_version + `GET /health` 200(be:8000 직접 + caddy:80 프록시).

**브랜치 통합**: PR #1 BE → be / #2 FE → fe / #3 AI → ai / #4 dev → main / #5 ai → main. 5개 장수 브랜치 동일 commit(`34dc58a`) 정렬.

---

### Phase 3 — 인증·온보딩 구현 (2026-05-26, 27차)

**BE M3.B1~B7** (`feat/be-auth` → `be`, PR #7)

- AuthService — 이메일 로그인(M3.B1) + 카카오/구글 OAuth 콜백 → Refresh HttpOnly Cookie + FE root 302
- StoreService — 매장 정보 CRUD + 소프트 삭제 + `POST /api/store/onboarding/complete` 멱등(M3.B2)
- 국세청 사업자등록번호 검증 어댑터 — 키 미설정 시 stub 통과(M3.B3)
- `POST /api/auth/logout-all` — 모든 디바이스 Refresh 일괄 폐기(M3.B4)
- auth_test BE 통합 12케이스(M3.B5)
- POS stub API — Phase 4 실연동 전 화면 흐름 막힘 방지용 mock 200(M3.B6)
- MenuService — 메뉴 CRUD + `POST /api/menus/bulk`(중복 메뉴 skip)(M3.B7)

**FE M3.F1~F6** (`feat/fe-auth` → `fe`, PR #8)

- 라우터·가드 — React Router v7 data router + `RequireAuth`/`RequireGuest`(부트스트랩 + onboarding 분기)
- Auth 부트스트랩 — 마운트 1회 `POST /api/auth/refresh` → 메모리 Access Token 동기 + `GET /api/auth/me`
- 로그인 화면 — 카카오/구글 버튼 → BE `/api/auth/login/{provider}` 302
- 온보딩 4스텝 (RHF + zod) — Step 1 매장 정보(phone 마스크) / Step 2 POS 연동(CSV_ONLY 시 자격증명 생략) / Step 3 메뉴 등록(`useFieldArray`) / Step 4 확인·제출(`PATCH /api/store` → POS 등록 → `POST /api/menus/bulk` → `POST /api/store/onboarding/complete`)
- 스토어 — Zustand `useAuthStore`(메모리) / `useOnboardingStore`(스텝 캐시), persist 미사용
- 테스트 — Vitest 8/8 통과 + Playwright E2E 스캐폴드(라우트 인터셉트)

**브랜치 통합**: PR #7 → be / PR #8 → fe / PR #9 → dev / PR #10 → dev.

---

### Phase 3 사후 정리 (2026-05-27, 28차)

- 머지 완료된 `feat/be-auth`·`feat/fe-auth` 원격+로컬 삭제 → 장수 브랜치 5개만 잔존
- outdated stash 1건 drop
- `HANDOFF.md` slim down (213 → 107줄, stale 4섹션 + 중복 표 제거)
- 문서 작업 main 동기화 의무 규칙 신설 (`README.md` §5, `CLAUDE.md`·`AGENTS.md` 핵심 규칙 ④로 확장)

---

### Phase 3 — dev 통합 검증 (E단계) + 골든패스 (2026-05-27, 29차)

HANDOFF.md E단계 9개 검증 시나리오 수행 + 발견된 결함 일괄 정정 + 카카오/구글 골든패스 통과.

**자동 검증 결과**

| 항목 | 결과 |
|---|---|
| dev 동기화 (7 commits FF) | ✅ |
| docker compose 6/6 healthy | ✅ |
| Alembic 23개 테이블 + alembic_version | ✅ |
| BE pytest auth_test | ✅ 12/12 |
| FE typecheck + Vitest | ✅ 8/8 |
| FE Playwright E2E | ✅ 2/2 |

**골든패스 통과** — 카카오·구글 OAuth 모두 로그인 → onboarding/1 진입 확인 (Safari 환경).

**검증 중 발견·픽스 (8건, 3 commit 묶음 + 4 commit 묶음)**

1차 묶음 (4 commit, `c2c639b..296e8a6`)
1. **BE 테스트 부재 → 재작성** — HANDOFF 기록의 auth_test 12개가 저장소에 없어 spec(api_spec §2) 기준으로 재작성. `NullPool` 기반 test engine + 이메일 prefix cleanup fixture. (`Back/tests/`)
2. **BE Dockerfile dev extras 누락** — pytest 미설치로 `docker compose exec be pytest` 실패 → `.` → `.[dev]` 변경 + `COPY Back/tests`.
3. **FE 빌드 파이프라인 vite 5/6 plugin 타입 충돌** — vitest 2.x가 vite 5 peer를 끌어들임. vitest 3.x 업그레이드로 vite 6 단일화.
4. **`workbox-precaching` 의존성 누락** — sw.ts import는 있는데 package.json에 없음 → `pnpm build` Rollup 해석 실패. 의존성 추가.
5. **E2E `login page exposes both OAuth buttons` 테스트 버그** — `beforeEach`의 refresh stub이 RequireGuest 가드를 트리거해 /login에서 리다이렉트. 해당 테스트만 refresh 401로 덮어쓰기.
6. **`arq-worker` healthcheck 실패** — `python:3.12-slim`에 `pgrep` 미설치(procps). `grep -q arq /proc/1/cmdline`로 교체.

2차 묶음 (3 commit, `14d9b6f..58d7a94`) — 골든패스 진행 중 발견

7. **BE: 카카오 OAuth 권한 부재 환경 대응**
   - `_SCOPES["kakao"]`에서 `account_email` 제거 → 신규 카카오 앱은 이메일 동의항목 검수 전이라 KOE205 발생, `profile_nickname`만 요청
   - fallback 이메일 도메인 `@no-email.local` → `@social.example.com` (valid TLD)
   - `UserMeResponse.email` 타입 `EmailStr` → `str` — OAuth fallback 이메일이 `.local` TLD라 EmailStr 검증에서 500 발생 후 FE 401 리다이렉트 루프 발생
8. **FE: Vite dev proxy로 BE 통합** — Safari ITP가 `localhost:5173 → localhost:8000`을 cross-site로 차단하여 refresh_token 쿠키 미전송. `server.proxy["/api"]` 추가 + `dev-up.sh` `API_BASE_URL` 기본값 `/api`로 변경 → same-origin 통합.

**산출물 신규**

- `scripts/dev-up.sh` — 통합 부트스트랩(docker stack + Alembic + FE dev). `--rebuild`/`--no-fe`/`--down`/`--logs`/`--status` 옵션. PID·로그는 `.dev-fe.pid`/`.dev-fe.log`로 분리(.gitignore 반영).

**브랜치 통합**

- PR #11 `dev → be` (sync) — be 브랜치를 dev에 정렬
- PR #12 `dev → fe` (sync) — fe 브랜치를 dev에 정렬
- 머지 후 be · fe · dev 동일 commit으로 lock-step 정렬 예정

**다음 (F단계)**: dev → main 릴리즈 PR (`release(phase-3): BE + FE 인증·온보딩 통합`) → 머지 후 `be`/`fe`/`ai`로 back-merge하여 5개 장수 브랜치 동일 commit 정렬.

---

### Phase 3 — 사업자 검증 게이트 구현 + dev 통합 + OAuth 픽스 (2026-05-29, 34차)

32·33차에서 문서로 확정한 사업자 검증 게이트(NTS + 등록증 업로드 + 관리자 승인)를 코드로 구현하고 `dev`에 통합. 수동 테스트로 골든패스·관리자 흐름 확인.

**구현 (PR-A 점주 측 → PR-B 관리자 측, 각 BE→FE 순)**

| 영역 | 산출물 | 마일스톤 |
|---|---|---|
| BE PR-A | `business_status` enum 마이그레이션(0003) + `core/storage.py`(등록증 저장) + `verify_business`(NTS→마스터=VERIFIED/등록증=PENDING) + verify 엔드포인트 multipart | M3.B8 |
| BE PR-B | `users.role` 마이그레이션(0004) + `AdminVerificationService`(목록·승인·반려·등록증 스트리밍) + `/api/admin/*` ADMIN 가드(`get_admin_user`, role DB 실시간 조회) | M3.B9 |
| FE PR-A | register 단순화(email·pw·name) + `/verify-business`(사업자번호+등록증 업로드, 반려 사유 표시) + `RequireStage`(verify/onboarding/app) 가드 + `landingPath()` | M3.F8·F9 |
| FE PR-B | `/admin/verifications` 심사 큐(목록·등록증 미리보기·승인/반려) + `RequireAdmin` 가드 | M3.F10 |

**docker**: `be` 서비스에 `be_uploads` 볼륨 추가(등록증 파일이 rebuild 시 유실되지 않도록).

**테스트**: BE pytest 20개(auth_test 16 + admin_test 4) + FE Vitest 19 + Playwright E2E 7 통과.

**OAuth 더블클릭 픽스**: 구글/카카오 콜백 `redirect_uri`를 BE:8000 직접 → FE proxy(`localhost:5173/api/auth/callback/*`)로 변경. cross-site refresh 쿠키를 Safari ITP가 첫 시도에 차단하던 문제 해결(§3 OAuth dev 운영 (d) 참조). OAuth 콘솔 양쪽에 5173 redirect URI 등록 후 1회 클릭 정상 동작 확인.

**수동 테스트 (`scripts/dev-up.sh`)**: 구글 로그인 → `/verify-business` 자동 진입 정상. 관리자 흐름은 `htaeky@gmail.com`을 DB에서 `role=ADMIN` 승격 후 `/admin/verifications` 접근 확인.

**브랜치 통합**: `feat/be-admin`(BE 전체) → dev, `feat/fe-admin`(FE 전체) → dev 직접 머지(BE는 `Back/`·`docker-compose`, FE는 `Front/`·`.env.example`로 파일 겹침 없음). `.env.example` OAuth redirect 수정은 dev 커밋. **be/fe 브랜치 정렬·dev → main 릴리즈는 전체 phase 완료 후 1회로 유보**.

---

## 5. 문서 수정 이력

차수별 상세 변경. 최근 항목을 위로, 옛 항목은 추상화한다. 1~27차 audit 상세는 git log + spec/research 본문 참조.

### 2026-05-30 (35차) — Phase 4 plan ↔ spec(CSV-only) 정합 + 화면 책임 분리 SSOT

Phase 4 진입 전 일관성 검토(plan-eng-review)에서 BE/FE plan이 CSV-only MVP 정책(`mvp_scope.md` §3·§4, `feature_spec.md` §4, `api_spec.md` §3, `research/backend/13_pos_adapter.md`, 19차 결정)과 충돌하는 것을 확인 — plan을 spec 기준으로 정정. ① **BE M4.B1**: `BARO V2 어댑터 실구현` → `CSVAdapter 구조 정리 + M3.B6 stub 유지(2단계 진입 전까지)`. 외부 POS API 어댑터(TossPlace·Kiwoom·OKPOS)는 [2단계] 명시. ② **FE M4.F1**: `자격증명 수정·연결 테스트 화면` → `연동 상태 표시 + CSV 템플릿 다운로드 + 업로드 화면 진입`(CSV 액션 허브). 자격증명 UI는 [2단계]로 이동. ③ **화면 책임 분리 SSOT**: 온보딩 Step 2 = 모드 선택만 / M4.F1 = CSV 액션 허브 / M4.F2 = 실제 업로드 — `feature_spec.md` §4.4의 "업로드 화면에서 템플릿 제공" 기존 문구는 본 35차로 일원화(중복·빈틈 방지). ④ **plan_gantt §4 `pos_be`/`pos_fe`** 행 문구를 위 정합에 맞춰 정정. **미해결**: M3.B6 stub 응답 스키마(dev 브랜치)와 `api_spec §3 GET /api/store/pos/status` 응답 정의 간 키/타입 대조 필요 — Phase 4 BE 본작업 첫 단계로 dev에서 확인.

### 2026-05-29 (34차) — 사업자 검증 게이트 구현·dev 통합 + OAuth redirect_uri 픽스

32·33차 문서 확정분을 코드로 구현(§4 34차 참조). 본 회차 문서 작업: ① §3 OAuth dev 운영 (d) 행에 `redirect_uri` proxy 경유(5173) 통일 + 콘솔 등록 의무 추가 ② §4 개발 이력에 34차(구현·통합·OAuth 픽스·수동 테스트) 추가 ③ `HANDOFF.md`를 검증 게이트 완료 상태로 갱신(다음 우선순위 = Phase 4 POS). `.env.example`의 OAuth redirect 기본값(5173)·설명 주석은 dev 브랜치에 커밋(코드 변경이라 main 릴리즈 때 동반).

### 2026-05-29 (33차) — 사업자 소유권 검증: NTS + 등록증 업로드 + 관리자 승인 (32차 확장)

실 사업자번호로 국세청 호출 테스트(460-07-03149 → 계속사업자) 결과, **NTS 조회는 사업자 실재·영업만 확인하고 가입자가 그 사업자의 주인인지(소유권)는 증명 못 한다**는 한계를 확인. 32차 설계(NTS 단독)를 소유권 검증까지 확장.

**상태 모델**: `business_verified`(boolean) → **`business_status` 4단계 enum**(`UNVERIFIED`→`PENDING`→`VERIFIED`/`REJECTED`). 검증 흐름: ① NTS 즉시 조회(실재·영업) → ② 사업자등록증 업로드 → `PENDING` → ③ 관리자 심사 → `VERIFIED`/반려 `REJECTED`.

**핵심 결정**: ① **온보딩 진입은 PENDING부터 허용(1-B)** — 관리자 승인을 기다리지 않고 진행, 사후 반려로 차단 ② NTS와 등록증+승인 **병행(2-A)** ③ 관리자 도입: `users.role`(OWNER/ADMIN, 운영자만 수동 지정), `/api/admin/*` ADMIN 가드, **심사 큐 1화면 + 승인/반려 + 등록증 열람**은 Phase 3에 포함, **사용자·매장 종합 관리도구는 Phase 11로** 후행. ④ 등록증 파일은 서버 볼륨 저장(DB엔 경로만), ADMIN 가드 하에서만 스트리밍. ⑤ 마스터 코드는 곧바로 `VERIFIED`.

**영향 문서**: `feature_spec.md` §1.2·§1.4, `api_spec.md` §2(login/me)·§3(verify multipart + `/api/admin/*` 신설), `schema.md`(users.role, stores.business_status·business_cert_path·business_reject_reason·business_reviewed_by), `service_design.md`(verify_business 업로드 + AdminVerificationService), `security.md` §2.4·§4.2(등록증 보관)·§5.1(ADMIN RBAC), `frontend_design.md` §3(/verify-business 업로드·/admin·상태 가드), `feature_list.md`, `user_flow.md`·`sequence.md`·`usecase_spec.md`, `plan/be`(M3.B8·B9)·`plan/fe`(M3.F9·F10)·`plan_gantt.md`(Phase 3·11). 코드(BE enum·업로드·admin, FE 업로드·admin 화면)는 후속 `feat/*` — 본 회차는 문서 확정. 32차에 만든 BE(`feat/be-verify`, boolean)는 enum으로 재작업 예정.

### 2026-05-29 (32차) — 사업자 검증을 온보딩 前 독립 게이트로 분리 + 마스터 코드

검증 호출이 이메일 `register`에만 있어 OAuth 가입자는 사업자 검증을 거치지 않던 불일치(spec 내부도 register-시점 vs 온보딩-시점 혼재)를 해소. 검증을 **인증 후·온보딩 진입 전 독립 단계**(`/verify-business`, `POST /api/store/business/verify`)로 통일하여 소셜·이메일 공통 적용.

**핵심 변경**: ① `register` 페이로드에서 `business_no`·`store_name` 제거(email·password·name만), 매장 행은 가입 시 빈 상태로 생성 ② `stores.business_verified` 컬럼 신설 + `business_no`·매장필드 nullable ③ 가드 순서에 `business_verified` 단계 추가(미검증 → `/verify-business`, 검증 전 온보딩 차단) ④ 검증 실패 시 계정 유지 + 재검증(미등록/형식 재입력·휴폐업 안내) ⑤ 시연용 마스터 코드(`NTS_MASTER_BYPASS_CODE`)로 국세청 호출 없이 강제 통과(운영 빈 값, 백도어로 `security.md` §2.4 명시) ⑥ 국세청 API는 odcloud(`api.odcloud.kr/api/nts-businessman/v1`), `.env`/`.env.example`에 `NTS_API_SERVICE_KEY`·`NTS_API_STUB_MODE`·`NTS_MASTER_BYPASS_CODE` 추가.

**영향 문서**: `feature_spec.md` §1.2·§1.4, `api_spec.md` §2·§3(verify 엔드포인트 신설), `service_design.md`(register 시그니처·`verify_business`), `schema.md`(stores), `sequence.md`, `user_flow.md`, `usecase_spec.md`, `security.md` §2.4, `frontend_design.md` §3, `feature_list.md`, `plan/be·fe/phase_03_auth.md`(M3.B8·M3.F9 신설). 코드 구현(BE 마이그레이션·verify 엔드포인트, FE `/verify-business`·가드)은 후속 `feat/*` 진행 — 본 회차는 문서·`.env` 확정만.

### 2026-05-28 (31차) — docs/plan/ai/ 신설 + plan_gantt §6 AI 트랙 색인 정렬

AI 트랙 plan 폴더가 부재했던 점을 30차 후속으로 보강. `be/`·`fe/`와 동일 형식의 6개 phase 파일 작성 + `plan_gantt.md` §6 색인 표에 "AI 파일" 열 신설.

**작성 방향 (사용자 지정)**: Phase 6 마일스톤은 **"데이터 수집 → EDA → 피처 관계 분석 → 모델 선정"** 순으로 분해. 모델 결정을 EDA·피처 분석 뒤로 명시적 후행화 — 30차 정합으로 모델 선정이 미확정인 상태에서 데이터·EDA 결과로 후보를 좁히는 흐름.

**신설 파일 (6)**

- `docs/plan/ai/phase_00_research.md` — M0.A1
- `docs/plan/ai/phase_02_infra.md` — M2.A1~A4 (AI Server 베이스·ML lib·Docker·env)
- `docs/plan/ai/phase_06_model.md` — M6.A1~A9 (데이터·EDA·피처·결측/이상치·모델비교·선정·XAI·신뢰도·DNN)
- `docs/plan/ai/phase_07_api.md` — M7.A1~A7 (REST API: forecast·recommend·xai·train·health)
- `docs/plan/ai/phase_12_hookup.md` — M12.A1~A6 (예측 근거 형태·임계값·n8n 규칙·평가 지표·XAI UI·회귀 검증)
- `docs/plan/ai/phase_13_release.md` — M13.A1~A5 (데모·성능·보안·CI/CD·모니터링)

**변경 (1)**

- `docs/plan/plan_gantt.md` §6 — Phase 색인 표 "AI 파일" 열 신설, Phase 6·7·12·13의 "AI 팀 영역, 본인 작업 아님" 빈 칸 채움. 마일스톤 ID 규칙에 `M{Phase}.A{n}` 추가.

브랜치: `docs/plan-ai-bootstrap` → PR → main (CLAUDE.md §4 정합).

### 2026-05-28 (30차) — research/ai/01·02 폐기 + spec 위임 표현 일괄 정리

`docs/research/ai/01_model_selection.md`(28곳) · `02_ml_pipeline_open_items.md`(13곳) 폐기. spec/plan/research 18개 파일에서 위임 문구를 일괄 제거하고 결정 대기 사항은 "별도 확정 예정" 또는 "AI 팀 확정"으로 약화 — 위임 위치 포인터(파일+섹션 ref)는 모두 제거. §3 정책 결정 이력의 "AI 미확정 → research 위임" 행은 정책 폐기 반영으로 갱신, "MVP 외부 데이터" 행은 03 조사 결과로 보강.

추가로 `docs/spec/08_ai/ml_pipeline.md` §4·§5 와 `model_spec.md` §5 입력 피처를 `research/ai/03_external_data_sources.md`(2026-05-24 조사, 24차) 정합으로 갱신 — 서울 생활인구→세담터, [조사 중]→[2단계] 분류, 학사일정/상가정보 추가.

**변경 파일**

- spec(10): `01_requirements/requirements·usecase_spec`, `02_mvp/mvp_scope`, `03_feature_design/feature_spec·feature_list`, `05_api/api_spec`, `06_database/schema`, `07_backend/service_design`, `08_ai/ml_pipeline·model_spec`
- plan(5): `be/phase_04_pos·08_n8n·11_dashboard·12_hookup`, `fe/phase_12_hookup`
- research/backend(3): `06_external_integration·08_async_pipeline·14_security_open_items`
- 인덱스(4): `docs/README.md` · `docs/research/README.md` · `docs/사주라_기술문서.md` · `PROGRESS.md` §3
- 삭제(2): `docs/research/ai/01_model_selection.md` · `02_ml_pipeline_open_items.md`

브랜치: `docs/cleanup-ai-research-01-02` → PR → main (`README.md` §5 · `CLAUDE.md` 핵심 규칙 ④ 정합).

### 2026-05-27 (29차) — dev 통합 검증(E단계) + 골든패스

§4 "Phase 3 — dev 통합 검증" 참조. 발견된 픽스 8건(BE 테스트 재작성 / BE Dockerfile dev extras / FE 빌드 파이프라인 vitest 3 업그레이드 / workbox-precaching / E2E 테스트 / arq healthcheck / 카카오 scope·email / Safari Vite proxy)을 `dev`에 7 commit으로 분리 푸시, PR #11(dev→be)·PR #12(dev→fe) 갱신.

**변경 파일**

- BE: `Back/tests/{__init__,conftest,auth_test}.py`(신규), `Back/pyproject.toml`(asyncio fixture loop scope), `Back/app/api/oauth.py`(scope·fallback 이메일), `Back/app/schemas/auth.py`(UserMeResponse.email)
- FE: `Front/package.json`(vitest 3·workbox-precaching) + `Front/pnpm-lock.yaml` + `Front/.gitignore`(test-results) + `Front/src/test/e2e/auth-onboarding.spec.ts` + `Front/vite.config.ts`(/api proxy)
- infra: `docker-compose.yml`(arq healthcheck) + `docker/be/Dockerfile`(`.[dev]` + `COPY Back/tests`) + `scripts/dev-up.sh`(신규) + `.gitignore`(.dev-fe.*)
- docs: `PROGRESS.md` 재구성(다이어트 + 개발 이력 §4 신설) + `HANDOFF.md` 갱신

### 2026-05-27 (28차) — Phase 3 사후 정리: 브랜치/HANDOFF/문서 작업 규칙 정합

§4 "Phase 3 사후 정리" 참조. 머지 완료 피처 브랜치 삭제 + HANDOFF slim down(50% 감축) + main 동기화 의무 규칙 신설(`README.md` §5, `CLAUDE.md`·`AGENTS.md` 핵심 규칙 ④).

### 2026-05-26 (27차) — Phase 3 인증·온보딩 구현 (BE M3.B1~B7 + FE M3.F1~F6)

§4 "Phase 3 — 인증·온보딩 구현" 참조. PR #7~#10으로 BE/FE 모두 통합 완료.

### 2026-05-25 (26차) — Phase 2 인프라 부트스트랩 + main 베이스라인 통합

§4 "Phase 2 — 인프라 부트스트랩" 참조. 3트랙 모두 main에 통합, 5개 장수 브랜치 동일 commit(`34dc58a`) 정렬.

### 2026-05-24 (25차) — `docs/plan/` 21개 phase 파일 정합성 audit

Q1~Q10 정정: spec 폴더 경로 정정·FE 알림 폴링 5분·POS stub 신설로 Phase 03 분리·BE phase_12 시작일 정정·데모 시나리오 9단계 SSOT·알림 채널 책임 분리(Slack 운영자 전용)·폴링/배치 시각 분산·산출물 비대칭 정합·미정의 항목 spec 참조 추가·SLA 강도 명확화. 21개 plan 파일 + `plan_gantt.md` 수정.

### 2026-05-23 (24차) — 외부 데이터 소스 조사 + Git 브랜치 전략

`docs/research/ai/03_external_data_sources.md` 신규 (조치원 홍익대 상권 특화). `README.md` §5 브랜치 전략 섹션 신설.

### 1~23차 audit 이력 (요약)

- **1~5차** (2026-05-06~07): 초기 spec 작성·일관성 검토 (`api_spec`·`schema`·`service_design`·`user_flow`·`sequence`·`mvp_scope`·`security`·`performance` 등)
- **2~13차** (2026-05-15~16): `research/backend/` 11개 카테고리 결정 일괄 진행 — 웹 프레임워크·앱 서버·리버스 프록시·데이터 계층·인증/암호화·외부 연동·캐시/관측·비동기/파이프라인·테스트/품질·배포·DI/유틸. 각 회차 결정은 §3 표로 추상화.
- **14~16차** (2026-05-16): `research/backend/12` 폐기 + `13_pos_adapter` 2단계 진입 가이드 재편. 보안 미확정 항목 정리(RBAC·감사 로그·logout-all·다중 디바이스). 종합 검증 + 책임 분리 정정(n8n=AI / ARQ=BE 도메인).
- **17~18차** (2026-05-16): `research/frontend/` 10+1개 카테고리(`11_observability.md` 신규). FE Sentry 결정·OAuth 콜백 응답 정정(200 → 302+Cookie)·인앱 폴링 5분 고정.
- **19차**: CSV-only MVP 정책 정합 + MVP/2단계 라벨 도입 + `frontend_design.md` FE spec 신설.
- **20차** (2026-05-16~17): 14개 미확정 AI 항목 → research 위임 + `prompts/` 폴더 폐기(`08_ai_handoff` + `consistency_check`).
- **21차** (2026-05-20): `plan_gantt.md` 골격·hookup 분할(Phase 12 AI hookup 신설), 14 Phase 구조.
- **22차**: AI research 일부 확정 (Regression / Walk-forward CV / IQR / 결측 보간 / 데이터 누수 방지).
- **23차** (2026-05-23): 캡스톤 ML 통합가이드 → `research/ai/00_ml_reference_guide.md` 이동.

> 각 회차 audit 영향 파일 목록은 `git log --follow --all <파일>` 또는 git blame으로 확인. spec/research 본문이 SSOT이므로 본 §5에는 차수·결정 사유만 남긴다.
