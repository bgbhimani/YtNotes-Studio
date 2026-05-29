from fastapi import APIRouter
from fastapi.responses import FileResponse
import os
from app.database import ppt_collection
from app.services.ppt_service import generate_ppt_from_video

router = APIRouter()


# =====================================================
# GENERATE PPT
# =====================================================


@router.post("/generate")
def generate_ppt(video_id: str, session_id: str):

    ppt_path = generate_ppt_from_video(
        video_id,
        session_id,
    )

    return FileResponse(
        ppt_path,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename="presentation.pptx",
    )


@router.delete("/{ppt_id}")
def delete_ppt(ppt_id: str):

    from bson import ObjectId

    doc = ppt_collection.find_one({
        "_id": ObjectId(ppt_id)
    })

    if not doc:
        return {"error": "not found"}

    # 🔹 remove file
    if os.path.exists(doc["path"]):
        os.remove(doc["path"])

    # 🔹 remove db record
    ppt_collection.delete_one({
        "_id": ObjectId(ppt_id)
    })

    return {"message": "deleted"}

# =====================================================
# GET GENERATED PPTS
# =====================================================


@router.get("/all")
def get_all_ppts(session_id: str, video_id: str):

    docs = list(ppt_collection.find({"session_id": session_id, "video_id": video_id}))

    for doc in docs:
        doc["_id"] = str(doc["_id"])

    return {"ppts": docs}
