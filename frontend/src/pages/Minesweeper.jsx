import { useNavigate } from "react-router-dom";
import "./GameStub.css";

export default function Minesweeper() {
  const navigate = useNavigate();
  return (
    <div className="stub">
      <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
      <h1>💣 Minesweeper</h1>
      <p>Coming soon...</p>
    </div>
  );
}
