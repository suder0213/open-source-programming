# Refactoring Log — Game Hub

`refactoring-plan.md`에 따라 수행한 리팩토링의 전 과정, 이유, 결과를 기록한 문서입니다.

- **수행 일자:** 2026-04-03
- **기준 문서:** `docs/code-smells.md`, `docs/refactoring-plan.md`
- **원칙:** 외부 동작(엔드포인트 입출력)을 변경하지 않고 내부 구조만 개선한다.

---

## 리팩토링 전 구조

```
backend/
└── main.py              ← 모든 로직이 한 파일에 집중

frontend/src/
└── pages/
    ├── Blackjack.jsx    ← fetch 호출 + 게임 로직 혼재
    └── Minesweeper.jsx  ← fetch 호출 + 게임 로직 혼재
```

`main.py` 한 파일이 앱 초기화, 미들웨어 설정, 게임별 상수, 요청 모델, 비즈니스 로직, 라우트 핸들러를 모두 소유하고 있었다. 각 게임 간 경계는 `# ── Blackjack ──` 형태의 장식성 주석으로만 표시되었으며, 코드 수준에서 강제되지 않았다.

---

## Phase 1 — Backend Router 분리

### 이유

`code-smells.md` #1 (God File), #2 (Comment-as-Structure), #4 (Closed to Extension)를 해소한다.

- **SRP 위반 해소:** `main.py`가 여러 책임을 동시에 지는 구조를 끊는다.
- **OCP 위반 해소:** 새 게임 추가 시 `main.py`를 직접 수정하지 않아도 되는 구조를 만든다.
- **주석 경계 제거:** 주석 대신 파일 분리 자체가 게임 간 경계를 나타내도록 한다.

### 수행한 작업

**1. `backend/routers/` 디렉토리 생성**

각 게임의 라우팅 책임을 독립 파일로 분리하기 위한 패키지를 만들었다.

**2. `routers/blackjack.py` 생성**

`main.py`에 있던 `SUITS`, `RANKS` 상수와 `GET /new-deck` 핸들러를 이 파일로 이동했다. `APIRouter` 인스턴스를 생성하고 핸들러를 등록했다.

**3. `routers/minesweeper.py` 생성**

`main.py`에 있던 `DIFFICULTIES` 상수, `NewGameRequest` Pydantic 모델, `POST /new-game` 핸들러를 이 파일로 이동했다.

**4. `routers/echo.py` 생성**

`EchoRequest` 모델과 `POST /echo` 핸들러를 이 파일로 이동했다.

**5. `main.py` 정리 — 중간 라우터 도입**

초기에는 각 라우터를 `prefix="/api/blackjack"` 형태로 개별 등록했다. 이후 `/api` prefix가 모든 라우터에 반복된다는 문제를 발견하여, 중간 `APIRouter(prefix="/api")`를 도입해 `/api`를 단 한 곳에서 선언하도록 개선했다.

```python
# 최종 main.py
api = APIRouter(prefix="/api")
api.include_router(blackjack.router,   prefix="/blackjack")
api.include_router(minesweeper.router, prefix="/minesweeper")
api.include_router(echo.router)
app.include_router(api)
```

### 검증

기존 테스트 `tests/test_echo.py` 5개 전부 통과 확인.

```
5 passed in 0.62s
```

---

## Phase 2 — Service Layer 도입

### 이유

`code-smells.md` #3 (Missing Service Layer)를 해소한다.

- **SRP 위반 해소 (라우터):** Phase 1 이후에도 라우터 핸들러가 입력 파싱과 비즈니스 로직을 동시에 수행하고 있었다. 라우터는 HTTP 계층만 담당해야 한다.
- **DIP 위반 해소:** 핸들러가 `random.sample`, `DIFFICULTIES` 딕셔너리 등 구체적인 구현에 직접 의존하는 구조를 끊는다. 서비스 함수라는 추상화 레이어를 통해 로직을 교체하거나 단독 테스트할 수 있게 된다.

### 수행한 작업

**1. `backend/services/` 디렉토리 생성**

비즈니스 로직 전용 패키지를 만들었다.

**2. `services/blackjack.py` 생성**

덱 생성·셔플 로직을 `generate_deck() -> list[dict]` 순수 함수로 추출했다. `SUITS`, `RANKS` 상수도 함께 이동했다. 이 함수는 FastAPI에 의존하지 않으며, HTTP 컨텍스트 없이 단독으로 테스트할 수 있다.

**3. `services/minesweeper.py` 생성**

지뢰 배치·safe zone 계산 로직을 `generate_mines(rows, cols, mine_count, first_row, first_col) -> list[tuple]` 순수 함수로 추출했다. `DIFFICULTIES` 상수도 이 파일로 이동했다.

**4. 라우터 핸들러 단순화**

라우터 핸들러는 요청 파싱 → 서비스 호출 → 응답 반환만 수행하도록 줄였다.

```python
# routers/blackjack.py — Phase 2 이후
@router.get("/new-deck")
def new_deck():
    return {"deck": blackjack_service.generate_deck()}
```

