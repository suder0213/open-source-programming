import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMinePositions } from "../api/gameApi";
import "./Minesweeper.css";

// ── Constants ─────────────────────────────────────────────────────────────

const DIFFICULTIES = {
  easy:   { rows: 9,  cols: 9,  mineCount: 10, label: "Easy" },
  medium: { rows: 16, cols: 16, mineCount: 40, label: "Medium" },
  hard:   { rows: 16, cols: 30, mineCount: 99, label: "Hard" },
};

const NEIGHBOR_COLORS = [
  "", "#2563eb", "#16a34a", "#dc2626",
  "#7c3aed", "#b91c1c", "#0891b2", "#111827", "#6b7280",
];

// ── Board helpers ──────────────────────────────────────────────────────────

function createBlankBoard(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false, isRevealed: false, isFlagged: false, neighborCount: 0, exploded: false,
    }))
  );
}

function plantMines(blankBoard, mineList) {
  const board = blankBoard.map(row => row.map(cell => ({ ...cell })));
  const rows = board.length;
  const cols = board[0].length;

  for (const [r, c] of mineList) board[r][c].isMine = true;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) count++;
        }
      board[r][c].neighborCount = count;
    }
  }
  return board;
}

function floodReveal(board, startR, startC) {
  const next = board.map(row => row.map(cell => ({ ...cell })));
  const rows = next.length;
  const cols = next[0].length;
  const queue = [[startR, startC]];

  while (queue.length) {
    const [r, c] = queue.shift();
    if (next[r][c].isRevealed || next[r][c].isFlagged || next[r][c].isMine) continue;
    next[r][c].isRevealed = true;
    if (next[r][c].neighborCount === 0) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !next[nr][nc].isRevealed)
            queue.push([nr, nc]);
        }
    }
  }
  return next;
}

function checkWin(board) {
  return board.every(row => row.every(cell => cell.isMine || cell.isRevealed));
}

// ── Component ─────────────────────────────────────────────────────────────

export default function Minesweeper() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("easy");
  const [board, setBoard] = useState(() => createBlankBoard(9, 9));
  const [gameState, setGameState] = useState("idle"); // idle | playing | won | lost
  const [flagCount, setFlagCount] = useState(0);
  const [time, setTime] = useState(0);

  // Timer
  useEffect(() => {
    if (gameState !== "playing") return;
    const id = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [gameState]);

  const resetGame = useCallback((diff) => {
    const { rows, cols } = DIFFICULTIES[diff];
    setBoard(createBlankBoard(rows, cols));
    setGameState("idle");
    setFlagCount(0);
    setTime(0);
  }, []);

  const handleDifficultyChange = (diff) => {
    setDifficulty(diff);
    resetGame(diff);
  };

  const handleCellClick = useCallback(async (r, c) => {
    if (gameState === "won" || gameState === "lost") return;
    if (board[r][c].isFlagged || board[r][c].isRevealed) return;

    // First click — fetch mines from backend then reveal
    if (gameState === "idle") {
      setGameState("playing");
      const { rows, cols, mineCount } = DIFFICULTIES[difficulty];
      const mines = await fetchMinePositions({
        difficulty, rows, cols, mineCount, firstRow: r, firstCol: c,
      });

      setBoard(prev => {
        const planted = plantMines(prev, mines);
        const revealed = floodReveal(planted, r, c);
        if (checkWin(revealed)) setGameState("won");
        return revealed;
      });
      return;
    }

    // Hit a mine → game over
    if (board[r][c].isMine) {
      setBoard(prev =>
        prev.map((row, ri) =>
          row.map((cell, ci) => ({
            ...cell,
            isRevealed: cell.isMine ? true : cell.isRevealed,
            exploded: ri === r && ci === c,
          }))
        )
      );
      setGameState("lost");
      return;
    }

    // Normal reveal
    setBoard(prev => {
      const next = floodReveal(prev, r, c);
      if (checkWin(next)) setGameState("won");
      return next;
    });
  }, [gameState, board, difficulty]);

  const handleRightClick = useCallback((e, r, c) => {
    e.preventDefault();
    if (gameState === "won" || gameState === "lost") return;
    if (board[r][c].isRevealed) return;

    const wasFlagged = board[r][c].isFlagged;
    setBoard(prev =>
      prev.map((row, ri) =>
        row.map((cell, ci) =>
          ri === r && ci === c ? { ...cell, isFlagged: !cell.isFlagged } : cell
        )
      )
    );
    setFlagCount(prev => wasFlagged ? prev - 1 : prev + 1);
  }, [gameState, board]);

  const { mineCount } = DIFFICULTIES[difficulty];
  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="ms-page">
      <button className="back-btn" onClick={() => navigate("/")}>← Back</button>

      <div className="ms-header">
        <h1>Minesweeper</h1>
        <div className="ms-difficulty">
          {Object.entries(DIFFICULTIES).map(([key, { label }]) => (
            <button
              key={key}
              className={`diff-btn ${difficulty === key ? "active" : ""}`}
              onClick={() => handleDifficultyChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="ms-status-bar">
        <span className="ms-stat">💣 {mineCount - flagCount}</span>
        <button className="ms-reset" onClick={() => resetGame(difficulty)} title="New game">
          {gameState === "won" ? "😎" : gameState === "lost" ? "😵" : "🙂"}
        </button>
        <span className="ms-stat">⏱ {formatTime(time)}</span>
      </div>

      {gameState === "won" && <p className="ms-banner won">You cleared the board!</p>}
      {gameState === "lost" && <p className="ms-banner lost">Boom! Try again.</p>}

      <div className="ms-board" style={{ "--cols": DIFFICULTIES[difficulty].cols }}>
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              className={[
                "ms-cell",
                cell.isRevealed ? "revealed" : "hidden",
                cell.isRevealed && cell.isMine ? "mine" : "",
                cell.exploded ? "exploded" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => handleCellClick(r, c)}
              onContextMenu={(e) => handleRightClick(e, r, c)}
              disabled={cell.isRevealed && !cell.isMine}
            >
              {!cell.isRevealed && cell.isFlagged && "🚩"}
              {cell.isRevealed && cell.isMine && "💣"}
              {cell.isRevealed && !cell.isMine && cell.neighborCount > 0 && (
                <span style={{ color: NEIGHBOR_COLORS[cell.neighborCount] }}>
                  {cell.neighborCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
