import { useReducer, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Tetris.css";

// ── Constants ─────────────────────────────────────────────────────────────

const COLS = 10;
const ROWS = 20;

const TETROMINOS = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: "#00f0f0" },
  O: { shape: [[1,1],[1,1]],                              color: "#f0f000" },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]],                 color: "#a000f0" },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]],                 color: "#00f000" },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]],                 color: "#f00000" },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]],                 color: "#0050f0" },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]],                 color: "#f0a000" },
};

const TYPES = Object.keys(TETROMINOS);
const SCORE_TABLE = [0, 100, 300, 500, 800]; // lines cleared: 0-4

// ── Pure helpers ───────────────────────────────────────────────────────────

const createBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(null));

const randomType = () => TYPES[Math.floor(Math.random() * TYPES.length)];

function newPiece(type) {
  const { shape, color } = TETROMINOS[type];
  return {
    type, shape, color,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
  };
}

function rotateCW(shape) {
  const N = shape.length;
  return Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) => shape[N - 1 - j][i])
  );
}

function isValid(board, shape, x, y) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nr = y + r, nc = x + c;
      if (nr >= ROWS || nc < 0 || nc >= COLS) return false;
      if (nr >= 0 && board[nr][nc]) return false;
    }
  }
  return true;
}

function lockAndClear(board, piece) {
  const next = board.map(row => [...row]);
  let topOut = false;

  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const nr = piece.y + r;
      if (nr < 0) { topOut = true; continue; }
      next[nr][piece.x + c] = piece.color;
    }
  }

  if (topOut) return { board: next, cleared: 0, gameOver: true };

  const kept = next.filter(row => !row.every(Boolean));
  const cleared = ROWS - kept.length;
  const filled = [
    ...Array(cleared).fill(null).map(() => Array(COLS).fill(null)),
    ...kept,
  ];
  return { board: filled, cleared, gameOver: false };
}

function getDisplayBoard(board, piece) {
  if (!piece) return board;

  // Ghost piece: find lowest valid drop position
  let ghostY = piece.y;
  while (isValid(board, piece.shape, piece.x, ghostY + 1)) ghostY++;

  const display = board.map(row => [...row]);

  // Paint ghost (only where board is empty and not overlapping real piece)
  if (ghostY !== piece.y) {
    for (let r = 0; r < piece.shape.length; r++)
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (!piece.shape[r][c]) continue;
        const gr = ghostY + r, gc = piece.x + c;
        if (gr >= 0 && gr < ROWS && gc >= 0 && gc < COLS && !display[gr][gc])
          display[gr][gc] = "ghost";
      }
  }

  // Paint current piece
  for (let r = 0; r < piece.shape.length; r++)
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const pr = piece.y + r, pc = piece.x + c;
      if (pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS)
        display[pr][pc] = piece.color;
    }

  return display;
}

// ── Reducer ────────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  board: createBoard(),
  piece: null,
  nextType: randomType(),
  score: 0,
  lines: 0,
  level: 1,
  gameState: "idle", // idle | playing | paused | over
};

function spawnNext(state) {
  const { board, piece, nextType, score, lines, level } = state;
  const { board: newBoard, cleared, gameOver } = lockAndClear(board, piece);

  if (gameOver) return { ...state, board: newBoard, gameState: "over" };

  const newLines = lines + cleared;
  const newLevel = Math.floor(newLines / 10) + 1;
  const newScore = score + SCORE_TABLE[Math.min(cleared, 4)] * level;
  const next = newPiece(nextType);
  const newNextType = randomType();

  // Spawn collision = board topped out
  if (!isValid(newBoard, next.shape, next.x, next.y)) {
    return { ...state, board: newBoard, piece: next, gameState: "over", score: newScore, lines: newLines, level: newLevel };
  }

  return { ...state, board: newBoard, piece: next, nextType: newNextType, score: newScore, lines: newLines, level: newLevel };
}

