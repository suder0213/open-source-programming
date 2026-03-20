"""
TDD - RED phase
Tests for POST /api/echo endpoint (not yet implemented).
All tests here are expected to FAIL until the feature is built.
"""
import pytest
import httpx
from main import app

pytestmark = pytest.mark.anyio


async def post_echo(text: str):
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post("/api/echo", json={"text": text})


async def test_echo_returns_200():
    """Endpoint must exist and accept a JSON body with 'text'."""
    res = await post_echo("hello")
    assert res.status_code == 200


async def test_echo_returns_same_text():
    """Response body must echo back the exact text the user sent."""
    res = await post_echo("hello world")
    assert res.json()["text"] == "hello world"


async def test_echo_returns_random_x_position():
    """Response must include an 'x' field (0–100) for the bubble spawn position."""
    data = (await post_echo("test")).json()
    assert "x" in data
    assert 0 <= data["x"] <= 100


async def test_echo_returns_valid_y_position():
    """Response must include a 'y' field capped so the bubble stays visible (0–80)."""
    data = (await post_echo("test")).json()
    assert "y" in data
    assert 0 <= data["y"] <= 80


async def test_echo_rejects_empty_text():
    """Empty string should be rejected with 422 Unprocessable Entity."""
    res = await post_echo("")
    assert res.status_code == 422
