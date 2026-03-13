import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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


# ── Blackjack ─────────────────────────────────────────────────────────────

SUITS = ["♠", "♥", "♦", "♣"]
RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]


@app.get("/api/blackjack/new-deck")
def blackjack_new_deck():
    deck = [{"suit": s, "rank": r} for s in SUITS for r in RANKS]
    random.shuffle(deck)
    return {"deck": deck}
