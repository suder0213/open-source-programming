import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Game Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Game Hub API is running"}


# ── Minesweeper ───────────────────────────────────────────────────────────────

DIFFICULTIES = {
    "easy":   {"rows": 9,  "cols": 9,  "mine_count": 10},
    "medium": {"rows": 16, "cols": 16, "mine_count": 40},
    "hard":   {"rows": 16, "cols": 30, "mine_count": 99},
}


class NewGameRequest(BaseModel):
    difficulty: str   # "easy" | "medium" | "hard"
    first_row: int
    first_col: int


@app.post("/api/minesweeper/new-game")
def minesweeper_new_game(req: NewGameRequest):
    config = DIFFICULTIES.get(req.difficulty, DIFFICULTIES["easy"])
    rows, cols, mine_count = config["rows"], config["cols"], config["mine_count"]

    # Keep a 3×3 area around the first click mine-free
    safe = {
        (req.first_row + dr, req.first_col + dc)
        for dr in range(-1, 2)
        for dc in range(-1, 2)
        if 0 <= req.first_row + dr < rows and 0 <= req.first_col + dc < cols
    }

    candidates = [(r, c) for r in range(rows) for c in range(cols) if (r, c) not in safe]
    mines = random.sample(candidates, min(mine_count, len(candidates)))

    return {"rows": rows, "cols": cols, "mines": mines}


# ── Blackjack ─────────────────────────────────────────────────────────────────

SUITS = ["♠", "♥", "♦", "♣"]
RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]


@app.get("/api/blackjack/new-deck")
def blackjack_new_deck():
    deck = [{"suit": s, "rank": r} for s in SUITS for r in RANKS]
    random.shuffle(deck)
    return {"deck": deck}
