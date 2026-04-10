"""Minesweeper business logic module.

Handles mine placement with a guaranteed safe zone around the first click.
Has no dependency on FastAPI, so it can be called and tested without an HTTP context.
"""

import random

DIFFICULTIES = {
    "easy":   {"rows": 9,  "cols": 9,  "mine_count": 10},
    "medium": {"rows": 16, "cols": 16, "mine_count": 40},
    "hard":   {"rows": 16, "cols": 30, "mine_count": 99},
}


def generate_mines(
    rows: int, cols: int, mine_count: int, first_row: int, first_col: int
) -> list[tuple[int, int]]:
    """Randomly place mines on a board while keeping the first-click area safe.

    A 3×3 zone centred on ``(first_row, first_col)`` is excluded from mine
    candidates, guaranteeing the player never hits a mine on the opening move.

    Args:
        rows (int): Total number of rows on the board.
        cols (int): Total number of columns on the board.
        mine_count (int): Number of mines to place.
        first_row (int): Row index of the player's first click.
        first_col (int): Column index of the player's first click.

    Returns:
        list[tuple[int, int]]: A list of ``(row, col)`` positions where mines
        are placed. Length equals ``min(mine_count, available_cells)``.

    Example:
        >>> mines = generate_mines(9, 9, 10, 4, 4)
        >>> len(mines)
        10
        >>> (4, 4) in mines
        False
    """
    safe = {
        (first_row + dr, first_col + dc)
        for dr in range(-1, 2)
        for dc in range(-1, 2)
        if 0 <= first_row + dr < rows and 0 <= first_col + dc < cols
    }

    candidates = [(r, c) for r in range(rows) for c in range(cols) if (r, c) not in safe]
    return random.sample(candidates, min(mine_count, len(candidates)))
