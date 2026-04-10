"""Blackjack router module.

Exposes HTTP endpoints for the Blackjack game.
Delegates all business logic to :mod:`services.blackjack`.
"""

from fastapi import APIRouter
from services import blackjack as blackjack_service

router = APIRouter()


@router.get("/new-deck")
def new_deck():
    """Return a freshly shuffled 52-card deck.

    Calls :func:`services.blackjack.generate_deck` and wraps the result
    in a JSON-serialisable response envelope.

    Returns:
        dict: A response object containing:

            - **deck** (list[dict]): 52 shuffled cards, each with ``suit`` and ``rank``.

    Example:
        **Request**::

            GET /api/blackjack/new-deck

        **Response**::

            {
              "deck": [
                {"suit": "♠", "rank": "A"},
                {"suit": "♥", "rank": "7"},
                ...
              ]
            }
    """
    return {"deck": blackjack_service.generate_deck()}
