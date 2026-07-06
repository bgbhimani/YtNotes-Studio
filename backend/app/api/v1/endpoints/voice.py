import os

from bson import ObjectId
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.database import voice_collection
from app.services.voice_service import generate_voice_from_video

router = APIRouter()


@router.get("/download/{voice_id}")
def download_voice(voice_id: str):
    doc = voice_collection.find_one({"_id": ObjectId(voice_id)})

    if not doc or not os.path.exists(doc["path"]):
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=doc["path"],
        media_type="audio/mpeg",
        filename=doc.get("filename") or os.path.basename(doc["path"]),
    )


@router.post("/generate")
async def generate_voice(
    video_id: str,
    session_id: str,
    voice: str = "hi-IN-MadhurNeural",
):
    result = await generate_voice_from_video(video_id, session_id, voice)

    if not result:
        raise HTTPException(
            status_code=400,
            detail="Could not generate audio. Process the video first.",
        )

    return result


@router.get("/all")
def get_all_voices(session_id: str, video_id: str):
    docs = list(
        voice_collection.find({"session_id": session_id, "video_id": video_id})
    )

    for doc in docs:
        doc["_id"] = str(doc["_id"])

    return {"voices": docs}


@router.delete("/{voice_id}")
def delete_voice(voice_id: str):
    doc = voice_collection.find_one({"_id": ObjectId(voice_id)})

    if not doc:
        return {"error": "not found"}

    if os.path.exists(doc["path"]):
        os.remove(doc["path"])

    voice_collection.delete_one({"_id": ObjectId(voice_id)})

    return {"message": "deleted"}
