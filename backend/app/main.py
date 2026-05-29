from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.api.v1.endpoints import chat, videos, summary, ppt
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
app.include_router(ppt.router,prefix="/ppt",tags=["ppt"])


app.mount(
    "/generated_ppts",
    StaticFiles(directory="generated_ppts"),
    name="generated_ppts"
)


@app.get("/")
def health_check():
    return {"status": "ok"}
