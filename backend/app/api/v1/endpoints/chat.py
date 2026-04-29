# from bson import ObjectId
# from fastapi import APIRouter
# from app.schemas.schema import ChatRequest, ChatResponse
# from app.services.rag import ask_question
# from app.database import chat_collection
# from datetime import datetime

# router = APIRouter()

# @router.post("/chat", response_model=ChatResponse)
# def chat(data: ChatRequest):
#     answer = ask_question(data.video_id, data.question, data.session_id)

#     chat_collection.update_one(
#         {
#             "session_id": data.session_id,
#             "video_id": data.video_id
#         },
#         {
#             "$push": {
#                 "messages": {
#                     "$each": [
#                         {"role": "user", "content": data.question},
#                         {"role": "assistant", "content": answer}
#                     ]
#                 }
#             },
#             "$set": {"updated_at": datetime.utcnow()}
#         },
#         upsert=True
#     )

#     return {"answer": answer}

# @router.get("/chat/history")
# def get_chat_history(session_id: str, video_id: str):
#     chats = list(chat_collection.find({
#         "session_id": session_id,
#         "video_id": video_id
#     }))

#     for c in chats:
#         c["_id"] = str(c["_id"])

#     return {"history": chats}


# @router.get("/outputs")
# def get_outputs(session_id: str, video_id: str):
#     outputs = list(chat_collection.find({
#         "session_id": session_id,
#         "video_id": video_id,
#         "question": "summary"
#     }))

#     return {"outputs": outputs}


# @router.delete("/output/{id}")
# def delete_output(id: str):
#     chat_collection.delete_one({"_id": ObjectId(id)})
#     return {"status": "deleted"}


from fastapi import APIRouter
from bson import ObjectId
from app.schemas.schema import ChatRequest
from app.services.rag import ask_question
from app.database import chat_collection

router = APIRouter()


# 💬 Ask Question
@router.post("/chat")
def chat(data: ChatRequest):
    answer = ask_question(
        data.video_id,
        data.question,
        data.session_id
    )

    return {"answer": answer}


# 📜 Get Chat History
@router.get("/chat/history")
def get_chat_history(session_id: str, video_id: str):
    chats = list(chat_collection.find({
        "session_id": session_id,
        "video_id": video_id
    }).sort("_id", 1))

    for c in chats:
        c["_id"] = str(c["_id"])

    return {"history": chats}


# 📦 Get Outputs (summary, etc.)
@router.get("/outputs")
def get_outputs(session_id: str, video_id: str):
    outputs = list(chat_collection.find({
        "session_id": session_id,
        "video_id": video_id,
        "question": "summary"
    }))

    for o in outputs:
        o["_id"] = str(o["_id"])

    return {"outputs": outputs}


# ❌ Delete Output
@router.delete("/output/{id}")
def delete_output(id: str):
    chat_collection.delete_one({"_id": ObjectId(id)})
    return {"status": "deleted"}