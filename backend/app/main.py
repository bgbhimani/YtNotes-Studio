import os

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.api.v1.endpoints import chat, videos, summary, ppt, voice
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Yt Notes Studio API"
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(videos.router, prefix="/video")
app.include_router(chat.router, prefix="/chat")
app.include_router(summary.router, prefix="/summary")
app.include_router(ppt.router, prefix="/ppt", tags=["ppt"])
app.include_router(voice.router, prefix="/voice", tags=["voice"])

os.makedirs("generated_ppts", exist_ok=True)
os.makedirs("generated_audio", exist_ok=True)

app.mount(
    "/generated_ppts",
    StaticFiles(directory="generated_ppts"),
    name="generated_ppts",
)
app.mount(
    "/generated_audio",
    StaticFiles(directory="generated_audio"),
    name="generated_audio",
)


@app.get("/")
def health_check():
    return {"status": "ok"}
