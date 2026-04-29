# models.py
# YtNotes Studio — Pydantic Models + MongoDB Schemas
# Database: MongoDB Atlas (via Motor - async driver)
# pip install motor pymongo pydantic[email]

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Literal
from datetime import datetime, timezone
from bson import ObjectId


# ─────────────────────────────────────────────
# HELPER — Make MongoDB's ObjectId work with Pydantic
# ─────────────────────────────────────────────

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")


def utcnow() -> datetime:
    """Always use timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


# ─────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str                          # hashed before saving

class UserInDB(UserBase):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    hashed_password: str
    created_at: datetime = Field(default_factory=utcnow)
    is_active: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: str
    created_at: datetime


# ─────────────────────────────────────────────
# VIDEO
# ─────────────────────────────────────────────

class VideoStatus(str):
    PENDING    = "pending"      # just added, not yet processed
    PROCESSING = "processing"   # transcript being fetched + indexed
    READY      = "ready"        # ChromaDB index built, ready to chat
    FAILED     = "failed"       # something went wrong


class VideoCreate(BaseModel):
    """Request body when user adds a YouTube URL."""
    url: str
    title: Optional[str] = None            # auto-filled after processing


class VideoInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str                           # owner
    url: str
    video_id: str                          # YouTube video ID e.g. "NqabT21d8VM"
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    language: Optional[str] = "en"        # detected transcript language
    status: str = VideoStatus.PENDING
    error_message: Optional[str] = None   # set if status == failed
    chunk_count: Optional[int] = None     # number of ChromaDB chunks stored
    created_at: datetime = Field(default_factory=utcnow)
    processed_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class VideoResponse(BaseModel):
    """What the frontend receives."""
    id: str
    url: str
    video_id: str
    title: Optional[str]
    thumbnail_url: Optional[str]
    status: str
    created_at: datetime
    processed_at: Optional[datetime]


class VideoStatusResponse(BaseModel):
    video_id: str
    status: str
    message: Optional[str] = None


# ─────────────────────────────────────────────
# CHAT
# ─────────────────────────────────────────────

class MessageRole(str):
    USER      = "user"
    ASSISTANT = "assistant"
    SYSTEM    = "system"


class ChatMessage(BaseModel):
    """A single message in a conversation."""
    role: Literal["user", "assistant", "system"]
    content: str
    created_at: datetime = Field(default_factory=utcnow)
    # Metadata — useful for debugging RAG
    sources: Optional[List[str]] = None   # transcript chunks used as context


class ChatSessionCreate(BaseModel):
    """Created automatically when user starts chatting with a video."""
    video_id: str


class ChatSessionInDB(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    video_id: str                          # which video this session belongs to
    messages: List[ChatMessage] = []       # full conversation history
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
    title: Optional[str] = None           # auto-generated from first question

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class ChatSessionResponse(BaseModel):
    id: str
    video_id: str
    messages: List[ChatMessage]
    created_at: datetime
    updated_at: datetime
    title: Optional[str]


class ChatRequest(BaseModel):
    """Body of POST /api/chat/{video_id}/message"""
    question: str
    session_id: Optional[str] = None      # if None, creates a new session
    language: Optional[str] = "en"        # response language preference


class ChatResponse(BaseModel):
    """Used for non-streaming responses (fallback)."""
    answer: str
    session_id: str
    sources: Optional[List[str]] = None


# ─────────────────────────────────────────────
# STUDIO ARTIFACTS
# ─────────────────────────────────────────────

class ArtifactType(str):
    SUMMARY     = "summary"
    FLASHCARDS  = "flashcards"
    MINDMAP     = "mindmap"
    QUIZ        = "quiz"
    REPORT      = "report"
    INFOGRAPHIC = "infographic"
    DATATABLE   = "datatable"


# ── Summary ──────────────────────────────────

class SummaryRequest(BaseModel):
    length: Literal["short", "medium", "long"] = "medium"
    language: Literal["en", "hi", "gu", "bn", "mr", "pa", "ta", "te", "kn", "ml"] = "en"

class SummaryContent(BaseModel):
    text: str                              # markdown formatted summary
    word_count: int
    language: str
    length: str


# ── Flashcards ────────────────────────────────

class FlashcardRequest(BaseModel):
    count: int = Field(default=10, ge=3, le=30)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    language: Literal["en", "hi", "gu", "bn", "mr", "pa", "ta", "te", "kn", "ml"] = "en"

class Flashcard(BaseModel):
    front: str                             # question / term
    back: str                              # answer / definition
    difficulty: str

class FlashcardsContent(BaseModel):
    cards: List[Flashcard]
    language: str


# ── Mind Map ──────────────────────────────────

class MindMapRequest(BaseModel):
    depth: Literal["basic", "detailed"] = "basic"
    language: Literal["en", "hi", "gu", "bn", "mr", "pa", "ta", "te", "kn", "ml"] = "en"

class MindMapNode(BaseModel):
    id: str
    label: str
    parent_id: Optional[str] = None        # None = root node

class MindMapContent(BaseModel):
    nodes: List[MindMapNode]               # React Flow renders these
    language: str
    depth: str


# ── Quiz ─────────────────────────────────────

class QuizRequest(BaseModel):
    count: int = Field(default=5, ge=3, le=20)
    type: Literal["mcq", "true_false"] = "mcq"
    language: Literal["en", "hi", "gu", "bn", "mr", "pa", "ta", "te", "kn", "ml"] = "en"

class QuizOption(BaseModel):
    label: str                             # "A", "B", "C", "D"
    text: str

class QuizQuestion(BaseModel):
    question: str
    options: List[QuizOption]
    correct_label: str                     # "A" / "B" / "True" / "False"
    explanation: Optional[str] = None

class QuizContent(BaseModel):
    questions: List[QuizQuestion]
    language: str


# ── Generic Artifact stored in MongoDB ───────

class StudioArtifactInDB(BaseModel):
    """Every generated studio output is saved here."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    video_id: str
    artifact_type: str                     # "summary" | "flashcards" | etc.
    # content is stored as a dict — actual shape depends on artifact_type
    # e.g. SummaryContent.dict() | FlashcardsContent.dict() | MindMapContent.dict()
    content: dict
    options: dict                          # the request params used (length, language, etc.)
    created_at: datetime = Field(default_factory=utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class StudioArtifactResponse(BaseModel):
    id: str
    video_id: str
    artifact_type: str
    content: dict
    options: dict
    created_at: datetime


# ─────────────────────────────────────────────
# GENERIC API RESPONSES
# ─────────────────────────────────────────────

class SuccessResponse(BaseModel):
    success: bool = True
    message: str

class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    detail: Optional[str] = None