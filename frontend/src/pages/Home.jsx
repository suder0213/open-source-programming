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
    </div>
  );
}
