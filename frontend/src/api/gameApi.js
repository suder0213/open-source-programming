// ── Blackjack ──────────────────────────────────────────────────────────────

function localDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  const deck = suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));
  return deck.sort(() => Math.random() - 0.5);
}

export async function fetchDeck() {
  try {
    const res = await fetch("/api/blackjack/new-deck");
    const data = await res.json();
    return data.deck;
  } catch {
    return localDeck();
  }
}

// ── Minesweeper ────────────────────────────────────────────────────────────

function localMines(rows, cols, mineCount, firstR, firstC) {
  const safe = new Set();
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const nr = firstR + dr, nc = firstC + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) safe.add(`${nr},${nc}`);
    }
  const candidates = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      if (!safe.has(`${r},${c}`)) candidates.push([r, c]);
  return candidates.sort(() => Math.random() - 0.5).slice(0, mineCount);
}

export async function fetchMinePositions({ difficulty, rows, cols, mineCount, firstRow, firstCol }) {
  try {
    const res = await fetch("/api/minesweeper/new-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ difficulty, first_row: firstRow, first_col: firstCol }),
    });
    const data = await res.json();
    return data.mines;
  } catch {
    return localMines(rows, cols, mineCount, firstRow, firstCol);
  }
}
