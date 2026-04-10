# Code Smells — Game Hub

현재 코드베이스에서 탐지된 code smell 목록과 각각의 근거, 위반하는 SOLID 원칙, 개선 방향을 정리한 문서입니다.

---

## 1. 단일 파일 집중 (God File)

**위치:** `backend/main.py`

> 🔴 **SOLID 위반 — S: Single Responsibility Principle**
> 하나의 모듈은 하나의 변경 이유만 가져야 한다. 현재 `main.py`는 앱 설정, 게임 로직, HTTP 라우팅이 모두 섞여 있어, 게임 로직이 바뀌어도, 미들웨어 설정이 바뀌어도, 새 게임이 추가되어도 동일한 파일을 수정해야 한다. 즉 변경 이유가 하나가 아니다.

**문제:**
`main.py`가 앱 진입점, 미들웨어 설정, 게임별 상수, 요청 모델, 비즈니스 로직, 라우트 핸들러를 모두 소유하고 있어, 하나의 파일이 너무 많은 책임을 진다.

**개선 방향:**
게임별로 `routers/blackjack.py`, `routers/minesweeper.py` 등으로 분리하고, `main.py`는 앱 초기화와 라우터 등록만 담당하도록 한다.

---

## 2. 주석 기반 구조화 (Comment-as-Structure)

**위치:** `backend/main.py`

> 🟡 **SOLID 위반 — S: Single Responsibility Principle (간접)**
> 각 게임이 독립적인 책임 단위임에도 불구하고 동일 파일 안에 공존하고 있다. 주석으로 경계를 표시한다는 것은, 코드 구조가 SRP를 강제하지 못하고 있다는 증거다.

**문제:**
게임 간 경계를 `# ── Blackjack ──` 같은 장식성 주석으로만 표시하고 있어, 구조가 텍스트 컨벤션에 의존할 뿐 코드 수준에서 강제되지 않는다. 실제로 Blackjack 상수와 엔드포인트 사이에 Echo 섹션이 끼어든 것처럼, 주석 경계는 언제든 무너질 수 있다.

**개선 방향:**
주석 대신 파일 분리 자체가 경계를 나타내도록 한다. 모듈 구조가 곧 문서가 된다.

---

## 3. 서비스 레이어 부재 (Missing Service Layer)

**위치:** `backend/main.py` — `minesweeper_new_game()`, `blackjack_new_deck()`

> 🔴 **SOLID 위반 — S: Single Responsibility Principle + D: Dependency Inversion Principle**
>
> **SRP:** 라우트 핸들러가 "HTTP 요청을 받는다"는 책임과 "게임 로직을 수행한다"는 책임을 동시에 진다. 두 책임은 변경 이유가 다르다 — API 스펙이 바뀌어도, 지뢰 배치 알고리즘이 바뀌어도 같은 함수를 수정해야 한다.
>
> **DIP:** 핸들러가 `random.sample`, `DIFFICULTIES` 딕셔너리 같은 구체적인 구현에 직접 의존하고 있다. 추상화된 서비스 인터페이스가 없으므로, 로직을 교체하거나 Mock으로 대체해 테스트하는 것이 불가능하다.

**문제:**
라우트 핸들러가 입력 파싱과 비즈니스 로직을 동시에 수행하고 있어, 라우팅 책임과 게임 로직 책임이 분리되지 않았다. 이로 인해 로직을 단독으로 테스트하거나 재사용하기 어렵다.

**개선 방향:**
`services/minesweeper.py` 같은 서비스 레이어를 두고, 핸들러는 요청을 받아 서비스를 호출하고 응답을 반환하는 역할만 하도록 분리한다.

---

## 4. 게임 추가에 닫힌 구조 (Closed to Extension)

**위치:** `backend/main.py` 전체 구조

> 🔴 **SOLID 위반 — O: Open/Closed Principle**
> 소프트웨어 엔티티는 확장에는 열려 있고, 수정에는 닫혀 있어야 한다. 현재 구조에서 새 게임을 추가하려면 반드시 `main.py`를 열어 코드를 추가해야 하므로, 확장(새 게임)이 곧 기존 코드의 수정을 의미한다. OCP의 정면 위반이다.

