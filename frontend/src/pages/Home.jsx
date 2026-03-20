import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const games = [
  {
    id: "blackjack",
    title: "Blackjack",
    description: "Beat the dealer to 21 without going bust.",
    emoji: "🃏",
    path: "/blackjack",
  },
  {
    id: "minesweeper",
    title: "Minesweeper",
    description: "Clear the board without hitting a mine.",
    emoji: "💣",
    path: "/minesweeper",
  },
  {
    id: "tetris",
    title: "Tetris",
    description: "Stack the falling blocks and clear lines.",
    emoji: "🟦",
    path: "/tetris",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [bubbles, setBubbles] = useState([]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    const res = await fetch("/api/echo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    const data = await res.json();

    const id = Date.now();
    setBubbles((prev) => [...prev, { id, text: data.text, x: data.x, y: data.y }]);
    setInput("");

    // Remove bubble after animation ends
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== id));
    }, 8000);
  }

  return (
    <div className="home">
      <header className="home-header">
        <h1>Game Hub</h1>
        <p>Pick a game and kill some time.</p>
      </header>

      <div className="game-grid">
        {games.map((game) => (
          <button
            key={game.id}
            className="game-card"
            onClick={() => navigate(game.path)}
          >
            <span className="game-emoji">{game.emoji}</span>
            <h2>{game.title}</h2>
            <p>{game.description}</p>
          </button>
        ))}
      </div>

      <form className="echo-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
        />
        <button type="submit">Send</button>
      </form>

      {bubbles.map((b) => (
        <div
          key={b.id}
          role="status"
          className="bubble"
          style={{ left: `${b.x}%`, bottom: `${b.y}%` }}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
}