function reducer(state, action) {
  const { board, piece, gameState } = state;

  switch (action.type) {
    case "START":
      return { ...INITIAL_STATE, piece: newPiece(randomType()), nextType: randomType(), gameState: "playing" };

    case "PAUSE":
      if (gameState !== "playing" && gameState !== "paused") return state;
      return { ...state, gameState: gameState === "playing" ? "paused" : "playing" };

    case "MOVE": {
      if (gameState !== "playing" || !piece) return state;
      const nx = piece.x + action.dx;
      const ny = piece.y + action.dy;
      if (!isValid(board, piece.shape, nx, ny)) return state;
      return { ...state, piece: { ...piece, x: nx, y: ny } };
    }

    case "ROTATE": {
      if (gameState !== "playing" || !piece) return state;
      const rotated = rotateCW(piece.shape);
      // Wall kicks: try offsets 0, +1, -1, +2, -2
      for (const kick of [0, 1, -1, 2, -2]) {
        if (isValid(board, rotated, piece.x + kick, piece.y))
          return { ...state, piece: { ...piece, shape: rotated, x: piece.x + kick } };
      }
      return state;
    }

    case "TICK":
    case "SOFT_DROP": {
      if (gameState !== "playing" || !piece) return state;
      if (isValid(board, piece.shape, piece.x, piece.y + 1)) {
        const bonus = action.type === "SOFT_DROP" ? 1 : 0;
        return { ...state, piece: { ...piece, y: piece.y + 1 }, score: state.score + bonus };
      }
      return spawnNext(state);
    }

    case "HARD_DROP": {
      if (gameState !== "playing" || !piece) return state;
      let dropY = piece.y;
      while (isValid(board, piece.shape, piece.x, dropY + 1)) dropY++;
      const dist = dropY - piece.y;
      return spawnNext({ ...state, piece: { ...piece, y: dropY }, score: state.score + dist * 2 });
    }

    default:
      return state;
  }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function Tetris() {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const { board, piece, nextType, score, lines, level, gameState } = state;

  // Game loop — re-creates when level changes to update speed
  useEffect(() => {
    if (gameState !== "playing") return;
    const ms = Math.max(80, 1000 - (level - 1) * 90);
    const id = setInterval(() => dispatch({ type: "TICK" }), ms);
    return () => clearInterval(id);
  }, [gameState, level]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e) => {
      switch (e.code) {
        case "ArrowLeft":  e.preventDefault(); dispatch({ type: "MOVE", dx: -1, dy: 0 }); break;
        case "ArrowRight": e.preventDefault(); dispatch({ type: "MOVE", dx:  1, dy: 0 }); break;
        case "ArrowDown":  e.preventDefault(); dispatch({ type: "SOFT_DROP" }); break;
        case "ArrowUp":
        case "KeyZ":       e.preventDefault(); dispatch({ type: "ROTATE" }); break;
        case "Space":      e.preventDefault(); dispatch({ type: "HARD_DROP" }); break;
        case "KeyP":       dispatch({ type: "PAUSE" }); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const displayBoard = getDisplayBoard(board, piece);
  const nextShape = TETROMINOS[nextType].shape;
  const nextColor = TETROMINOS[nextType].color;

  return (
    <div className="tetris-page">
      <button className="back-btn" onClick={() => navigate("/")}>← Back</button>

      <div className="tetris-layout">
        {/* Board */}
        <div className="tetris-board">
          {displayBoard.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={`${r}-${c}`}
                className={`t-cell${cell ? (cell === "ghost" ? " ghost" : " filled") : ""}`}
                style={cell && cell !== "ghost" ? { background: cell } : {}}
              />
            ))
          )}

          {/* Pause / Game-over overlay rendered inside the board */}
          {gameState === "paused" && (
            <div className="board-overlay">
              <p>PAUSED</p>
              <button className="t-btn primary" onClick={() => dispatch({ type: "PAUSE" })}>Resume</button>
            </div>
          )}
          {gameState === "over" && (
            <div className="board-overlay">
              <p>GAME OVER</p>
              <button className="t-btn primary" onClick={() => dispatch({ type: "START" })}>Play Again</button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div className="tetris-panel">
          {/* Next piece */}
          <div className="panel-box">
            <p className="panel-label">NEXT</p>
            <div
              className="next-grid"
              style={{ gridTemplateColumns: `repeat(${nextShape[0].length}, 22px)` }}
            >
              {nextShape.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`t-cell${cell ? " filled" : ""}`}
                    style={cell ? { background: nextColor } : {}}
                  />
                ))
              )}
            </div>
          </div>

          {/* Stats */}
          {[["SCORE", score.toLocaleString()], ["LINES", lines], ["LEVEL", level]].map(([label, val]) => (
            <div key={label} className="panel-box">
              <p className="panel-label">{label}</p>
              <p className="panel-value">{val}</p>
            </div>
          ))}

          {/* Action button */}
          {gameState === "idle" && (
            <button className="t-btn primary" onClick={() => dispatch({ type: "START" })}>Start</button>
          )}
          {(gameState === "playing" || gameState === "paused") && (
            <button className="t-btn secondary" onClick={() => dispatch({ type: "PAUSE" })}>
              {gameState === "paused" ? "Resume" : "Pause"}
            </button>
          )}
          {gameState === "over" && (
            <button className="t-btn primary" onClick={() => dispatch({ type: "START" })}>Play Again</button>
          )}

          {/* Controls hint */}
          <div className="controls-hint">
            <p>← → &nbsp; Move</p>
            <p>↑ / Z &nbsp; Rotate</p>
            <p>↓ &nbsp;&nbsp;&nbsp;&nbsp; Soft drop</p>
            <p>Space &nbsp; Hard drop</p>
            <p>P &nbsp;&nbsp;&nbsp;&nbsp; Pause</p>
          </div>
        </div>
      </div>
    </div>
  );
}
