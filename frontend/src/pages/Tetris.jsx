import { useNavigate } from "react-router-dom";
import "./GameStub.css";

export default function Tetris() {
  const navigate = useNavigate();
  return (
    <div className="stub">
      <button className="back-btn" onClick={() => navigate("/")}>← Back</button>
      <h1>🟦 Tetris</h1>
      <p>Coming soon...</p>
    </div>
  );
}
