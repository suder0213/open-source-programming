import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Blackjack from "./pages/Blackjack";
import Minesweeper from "./pages/Minesweeper";
import Tetris from "./pages/Tetris";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blackjack" element={<Blackjack />} />
        <Route path="/minesweeper" element={<Minesweeper />} />
        <Route path="/tetris" element={<Tetris />} />
      </Routes>
    </BrowserRouter>
  );
}
