"""Blackjack business logic module.

Handles deck generation and shuffling.
Has no dependency on FastAPI, so it can be called and tested without an HTTP context.
"""

import random

SUITS = ["♠", "♥", "♦", "♣"]
RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"]


def generate_deck() -> list[dict]:
    """Generate a standard 52-card deck and return it in shuffled order.

    Builds every combination of 4 suits (♠ ♥ ♦ ♣) and 13 ranks (2–A),
    then randomises the order with ``random.shuffle``.

    Returns:
        list[dict]: A shuffled list of 52 cards. Each card is a dict with:

            - **suit** (str): Card suit, e.g. ``"♠"``
            - **rank** (str): Card rank, e.g. ``"A"``

    Example:
        >>> deck = generate_deck()
        >>> len(deck)
        52
        >>> set(deck[0].keys()) == {"suit", "rank"}
        True
    """
    deck = [{"suit": s, "rank": r} for s in SUITS for r in RANKS]
    random.shuffle(deck)
    return deck
