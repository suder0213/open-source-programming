"""Minesweeper router module.

Exposes HTTP endpoints for the Minesweeper game.
Delegates mine-generation logic to :mod:`services.minesweeper`.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from services import minesweeper as minesweeper_service

router = APIRouter()


class NewGameRequest(BaseModel):
    """Request body for starting a new Minesweeper game.

    Attributes:
        difficulty (str): Game difficulty level. One of ``"easy"``, ``"medium"``, or ``"hard"``.
        first_row (int): Row index of the player's first click (0-based).
        first_col (int): Column index of the player's first click (0-based).
    """

    difficulty: str
    first_row: int
    first_col: int


@router.post("/new-game")
def new_game(req: NewGameRequest):
    """Generate a new Minesweeper board based on the requested difficulty.

    Looks up board dimensions and mine count from :data:`services.minesweeper.DIFFICULTIES`,
    then delegates mine placement to :func:`services.minesweeper.generate_mines`.
    If an unrecognised difficulty is supplied, it falls back to ``"easy"``.

    Args:
        req (NewGameRequest): Difficulty level and the position of the first click.

    Returns:
        dict: A response object containing:

            - **rows** (int): Number of rows on the board.
            - **cols** (int): Number of columns on the board.
            - **mines** (list[list[int]]): List of ``[row, col]`` mine positions.

    Example:
        **Request**::

            POST /api/minesweeper/new-game
            {"difficulty": "easy", "first_row": 4, "first_col": 4}

        **Response**::

            {"rows": 9, "cols": 9, "mines": [[0, 2], [3, 7], ...]}
    """
    config = minesweeper_service.DIFFICULTIES.get(req.difficulty, minesweeper_service.DIFFICULTIES["easy"])
    rows, cols, mine_count = config["rows"], config["cols"], config["mine_count"]
    mines = minesweeper_service.generate_mines(rows, cols, mine_count, req.first_row, req.first_col)
    return {"rows": rows, "cols": cols, "mines": mines}