```python
# routers/minesweeper.py — Phase 2 이후
@router.post("/new-game")
def new_game(req: NewGameRequest):
    config = minesweeper_service.DIFFICULTIES.get(req.difficulty, ...)
    mines = minesweeper_service.generate_mines(rows, cols, mine_count, ...)
    return {"rows": rows, "cols": cols, "mines": mines}
```

**5. 서비스 단위 테스트 작성**

서비스 레이어 분리의 핵심 목적인 "로직을 단독으로 테스트한다"를 실증하기 위해 테스트를 추가했다. HTTP 요청 없이 서비스 함수만 직접 호출한다.

- `tests/test_blackjack.py` — 4개 테스트
  - 덱이 52장인지
  - 중복 카드가 없는지
  - 모든 수트·랭크 조합이 존재하는지
  - 매번 다른 순서로 셔플되는지

- `tests/test_minesweeper.py` — 4개 테스트
  - 난이도별 지뢰 개수가 정확한지
  - safe zone(첫 클릭 3×3 영역) 안에 지뢰가 없는지
  - 모든 지뢰가 보드 범위 안에 있는지
  - 중복 지뢰가 없는지

### 검증

전체 테스트 13개 통과 확인. 기존 5개는 회귀 없음, 신규 8개 모두 통과.

```
13 passed in 0.95s
```

---

## Phase 3 — Frontend API 호출 중앙화

### 이유

`code-smells.md` #3의 프론트엔드 측 문제를 해소한다.

- **DIP 잠재적 위반 해소:** `Blackjack.jsx`와 `Minesweeper.jsx`가 각자 `fetch` 구현, 에러 처리, 로컬 fallback 로직을 내부에 직접 포함하고 있었다. API URL이 바뀌거나 에러 처리 방식이 달라지면 컴포넌트를 직접 열어야 했다.
- **중복 제거:** 두 컴포넌트 모두 동일한 패턴(fetch → 실패 시 로컬 fallback)을 반복하고 있었다.

### 수행한 작업

**1. `frontend/src/api/gameApi.js` 생성**

각 컴포넌트에 흩어진 `fetch` 호출, 에러 처리, 로컬 fallback 로직을 이 파일로 통합했다.

- `fetchDeck()` — `/api/blackjack/new-deck` 호출. 실패 시 로컬에서 덱을 생성해 반환.
- `fetchMinePositions(opts)` — `/api/minesweeper/new-game` 호출. 실패 시 로컬에서 지뢰를 생성해 반환.
- 로컬 fallback 함수(`localDeck`, `localMines`)도 함께 이 파일로 이동.

**2. `Blackjack.jsx` 수정**

`localDeck` 함수 제거, `dealNewGame` 안의 fetch + try/catch 블록을 `fetchDeck()` 한 줄로 교체했다. 컴포넌트는 이제 API 호출 방식을 알지 못한다.

**3. `Minesweeper.jsx` 수정**

`generateMinesLocally` 함수 제거, `handleCellClick` 안의 fetch + try/catch 블록을 `fetchMinePositions(...)` 한 줄로 교체했다.

### 검증

프론트엔드 프로덕션 빌드 오류 없음 확인.

```
✓ built in 302ms
```

---

## 최종 구조

```
backend/
├── main.py              ← 앱 초기화 + APIRouter 등록만
├── routers/
│   ├── blackjack.py     ← HTTP 라우팅, 요청/응답 모델
│   ├── minesweeper.py
│   └── echo.py
├── services/
│   ├── blackjack.py     ← 순수 비즈니스 로직 (덱 생성)
│   └── minesweeper.py   ← 순수 비즈니스 로직 (지뢰 생성)
└── tests/
    ├── test_blackjack.py
    ├── test_echo.py
    └── test_minesweeper.py

frontend/src/
├── api/
│   └── gameApi.js       ← fetch 호출, 에러 처리, fallback 통합
└── pages/
    ├── Blackjack.jsx    ← UI + 게임 로직만
    └── Minesweeper.jsx
```

---

## 해소된 Code Smell 및 SOLID 위반

| # | Code Smell | 해소 Phase | 해소된 SOLID |
|---|---|---|---|
| 1 | God File | Phase 1 | S |
| 2 | Comment-as-Structure | Phase 1 | S |
| 3 | Missing Service Layer | Phase 2, 3 | S, D |
| 4 | Closed to Extension | Phase 1 | O |
| 5 | No Backend Contract | 범위 밖 — 기능 추가에 해당 | — |

---

## 리팩토링 중 발견한 추가 개선 사항

**`/api` prefix 중복 문제**

Phase 1 완료 후 `main.py`를 검토하는 과정에서 `/api`가 각 `include_router` 호출에 반복된다는 문제를 발견했다. 이는 계획에 없던 사항이었으나, 중간 `APIRouter(prefix="/api")`를 도입해 즉시 해소했다. 새 게임 추가 시 `/api` prefix를 다시 신경 쓸 필요가 없어졌다.

---

## 검증 결과 요약

| 시점 | 테스트 수 | 결과 |
|---|---|---|
| Phase 1 완료 후 | 5 | 5 passed |
| Phase 2 완료 후 | 13 | 13 passed |
| Phase 3 완료 후 | 13 + 빌드 확인 | 13 passed, build ✓ |
