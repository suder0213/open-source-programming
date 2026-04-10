"""Echo router module.

Provides a simple echo endpoint used for testing and UI demonstrations.
"""

import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class EchoRequest(BaseModel):
    """Request body for the echo endpoint.

    Attributes:
        text (str): Non-empty string to be echoed back to the caller.

    Raises:
        ValueError: If ``text`` is an empty string.
    """

    text: str

    def model_post_init(self, __context):
        if not self.text:
            raise ValueError("text must not be empty")


@router.post("/echo")
def echo(req: EchoRequest):
    """Echo the submitted text back with a random spawn position.

    Returns the original text alongside randomly generated ``x`` and ``y``
    coordinates, which the frontend uses to position a floating bubble on screen.

    Args:
        req (EchoRequest): Request body containing the text to echo.

    Returns:
        dict: A response object containing:

            - **text** (str): The original text from the request.
            - **x** (int): Random horizontal position in the range ``[0, 100]``.
            - **y** (int): Random vertical position in the range ``[0, 80]``.

    Example:
        **Request**::

            POST /api/echo
            {"text": "hello"}

        **Response**::

            {"text": "hello", "x": 42, "y": 17}
    """
    return {
        "text": req.text,
        "x": random.randint(0, 100),
        "y": random.randint(0, 80),
    }