**문제:**
새 게임을 추가할 때마다 `main.py`를 직접 수정해야 하는 구조로, 기존 코드를 건드리지 않고 확장하는 것이 불가능하다.

**개선 방향:**
FastAPI의 `APIRouter`를 게임별 모듈로 분리하면, 새 게임 추가 시 `main.py`에는 `app.include_router(...)` 한 줄만 추가하면 된다.

```python
# main.py가 이상적으로 가져야 할 형태
from routers import blackjack, minesweeper, tetris

app.include_router(blackjack.router, prefix="/api/blackjack")
app.include_router(minesweeper.router, prefix="/api/minesweeper")
app.include_router(tetris.router, prefix="/api/tetris")
```

---

## 5. 테트리스의 백엔드 접점 부재 (No Backend Contract)

**위치:** `frontend/src/pages/Tetris.jsx`, `backend/main.py`

> 🟡 **SOLID 위반 — D: Dependency Inversion Principle (잠재적)**
> DIP는 고수준 모듈이 저수준 모듈에 직접 의존해서는 안 된다고 말한다. 현재 `Tetris.jsx`는 점수 같은 게임 결과를 외부로 전달하는 추상화된 경로가 전혀 없어, 나중에 백엔드가 필요해지면 프론트엔드 컴포넌트 내부를 직접 수정해야 한다. 즉 현재는 위반이 아니지만, 이 구조를 유지한 채 기능을 확장하면 DIP 위반이 발생하는 구조적 취약점이다.

**문제:**
테트리스는 백엔드 엔드포인트가 전혀 없어, 점수·결과 같은 게임 데이터가 프론트엔드 메모리 안에서만 사라진다. 게임 로직 자체를 서버로 옮기자는 의미가 아니라, 최소한의 계약 지점조차 없으면 이후 리더보드·통계 기능을 붙일 때 프론트 구조를 전면 수정해야 한다.

> 테트리스는 60fps 수준의 실시간 루프가 필요한 게임이므로 핵심 게임 로직은 프론트엔드에 두는 것이 올바른 설계다. 다만 결과 데이터를 서버에 전달하는 최소한의 접점은 필요하다.

**개선 방향:**
`POST /api/tetris/score` 같은 엔드포인트를 추가해 게임 종료 시 점수를 서버에 전달하는 계약 지점을 만든다. 이렇게 하면 DB나 리더보드 기능을 추가할 때 프론트는 이미 존재하는 엔드포인트를 활용하면 된다.

---

## SOLID 위반 요약

| 원칙 | 위반 여부 | 위반 위치 |
|---|---|---|
| **S** Single Responsibility | 🔴 위반 | `main.py` 전체, 각 라우트 핸들러 |
| **O** Open/Closed | 🔴 위반 | `main.py` — 게임 추가 시 기존 파일 수정 필요 |
| **L** Liskov Substitution | ✅ 해당 없음 | 상속 구조 자체가 없음 |
| **I** Interface Segregation | ✅ 해당 없음 | 인터페이스 정의 자체가 없음 |
| **D** Dependency Inversion | 🔴 위반 | 핸들러가 구체 구현에 직접 의존, Tetris 접점 부재 |

> **참고:** L과 I는 현재 코드베이스에 상속·인터페이스 구조가 없어 적용 대상 자체가 없다. 위반이 아닌 것이 아니라, 판단할 수 없는 상태다. 구조가 복잡해질수록 이 두 원칙도 점검 대상이 된다.

---

## 우선순위 요약

| # | 냄새 | SOLID | 심각도 | 비고 |
|---|---|---|---|---|
| 1 | God File | S | 높음 | 모든 문제의 근원 |
| 2 | Comment-as-Structure | S | 중간 | 1번 해결 시 자동 해소 |
| 3 | Missing Service Layer | S, D | 중간 | 테스트 가능성에 직접 영향 |
| 4 | Closed to Extension | O | 높음 | 1번 해결 시 자동 해소 |
| 5 | No Backend Contract | D | 낮음 | 현재 요구사항엔 무해, 향후 확장 시 문제 |
