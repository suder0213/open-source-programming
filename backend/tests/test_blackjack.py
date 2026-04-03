from services.blackjack import generate_deck, SUITS, RANKS


def test_deck_has_52_cards():
    deck = generate_deck()
    assert len(deck) == 52


def test_deck_has_no_duplicates():
    deck = generate_deck()
    pairs = [(c["suit"], c["rank"]) for c in deck]
    assert len(pairs) == len(set(pairs))


def test_deck_contains_all_suits_and_ranks():
    deck = generate_deck()
    for suit in SUITS:
        for rank in RANKS:
            assert {"suit": suit, "rank": rank} in deck


def test_deck_is_shuffled():
    # 두 덱이 동일한 순서일 확률은 1/52! — 사실상 0
    deck1 = generate_deck()
    deck2 = generate_deck()
    assert deck1 != deck2
