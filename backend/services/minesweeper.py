import random

DIFFICULTIES = {
    "easy":   {"rows": 9,  "cols": 9,  "mine_count": 10},
    "medium": {"rows": 16, "cols": 16, "mine_count": 40},
    "hard":   {"rows": 16, "cols": 30, "mine_count": 99},
}


def generate_mines(
    rows: int, cols: int, mine_count: int, first_row: int, first_col: int
) -> list[tuple[int, int]]:
    # Keep a 3×3 area around the first click mine-free
    safe = {
        (first_row + dr, first_col + dc)
        for dr in range(-1, 2)
        for dc in range(-1, 2)
        if 0 <= first_row + dr < rows and 0 <= first_col + dc < cols
    }

    candidates = [(r, c) for r in range(rows) for c in range(cols) if (r, c) not in safe]
    return random.sample(candidates, min(mine_count, len(candidates)))
