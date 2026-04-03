from fastapi import APIRouter
from pydantic import BaseModel
from services import minesweeper as minesweeper_service

router = APIRouter()


class NewGameRequest(BaseModel):
    difficulty: str   # "easy" | "medium" | "hard"
    first_row: int
    first_col: int


@router.post("/new-game")
def new_game(req: NewGameRequest):
    config = minesweeper_service.DIFFICULTIES.get(req.difficulty, minesweeper_service.DIFFICULTIES["easy"])
    rows, cols, mine_count = config["rows"], config["cols"], config["mine_count"]
    mines = minesweeper_service.generate_mines(rows, cols, mine_count, req.first_row, req.first_col)
    return {"rows": rows, "cols": cols, "mines": mines}
