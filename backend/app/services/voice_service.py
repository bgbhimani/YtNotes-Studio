import os
import re

import edge_tts

from app.database import voice_collection
from app.services.rag import generate_summary

DEFAULT_VOICE = "hi-IN-MadhurNeural"


def _strip_markdown(text: str) -> str:
    text = re.sub(r"#{1,6}\s+", "", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = re.sub(r"`(.+?)`", r"\1", text)
    text = re.sub(r"\[(.+?)\]\(.+?\)", r"\1", text)
    text = re.sub(r"[-*]\s+", "", text)
    return text.strip()


async def generate_voice_from_video(
    video_id: str,
    session_id: str,
    voice: str = DEFAULT_VOICE,
) -> dict | None:
    summary = generate_summary(video_id, session_id)

    if not summary or summary.startswith("⚠️"):
        return None

    text = _strip_markdown(summary)

    os.makedirs("generated_audio", exist_ok=True)

    filename = f"{video_id}_{session_id}.mp3"
    output_path = os.path.join("generated_audio", filename)

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)

    result = voice_collection.insert_one(
        {
            "video_id": video_id,
            "session_id": session_id,
            "path": output_path.replace("\\", "/"),
            "filename": filename,
            "voice": voice,
            "summary": summary,
        }
    )

    return {
        "summary": summary,
        "path": output_path.replace("\\", "/"),
        "filename": filename,
        "_id": str(result.inserted_id),
    }
