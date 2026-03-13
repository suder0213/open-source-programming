# Game Hub

A browser-based game collection built with **FastAPI** (backend) and **React** (frontend).
Includes Blackjack, Minesweeper, and Tetris — no login required.

---

## Running Locally

### Option A — Docker (recommended)

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd open-source_programming

# 2. Start everything
docker compose up --build
```

Open your browser at **http://localhost:5173**

To stop:
```bash
docker compose down
```

---

### Option B — Manual

**Requirements:** Python 3.10+, Node.js 18+

#### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at **http://localhost:8000**

#### 2. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open your browser at **http://localhost:5173**

---

## Project Structure

```
open-source_programming/
├── backend/
│   ├── main.py           # FastAPI app
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx       # React Router setup
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Blackjack.jsx
│   │       ├── Minesweeper.jsx
│   │       └── Tetris.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
├── requirement.md
└── README.md
```

## Pages

| Route          | Description                        |
|----------------|------------------------------------|
| `/`            | Home — choose a game               |
| `/blackjack`   | Blackjack card game                |
| `/minesweeper` | Minesweeper puzzle                 |
| `/tetris`      | Tetris falling-block game          |
