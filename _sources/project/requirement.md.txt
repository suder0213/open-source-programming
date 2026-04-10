# Project Requirement Document

## Overview

A browser-based, time-killing game collection web service built with **FastAPI** (backend) and **React** (frontend).
No user authentication is required. All games run entirely in the browser.
This project is for a college course and is intended for local use only.

---

## Tech Stack

| Layer         | Technology              |
|---------------|-------------------------|
| Backend       | Python / FastAPI        |
| Frontend      | React (Vite)            |
| Styling       | Plain CSS (or inline)   |
| API           | REST (JSON)             |
| Containerization | Docker + Docker Compose |

> Replaces the existing Flask-based `app.py`.

---

## Project Structure

```
open-source_programming/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── Dockerfile           # Backend container
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
│   ├── Dockerfile           # Frontend container (Nginx)
│   └── package.json
├── docker-compose.yml       # Orchestrates both services
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
- **Local only** — Docker is used only for simplified local development, not cloud deployment.
- **No database** — all game state is held in React component state.
- In Docker mode: frontend (Nginx) runs on port 5173, backend (uvicorn) on port 8000.
- In manual mode: CORS is enabled on FastAPI so the Vite dev server (port 5173) can call the API (port 8000).

---

## Development Environment

**Option A — Docker (recommended, easiest)**
- Docker Desktop

**Option B — Manual**
- Python 3.10+
- Node.js 18+
- npm

---

## Deliverables

- [x] `requirement.md` — this document
- [x] `README.md` — local setup and run instructions
- [x] `.gitignore` — covers Python, Node, OS, and Docker artifacts
- [x] FastAPI backend (`backend/`)
- [x] React frontend (`frontend/`)
- [x] 4 pages: Home, Blackjack, Minesweeper, Tetris
- [ ] `docker-compose.yml` + `Dockerfile`s
