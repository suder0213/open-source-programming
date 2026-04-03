from services.minesweeper import generate_mines, DIFFICULTIES


def test_mine_count_matches_difficulty():
    for key, config in DIFFICULTIES.items():
        mines = generate_mines(
            config["rows"], config["cols"], config["mine_count"],
            first_row=0, first_col=0,
        )
        assert len(mines) == config["mine_count"], f"Failed for difficulty: {key}"


def test_no_mine_in_safe_zone():
    rows, cols, mine_count = 9, 9, 10
    first_row, first_col = 4, 4

    mines = generate_mines(rows, cols, mine_count, first_row, first_col)
    mine_set = set(map(tuple, mines))

    for dr in range(-1, 2):
        for dc in range(-1, 2):
            assert (first_row + dr, first_col + dc) not in mine_set


def test_mines_within_board_bounds():
    rows, cols, mine_count = 9, 9, 10
    mines = generate_mines(rows, cols, mine_count, first_row=0, first_col=0)

    for r, c in mines:
        assert 0 <= r < rows
        assert 0 <= c < cols


def test_no_duplicate_mines():
    rows, cols, mine_count = 16, 16, 40
    mines = generate_mines(rows, cols, mine_count, first_row=0, first_col=0)
    assert len(mines) == len(set(map(tuple, mines)))
