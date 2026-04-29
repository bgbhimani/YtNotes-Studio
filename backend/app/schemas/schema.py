from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# =========================
# 🔹 Message Model
# =========================
class Message(BaseModel):
    role: str = Field(..., example="user")  # "user" or "assistant"
    content: str = Field(..., example="Explain transformers")


# =========================
# 🔹 Chat Model (DB Schema)
# =========================
class Chat(BaseModel):
    session_id: str = Field(..., example="abc123-session")
    video_id: str = Field(..., example="yt_video_id")
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# =========================
# 🔹 Create Chat Request
# =========================


class ChatRequest(BaseModel):
    video_id: str
    question: str
    session_id: str   # ✅ ADD THIS

# =========================
# 🔹 Chat Response
# =========================
class ChatResponse(BaseModel):
    answer: str


# =========================
# 🔹 Video Model (DB Schema)
# =========================
class Video(BaseModel):
    video_id: str
    youtube_url: str
    title: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


# =========================
# 🔹 Create Video Request
# =========================

class VideoRequest(BaseModel):
    youtube_url: str
    session_id: str
# =========================
# 🔹 Video Response
# =========================
class VideoResponse(BaseModel):
    video_id: str
    message: str


# =========================
# 🔹 Summary Response
# =========================
class SummaryResponse(BaseModel):
    video_id: str
    summary: str

class SummaryRequest(BaseModel):
    video_id: str
    session_id: str 
    
# =========================
# 🔹 Chat History Response
# =========================
class ChatHistoryResponse(BaseModel):
    session_id: str
    video_id: str
    messages: List[Message]