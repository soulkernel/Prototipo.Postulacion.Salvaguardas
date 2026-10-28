"""Private E5 embedding service. No corpus or applicant data is bundled."""
import hmac
import os
from contextlib import asynccontextmanager
from typing import Literal

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

MODEL = "intfloat/multilingual-e5-small"


@asynccontextmanager
async def lifespan(app: FastAPI):
    if len(os.environ.get("GLF_E5_API_KEY", "")) < 32:
        raise RuntimeError("Configure a strong GLF_E5_API_KEY secret")
    app.state.encoder = SentenceTransformer(MODEL, device="cpu")
    yield


app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)


class Request(BaseModel):
    inputs: list[str] = Field(min_length=1, max_length=8)
    kind: Literal["query", "passage"]


@app.get("/health")
def health():
    return {"status": "ready", "model": MODEL}


@app.post("/embed")
def embed(body: Request, authorization: str = Header(default="")):
    expected = "Bearer " + os.environ["GLF_E5_API_KEY"]
    if not hmac.compare_digest(authorization.encode(), expected.encode()):
        raise HTTPException(401, "Unauthorized")
    limit = 1500 if body.kind == "query" else 12000
    if any(not t.strip() or len(t) > limit for t in body.inputs):
        raise HTTPException(422, "Invalid text length")
    vectors = app.state.encoder.encode(
        [f"{body.kind}: {text.strip()}" for text in body.inputs],
        normalize_embeddings=True, batch_size=8,
    )
    return {"model": MODEL, "embeddings": vectors.tolist()}
