# Refactoring Plan — Game Hub

`code-smells.md`에서 탐지된 5개의 문제를 해소하기 위한 리팩토링 계획입니다.
코드를 한 번에 전부 바꾸지 않고, 단계별로 안전하게 진행합니다.

---

## 목표 아키텍처

### Before (현재)

```
backend/
├── main.py          ← 모든 것이 여기에
├── requirements.txt
└── tests/
    └── test_echo.py

frontend/src/
├── App.jsx
├── pages/
│   ├── Blackjack.jsx    ← fetch + 게임 로직 혼재
│   ├── Minesweeper.jsx  ← fetch + 게임 로직 혼재
│   └── Tetris.jsx       ← 백엔드 접점 없음
```

### After (목표)

```
backend/
├── main.py              ← 앱 초기화 + include_router만
├── routers/
│   ├── blackjack.py     ← HTTP 라우팅 + 요청/응답 모델
│   ├── minesweeper.py
│   ├── tetris.py        ← 신규: score 엔드포인트
│   └── echo.py
├── services/
│   ├── blackjack.py     ← 순수 비즈니스 로직 (덱 생성)
│   ├── minesweeper.py   ← 순수 비즈니스 로직 (지뢰 생성)
│   └── tetris.py        ← 신규: 점수 처리 로직
├── requirements.txt
└── tests/
    ├── test_echo.py
    ├── test_blackjack.py    ← 신규
    └── test_minesweeper.py  ← 신규

frontend/src/
├── App.jsx
├── api/
│   └── gameApi.js       ← 신규: fetch 호출 중앙화
├── pages/
│   ├── Blackjack.jsx    ← UI + 게임 로직만
│   ├── Minesweeper.jsx
│   └── Tetris.jsx       ← score 제출 접점 추가
```

---

## Phase 1 — Backend Router 분리

**해소하는 냄새:** #1 God File, #2 Comment-as-Structure, #4 Closed to Extension
**해소하는 SOLID 위반:** S (SRP), O (OCP)

### 작업 목록

**1-1.** `backend/routers/` 디렉토리 생성 및 `__init__.py` 추가

**1-2.** `backend/routers/blackjack.py` 생성
- `SUITS`, `RANKS` 상수를 이 파일로 이동
- `APIRouter` 인스턴스 생성
- `GET /new-deck` 핸들러 이동 (prefix는 `main.py`에서 지정)

**1-3.** `backend/routers/minesweeper.py` 생성
- `DIFFICULTIES`, `NewGameRequest`를 이 파일로 이동
- `POST /new-game` 핸들러 이동

**1-4.** `backend/routers/echo.py` 생성
- `EchoRequest`, `POST /echo` 핸들러 이동

**1-5.** `backend/main.py` 정리
- 라우터 `include_router` 등록만 남기고 나머지 제거

```python
# Phase 1 완료 후 main.py의 모습
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import blackjack, minesweeper, echo

app = FastAPI(title="Game Hub API")

app.add_middleware(CORSMiddleware, ...)

app.include_router(blackjack.router,    prefix="/api/blackjack")
app.include_router(minesweeper.router,  prefix="/api/minesweeper")
app.include_router(echo.router,         prefix="/api")
```

### 검증
- 기존 테스트(`test_echo.py`) 통과 확인
- 각 엔드포인트 수동 호출로 동작 확인

---

## Phase 2 — Service Layer 도입

**해소하는 냄새:** #3 Missing Service Layer
**해소하는 SOLID 위반:** S (라우터-로직 분리), D (추상화 레이어 추가)

### 작업 목록

**2-1.** `backend/services/` 디렉토리 생성 및 `__init__.py` 추가

**2-2.** `backend/services/blackjack.py` 생성
- `generate_deck() -> list[dict]` 함수 작성
- 덱 생성·셔플 로직을 라우터에서 이 함수로 이동

