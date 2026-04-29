# from fastapi import APIRouter
# from app.schemas.schema import VideoRequest, VideoResponse
# from app.services.youtube import fetch_transcript
# from app.services.rag import build_index
# from app.database import video_collection

# router = APIRouter()


# @router.post("/video", response_model=VideoResponse)
# def add_video(data: VideoRequest):
#     text, video_id = fetch_transcript(data.youtube_url)

#     build_index(video_id, text)

#     video_collection.insert_one({"video_id": video_id, "youtube_url": data.youtube_url})

#     return {"video_id": video_id, "message": "Video processed successfully"}


# @router.get("/videos")
# def get_videos(session_id: str):
#     videos = list(video_collection.find({"session_id": session_id}))

#     for v in videos:
#         v["_id"] = str(v["_id"])

#     return {"videos": videos}


from fastapi import APIRouter
from bson import ObjectId
from app.schemas.schema import VideoRequest
from app.database import video_collection, chunk_collection, chat_collection
from app.services.youtube import process_video

router = APIRouter()


# 🎥 Add Video
@router.post("/video")
def add_video(data: VideoRequest):
    video_id = process_video(data.youtube_url)

    video_doc = {
        "video_id": video_id,
        "youtube_url": data.youtube_url,
        "session_id": data.session_id,
    }

    video_collection.insert_one(
        {
            "session_id": data.session_id,
            "video_id": video_id,
            "youtube_url": data.youtube_url,
        }
    )  # Insert video document into the collection
    return {"video_id": video_id}


# 📚 Get Videos
@router.get("/videos")
def get_videos(session_id: str):
    videos = list(video_collection.find({"session_id": session_id}))

    for v in videos:
        v["_id"] = str(v["_id"])

    return {"videos": videos}


# ❌ Delete Video
@router.delete("/video/{video_id}")
def delete_video(video_id: str, session_id: str):

    video_collection.delete_one({
        "video_id": video_id,
        "session_id": session_id
    })

    chunk_collection.delete_many({
        "video_id": video_id
    })

    chat_collection.delete_many({
        "video_id": video_id,
        "session_id": session_id
    })

    return {"message": "deleted"}
