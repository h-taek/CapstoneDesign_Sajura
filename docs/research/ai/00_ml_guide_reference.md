# 종합설계(Capstone Design) 머신러닝 통합 가이드

> 이 문서는 세 개의 정리 문서 — **데이터 시각화**, **피처 선택(Feature Selection)**, **AutoML 도구 조사** — 를 하나의 머신러닝 프로젝트 흐름으로 통합한 레퍼런스입니다. 내용은 압축하지 않고 원본 디테일(표·코드·인용·함정)을 모두 보존했습니다.
>
> 캡스톤 프로젝트가 실제로 진행되는 순서를 따릅니다:
> **① 데이터 탐색·시각화(EDA) → ② 피처 선택 → ③ 모델 선택·학습(AutoML 포함) → ④ 평가·해석 시각화**
>
> 출처 강의 자료: `데이터_시각화.pdf(P03)`, `데이터_요약_원리와_시각화.pdf(D02)`, `분류_모델.pdf`, `회귀_분석.pdf`, `feature_selection`·`ANOVA`·`TreeBased_Models` 시리즈, 그리고 AutoML 라이브러리 공식 문서(2026년 5월 기준).

---

## 목차

- [PART 0 — 전체 워크플로우 한눈에 보기](#part-0)
- [PART 1 — 데이터 탐색과 시각화 (EDA / 기술적 시각화)](#part-1)
  - 1-0. 전처리와 시각화의 순서 + 전처리 7가지 핵심 항목
  - 1-1 ~ 1-9. 시각화 종류·원칙·도구·차트 선택
- [PART 2 — 피처 선택 (Feature Selection)](#part-2)
- [PART 3 — 모델 선택과 AutoML](#part-3)
- [PART 4 — 평가·해석 시각화 (분석적 시각화)](#part-4)
- [PART 5 — 공통 함정 모음 (3개 영역 통합)](#part-5)
- [부록 — 발표용 체크리스트](#appendix)

---

<a name="part-0"></a>
# PART 0 — 전체 워크플로우 한눈에 보기

캡스톤 머신러닝 프로젝트는 대개 다음 순서로 흐릅니다. 이 문서의 각 PART는 이 흐름의 한 칸에 대응합니다.

```
[데이터 수집]
     │
     ▼
① EDA · 기술적 시각화  ──────────────  PART 1 (1-1~1-9)
   (분포·관계·상관 파악, 데이터 타입 확인)
     │
     ▼  ← 시각화로 "무엇을 고칠지" 발견
② 데이터 전처리  ─────────────────────  PART 1 (1-0)
   (결측치·이상치·편향치·인코딩·스케일링·차원축소·피처생성)
   └ 처리 후 다시 시각화로 확인 → 필요시 ①로 순환
     │
     ▼
③ 피처 선택  ─────────────────────────  PART 2
   (데이터 타입 + 모델 가정에 맞는 방법 결정)
     │
     ▼
④ 모델 선택 · 학습  ──────────────────  PART 3
   (Baseline → AutoML 리더보드 → 수동 재현·튜닝)
     │
     ▼
⑤ 평가 · 해석 · 분석적 시각화  ────────  PART 4
   (혼동행렬·ROC·잔차·특성 중요도·차원 축소)
     │
     ▼
[보고서 · 발표]  ─────────────────────  부록 체크리스트
```

**세 영역이 어떻게 연결되는가 (핵심)**:
- **EDA 시각화(PART 1)가 전처리(PART 1-0)에서 "무엇을 고칠지" 알려준다.** 전처리 전 그림으로 결측·이상치·치우침을 발견하고, 전처리 후 그림으로 확인한다(순환).
- **EDA에서 파악한 데이터 타입**이 **피처 선택(PART 2)의 Filter 함수**를 결정한다 (연속/범주 조합에 따라 `f_classif`, `chi2`, `mutual_info_*` 등이 갈림).
- **선택한 모델군(PART 3)**이 다시 **전처리(스케일링 필요 여부)·피처 선택 방법(PART 2)·평가 시각화(PART 4)**의 종류를 결정한다 (선형 모델 → 스케일링+L1+ROC, 트리 모델 → 스케일링 불필요+SHAP+특성 중요도 등).
- 즉 세 영역은 독립된 지식이 아니라 **하나의 의사결정 사슬**이다.

---

<a name="part-1"></a>
# PART 1 — 데이터 탐색과 시각화 (EDA / 기술적 시각화)

> 강의 자료 `데이터_시각화.pdf(P03)`, `데이터_요약_원리와_시각화.pdf(D02)`, `머신러닝의_개요ML1.pdf(ML1)` 기반. 모델링 이전, 데이터 자체를 이해하고 정리하는 단계입니다.

## 1-0. 전처리와 시각화의 순서 — 무엇을 먼저 하는가

### 1-0-1. 결론: 양자택일이 아니라 "순환(loop)"이다

"시각화 전에 전처리를 하는 게 좋은가, 후에 하는 게 좋은가"는 자주 나오는 질문이지만, 정답은 **둘 중 하나가 아니라 번갈아 도는 것**이다. 시각화는 전처리의 *전후 양쪽*에 모두 위치한다. 단계마다 그리는 그림과 목적이 다르다.

```
[원본 데이터]
     │
     ▼
① 전처리 "전" 시각화 (진단용)   ← 무엇을 고칠지 발견
   히스토그램·상자그림·결측치맵·상관 히트맵
     │
     ▼
② 전처리 (1-0-3의 7가지 항목)
     │
     ▼
③ 전처리 "후" 시각화 (확인용)   ← 의도대로 됐는지 확인
   변환된 분포, 스케일링 결과 비교
     │
     └──→ 필요하면 ①로 되돌아감 (새 이상치 발견 등)
              │
              ▼
       [모델 학습 → PART 4: 평가·해석 시각화]
```

| 시점 | 그리는 그림 | 목적 |
|---|---|---|
| 전처리 **전** | 히스토그램, 상자그림, 결측치맵, 상관 히트맵 | 무엇을 고칠지 **발견** |
| 전처리 **후** | 변환된 분포, 스케일링 결과 | 의도대로 됐는지 **확인** |
| 모델 학습 후 (PART 4) | 혼동행렬, ROC, 잔차, 특성 중요도 | 결과 **해석** |

**한 줄 요약**: 무엇을 전처리할지 보려면 전처리 **전**에 그리고, 잘 됐는지 보려면 전처리 **후**에 또 그린다. 단, **모델에 쓸 변환은 train/test split 이후에만** 한다(아래 함정 참고).

> 강의 자료(ML1)의 머신러닝 개발 과정도 이 순서를 명시한다: **데이터 수집 → 데이터 탐색(분석) → 데이터 전처리 → 모델 개발 → 모델 평가 → 피드백**. 즉 "탐색(시각화)"이 "전처리" *앞*에 한 번 오고, 피드백 루프로 다시 순환한다. ML1 슬라이드 원문: "데이터 분석 → 수집된 데이터를 탐색하고 이해하여 유의미한 패턴과 특징을 발견 / 데이터 전처리 → 모델의 성능을 높이기 위해 데이터를 정제, 처리 및 변환 작업을 수행".

### 1-0-2. ⚠️ 가장 중요한 함정: 시각화용 변환 ≠ 모델용 변환

같은 "전처리"라는 단어를 쓰지만 목적이 완전히 다르다. 이 둘을 섞으면 **데이터 누수(data leakage)**가 발생한다.

- **탐색용 변환**: 분포를 눈으로 보기 위한 것. test 누수 걱정 없이 전체 데이터로 자유롭게 해도 된다.
- **모델용 변환**(스케일링, 결측치 대치 등): 반드시 **train/test를 나눈 뒤, train에만 `fit`** 해야 한다. 전체 데이터로 `StandardScaler().fit()`을 하면 test의 평균·분산 정보가 train으로 새어 들어간다.

전형적 실수: "시각화하려고 전체 데이터를 스케일링했다 → 그 스케일링된 배열을 그대로 모델에 넣었다". 탐색은 자유롭게 하되, **모델에 들어가는 변환은 split 이후 `Pipeline` 안에서** 처리하라. (이 함정은 PART 5-1과 동일한 원칙이다.)

```python
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# 1) 먼저 나눈다
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# 2) 변환은 Pipeline 안에서 → fit은 train에만 적용됨 (누수 방지)
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('model', SomeModel()),
])
pipe.fit(X_train, y_train)   # scaler.fit도 train에서만 일어남
```

### 1-0-3. 스케일링은 대부분의 EDA 시각화에 불필요하다

학생들이 "시각화 전에 스케일링부터 해야 하나?"를 고민하는데, 히스토그램·산점도·상자그림 같은 **기본 EDA 그림은 원본 단위 그대로 그리는 게 해석에 좋다**(예: "나이 35세"가 "스케일링된 0.7"보다 읽기 쉽다).

스케일링이 필요한 시각화는 **여러 변수를 같은 축에서 비교할 때**뿐이다 — PCA/t-SNE 투영(PART 4-6), 여러 변수를 겹친 KDE, 평행좌표 그래프 등. 이때의 스케일링도 "그 그림 전용"이지 모델로 가져가는 것이 아니다.

### 1-0-4. 강의 자료가 강조하는 전처리의 위상 (ML1)

- **Garbage In, Garbage Out**: 잘못되거나 부정확한 입력 데이터를 사용하면 결과 역시 부정확하거나 무의미하다는 원칙. 전처리가 곧 모델 품질의 상한선을 정한다.
- **현장 비중**: ML1이 인용한 CrowdFlower 설문(데이터 과학자 80명, 2년)에 따르면 **모델 개발 시간의 약 79%가 데이터 수집 및 전처리**에 쓰이며, 동시에 **가장 재미없는 작업(78%)**으로 꼽혔다. 즉 가장 시간이 많이 들고 귀찮지만, 성능을 좌우하는 핵심 단계다.
- 전처리의 정의: **"데이터를 분석 및 처리에 적합한 형태로 만드는 과정"**.

### 1-0-5. 전처리의 두 갈래: 데이터 정제 vs 특성 공학 (ML1)

ML1은 전처리를 두 단계로 구분한다.

| 구분 | 정의 | 시점 | 예시 |
|---|---|---|---|
| **데이터 정제**<br>(Data Cleaning) | 불필요한 자료를 덜어내고, 모델이 학습할 수 있는 형태로 데이터를 변환하는 과정 | 모델 학습을 위해 **1차적으로** 수행하는 전처리 | 결측치 제거, 이상치 제거, 데이터 통합, 인코딩 |
| **특성 공학**<br>(Feature Engineering) | 모델 성능을 향상시키기 위해 데이터의 새로운 특성(Feature)을 만들거나 변형하는 과정 | **더 나은 학습 성능**을 내기 위해 수행하는 전처리 | 피처 생성, 변형, 차원 축소 |

즉 데이터 정제는 "일단 돌아가게 만드는" 필수 단계이고, 특성 공학은 "더 잘 돌아가게 만드는" 성능 개선 단계다.

### 1-0-6. 전처리 7가지 핵심 항목 (ML1) — EDA 시각화와의 연결

ML1은 데이터 전처리를 다음 7가지로 정리한다. 각 항목을 **어떤 시각화로 진단하는지(전처리 전)**, **어떻게 처리하는지**, **이 문서 어디와 연결되는지**를 함께 정리한다.

1. **결측치 처리 (Missing Value)**
   - 진단 시각화: 결측치 히트맵(`missingno.matrix`/`heatmap`), 변수별 결측 비율 막대그래프.
   - 처리: 행/열 삭제, 또는 대치(평균·중앙값·최빈값, KNN 대치, 회귀 대치). 강의 예시는 `salary` 열의 `NULL` 값.
   - 누수 주의: 대치값(평균 등)은 **train에서만 계산**해 test에 적용. → 1-0-2.

2. **이상치 처리 (Outlier)**
   - 진단 시각화: 상자그림(IQR로 수염 밖 점 식별), 히스토그램, 산점도.
   - 처리: 제거, 상한/하한 클리핑(winsorizing), 로그 변환으로 영향 축소.
   - 평가지표 연결: 회귀에서 **MSE는 오차를 제곱하므로 이상치에 민감**(회귀 자료) → 이상치 처리가 MSE 기반 모델 성능에 직접 영향.

3. **편향치 처리 (치우침 / Skew)**
   - 진단 시각화: 히스토그램·KDE에서 한쪽 꼬리가 긴 분포 확인.
   - 처리: 로그 변환, 제곱근 변환, Box-Cox 등으로 분포를 대칭에 가깝게.
   - 확인 시각화: 변환 후 히스토그램을 다시 그려 정규에 가까워졌는지 확인(전처리 후 시각화의 대표 사례).

4. **인코딩 (Encoding)**
   - 진단: 범주형 변수의 카디널리티(고유값 개수) 확인 → count plot.
   - 처리: One-Hot 인코딩(순서 없는 범주), Label/Ordinal 인코딩(순서 있는 범주), 타깃 인코딩(고-카디널리티).
   - 피처 선택 연결: One-Hot 결과는 **비음수**라 `chi2` 필터에 적합(PART 2-3). 고-카디널리티 인코딩은 트리 MDI 편향을 유발(PART 2-4-6, 5-3).

5. **스케일링 (Scaling)**
   - 진단 시각화: 변수별 상자그림을 한 화면에 → 단위·범위 차이 확인.
   - 처리: `StandardScaler`(표준화, 평균0·분산1), `MinMaxScaler`(0~1 정규화), `RobustScaler`(이상치에 강함).
   - 모델 연결: 거리·내적·정규화 기반 모델(KNN, SVM, 선형/Lasso/Ridge)에 **필수**, 트리 기반은 **불필요**(PART 2-5 스케일링 열). 누수 주의는 1-0-2.

6. **차원 축소 (Dimension Reduction)**
   - 진단·결과 시각화: PCA/t-SNE 2D 투영(PART 4-6) — 분석적 시각화에 해당.
   - 처리: PCA(선형), t-SNE/UMAP(비선형, 시각화 위주). 변수가 매우 많을 때 사용.
   - 피처 선택과의 차이: 차원 축소는 변수를 **합성·변형**(원본 해석 어려움), 피처 선택(PART 2)은 원본 변수 **부분집합 유지**(해석 가능). 목적에 따라 선택.

7. **피처 생성 (Feature Creation / 특성 공학)**
   - 예: 날짜에서 요일·월 추출, 두 변수의 비율·곱, 시계열의 lag·rolling 통계(PART 3-3의 tsfresh와 연결).
   - 진단 시각화: 생성한 피처와 타깃의 산점도·상자그림으로 구분력 확인.
   - 검증: 생성 후 상관 히트맵(1-8)으로 기존 변수와의 중복(다중공선성) 점검.

> 정리하면, ML1의 전처리 7항목 중 **결측치·이상치·편향치·인코딩·스케일링은 "데이터 정제"**(필수), **차원 축소·피처 생성은 "특성 공학"**(성능 개선)에 가깝다. 그리고 각 항목의 *진단*은 전처리 전 시각화(1-2~1-9)로, *확인*은 전처리 후 시각화로, *최종 결과 해석*은 PART 4로 이어진다.

---

## 1-1. 시각화의 큰 그림: 두 종류

P03 자료는 시각화를 두 갈래로 나누는 것에서 출발합니다. 캡스톤에서 어느 단계의 그림을 그리고 있는지 항상 의식하면 좋습니다.

| 구분 | 목적 | 예시 | 캡스톤에서의 위치 |
|------|------|------|-------------------|
| **기술적 시각화**<br>(Descriptive) | 데이터 자체를 보여줌 | 1변수 요약(히스토그램), 2변수 관계(산점도), 3변수 이상 | 데이터 탐색(EDA) 단계 → **PART 1** |
| **분석적 시각화**<br>(Analytical) | 모델링 과정·결과를 보여줌 | 차원 축소, 군집화, 네트워크 분석, ROC 분석 | 모델 평가·해석 단계 → **PART 4** |

데이터 종류(연속형 / 비율형 / 범주형 / 순서형, 텍스트, 시공간 등)에 따라 적절한 방법이 달라진다는 점도 자료가 강조하는 부분입니다. **1-9의 차트 선택 가이드가 바로 이 분기를 정리한 것입니다.**

> ⚠️ 솔직한 메모: P03 자료는 분석적 시각화를 "종류가 있다"고 언급만 하고 실제 코드는 거의 다루지 않습니다. 캡스톤이 머신러닝 프로젝트라면 그 빈자리를 **PART 4**에서 채웁니다.

---

## 1-2. 좋은 그림을 위한 8가지 원칙 (D02)

D02 자료의 핵심입니다. 발표·보고서 평가 기준으로 그대로 쓰일 수 있으니 그림을 완성한 뒤 체크리스트로 활용하세요.

1. **면적은 값에 정비례해야 한다.** 색칠된 영역이 수치를 나타낼 때 면적이 값과 비례해야 함. Linear Scale은 **0에서 출발**, Log Scale은 **1에서 출발**.
2. **겹치는 점은 처리한다.** 점이 겹칠 때는 투명도(`alpha`)나 지터링(jittering)을 활용.
3. **목적 없는 색은 쓰지 않는다.** 무분별한 색 사용은 금물. 범주가 많으면 색 대신 레이블을 활용.
4. **범례에 주의를 기울인다.** 범례 위치·필요성을 점검.
5. **소형 다중 패널(small multiples)은 신중하게.** 잘 디자인하지 않으면 오히려 역효과.
6. **도표와 배경 요소의 밸런스를 맞춘다.** 배경도 정보 전달에 활용 가능.
7. **선으로만 이루어진 도표는 자제한다.**
8. **3차원 도표는 자제한다.**

가장 흔한 실수는 **막대그래프를 0이 아닌 값에서 시작하는 것**입니다(D02에서 'bad' 예시로 등장). 작은 차이를 과장해 보이게 만들어 오해를 부릅니다.

---

## 1-3. 네 가지 도구의 역할 분담

| 라이브러리 | 한 줄 정의 | 언제 쓰나 |
|------------|-----------|-----------|
| **Matplotlib** | 파이썬 시각화의 기본(저수준) | 세밀한 커스터마이징, 여러 그림 배치 |
| **Pandas `.plot`** | DataFrame에서 바로 그리기 | EDA 단계의 빠른 확인 |
| **Seaborn** | 통계 그래프(Matplotlib 기반) | 통계 집계가 들어간 그림을 간결하게 |
| **Plotnine** | Grammar of Graphics (R ggplot2) | 그림을 구성요소 조합으로 체계화 |

추상화 수준은 **Matplotlib(가장 낮음) → Pandas/Seaborn → Plotnine** 순으로 올라갑니다. 낮을수록 자유롭지만 코드가 길고, 높을수록 간결하지만 제어가 줄어듭니다.

---

## 1-4. Matplotlib 핵심: Figure–Axes 구조

Matplotlib에는 두 가지 코딩 방식이 있습니다.

- **Explicit (객체지향)**: `fig, ax = plt.subplots()`로 객체를 직접 다룸. 덜 직관적이지만 커스터마이징에 유리. **캡스톤에서는 이 방식을 권장합니다.**
- **Implicit**: `plt.plot()`처럼 바로 그림. 직관적이지만 제어가 약함.

```python
import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(0, 2, 100)

# Explicit 방식 (권장)
fig, ax = plt.subplots(figsize=(5, 2.7), layout='constrained')
ax.plot(x, x,    label='linear')
ax.plot(x, x**2, label='quadratic')
ax.plot(x, x**3, label='cubic')
ax.set_xlabel('x label')
ax.set_ylabel('y label')
ax.set_title("Simple Plot")
ax.legend()
```

**Figure(전체 도화지)** 안에 하나 이상의 **Axes(개별 그림 영역, subplot)**를 둡니다. 여러 그림을 한 번에 만들려면:

```python
fig, axes = plt.subplots(2, 2)                 # 2×2 격자
axes[0, 0].plot(np.random.standard_normal(50).cumsum())  # 추세선
axes[0, 1].hist(np.random.standard_normal(100), bins=20) # 히스토그램
axes[1, 0].scatter(np.arange(30), np.arange(30) + 3*np.random.standard_normal(30))  # 산점도
```

`subplots`의 주요 옵션: `nrows`(행 수), `ncols`(열 수), `sharex`/`sharey`(축 공유 여부).

### 자주 쓰는 꾸미기

- **눈금**: `set_xticks` / `set_yticks` (위치), `set_xticklabels` (레이블, `rotation`·`fontsize` 지정 가능)
- **레이블·제목**: `set_xlabel` / `set_ylabel` / `set_title`
- **범례**: 각 그래프에 `label=`을 주고 `ax.legend()` 호출
- **색상 약어**: `b`(blue), `g`(green), `r`(red), `c`(cyan), `m`(magenta), `y`(yellow), `k`(black), `w`(white)
- **선 스타일**: `-`(solid), `--`(dashed), `-.`(dashdot), `:`(dotted)
- **저장**: `plt.savefig("fig.png", dpi=400)` — 확장자로 포맷 결정(png/pdf/svg 등)
- **전역 설정**: `plt.rc("figure", figsize=(10,10))`, `plt.rc("font", ...)`, 되돌리기 `plt.rcdefaults()`

---

## 1-5. Pandas `.plot` 빠른 시각화

DataFrame에서 메서드 한 줄로 그립니다. EDA 단계에 적합합니다.

```python
import pandas as pd

df = pd.DataFrame({'length': [1.5, 0.5, 1.2, 0.9, 3],
                   'width':  [0.7, 0.2, 0.15, 0.2, 1.1]},
                  index=['pig', 'rabbit', 'duck', 'chicken', 'horse'])

df.plot(kind="line")                  # 선그림 (기본)
df.plot.scatter("length", "width")    # 산점도
df.plot.bar()                         # 막대 / df.plot.barh() 수평막대
df.plot.hist(bins=12, alpha=0.5)      # 히스토그램
df.plot.box()                         # 상자그림
df.plot.kde(bw_method=1)              # 커널밀도
```

| 그림 | 메서드 | `kind` |
|------|--------|--------|
| 선그림 | `plot.line()` | `"line"` |
| 면적그림 | `plot.area()` | `"area"` |
| 산점도 | `plot.scatter(x, y)` | `"scatter"` |
| 막대 / 수평막대 | `plot.bar()` / `plot.barh()` | `"bar"` / `"barh"` |
| 히스토그램 | `plot.hist()` | `"hist"` |
| 파이차트 | `plot.pie()` | `"pie"` |
| 상자그림 | `plot.box()` | `"box"` |
| 밀도 / 커널밀도 | `plot.density()` / `plot.kde()` | `"density"` / `"kde"` |
| Hexbin | `plot.hexbin()` | `"hexbin"` |

---

## 1-6. Seaborn 통계 그래프

Matplotlib 기반의 통계 시각화 라이브러리로, Pandas와 긴밀히 연동되고 **통계 집계(평균, 신뢰구간 등)를 내부에서 자동 수행**합니다. 네 가지 대표 함수를 기억하면 됩니다.

```python
import seaborn as sns
sns.set_theme(style="whitegrid")   # darkgrid/whitegrid/dark/white/ticks
tips = sns.load_dataset("tips")
```

| 함수 | 용도 | 핵심 `kind` |
|------|------|-------------|
| `relplot()` | 관계(Relationship) | `"scatter"`(기본), `"line"` |
| `displot()` | 분포(Distribution) | `"hist"`(기본), `"kde"`, `"ecdf"` |
| `catplot()` | 범주형(Categorical) | `"strip"`, `"swarm"`, `"box"`, `"violin"`, `"bar"`, `"count"`, `"point"` |
| `lmplot()` | 회귀(Regression) | 산점도 + 회귀선(linear/logistic/lowess) |

```python
# 관계: 여러 변수를 색(hue)·크기(size)·패싯(col)으로 한 번에
sns.relplot(data=tips, x="total_bill", y="tip",
            col="time", hue="smoker", style="smoker", size="size")

# 분포
sns.displot(data=tips, x="total_bill", col="time", kde=True)

# 범주형
sns.catplot(data=tips, kind="violin", x="day", y="total_bill", hue="smoker")

# 회귀
sns.lmplot(data=tips, x="total_bill", y="tip", col="time", hue="smoker")
```

복합 데이터용으로 `jointplot`(관계+분포 결합), `pairplot`(산점도 행렬, 변수 간 관계를 한눈에)도 유용합니다 — EDA에서 특히 강력합니다.

```python
penguins = sns.load_dataset("penguins")
sns.pairplot(data=penguins, hue="species")   # 변수 쌍별 산점도 행렬
```

---

## 1-7. Grammar of Graphics (Plotnine)

"그림이란 무엇인가"를 체계화한 문법입니다. 차트 종류를 외우는 대신 **구성요소의 조합**으로 이해하게 해줍니다. 그림은 5요소로 이루어집니다.

1. **data** — 데이터
2. **geometric object** — 점/선/막대 등 기하 객체
3. **mapping** — 변수를 시각 속성(aesthetics: 위치·색·크기)에 대응
4. **scale & coordinate system** — 척도와 좌표계
5. **annotation** — 주석

Python 구현체는 **Plotnine**(R의 ggplot2 이식)입니다.

```python
from plotnine import ggplot, geom_point, aes, stat_smooth, facet_wrap
from plotnine.data import mtcars

(ggplot(mtcars, aes("wt", "mpg", color="factor(gear)"))
 + geom_point()
 + stat_smooth(method="lm")
 + facet_wrap("gear"))
```

`+`로 레이어를 쌓는 방식이라, "데이터 → 기하 객체 → 매핑 → 통계 변환 → 패싯"의 사고 흐름이 코드에 그대로 드러납니다.

---

## 1-8. 상관관계 히트맵 (EDA ↔ 피처 선택의 다리)

EDA와 분석적 시각화의 경계에 있는 그림입니다. 변수 간 선형 연관성(상관계수)을 한눈에 봅니다. 상관계수는 −1~+1이며, 부호는 방향, 절댓값은 강도를 나타냅니다(**선형 관계만** 측정).

```python
import matplotlib.pyplot as plt
import seaborn as sns

corr = df.corr(numeric_only=True)
fig, ax = plt.subplots(figsize=(9, 7))
sns.heatmap(corr, annot=True, fmt='.2f', cmap='coolwarm',
            center=0, vmin=-1, vmax=1, ax=ax)
ax.set_title('상관관계 히트맵')
plt.tight_layout()
plt.show()
```

> 💡 **이 그림이 PART 2(피처 선택)로 직접 이어집니다.** 강하게 상관된 변수쌍(다중공선성)을 발견하면 → 회귀에서 Ridge/Lasso 정규화나 변수 선택을 고려하는 근거가 됩니다. PART 2-6 Stage 1의 "|r| > 0.95 변수쌍 제거"가 바로 이 히트맵에서 출발합니다.

---

## 1-9. 차트 선택 가이드

"어떤 데이터일 때 어떤 차트를 쓰는가"를 의사결정 순서로 정리했습니다.

### 1-9-1. 목적별 빠른 선택표

| 무엇을 보고 싶은가 | 변수 구성 | 추천 차트 | 함수 |
|---|---|---|---|
| **한 변수의 분포** | 연속형 1개 | 히스토그램, KDE, 상자그림 | `hist`, `kde`, `box` |
| **한 변수의 빈도** | 범주형 1개 | 막대그래프, count plot | `bar`, `sns.countplot` |
| **두 연속형의 관계** | 연속 × 연속 | 산점도, hexbin(점 많을 때) | `scatter`, `hexbin` |
| **범주별 연속형 비교** | 범주 × 연속 | 상자그림, 바이올린, 막대 | `box`, `violin`, `bar` |
| **시간에 따른 추세** | 시간 × 연속 | 선그림, 면적그림 | `line`, `area` |
| **여러 변수 간 관계 한눈에** | 연속형 다수 | 산점도 행렬, 상관 히트맵 | `pairplot`, `heatmap` |
| **부분-전체 비율** | 범주형 비율 | 파이/막대 (※막대 권장) | `pie`, `bar` |
| **불확실성 표현** | 추정치 + 오차 | 오차막대, 신뢰구간 띠 | `errorbar`, `fill_between` |

### 1-9-2. 의사결정 흐름

```
1. 변수 개수는?
   ├─ 1개  → 분포를 보고 싶다 → 히스토그램 / 상자그림 / KDE
   │         빈도를 보고 싶다 → 막대그래프
   ├─ 2개  → 연속 × 연속 → 산점도 (점 많으면 hexbin / hist2d)
   │         범주 × 연속 → 상자그림 / 바이올린 / catplot
   │         시간 × 연속 → 선그림
   └─ 3개+ → 색(hue)·크기(size)·패싯(col)으로 차원 추가
             또는 산점도 행렬(pairplot) / 차원 축소(PCA, t-SNE)

2. 머신러닝 결과인가?  → PART 4로
   ├─ 분류 → 혼동행렬 + ROC/AUC (불균형이면 PR곡선)
   ├─ 회귀 → 실제값vs예측값 산점도 + 잔차 플롯
   ├─ 해석 → 특성 중요도
   └─ 비지도 → 차원 축소 산점도 / 군집 결과
```

### 1-9-3. 데이터 종류별 주의점

- **연속형**: 산점도·히스토그램·상자그림. 점이 너무 많으면 `alpha`(투명도)나 hexbin으로.
- **범주형**: 막대·count plot. 범주가 많으면 정렬 후 수평막대(`barh`)가 읽기 좋음.
- **순서형**: 범주의 **순서를 유지**해서 정렬(알파벳순 자동 정렬 주의).
- **시공간**: 선그림(시간), 지도 기반(공간).

### 1-9-4. 피해야 할 것 (D02 원칙 재확인)

- ❌ 막대그래프 y축을 0이 아닌 곳에서 시작 (차이 과장)
- ❌ 3차원 효과 차트 (왜곡·가독성 저하)
- ❌ 의미 없는 색 남발
- ❌ 부분-전체 비교에 조각 많은 파이차트 (각도 비교는 부정확 → 막대 권장)
- ❌ 겹친 점을 그대로 방치 (투명도/지터링으로 처리)

---

<a name="part-2"></a>
# PART 2 — 피처 선택 (Feature Selection)

> `feature_selection`·`ANOVA`·`TreeBased_Models` 강의 자료 기반. **모델이 무엇을 가정하느냐 + 데이터가 어떤 타입이냐**가 방법을 결정합니다.

## 2-0. TL;DR

- **모델이 무엇을 가정하느냐**가 피처 선택 방법을 결정한다. 선형성을 가정하는 모델(Linear/Logistic/Ridge/Lasso/SVM-linear)은 **L1 임베디드 + Pearson/F-test 필터**가 표준, 트리 기반 모델(DT/RF/GBDT/XGBoost/LightGBM)은 **임베디드 중요도(MDI/Gain) + 검증용 permutation/SHAP**이 표준, 거리 기반 모델(KNN, RBF-SVM)은 **반드시 스케일링 + 필터/Wrapper(RFE)**가 표준이다.
- **MDI(불순도 기반 중요도)는 고-카디널리티·연속형 변수에 편향**된다(Strobl, Boulesteix, Zeileis & Hothorn 2007, *BMC Bioinformatics* 8:25; scikit-learn 공식 문서가 동일하게 명시). Random Forest·GBDT의 최종 피처 선택에는 **permutation_importance(검증셋 기준)** 또는 **TreeSHAP**을 함께 사용해야 한다.
- **데이터 타입이 필터 함수를 정한다**: 연속 X – 범주 y → ANOVA F (`f_classif`), 범주 X – 범주 y → χ²/Cramér's V (`chi2`), 연속 X – 연속 y → Pearson/Spearman (`f_regression`), 비선형 관계 의심 시 → Mutual Information(`mutual_info_*`).

---

## 2-1. 5가지 핵심 결정 원칙

1. **피처 선택은 "범용 정답"이 없다.** Guyon & Elisseeff(JMLR 2003, "An Introduction to Variable and Feature Selection")가 정리한 대로, 선택은 (a) 모델의 가정, (b) 데이터 타입, (c) 계산 비용 제약, (d) 해석 목적의 4가지 축에서 결정된다.
2. **선형 모델 계열은 L1(Lasso)이 "임베디드 피처 선택"의 표준**이다. Lasso는 계수를 정확히 0으로 만들지만 상관 높은 변수 중 **하나만 임의로 선택**하는 약점이 있어, 다중공선성이 강하면 Elastic Net(Zou & Hastie 2005)을 쓴다.
3. **트리 모델은 임베디드 중요도가 "공짜로" 나오지만 편향이 있다.** scikit-learn 공식 문서: *"impurity-based feature importance for trees is strongly biased and favor high cardinality features (typically numerical features) over low cardinality features such as binary features or categorical variables with a small number of possible categories."* **반드시 hold-out에서 `permutation_importance` 또는 SHAP으로 교차검증**해야 한다.
4. **거리·내적 기반 모델(KNN, SVM-RBF, Ridge·Lasso 그 자체)은 스케일에 민감**하다. 피처 선택 *전에* `StandardScaler`/`MinMaxScaler`를 적용하지 않으면 큰 스케일 변수가 거리·계수·정규화 페널티를 지배한다.
5. **Filter → Wrapper/Embedded의 2단계 파이프라인**이 실무 표준이다. Filter로 명백한 노이즈를 빠르게 거른 뒤, 모델 종속적인 Embedded/Wrapper로 미세 조정. Peng, Long & Ding(IEEE TPAMI 2005)의 mRMR도 본질적으로 "Relevance 최대화 + Redundancy 최소화"의 2단계 사고방식이다.

---

## 2-2. Filter / Wrapper / Embedded 3대 가족과 트레이드오프

| 가족 | 대표 기법 | 장점 | 단점 | scikit-learn |
|---|---|---|---|---|
| **Filter** | Variance Threshold, Pearson, Spearman, t-test, ANOVA F, χ², Mutual Information, Fisher Score, mRMR | 모델 독립적, 매우 빠름, 과적합 위험 적음 | 변수 간 상호작용·중복 무시(단변량) | `VarianceThreshold`, `SelectKBest(f_classif/f_regression/chi2/mutual_info_*)` |
| **Wrapper** | SFS, SBE, Stepwise, RFE, Exhaustive | 모델 성능 직접 최적화 | 매우 느림, 과적합 위험 | `SequentialFeatureSelector`, `RFE`, `RFECV` |
| **Embedded** | Lasso(L1), Ridge(L2), Elastic Net, Tree MDI, GBDT Gain | 학습 중 동시 선택, 효율적 | 모델에 종속, 편향 가능(MDI 등) | `SelectFromModel(Lasso/Logistic/LinearSVC/RandomForest/GBR)` |

**선택 기준**: 변수 ≥ 수만 개 → Filter 우선. 변수 ~수십~수백, 시간 충분 → Wrapper(RFECV). 변수 중간 규모, 모델이 이미 정해짐 → Embedded.

---

## 2-3. 데이터 타입에 따른 Filter 함수 매트릭스

scikit-learn `feature_selection` 모듈 기준. **이 표가 PART 1(EDA)에서 파악한 데이터 타입과 직결됩니다.**

| X(피처) | y(타깃) | 권장 점수 함수 | scikit-learn API | 비고 |
|---|---|---|---|---|
| 연속 | 연속 (회귀) | **Pearson / F-test** | `f_regression`, `r_regression` | 선형 관계 가정 |
| 연속 | 연속 (회귀) | **Spearman / MI** | `mutual_info_regression` | 비선형 관계, 순위 기반 |
| 연속 | 범주 (분류) | **ANOVA F-test** | `f_classif` | 그룹 평균 차이 검정 |
| 연속 | 범주 (분류, 2그룹) | **t-test** | (scipy) | ANOVA의 2-그룹 특수 케이스 |
| 범주 | 범주 (분류) | **χ²/Cramér's V** | `chi2` | 단, `chi2`는 **음수 불가** (one-hot/카운트만) |
| 범주 | 연속 (회귀) | **ANOVA F (역방향)** | `f_regression` after encoding | y를 기준으로 그룹화하는 ANOVA 해석 |
| 모두 | 모두 (비선형) | **Mutual Information** | `mutual_info_classif`, `mutual_info_regression` | 모든 의존성 포착, 비모수 |

**One-Way ANOVA 보충**: F = (그룹간 분산)/(그룹내 분산). 귀무가설 H₀: 모든 그룹 평균이 같다. F가 크고 p<α 면 해당 피처는 클래스 구분력이 있다. sklearn `f_classif`가 정확히 이 값을 반환한다. 사후검정(Tukey HSD)은 어느 클래스 쌍에서 차이가 나는지 확인할 때 사용.

**중요한 함정**:
- scikit-learn 공식 문서: *"Beware not to use a regression scoring function with a classification problem, you will get useless results."*
- F-test는 **선형 의존성**만 잡는다. y = sin(2πx) 같은 관계는 F≈0, MI=높음 (scikit-learn 공식 예제 `plot_f_test_vs_mi`).
- `chi2`는 비음수 행렬만 받음 → 표준화 전 raw count/one-hot에서만 사용.

---

## 2-4. 모델별 권장 피처 선택 방법

### 2-4-1. Linear Regression / Logistic Regression

**권장 순서**:
1. (필수) 표준화 `StandardScaler`
2. Filter: `f_regression`(회귀) / `f_classif`(분류) 또는 Pearson 상관 계수
3. Embedded: **L1 페널티(Lasso, LogisticRegression(penalty='l1'))** → `SelectFromModel`
4. Wrapper(선택): `RFE` with LinearRegression/LogisticRegression (계수 기반 랭킹)

**근거**: 선형 모델의 계수는 곧 피처 중요도이므로 L1 정규화가 자연스러운 피처 선택기다. scikit-learn 공식 문서: *"Linear models penalized with the L1 norm have sparse solutions: many of their estimated coefficients are zero."*

**주의**:
- **다중공선성**: VIF > 10 또는 상관 |r| > 0.8 짝은 사전에 제거하거나 Elastic Net으로 가야 함.
- 스케일링은 필수. 그렇지 않으면 L1/L2 페널티가 큰 스케일 변수에 비비례적으로 작용.

### 2-4-2. Lasso (L1) / Ridge (L2) / Elastic Net — 임베디드 선택의 본가

| 방법 | 페널티 | 피처 선택? | 다중공선성 처리 | 언제 쓰나 |
|---|---|---|---|---|
| **Ridge** | L2: ∑βⱼ² | **아니오** (0으로 안 만듦) | **우수** (상관 변수에 계수를 분산) | 모든 변수가 유효하다고 믿을 때, 다중공선성 안정화 |
| **Lasso** | L1: ∑\|βⱼ\| | **예** (희소 해) | 약함 — 상관 그룹에서 **하나만 임의 선택** | 노이즈 변수 多, 희소 모델·해석 우선 |
| **Elastic Net** | αL1 + (1−α)L2 | **예** | **우수** — 상관 그룹을 함께 선택/축소 | p ≫ n, 상관 그룹 존재, Lasso가 너무 적게 고를 때 |

Zou & Hastie(2005, *JRSSB* 67:301–320): "The elastic net is particularly useful when the number of predictors (p) is much bigger than the number of observations (n)."

**실무 의사결정**:
- 변수가 거의 모두 의미 있을 것 같다 → Ridge (`alpha`만 CV로 튜닝)
- 변수 중 일부만 진짜라고 본다 → Lasso (`LassoCV`)
- 상관 그룹이 있고, Lasso가 너무 공격적으로 제거하거나 매 실행마다 다른 변수를 고름 → Elastic Net (`ElasticNetCV`, `l1_ratio` 추가 튜닝)
- 피처 선택만 따로 → `SelectFromModel(LassoCV())`로 0이 아닌 계수만 추출 후 다른 모델에 투입

**scikit-learn 공식 경고**: Lasso 회복 정확도는 (1) 표본 수가 충분히 클 것, (2) 설계 행렬이 너무 상관되지 않을 것을 요구. 따라서 강한 다중공선성에서는 **Lasso 단독 사용을 피하라**.

### 2-4-3. Support Vector Machine (SVM / SVR)

**선형 커널**: 가중치 벡터 |wⱼ|가 피처 중요도 → **SVM-RFE** (Guyon, Weston, Barnhill & Vapnik 2002, "Gene selection for cancer classification using support vector machines", *Machine Learning* 46, 389–422).
- scikit-learn: `RFE(estimator=LinearSVC(...))` 또는 `RFECV`
- 또는 `LinearSVC(penalty='l1', dual=False)` + `SelectFromModel` (L1-SVM, 임베디드)

**비선형 커널(RBF, Polynomial)**: 가중치 해석 불가 →
- Filter 선처리(MI, ANOVA F)
- Wrapper: SFS/RFE의 비선형 변형 (계산 비용 큼)
- Permutation Importance (모델 종속적이지만 비선형 SVM에 가능)

**필수 전처리**: SVM은 거리/내적 기반 → **반드시 표준화**. 그렇지 않으면 큰 스케일 변수가 마진 결정.

### 2-4-4. K-Nearest Neighbors (KNN)

KNN은 거리 함수(유클리드, 민코프스키)로 이웃을 정의하므로 **모든 피처가 거리 계산에 동등 가중**된다. 따라서:

**필수 1단계 — 스케일링**: scikit-learn `KNeighborsClassifier` 공식 문서가 권장하는 대로, 큰 스케일 변수가 거리 계산을 지배하므로 `StandardScaler` 또는 `MinMaxScaler` 적용이 사실상 필수다.

**필수 2단계 — 피처 선택**:
- Filter 우선: ANOVA F, MI(비선형) — 빠르고 모델 독립적
- Wrapper: SFS/SBE (KNN을 estimator로 `SequentialFeatureSelector`)
- 대체: Random Forest의 중요도 또는 permutation importance로 **다른 모델로 선택 후 KNN 학습**(surrogate model 접근)

**이유**: KNN은 자체 임베디드 선택 메커니즘이 없고, 차원의 저주에 가장 취약하다. 노이즈 피처가 거리를 흐려놓으면 성능이 급락하므로, **차원 축소가 KNN에는 다른 어떤 모델보다 중요**.

### 2-4-5. Decision Tree (CART)

단일 트리는 분할 기준(Gini, Entropy, MSE)에서 자체적으로 피처를 선택한다. 그러나:

- 단일 트리의 `feature_importances_`(MDI)는 분산이 크고 안정성 낮음 → 여러 트리(RF)나 부스팅으로 확장하는 것이 통상.
- 학습 데이터로 계산되어 과적합 반영.

**권장**:
- 작은 트리 + `max_depth`/`min_samples_leaf`로 자체 정규화 → 사실상 임베디드 선택
- 외부 피처 선택을 추가하려면 Filter(F-test, MI) + 트리

**조건부 추론 트리(ctree, mob; Hothorn, Hornik & Zeileis 2006)와 편향 없는 재귀 분할**: Strobl 등이 지적한 분할 변수 선택 편향(고-카디널리티 선호)을 통계적 검정으로 해소.

### 2-4-6. Random Forest

**기본 임베디드 중요도**:
- **MDI (Mean Decrease in Impurity, scikit-learn 기본 `feature_importances_`)** — 빠름, 학습 중 자동 계산.
- **Permutation Importance (MDA, Mean Decrease in Accuracy)** — Breiman 원논문(2001)에서 제안. OOB 또는 hold-out에서 변수 값을 무작위 셔플 후 성능 저하량.

**MDI의 치명적 편향 (Strobl, Boulesteix, Zeileis & Hothorn 2007, *BMC Bioinformatics* 8:25, DOI 10.1186/1471-2105-8-25)**:
- 초록: *"random forest variable importance measures are a sensible means for variable selection in many applications, but are not reliable in situations where potential predictor variables vary in their scale of measurement or their number of categories."*
- 결과 섹션: *"the Gini importance shows a strong preference for variables with many categories and the continuous variable … We conclude that the Gini importance cannot be used to reliably measure variable importance in this situation either."*
- scikit-learn 공식 문서가 동일하게 경고: *"impurity-based feature importance for trees is strongly biased and favor high cardinality features (typically numerical features) over low cardinality features such as binary features or categorical variables with a small number of possible categories."*
- 원인: 분할점이 많은 변수일수록 우연히 좋은 분할을 찾을 확률(다중 검정 효과)이 높음 → 더 자주 선택됨.

**권장 워크플로우**:
1. RF 학습 → MDI로 1차 스크리닝(빠르게 명백히 무관한 변수 제거).
2. **`sklearn.inspection.permutation_importance`를 hold-out에서 실행** (n_repeats=10~30) → 진짜 중요도 추정.
3. 상관 높은 변수는 **클러스터링 후 그룹당 1개만 유지** (scikit-learn 공식 가이드 *Permutation Importance with Multicollinear or Correlated Features* 권장 방법). 또는 Strobl & Boulesteix의 **conditional permutation importance**(R의 `party::cforest`).
4. 최종 선택: `SelectFromModel(RandomForestClassifier, threshold='median')`.

### 2-4-7. Gradient Boosting (sklearn GBDT) / XGBoost / LightGBM

세 라이브러리 모두 트리 기반이지만 **중요도 정의가 미묘하게 다르다**:

| 라이브러리 | importance_type | 정의 (공식 문서 원문) |
|---|---|---|
| sklearn `GradientBoosting*` | `feature_importances_` | MDI (불순도 감소 합) |
| **XGBoost** | `'weight'` | *"the number of times a feature is used to split the data across all trees"* |
| XGBoost | `'gain'` | *"the average gain across all splits the feature is used in"* |
| XGBoost | `'cover'` | *"the average coverage across all splits the feature is used in"* |
| XGBoost | `'total_gain'` | *"the total gain across all splits the feature is used in"* |
| XGBoost | `'total_cover'` | *"the total coverage across all splits the feature is used in"* |
| **LightGBM** | `'split'` (default) | *"result contains numbers of times the feature is used in a model"* |
| LightGBM | `'gain'` | *"result contains total gains of splits which use the feature"* |

(출처: XGBoost 공식 문서 `xgboost.Booster.get_score` / `XGBModel.feature_importances_`, LightGBM 공식 문서 `Booster.feature_importance`. 주의: XGBoost의 `'gain'`은 평균인 반면 LightGBM의 `'gain'`은 합 — 명세가 다르다.)

**핵심 권장 — Gain 우선**:
- `'weight'` / `'split'`: 사용 횟수만 셈 → **연속형/고-카디널리티 변수에 편향** (XGBoost 가이드: *"Weight measures the number a times a feature occurs in the model. Due to the way the model builds trees, this value is skewed in favor of continuous features"*).
- `'gain'` (XGBoost) 또는 `'gain'`/`'total_gain'` (LightGBM): 손실 감소량 → **예측력에 더 직접적**이고 일반적으로 권장.
- `'cover'`: 영향받는 샘플 수 → 보조적.

**그러나 Gain도 일관성 부족 문제**: Lundberg, Erion & Lee(2019, arXiv:1802.03888, "Consistent Individualized Feature Attribution for Tree Ensembles")는 다음을 명시했다: *"the feature importance values from the gain, split count, and Saabas methods are all inconsistent. This means that a model can change such that it relies more on a given feature, yet the importance estimate assigned to that feature decreases."* SHAP은 이 일관성 공리를 만족하는 유일한 해다(Lundberg & Lee 2017, NeurIPS).

**최종 권장**:
- 빠른 1차 스크리닝: XGBoost/LightGBM의 `gain`
- **모델 디버깅·해석·논문/보고서 용도: TreeSHAP** (`shap.TreeExplainer`) — 일관성 있고 국소·전역 모두 제공.
- 검증: `permutation_importance`를 hold-out에서.
- 피처 *선택* 자동화: `SelectFromModel(XGBClassifier(), threshold='median')` 또는 RFE w/ XGBoost.

**스케일링 불필요** — 트리 기반 모델은 단조 변환에 불변(분위수 기반 분할).

### 2-4-8. Naive Bayes

Naive Bayes는 피처 독립을 *가정*하므로 **상관 높은/중복 피처에 특히 취약**. 텍스트 분류에서 가장 자주 쓰이며, 표준 선택법은:
- **χ² 검정** (`chi2`) — 텍스트 분류 문헌에서 가장 일관되게 좋은 성능 (Forman 2003 *JMLR*; Yang & Pedersen 1997 ICML). 비음수 카운트 데이터에 자연스럽게 부합.
- **Mutual Information** (`mutual_info_classif`)
- **Information Gain** — 본질적으로 MI와 동등.

연구 비교(Párraga-Valle, García-Bermúdez, Rojas, Torres-Morán & Simón-Cuevas 2020, "Evaluating Mutual Information and Chi-Square Metrics in Text Features Selection Process: A Study Case Applied to the Text Classification in PubMed", *IWBBIO 2020 LNCS* 12108:636–646): *"Chi-square obtained the highest accuracy scores in documents classification by using a multinomial naive Bayes classifier."*

**Variance Threshold**(`VarianceThreshold`)로 0-거의 0 분산 단어 사전 제거도 권장.

**스케일링 불필요** (GaussianNB은 변수별 정규분포 적합).

### 2-4-9. Neural Networks (간단)

기본적으로 NN은 자체 표현 학습으로 변수 가중을 학습하지만, **소규모/표 형식 데이터·해석 필요 시**:
- **L1 정규화** (입력층 가중치): keras `kernel_regularizer=l1(...)` → 임베디드 선택
- **Group Lasso**(같은 입력 변수에 연결된 모든 가중치를 그룹) — Lemhadri et al. LassoNet 등
- 외부 도구: **permutation importance**, **SHAP(DeepExplainer/GradientExplainer)**, **Integrated Gradients**(Sundararajan, Taly & Yan 2017 ICML)
- 입력 게이트/주의(attention) 기반의 **Concrete Dropout, Gumbel-Softmax feature selection** (DeepPINK, STG 등)

**실용 권장**: 표 형식 데이터에서 변수 100~1000개라면, **XGBoost/LightGBM으로 피처 중요도를 산출 후 NN 학습** 또는 **L1 정규화 입력층**으로 시작하는 것이 가장 비용 대비 효과적.

---

## 2-5. Summary Decision Matrix — 모델 → 권장 피처 선택 방법

| 모델 | 1차 권장 (Embedded/내장) | 2차 권장 (Filter/외부) | Wrapper 옵션 | 스케일링 필요? | 핵심 주의사항 |
|---|---|---|---|---|---|
| **Linear Regression** | Lasso(L1) `SelectFromModel(LassoCV)` | `f_regression`, Pearson | RFE | ✅ 필수 | 다중공선성 시 Elastic Net |
| **Logistic Regression** | L1-Logistic `LogisticRegression(penalty='l1')` | `f_classif`, MI | RFE | ✅ 필수 | 다중공선성 시 Elastic Net |
| **Ridge (L2)** | (선택 안 함, 계수 축소만) | `f_regression`/외부 Filter | RFE 가능 | ✅ 필수 | 피처 선택이 목적이면 Ridge ❌, Lasso/EN으로 |
| **Lasso (L1)** | 자체 임베디드 | — | — | ✅ 필수 | 상관 그룹에서 1개 임의 선택; α는 CV |
| **Elastic Net** | 자체 임베디드 | — | — | ✅ 필수 | l1_ratio·alpha 함께 CV |
| **SVM (선형)** | L1-LinearSVC, **SVM-RFE** | `f_classif`/MI | RFE | ✅ 필수 | Guyon et al. 2002 원조 |
| **SVM (RBF/비선형)** | (직접 임베디드 없음) | MI, ANOVA F | SFS, Permutation 기반 | ✅ 필수 | 가중치 해석 불가 |
| **Decision Tree** | MDI (단, 분산 큼) | F-test, MI | — | ❌ 불필요 | 단일 트리는 불안정 → 앙상블 권장 |
| **Random Forest** | MDI(1차) → **Permutation Importance(검증)** | MI | — | ❌ 불필요 | **MDI는 고-카디널리티·연속형 편향**; hold-out permutation 필수 |
| **GBDT (sklearn)** | MDI | — | — | ❌ 불필요 | RF와 동일한 편향 주의 |
| **XGBoost** | `gain` / `total_gain` → **TreeSHAP** | — | RFE w/ XGB | ❌ 불필요 | `weight`는 연속형 편향; SHAP이 일관성 보장 |
| **LightGBM** | `gain` → **TreeSHAP** | — | RFE w/ LGB | ❌ 불필요 | `split`(default)은 편향, 명시적으로 `importance_type='gain'` 지정 권장 |
| **KNN** | (임베디드 없음) | **MI, ANOVA F**(필수) | SFS, RFE w/ 다른 모델 | ✅✅ 매우 필수 | 차원의 저주 가장 강함 |
| **Naive Bayes** | (간접) | **χ², MI** | — | ❌ (GaussianNB 제외) | 상관 변수에 취약, 사전 중복 제거 |
| **Neural Net (tabular)** | L1 입력 정규화, LassoNet | XGBoost로 사전 선택 | — | ✅ 필수 | 작은 데이터에서는 XGB→NN 파이프라인 추천 |

---

## 2-6. 단계별 적용 가이드

**Stage 1 — 데이터 정리·기본 필터 (모든 모델 공통)**
1. `VarianceThreshold(threshold=0)`로 상수 변수 제거.
2. Pearson/Spearman으로 |r| > 0.95인 변수 쌍에서 1개씩 제거(중복 변수). → **PART 1-8 상관 히트맵에서 출발**.
3. 데이터 타입에 맞는 단변량 점수: 회귀면 `f_regression`+`mutual_info_regression`, 분류면 `f_classif`+`mutual_info_classif` (또는 `chi2`). 상위 50~70%만 유지.

**Stage 2 — 모델군별 분기**
- **선형/SVM-linear 후보**: `StandardScaler` → `LassoCV` 또는 `ElasticNetCV` → 0이 아닌 계수 유지.
- **트리/부스팅 후보**: 모델 학습 → MDI/gain으로 1차 → hold-out에서 `permutation_importance` → 일치하지 않으면 SHAP으로 결정.
- **KNN 후보**: `StandardScaler` 후 MI 기반 상위 20~30% 또는 XGBoost importance로 사전 선택.

**Stage 3 — 검증**
- 선택된 부분집합에서 교차검증 점수가 *유지/향상*되는지 확인 (피처 수↓, 성능 유지 = 성공).
- 최종 보고에는 **Permutation Importance** 또는 **SHAP summary plot**으로 시각화 (Molnar, *Interpretable Machine Learning*). → **PART 4-5와 연결**.

**언제 권장이 바뀌나 — 임계값**
- 변수 수 > 1000: Filter(특히 mRMR/MI) 비중↑, Wrapper 사실상 포기.
- 표본 < 변수 수 (p ≫ n, 예: 유전체): **Elastic Net** 또는 **SVM-RFE** 강력 권장.
- 다중공선성 VIF > 10: Lasso 단독 금지 → Elastic Net 또는 Ridge+외부 선택.
- 범주형 변수의 카디널리티 > 20: RF/GBDT의 MDI 사용 금지 → permutation 또는 SHAP.

---

<a name="part-3"></a>
# PART 3 — 모델 선택과 AutoML

> AutoML 도구 조사(2026년 5월 기준) 기반. **정형 데이터 분류 + 시계열 분류**를 중심으로 정리합니다. 환경 가정: 학부 캡스톤, RTX TITAN 24GB GPU 보유.

## 3-0. TL;DR

- **정형 데이터 분류라면 AutoGluon(TabularPredictor)을 메인 베이스라인으로, PyCaret을 EDA·해석용으로 병행**하는 2-트랙 전략이 학부 캡스톤에 가장 효율적이다. AutoGluon 1.2 릴리스 노트에 따르면 "Across all of 2024, AutoGluon was used to achieve a top 3 finish in 15 out of 18 tabular Kaggle competitions, including 7 first place finishes, and was never outside the top 1% of private leaderboard placements"로, 정형 데이터에서 사실상의 SOTA다.
- **시계열 분류(TSC)는 일반 AutoML 도구로 풀면 안 된다.** Auto-PyTorch는 TSC를 공식 지원하지 않으며("mainly developed to support tabular data (classification, regression) and time series data (forecasting)"), 정답은 `aeon` 라이브러리의 MultiRocket/HIVE-COTE 2.0 + (RTX TITAN 활용) `tsai`의 InceptionTime 비교다. 각 row가 하나의 독립 시계열인 "panel" 구조라면 일반 StratifiedKFold가 맞고, TimeSeriesSplit은 **틀린 선택**이다.
- **부스팅이 잘 안 맞는 경우(소량/노이즈/고차원 희소/순서 의존성)는 흔하며, AutoML은 "베이스라인 + 진단" 도구로 쓸 때 가장 가치가 크다.** AutoML 결과를 무비판적으로 보고서에 옮기지 말고, Baseline → AutoML 리더보드 → 수동 재현·튜닝의 3단계로 정당화하라.

---

## 3-1. AutoML이란 무엇이며, 왜 쓰는가

AutoML(Automated Machine Learning)은 ML 파이프라인의 반복적·전문적 단계를 자동화하는 도구 카테고리다. 자동화 범위는 **(a) 데이터 전처리(결측치 처리, 인코딩, 스케일링), (b) 피처 엔지니어링, (c) 모델 선택(LightGBM/XGBoost/CatBoost/RF/선형/딥러닝 등), (d) 하이퍼파라미터 튜닝(Bayesian/Optuna/유전 알고리즘/CFO 등), (e) 앙상블·스태킹, (f) 일부 도구는 배포·해석까지** 포괄한다. mljar의 정리는 "AutoML systems can choose algorithms, tune their hyperparameters, and handle data preprocessing and feature engineering"이라고 요약한다.

**일반 ML과의 차이**는 "탐색 공간을 사람이 직접 코딩으로 정의하느냐, 시스템이 자동 탐색하느냐"다. scikit-learn으로 RandomForest, GradientBoosting을 하나씩 fit·평가하던 방식이 지금까지 한 작업이라면, AutoML은 "데이터 + 시간 예산 → 리더보드"를 단 3–5줄로 출력한다.

**학생 프로젝트 관점의 장단점:**
- 장점: ① 강력한 베이스라인을 빠르게 확보(보고서 baseline 섹션 자동 작성 가능), ② "어떤 모델 군이 이 데이터에서 잘 작동하는지" 진단, ③ 자동 EDA/SHAP/feature importance 리포트(MLJAR·PyCaret), ④ 발표 시 "모델 선택의 근거"를 데이터로 제시 가능.
- 단점: ① 시간 예산이 부족하면 결과가 임의적으로 변동, ② 데이터 누수(data leakage)나 잘못된 CV 분할은 자동으로 잡아주지 않음, ③ "왜 그 모델이 이겼는가"에 대한 해석은 여전히 학생 몫, ④ 블랙박스 신뢰는 캡스톤 평가에서 감점 요인.

---

## 3-2. 2025–2026년 주요 AutoML 라이브러리 비교 (정형 데이터)

| 도구 | 개발사/관리상태 | 핵심 강점 | 약점 | GPU | 학습곡선 | 한국어 자료 |
|---|---|---|---|---|---|---|
| **AutoGluon 1.5** (2025) | AWS, 활발 | 다층 스태킹, AMLB 1위, Kaggle 우승 다수, TabPFNv2·TabM·Mitra 등 신형 모델 자동 포함 | 학습·추론 자원 큼, Windows 공식 미지원 | 지원(FT-Transformer, AG_AUTOMM, FastAI NN, NN_TORCH) | 낮음(3줄) | 풍부(SmileShark, AWS 한국어 docs) |
| **PyCaret 3.x** | 커뮤니티, 활발 | 한 줄 `setup()`+`compare_models()`로 16종 모델 비교, SHAP·plot_model 내장, 한국어 문서 | 정확도는 AutoGluon보다 낮은 편, 매우 큰 데이터는 느림 | 부분 지원(LightGBM·XGBoost GPU 모드) | 매우 낮음 | 매우 풍부(Velog, Dacon, jaeworld) |
| **H2O AutoML** | H2O.ai, 활발 | JVM 기반 대규모 데이터, 리더보드·해석 강력 | JVM 설치 부담, 딥러닝 약함 | 일부 | 중간 | 보통 |
| **FLAML 2.x** | Microsoft, 활발 | 시간/메모리 예산 기반 비용효율 탐색(CFO/BlendSearch), scikit-learn 스타일 3줄 | 단순 앙상블, 시각화 약함 | LightGBM/XGBoost GPU 가능 | 매우 낮음 | 보통 |
| **MLJAR Supervised** | MLJAR, 활발 | Explain/Perform/Compete/Optuna 4모드, **Markdown 리포트 자동 생성**(보고서 직결!) | 속도 느림 | 부분 | 낮음 | 적음 |
| **LightAutoML (LAMA)** | Sber, 유지보수 보통 | 빠른 Linear+LGBM 스택, 금융권 검증 | 영어 자료 적음, 커뮤니티 작음 | 부분 | 중간 | 적음 |
| **TPOT** | Olson 등, 활발 | 유전 프로그래밍으로 sklearn 파이프라인 자동 작성·export | AMLB에서 실패율 높음, 시간 예산 초과 빈번 | X | 중간 | 보통 |
| **Auto-sklearn** | Freiburg AutoML, **유지보수 비활성**(Snyk: "Inactive", 12개월 새 PyPI 릴리스 없음) | 베이지안 최적화 메타러닝 | 최신 sklearn 호환성 문제, 설치 까다로움 | X | 높음 | 적음 |
| **Google Vertex AI AutoML** | Google Cloud | 노코드 UI, 자동 배포 | 유료, 캡스톤 예산 부담, 블랙박스 정도 큼 | 클라우드 | 매우 낮음(UI) | 보통 |

**캡스톤 추천 1순위 = AutoGluon, 2순위 = PyCaret(혹은 MLJAR Compete 모드).** 이유는 (a) AutoGluon은 2024 AMLB 벤치마크에서 모든 시간 예산에서 통계적으로 1위(Nemenyi post-hoc test 기준), (b) PyCaret/MLJAR은 자동 시각화·Markdown 리포트가 발표 슬라이드에 그대로 들어간다는 점이다. Auto-sklearn은 활발히 유지되지 않으므로 학부 신규 프로젝트에서는 피하는 것이 좋다.

---

## 3-3. 시계열 분류(TSC) 전용 라이브러리

**중요: 일반 AutoML(PyCaret, AutoGluon Tabular 등)에 시계열 raw 신호를 그대로 넣으면 안 된다.** 시계열은 (a) 피처 추출 후 정형화하거나 (b) TSC 전용 모델을 써야 한다.

**(1) aeon-toolkit (sktime의 후속, 2026년 활발 개발):**
- scikit-learn API와 호환, 3D numpy 패널 `(n_cases, n_channels, n_timepoints)` 입력
- ROCKET / MiniROCKET / MultiROCKET / HIVE-COTE 2.0 / InceptionTime / WEASEL 등 광범위 구현
- 공식 인용: Middlehurst et al., "aeon: a Python Toolkit for Learning from Time Series," *Journal of Machine Learning Research* vol. 25, no. 289, pp. 1–10 (2024) — http://jmlr.org/papers/v25/23-1444.html
- GitHub: https://github.com/aeon-toolkit/aeon

**(2) sktime:** aeon의 모태. 여전히 유지되지만 TSC 최신 알고리즘 구현은 aeon으로 이동 중. 학생이 검색하면 둘 다 나오는데, **신규 프로젝트는 aeon을 권장**한다.

**(3) tsai (PyTorch/fastai):**
- RTX TITAN 24GB와 가장 잘 맞는 선택. InceptionTime, TST(Transformer), PatchTST, MiniRocket까지 한 API로 제공
- `learn.fit_one_cycle()`이 자동으로 GPU 사용
- 공식 사이트: https://timeseriesai.github.io/tsai/

**(4) Auto-PyTorch:** README에 "Auto-PyTorch is mainly developed to support tabular data (classification, regression) and time series data (forecasting)"라고 명시되어 있어 **TSC는 공식 지원하지 않는다**. "Auto-PyTorch-TSC"라는 별도 패키지/논문은 존재하지 않는다. 따라서 TSC AutoML이 필요하면 aeon + Optuna를 직접 조합하거나 tsai의 학습률·아키텍처 grid를 수동으로 돌리는 것이 현실적이다.

**(5) tsfresh + AutoML 조합:** tsfresh로 수백 개 통계·스펙트럼 피처를 자동 추출 → 정형 데이터로 변환 → AutoGluon/PyCaret에 투입. **이것이 학부생에게 가장 권장되는 실용적 우회 경로**다.

**TSC SOTA(2024 Bake-Off Redux, Middlehurst, Schäfer & Bagnall, *Data Mining and Knowledge Discovery* vol. 38, no. 4, pp. 1958–2031, 2024, DOI:10.1007/s10618-024-01022-1 / arXiv:2304.13029):** UCR 112개 데이터셋에서 저자들은 "two recently proposed algorithms, MultiROCKET+Hydra (Dempster et al, 2022) and HIVE-COTEv2 (Middlehurst et al, 2021), perform significantly better than other approaches on both the current and new TSC problems"라고 결론지었다. 그 아래로 MultiROCKET > InceptionTime ≈ MiniROCKET이 강한 베이스라인이다. **HIVE-COTE 2.0은 정확도 최강이나 매우 느리다** — arXiv:2512.06666v1은 "HIVE-COTE 2.0 requires 340 hours to train on the 112-dataset UCR benchmark compared to 2.85 hours for efficient single-algorithm approaches like ROCKET"이라고 보고한다. 따라서 **MultiRocket은 GPU 없이 분 단위로 학습 가능해 캡스톤에 최적**이며, RTX TITAN이 있다면 **InceptionTime(tsai)을 GPU로 추가 비교**해 발표에서 "전통 vs 딥러닝" 대비를 살리는 것을 권장한다.

**aeon TSC quickstart 코드 (공식 GitHub README):**
```python
from aeon.classification.convolution_based import RocketClassifier
from aeon.datasets import load_gunpoint
X_train, y_train = load_gunpoint(split="train")
X_test,  y_test  = load_gunpoint(split="test")
clf = RocketClassifier()
clf.fit(X_train, y_train)
print("Accuracy:", clf.score(X_test, y_test))
```

**tsai InceptionTime quickstart 코드 (공식 docs):**
```python
from tsai.basics import *
X, y, splits = get_UCR_data('NATOPS', split_data=False)
tfms = [None, [TSCategorize()]]
batch_tfms = TSStandardize()
dls = get_ts_dls(X, y, splits=splits, tfms=tfms, batch_tfms=batch_tfms)
model = InceptionTimePlus(dls.vars, dls.c, dls.len)
learn = Learner(dls, model, metrics=accuracy)
learn.fit_one_cycle(25, lr_max=1e-3)
```

---

## 3-4. 정형 데이터 분류 quickstart (실제 코드)

**AutoGluon (1순위):**
```bash
pip install -U autogluon
```
```python
from autogluon.tabular import TabularDataset, TabularPredictor
train = TabularDataset('train.csv')
test  = TabularDataset('test.csv')
predictor = TabularPredictor(label='target', eval_metric='f1').fit(
    train, presets='best_quality', time_limit=3600  # 1시간
)
predictor.leaderboard(test, silent=False)        # 모델별 성능 비교표
predictor.feature_importance(test)               # SHAP 기반 중요도
pred = predictor.predict(test)
```
- `presets`: `medium_quality`(빠름), `high_quality`, `best_quality`(스택 깊음), `experimental_quality`(2024 신규)
- `leaderboard()`는 캡스톤 보고서에 그대로 붙일 표가 된다.

**PyCaret (해석·시각화 보조):**
```bash
pip install pycaret
```
```python
from pycaret.classification import setup, compare_models, tune_model, plot_model, interpret_model
s = setup(data=df, target='label', session_id=42, fold=5, fold_strategy='stratifiedkfold')
best = compare_models(sort='F1', n_select=3)     # 상위 3개 모델
tuned = tune_model(best[0], optimize='F1', search_library='optuna')
plot_model(tuned, plot='confusion_matrix')
plot_model(tuned, plot='feature')
interpret_model(tuned)                            # SHAP
```

**FLAML (가장 가벼운 옵션, 3줄):**
```python
from flaml import AutoML
automl = AutoML()
automl.fit(X_train, y_train, task="classification", time_budget=600, metric="f1")
```

**해석 방법:** `leaderboard`/`compare_models` 출력에서 (i) **상위 모델이 모두 같은 가족(예: LightGBM/XGBoost/CatBoost) → 부스팅이 잘 맞는 데이터**, (ii) **상위에 NN_TORCH·FT_TRANSFORMER가 끼면 → 비선형·고차원 상호작용 존재 가능성**, (iii) **Linear/Ridge가 상위 → 단순 구조, 부스팅의 이득 적음** 식으로 진단한다.

**한국어 자료 (실제로 따라할 만한 것):**
- PyCaret: jaeworld.github.io의 한글 정리, Velog/Dacon "[MAT 6편] 실전 AutoML 1탄: PyCaret" (https://dacon.io/en/codeshare/5161), velog "AutoML PyCaret" 시리즈, PyCaret 공식 gitbook 한글 문서.
- AutoGluon: smileshark.kr "자동화된 기계 학습 AutoML - AutoGluon" (https://www.smileshark.kr/post/automated-machine-learning-autogluon), AWS 한국어 docs(SageMaker AutoGluon-Tabular 페이지: https://docs.aws.amazon.com/ko_kr/sagemaker/latest/dg/autogluon-tabular.html), Velog "[머신러닝] AutoML : Pycaret, AutoGluon, H2O AutoML, TPOT".
- 영상: 데이콘·인프런·유튜브에서 "PyCaret 튜토리얼", "AutoGluon 한국어"로 검색 가능.

---

## 3-5. 부스팅이 데이터셋과 안 맞을 때의 진단

부스팅(XGBoost/LightGBM/CatBoost)이 약해지는 상황:
- **소량 데이터(수천 행 미만):** 트리가 노이즈를 외워 과적합. TabPFN(<10k 행, 100 피처, 10 클래스 이하)·정규화 강한 Linear/Ridge가 종종 이긴다.
- **노이즈·라벨 오류 많음:** 부스팅은 후속 트리가 오류를 "고치려" 노이즈를 학습 → 과적합. arXiv 연구들이 일관되게 보고하듯 boosting algorithms tend to assign large weights to noisy instances. Random Forest가 안전한 대안.
- **고차원 희소(텍스트 BoW, 원핫):** 선형 모델(L1/L2)이 더 빠르고 정확.
- **순서·시간 의존성(시계열 raw):** 트리는 시간 구조 모름 → 별도 피처(lag, rolling, tsfresh) 또는 TSC 전용 모델 필요.
- **클래스 극도 불균형 + 작은 양성 샘플:** 부스팅이 majority class만 맞춤. AUPRC 기준 평가, class_weight·SMOTE·focal loss 고려.

**진단 체크리스트:**
1. CV 점수 표(폴드별 표준편차 큰가? → 데이터 부족·과적합 신호)
2. 학습/검증 곡선(`xgb.cv(..., callbacks=[early_stopping])`) → train↓·val↑면 부스팅 과적합
3. **AutoML 리더보드 위 5개 중 부스팅이 아닌 모델이 절반 이상이면** 데이터 특성이 부스팅과 안 맞는다는 강력한 신호
4. SHAP summary plot으로 1–2개 피처가 모든 예측을 좌우하면 단순 모델이 더 적합할 수 있음

---

## 3-6. RTX TITAN 24GB GPU 활용 옵션

24GB VRAM은 정형 데이터 딥러닝 모델에 충분히 넉넉하다. AutoGluon 1.5 공식 문서가 명시하는 GPU 활용 가능 모델:

| 모델 | 라이브러리 | GPU 활용 |
|---|---|---|
| **TabPFN v2** | AutoGluon `TABPFNV2` 또는 `pip install tabpfn` | GPU 필수, <10k 행에서 1초 내 SOTA |
| **FT-Transformer** | AutoGluon `FT_TRANSFORMER` | GPU 권장, 100 피처 이하 권장 |
| **TabM / RealMLP** | AutoGluon `TABM`/`REALMLP` (2024–25 신규) | GPU 권장 |
| **Mitra (foundation model for tabular)** | AutoGluon `MITRA` | GPU 필수 |
| **TabNet** | pytorch-tabnet | GPU 권장 |
| **InceptionTime / PatchTST / TST** | tsai (TSC용) | GPU 강력 추천 |
| **MultiModalPredictor (텍스트+표 혼합)** | AutoGluon `AG_AUTOMM` | GPU 필수 |

**가장 간단한 활용법: AutoGluon에서 `presets='best_quality'`로 두면 GPU가 있을 때 자동으로 FT-Transformer·NN_TORCH·FastAI NN을 포함한 스택을 구성한다.** 별도 코드 없이 GPU가 활용된다. 보고서에는 "GBM(LightGBM/XGBoost/CatBoost) + 정형 딥러닝(FT-Transformer, NN_TORCH) 스택 앙상블"이라고 서술 가능.

---

## 3-7. 추천 워크플로우 (캡스톤 4단계)

1. **Baseline 단계 (1일):** sklearn DummyClassifier·LogisticRegression 점수 측정 → "AutoML/ML이 baseline 대비 얼마나 좋은가"의 기준선 확립. MLJAR의 자동 Baseline 기능을 그대로 써도 좋다(prior class distribution 기반 자동 산출).
2. **AutoML 탐색 단계 (1–3일):** AutoGluon `best_quality` 1시간 + PyCaret `compare_models()` 병행. 리더보드 저장.
3. **인사이트 추출 (1–2일):** 어떤 모델 군이 우세한지, 피처 중요도 상위 5개, 오차 패턴(혼동행렬·잔차 분포) 분석. → "왜 부스팅이 1위/2위인가" 가설 수립. (시각화는 PART 4 참고)
4. **수동 튜닝·재현 (3–5일):** AutoML 상위 모델 구조를 그대로 가져와 sklearn/LightGBM/XGBoost로 재구현 → Optuna로 추가 튜닝. **이 단계가 캡스톤 평가에서 "AutoML 결과를 베끼지 않았다"는 증거**가 된다.

**보고서·발표 정당화 문장 예시:**
> "본 연구에서는 모델 선택의 객관성을 확보하기 위해 AWS AutoGluon 1.5의 best_quality 프리셋(스택 앙상블, 1시간 예산)으로 14개 알고리즘을 자동 비교하여 LightGBM과 CatBoost가 상위 모델임을 확인하였다. 이후 동일 하이퍼파라미터를 sklearn 환경에서 재현하고 Optuna로 추가 튜닝하여 최종 F1 0.xxx를 달성하였다. AutoML은 베이스라인·진단 도구로 활용되었으며, 최종 모델은 재현 가능한 수동 구현이다."

**기준선(이 결과가 나오면 방향 전환):**
- AutoML 1위 < Baseline + 5% → 데이터·라벨링·문제 정의 자체를 재검토.
- 부스팅이 리더보드 5위 밖 → 3-6의 정형 딥러닝(FT-Transformer, TabM) 또는 3-5의 대체 모델군(Linear, RF, TabPFN) 우선 탐색.
- 시계열 InceptionTime이 MultiRocket보다 의미 있게 낮음 → 데이터가 작아서 딥러닝이 과적합 → ROCKET 계열로 결정.


---

<a name="part-4"></a>
# PART 4 — 평가·해석 시각화 (분석적 시각화)

> P03 자료에 빠진 **분석적 시각화** 부분입니다. 분류·회귀 모델의 평가지표(`분류_모델.pdf`, `회귀_분석.pdf`)와 직접 연결되며, PART 3에서 학습한 모델을 해석합니다. matplotlib · seaborn · scikit-learn 내장 plot 기능을 상황에 맞게 모두 사용합니다.

공통 임포트:

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
plt.rcParams['axes.unicode_minus'] = False
# 한글 폰트 (Mac: 'AppleGothic', Windows: 'Malgun Gothic')
plt.rcParams['font.family'] = 'AppleGothic'
```

## 4-1. 분류 모델: 혼동행렬 (Confusion Matrix)

혼동행렬은 레이블별 예측 결과를 정리한 행렬로, 여기서 정확도·재현율·정밀도·F1·AUC가 모두 파생됩니다.

- **TP**: 실제 양성을 양성으로 (정답)
- **TN**: 실제 음성을 음성으로 (정답)
- **FP**: 실제 음성을 양성으로 (Type I Error)
- **FN**: 실제 양성을 음성으로 (Type II Error)

```python
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, classification_report

# 방법 A — scikit-learn 내장 (가장 간단, 권장)
ConfusionMatrixDisplay.from_estimator(model, X_test, y_test, cmap='Blues')
plt.title("Confusion Matrix")
plt.show()

# 방법 B — seaborn 히트맵 (커스터마이징 자유로움)
cm = confusion_matrix(y_test, y_pred)
fig, ax = plt.subplots(figsize=(5, 4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
            xticklabels=['음성(0)', '양성(1)'],
            yticklabels=['음성(0)', '양성(1)'], ax=ax)
ax.set_xlabel('예측')
ax.set_ylabel('실제')
ax.set_title('혼동행렬')
plt.show()

# 텍스트 지표 한 번에
print(classification_report(y_test, y_pred))
```

> 💡 의료 진단처럼 **FN(놓친 양성)이 치명적**인 도메인이라면, 혼동행렬에서 FN 칸을 특히 주목하세요. 정확도 하나만 보면 불균형 데이터에서 모델을 과대평가하게 됩니다.

## 4-2. 분류 모델: ROC 곡선과 AUC

ROC는 거짓양성비율(FPR)에 대한 참양성비율(TPR=Recall)의 관계 곡선이고, AUC는 그 아래 면적입니다. 1에 가까울수록 좋습니다 (자료 기준: 0.9↑ 아주 좋음 / 0.8~0.9 좋음 / 0.7~0.8 괜찮음 / 0.6~0.7 의미는 있음 / 0.5~0.6 좋지 않음).

```python
from sklearn.metrics import RocCurveDisplay, roc_curve, auc

# 방법 A — scikit-learn 내장
RocCurveDisplay.from_estimator(model, X_test, y_test)
plt.plot([0, 1], [0, 1], 'k--', label='무작위 (AUC=0.5)')  # 대각 기준선
plt.title("ROC Curve")
plt.legend()
plt.show()

# 방법 B — 여러 모델 비교 (matplotlib 직접)
fig, ax = plt.subplots(figsize=(6, 6))
for name, clf in models.items():            # models = {"RF": rf, "LR": lr, ...}
    y_score = clf.predict_proba(X_test)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_score)
    ax.plot(fpr, tpr, label=f"{name} (AUC={auc(fpr, tpr):.3f})")
ax.plot([0, 1], [0, 1], 'k--')
ax.set_xlabel('False Positive Rate')
ax.set_ylabel('True Positive Rate (Recall)')
ax.set_title('ROC Curve 비교')
ax.legend()
plt.show()
```

## 4-3. 분류 모델: Precision-Recall 곡선

**클래스 불균형이 심할 때는 ROC보다 PR 곡선이 더 정직합니다.** 캡스톤 데이터가 불균형이면 둘 다 제시하는 걸 권장합니다.

```python
from sklearn.metrics import PrecisionRecallDisplay
PrecisionRecallDisplay.from_estimator(model, X_test, y_test)
plt.title("Precision-Recall Curve")
plt.show()
```

## 4-4. 회귀 모델: 실제값 vs 예측값 / 잔차

회귀 평가지표(MAE, MAPE, MSE, RMSE, R²) 옆에 항상 두 그림을 같이 두면 설득력이 큽니다. R²는 0~1 사이 설명력 지표로, 1에 가까울수록 좋습니다.

```python
y_pred = model.predict(X_test)

fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# (1) 실제값 vs 예측값 — 대각선에 가까울수록 좋음
axes[0].scatter(y_test, y_pred, alpha=0.5)
lims = [min(y_test.min(), y_pred.min()), max(y_test.max(), y_pred.max())]
axes[0].plot(lims, lims, 'r--', label='완벽한 예측 기준선')
axes[0].set_xlabel('실제값'); axes[0].set_ylabel('예측값')
axes[0].set_title('실제값 vs 예측값'); axes[0].legend()

# (2) 잔차 플롯 — 0 주변에 무작위로 흩어져야 좋음 (패턴이 보이면 모델 문제)
residuals = y_test - y_pred
axes[1].scatter(y_pred, residuals, alpha=0.5)
axes[1].axhline(0, color='r', linestyle='--')
axes[1].set_xlabel('예측값'); axes[1].set_ylabel('잔차 (실제−예측)')
axes[1].set_title('잔차 플롯')

plt.tight_layout()
plt.show()
```

> 잔차 플롯에서 깔때기 모양이나 곡선 패턴이 보이면, 등분산 가정 위배나 비선형성 누락을 의심해야 합니다.

## 4-5. 특성 중요도 (Feature Importance)

"왜 이렇게 예측했는가"를 설명하는 핵심 그림입니다. 트리 기반 모델은 `feature_importances_`, 선형 모델은 계수(`coef_`)를 씁니다. **PART 2-4(트리 모델의 MDI 편향)와 직결되므로 Permutation Importance 병행을 권장합니다.**

```python
# 트리 기반 (RandomForest, GradientBoosting 등)
importances = pd.Series(model.feature_importances_, index=X.columns)
importances = importances.sort_values()

fig, ax = plt.subplots(figsize=(7, 5))
importances.plot.barh(ax=ax)          # 수평막대가 레이블 읽기 좋음
ax.set_title('특성 중요도')
ax.set_xlabel('중요도')
plt.tight_layout()
plt.show()
```

```python
# 모델 종류와 무관한 Permutation Importance (더 신뢰성 높음 — PART 2 권장)
from sklearn.inspection import permutation_importance
result = permutation_importance(model, X_test, y_test, n_repeats=10, random_state=42)
perm = pd.Series(result.importances_mean, index=X.columns).sort_values()
perm.plot.barh(figsize=(7, 5), title='Permutation Importance')
plt.tight_layout(); plt.show()
```

## 4-6. 차원 축소 시각화 (PCA / t-SNE)

고차원 데이터를 2D로 눌러 클래스가 잘 분리되는지 눈으로 봅니다. P03이 언급한 "Dimension Reduction" 분석적 시각화입니다.

```python
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

X_scaled = StandardScaler().fit_transform(X)
X_pca = PCA(n_components=2).fit_transform(X_scaled)

fig, ax = plt.subplots(figsize=(7, 6))
sc = ax.scatter(X_pca[:, 0], X_pca[:, 1], c=y, cmap='viridis', alpha=0.6)
ax.set_xlabel('PC1'); ax.set_ylabel('PC2')
ax.set_title('PCA 2차원 투영')
plt.colorbar(sc, label='클래스')
plt.show()
```

```python
# t-SNE: 비선형 구조 포착에 강함 (단, 거리 해석에 주의)
from sklearn.manifold import TSNE
X_tsne = TSNE(n_components=2, random_state=42).fit_transform(X_scaled)
plt.scatter(X_tsne[:, 0], X_tsne[:, 1], c=y, cmap='viridis', alpha=0.6)
plt.title('t-SNE 2차원 투영'); plt.show()
```

## 4-7. 군집 결과 시각화

비지도 학습(Clustering) 결과를 보여줍니다.

```python
from sklearn.cluster import KMeans

km = KMeans(n_clusters=3, random_state=42, n_init=10).fit(X_scaled)
X_2d = PCA(n_components=2).fit_transform(X_scaled)

fig, ax = plt.subplots(figsize=(7, 6))
ax.scatter(X_2d[:, 0], X_2d[:, 1], c=km.labels_, cmap='Set2', alpha=0.6)
ax.set_title('K-Means 군집 결과 (PCA 투영)')
plt.show()

# 적절한 K 찾기 — 엘보우 방법
inertias = [KMeans(n_clusters=k, random_state=42, n_init=10).fit(X_scaled).inertia_
            for k in range(1, 10)]
plt.plot(range(1, 10), inertias, 'o-')
plt.xlabel('클러스터 수 (K)'); plt.ylabel('Inertia')
plt.title('엘보우 방법'); plt.show()
```

---

<a name="part-5"></a>
# PART 5 — 공통 함정 모음 (3개 영역 통합)

> 세 출처 문서의 "Caveats/함정" 섹션을 한곳에 모았습니다. 캡스톤에서 가장 자주 점수를 깎이는 지점들입니다.

## 5-1. 데이터 누수 (Data Leakage) — 가장 치명적

1. **피처 선택 누수**: 피처 선택을 *전체 데이터*에서 수행 후 CV → 낙관적 편향. **반드시 `Pipeline`으로 묶어 fold마다 따로** (scikit-learn 공식 가이드).
2. **전처리 누수**: train+test 합쳐서 `StandardScaler.fit()` → test 정보가 train으로 흘러감. **AutoGluon·PyCaret은 내부적으로 폴드별 fit하지만, 외부에서 미리 스케일링하면 누수가 발생한다.** 원본 CSV를 그대로 넣는 것이 안전.
3. **target 파생 변수**: target과 직접/간접 연관된 피처(사후 집계, 정답 파생 변수)를 무심코 포함. AutoML 점수가 비현실적으로 높으면(>0.99) 의심.

## 5-2. 교차검증(CV) 분할 실수 — 시계열에서 특히

4. **K-fold를 한 개의 긴 시계열에 적용**: 무작위 분할하면 미래 정보가 과거 학습에 새어 들어옴. → 이 경우엔 `TimeSeriesSplit`/walk-forward CV 필수.
5. **반대로, 패널 시계열(각 row가 독립 시계열)에 TimeSeriesSplit 적용**: sktime 공식 TSC 튜토리얼 예시는 `cross_val_score(clf, X_train, y=y_train, cv=KFold(n_splits=4))`로, panel TSC에서는 **일반 `KFold` 또는 `StratifiedKFold`가 정답**이다. "시계열 = TimeSeriesSplit" 공식을 외워 잘못 쓰는 경우가 많다.

## 5-3. 피처 선택·중요도 해석 함정

6. **MDI는 학습 데이터 기준 + 고-카디널리티 편향**: "feature_importances_가 크다 = 일반화에 중요" 가 **아니다** (scikit-learn 공식 경고; Strobl et al. 2007). → hold-out permutation 또는 SHAP 병행.
7. **Permutation Importance + 강상관 변수**: 한 변수를 셔플해도 상관된 다른 변수로 모델이 보완 → 두 변수 모두 중요도가 낮게 나옴. → 상관 클러스터링 후 대표 변수만 평가하거나 conditional permutation importance 사용(Strobl et al. 2008, *BMC Bioinformatics* 9:307).
8. **Filter 단변량 한계**: 단일로는 좋지 않지만 조합으로는 강력한 피처(예: XOR 두 변수)를 놓친다. → MI 또는 Wrapper로 보완.
9. **`chi2`의 잘못된 사용**: 음수가 있는 표준화된 데이터에 적용하면 오류. raw count 또는 one-hot에서만 사용.
10. **Lasso의 비일관성**: 같은 데이터에 약간의 노이즈를 더해도 다른 변수 집합을 고를 수 있다. → 안정성 확인은 Stability Selection(Meinshausen & Bühlmann 2010, *JRSSB* 72:417–473) 또는 부트스트랩 반복.
11. **LightGBM `importance_type` 기본값 함정**: `'split'`이 기본 → 별 의미 없이 자주 분할되는 변수가 1등으로 뜰 수 있다. 항상 `feature_importance(importance_type='gain')`을 명시 권장.
12. **"피처 중요도 = 인과 효과" 오해 금지**: 어떤 중요도 지표도 인과를 보장하지 않는다(Molnar, *Interpretable Machine Learning*). 도메인 해석은 인과 분석을 별도 수행해야 한다.
13. **One-Way ANOVA 가정**: 정규성·등분산 가정 위배 시 F-test가 왜곡 → 비모수 대안(Kruskal-Wallis) 또는 MI.
14. **SHAP의 비용**: TreeSHAP은 O(TLD²)로 트리 모델에 효율적이지만, NN의 KernelSHAP은 매우 느리다.

## 5-4. AutoML 함정

15. **AutoML 결과 맹신**: "best_quality 모델 F1 0.92"만 보고서에 적고 종료 → 평가위원에게 "왜 그 모델인지" 답변 불가. 항상 (a) baseline 대비 개선폭, (b) 모델별 점수 분포, (c) 오류 사례 분석을 함께 제시.
16. **시간 예산 부족**: AutoGluon `time_limit=60`(1분) 같은 짧은 예산은 결과 변동성이 크다. 캡스톤이라면 최소 30–60분, 가능하면 수시간 돌릴 것.
17. **평가 지표 미스매치**: 불균형 분류에서 accuracy로 최적화 → majority class만 맞히는 모델 선택. F1/AUPRC/MCC 지정 필수.
18. **재현성 미고려**: AutoML 학습 후 `seed`/`random_state` 기록·모델 직렬화(`predictor.save()`/`pickle`) 누락 → 발표 직전 결과 사라짐.
19. **벤치마크는 평균일 뿐**: AMLB·Bake-Off Redux 결과는 수십~백여 개 데이터셋의 평균이며, 특정 문제에서는 단순 LogisticRegression이 이길 수 있다.
20. **TSC AutoML은 아직 "성숙"하지 않다**: Auto-PyTorch가 TSC를 지원하지 않듯, 정형 데이터 AutoML 수준의 자동화는 TSC 분야에서 아직 일반적이지 않다. tsfresh+정형 AutoML 또는 aeon의 수동 모델 비교가 현실적이다.

## 5-5. 시각화 함정 (D02 원칙 위반)

21. **막대그래프 y축을 0이 아닌 곳에서 시작** (차이 과장) — D02의 'bad' 대표 예시.
22. **3차원 효과 차트** (왜곡·가독성 저하).
23. **의미 없는 색 남발**.
24. **부분-전체 비교에 조각 많은 파이차트** (각도 비교는 부정확 → 막대 권장).
25. **겹친 점을 그대로 방치** (투명도/지터링으로 처리).
26. **ML 평가에서 ROC만 보고 PR 곡선 누락** (불균형 데이터에서 과대평가).

---

<a name="appendix"></a>
# 부록 — 캡스톤 발표용 체크리스트

## A-1. 시각화 체크리스트 (발표 직전 각 그림에 대해)

- [ ] 축 레이블과 단위가 있는가?
- [ ] 제목이 "그림이 말하려는 메시지"를 담고 있는가?
- [ ] 막대그래프라면 y축이 0에서 시작하는가?
- [ ] 색에 의미가 있는가, 범례가 명확한가?
- [ ] 글자 크기가 발표 화면에서 읽히는가?
- [ ] (ML 그림) 평가지표 수치를 그림 옆/안에 함께 제시했는가?
- [ ] 데이터가 불균형이면 ROC뿐 아니라 PR곡선도 봤는가?
- [ ] 3D·과한 장식 없이 단순한가?

## A-2. 파이프라인 정합성 체크리스트

- [ ] (EDA) 데이터 타입을 연속/범주/순서/시공간으로 분류했는가? → 피처 선택 함수 결정의 근거
- [ ] (전처리 전 시각화) 히스토그램·상자그림·결측치맵으로 무엇을 고칠지 진단했는가?
- [ ] (전처리) 결측치·이상치·편향치·인코딩·스케일링을 데이터 특성에 맞게 처리했는가? (1-0-6)
- [ ] (전처리 후 시각화) 변환·스케일링이 의도대로 됐는지 다시 그려 확인했는가?
- [ ] (누수 방지) 스케일링·대치 등 모델용 변환을 train/test split 이후 Pipeline 안에서 했는가? (1-0-2)
- [ ] (피처 선택) 데이터 타입과 모델 가정에 맞는 방법을 골랐는가? (2-5 매트릭스 확인)
- [ ] (피처 선택) 트리 모델이면 MDI만 보지 않고 permutation/SHAP을 병행했는가?
- [ ] (피처 선택) 스케일 민감 모델(KNN/SVM/선형)에 스케일링을 적용했는가?
- [ ] (피처 선택·전처리) Pipeline으로 묶어 CV fold마다 fit해 누수를 막았는가?
- [ ] (모델) Baseline(Dummy/LogReg) 점수를 먼저 측정했는가?
- [ ] (모델) AutoML 결과를 수동으로 재현·튜닝했는가? (베끼지 않았다는 증거)
- [ ] (모델) 시계열이면 panel/single 구조를 구분해 CV를 골랐는가?
- [ ] (평가) 불균형이면 accuracy 대신 F1/AUPRC/MCC로 최적화·평가했는가?
- [ ] (재현성) seed 고정·모델 직렬화를 했는가?

---

*이 문서는 출처 정리 문서(데이터 시각화 통합정리, 피처선택조건_모델고려, AutoML 도구조사)와 강의 슬라이드 자료(머신러닝의 개요 ML1, 회귀 분석, 데이터 요약·시각화 등)를 캡스톤 ML 파이프라인 순서(EDA·전처리 → 피처 선택 → 모델/AutoML → 평가 시각화)로 통합·재배치한 것입니다. PART 1-0의 전처리 7항목·데이터 정제/특성 공학 구분·"Garbage In Garbage Out"·전처리 시간 비중(79%) 등은 `머신러닝의_개요ML1.pdf`에서, 정규화(L1/L2/Elastic Net)·MSE의 이상치 민감성은 `회귀_분석.pdf`에서 인용했습니다. 원본 내용은 압축 없이 보존되었으며, 영역 간 상호 참조(PART X-Y 형식)를 추가했습니다. CLAUDE.md에서 이 문서를 레퍼런스로 참조할 수 있습니다.*