**2-3.** `backend/services/minesweeper.py` 생성
- `generate_mines(rows, cols, mine_count, first_row, first_col) -> list[tuple]` 함수 작성
- 지뢰 배치·safe zone 계산 로직을 라우터에서 이 함수로 이동

**2-4.** 라우터 핸들러 단순화
- 핸들러는 요청 파싱 → 서비스 호출 → 응답 반환만 수행

```python
# Phase 2 완료 후 routers/blackjack.py 핸들러의 모습
@router.get("/new-deck")
def new_deck():
    return {"deck": blackjack_service.generate_deck()}
```

**2-5.** 서비스 단위 테스트 작성
- `tests/test_blackjack.py`: `generate_deck()`이 52장을 반환하는지, 중복이 없는지
- `tests/test_minesweeper.py`: mine이 safe zone 안에 없는지, 개수가 정확한지

### 검증
- 기존 엔드포인트 동작 변화 없음 확인
- 신규 서비스 단위 테스트 통과 확인

---

## Phase 3 — Frontend API 호출 중앙화

**해소하는 냄새:** #3 (프론트엔드 측)
**해소하는 SOLID 위반:** D (컴포넌트가 fetch 구현에 직접 의존하는 구조 해소)

### 작업 목록

**3-1.** `frontend/src/api/gameApi.js` 생성
- 현재 각 컴포넌트 안에 흩어진 `fetch` 호출을 이 파일로 이동
- 로컬 fallback 로직도 여기에 포함

```js
// gameApi.js가 담당할 함수들
export async function fetchDeck()              // Blackjack
export async function fetchMinePositions(opts) // Minesweeper
```

**3-2.** 각 컴포넌트 수정
- `Blackjack.jsx`: `dealNewGame` 안의 fetch 로직 → `fetchDeck()` 호출로 교체
- `Minesweeper.jsx`: `handleCellClick` 안의 fetch 로직 → `fetchMinePositions()` 호출로 교체

### 이점
- API URL, 에러 처리, fallback을 한 곳에서 관리
- 백엔드 URL이 바뀌어도 컴포넌트는 수정하지 않아도 됨
- 컴포넌트는 UI와 게임 로직에만 집중

---

## 단계별 의존 관계

```
Phase 1 (Router 분리)
    └── Phase 2 (Service Layer)        ← Phase 1 완료 후 진행
            └── Phase 3 (Frontend API 중앙화)  ← Phase 2 완료 후 진행
```

각 Phase는 독립적으로 검증 가능하며, 이전 Phase 없이 다음으로 넘어가지 않는다.

---

## 리팩토링 원칙

- **동작을 바꾸지 않는다.** 각 Phase는 기존 엔드포인트의 입출력을 그대로 유지한다. 새 엔드포인트 추가나 새 기능 도입은 리팩토링이 아니므로 이 계획에 포함하지 않는다.
- **테스트를 먼저 확인한다.** Phase 완료 후 반드시 기존 테스트를 돌려 회귀를 확인한다.
- **한 번에 하나씩.** 여러 Phase를 동시에 진행하지 않는다.

> **범위 밖 (Out of Scope)**
> `code-smells.md`의 #5 (No Backend Contract — Tetris 점수 엔드포인트 추가)는 새로운 기능 추가에 해당하므로 이 리팩토링 계획에 포함하지 않는다. 별도의 기능 개발 계획으로 다뤄야 한다.

---

## 리팩토링 전후 비교

| 항목 | Before | After |
|---|---|---|
| 백엔드 파일 수 | 1 (`main.py`) | 8 (main + 3 routers + 3 services) |
| 새 게임 추가 시 수정 파일 | `main.py` 전체 | `main.py` 1줄 + 새 파일 2개 |
| 비즈니스 로직 테스트 | 불가 (핸들러에 묶임) | 가능 (서비스 단독 호출) |
| 프론트엔드 fetch 위치 | 컴포넌트 내부 | `api/gameApi.js` 한 곳 |
