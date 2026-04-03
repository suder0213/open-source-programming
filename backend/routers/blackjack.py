from fastapi import APIRouter
from services import blackjack as blackjack_service

router = APIRouter()


@router.get("/new-deck")
def new_deck():
    return {"deck": blackjack_service.generate_deck()}
