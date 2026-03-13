import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Blackjack.css";

// ── Card helpers ───────────────────────────────────────────────────────────

const RED_SUITS = new Set(["♥", "♦"]);

function cardValue(rank) {
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return parseInt(rank);
}

function handTotal(cards) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === "A") aces++;
    total += cardValue(card.rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isBlackjack(cards) {
  return cards.length === 2 && handTotal(cards) === 21;
}

// Generate a local shuffled deck (fallback if backend unreachable)
function localDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  const deck = suits.flatMap(suit => ranks.map(rank => ({ suit, rank })));
  return deck.sort(() => Math.random() - 0.5);
}

// ── Sub-components ─────────────────────────────────────────────────────────

function PlayingCard({ card, hidden = false }) {
  if (hidden) {
    return <div className="card card-hidden"><span>?</span></div>;
  }
  const red = RED_SUITS.has(card.suit);
  return (
    <div className={`card ${red ? "card-red" : "card-black"}`}>
      <span className="card-rank-top">{card.rank}</span>
      <span className="card-suit">{card.suit}</span>
      <span className="card-rank-bot">{card.rank}</span>
    </div>
  );
}

function Hand({ cards, hideSecond = false, label, total, soft }) {
  return (
    <div className="hand">
      <p className="hand-label">
        {label}
        {!hideSecond && (
          <span className="hand-total">
            {total}{soft ? " (soft)" : ""}
          </span>
        )}
      </p>
      <div className="hand-cards">
        {cards.map((card, i) => (
          <PlayingCard key={i} card={card} hidden={hideSecond && i === 1} />
        ))}
      </div>
    </div>
  );
}

// ── Result banner ──────────────────────────────────────────────────────────

const RESULT_CONFIG = {
  blackjack: { text: "Blackjack! You win!", cls: "win" },
  win:       { text: "You win!",           cls: "win" },
  lose:      { text: "Dealer wins.",       cls: "lose" },
  push:      { text: "Push — it's a tie.", cls: "push" },
  bust:      { text: "Bust! Dealer wins.", cls: "lose" },
};

// ── Main component ─────────────────────────────────────────────────────────

export default function Blackjack() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [gameState, setGameState] = useState("idle");   // idle | playing | done
  const [result, setResult] = useState(null);           // null | blackjack | win | lose | push | bust
  const [loading, setLoading] = useState(false);

  // Draw n cards from deck, return [drawn, remaining]
  function draw(d, n = 1) {
    return [d.slice(0, n), d.slice(n)];
  }

  const dealNewGame = useCallback(async () => {
    setLoading(true);
    let freshDeck;
    try {
      const res = await fetch("/api/blackjack/new-deck");
      const data = await res.json();
      freshDeck = data.deck;
    } catch {
      freshDeck = localDeck();
    }

    // Deal: player, dealer, player, dealer
    const [p1, d1] = draw(freshDeck);
    const [d1Card, deckAfterP1] = [p1[0], d1];
    const [p2, d2] = draw(deckAfterP1);
    const [d2Card, deckAfterP2] = [p2[0], d2];
    const [p3, d3] = draw(deckAfterP2);
    const [d3Card, deckAfterP3] = [p3[0], d3];
    const [p4, d4] = draw(deckAfterP3);
    const [d4Card, remaining] = [p4[0], d4];

    const newPlayer = [d1Card, d3Card];
    const newDealer = [d2Card, d4Card];

    setDeck(remaining);
    setPlayerHand(newPlayer);
    setDealerHand(newDealer);
    setResult(null);
    setLoading(false);

    // Check immediate blackjack
    if (isBlackjack(newPlayer)) {
      setGameState("done");
      setResult(isBlackjack(newDealer) ? "push" : "blackjack");
    } else {
      setGameState("playing");
    }
  }, []);

  const hit = useCallback(() => {
    const [drawn, remaining] = draw(deck);
    const newHand = [...playerHand, drawn[0]];
    setDeck(remaining);
    setPlayerHand(newHand);

    if (handTotal(newHand) > 21) {
      setGameState("done");
      setResult("bust");
    }
  }, [deck, playerHand]);

  const stand = useCallback(() => {
    // Dealer draws until total >= 17
    let currentHand = [...dealerHand];
    let currentDeck = [...deck];

    while (handTotal(currentHand) < 17) {
      const [drawn, remaining] = draw(currentDeck);
      currentHand = [...currentHand, drawn[0]];
      currentDeck = remaining;
    }

    setDealerHand(currentHand);
    setDeck(currentDeck);
    setGameState("done");

    const playerTotal = handTotal(playerHand);
    const dealerTotal = handTotal(currentHand);

    if (dealerTotal > 21 || playerTotal > dealerTotal) setResult("win");
    else if (playerTotal < dealerTotal) setResult("lose");
    else setResult("push");
  }, [deck, dealerHand, playerHand]);

  const playerTotal = handTotal(playerHand);
  const dealerTotal = handTotal(dealerHand);
  const dealerHideSecond = gameState === "playing";

  return (
    <div className="bj-page">
      <button className="back-btn" onClick={() => navigate("/")}>← Back</button>

      <h1 className="bj-title">Blackjack</h1>

      <div className="bj-table">
        {/* Dealer hand */}
        {dealerHand.length > 0 && (
          <Hand
            cards={dealerHand}
            hideSecond={dealerHideSecond}
            label="Dealer"
            total={dealerTotal}
          />
        )}

        {/* Result banner */}
        {result && (
          <div className={`bj-result ${RESULT_CONFIG[result].cls}`}>
            {RESULT_CONFIG[result].text}
          </div>
        )}

        {/* Player hand */}
        {playerHand.length > 0 && (
          <Hand
            cards={playerHand}
            label="You"
            total={playerTotal}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="bj-actions">
        {gameState === "idle" && (
          <button className="bj-btn primary" onClick={dealNewGame} disabled={loading}>
            {loading ? "Dealing…" : "Deal"}
          </button>
        )}

        {gameState === "playing" && (
          <>
            <button className="bj-btn primary" onClick={hit}>Hit</button>
            <button className="bj-btn secondary" onClick={stand}>Stand</button>
          </>
        )}

        {gameState === "done" && (
          <button className="bj-btn primary" onClick={dealNewGame} disabled={loading}>
            {loading ? "Dealing…" : "New Hand"}
          </button>
        )}
      </div>

      {gameState === "idle" && (
        <p className="bj-hint">Press Deal to start. Try to get closer to 21 than the dealer.</p>
      )}
    </div>
  );
}
