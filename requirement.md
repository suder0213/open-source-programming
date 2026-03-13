# Project Requirement Document

## Overview

A browser-based, time-killing game collection web service built with **FastAPI** (backend) and **React** (frontend).
No user authentication is required. All games run entirely in the browser.
This project is for a college course and is intended for local use only.

---

## Tech Stack

| Layer     | Technology              |
|-----------|-------------------------|
| Backend   | Python / FastAPI        |
| Frontend  | React (Vite)            |
| Styling   | Plain CSS (or inline)   |
| API       | REST (JSON)             |

> Replaces the existing Flask-based `app.py`.

---

## Project Structure

```
open-source_programming/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx          # Root component with routing
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Game selection page (/)
│   │   │   ├── Blackjack.jsx
│   │   │   ├── Minesweeper.jsx
│   │   │   └── Tetris.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
├── .gitignore
├── README.md
└── requirement.md
```

---

## Pages (Minimum 3 Required)

### 1. Home Page — `/`
- Displays the title of the app.
- Shows 3 game cards/buttons, each linking to a game page.

### 2. Blackjack — `/blackjack`
- Standard card game against a dealer (computer).
- Player can Hit or Stand.
- Game logic runs in the React component (client-side).
- Backend provides a `/api/blackjack/new-deck` endpoint to shuffle and deal a new hand.

### 3. Minesweeper — `/minesweeper`
- Classic grid-based minesweeper.
- Player selects difficulty (Easy / Medium / Hard) which changes grid size and mine count.
- Game logic runs fully client-side in React.
- Backend provides a `/api/minesweeper/new-game` endpoint to generate a board (mine positions).

### 4. Tetris — `/tetris`
- Classic falling-block puzzle game.
- Runs entirely client-side using React state + `requestAnimationFrame`.
- No backend endpoint needed for this game.

---

## Backend API Endpoints

| Method | Path                        | Description                          |
|--------|-----------------------------|--------------------------------------|
| GET    | `/`                         | Health check / API info              |
| GET    | `/api/blackjack/new-deck`   | Returns a shuffled deck of 52 cards  |
| POST   | `/api/minesweeper/new-game` | Returns a new board with mine coords |

All responses are JSON. The frontend is served separately by Vite dev server during development.

---

## Key Constraints

- **No login / registration** — stateless, no user sessions.
- **Local only** — no deployment configuration needed (no Docker, no cloud).
- **No database** — all game state is held in React component state.
- CORS is enabled on FastAPI so the Vite dev server (port 5173) can call the API (port 8000).

---

## Development Environment

- Python 3.10+
- Node.js 18+
- npm or npx

---

## Deliverables

- [ ] `requirement.md` — this document
- [ ] `README.md` — local setup and run instructions
- [ ] `.gitignore` — covers Python, Node, and OS artifacts
- [ ] FastAPI backend (`backend/`)
- [ ] React frontend (`frontend/`)
- [ ] 4 pages: Home, Blackjack, Minesweeper, Tetris
