from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from routers import blackjack, minesweeper, echo

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


api = APIRouter(prefix="/api")
api.include_router(blackjack.router, prefix="/blackjack")
api.include_router(minesweeper.router, prefix="/minesweeper")
api.include_router(echo.router)
app.include_router(api)
