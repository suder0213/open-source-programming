import random
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class EchoRequest(BaseModel):
    text: str

    def model_post_init(self, __context):
        if not self.text:
            raise ValueError("text must not be empty")


@router.post("/echo")
def echo(req: EchoRequest):
    return {
        "text": req.text,
        "x": random.randint(0, 100),
        "y": random.randint(0, 80),
    }
