# from fastapi import APIRouter
# from app.schemas.schema import SummaryRequest
# from app.services.rag import generate_summary
# from app.database import chat_collection
# router = APIRouter()

# @router.post("/summary")
# def summary(data: SummaryRequest):
#     summary_text = generate_summary(
#         data.video_id,
#         data.session_id   # ✅ PASS THIS
#     )

#     return {"summary": summary_text}


from fastapi import APIRouter
from app.schemas.schema import SummaryRequest
from app.services.rag import generate_summary

router = APIRouter()


# 📝 Generate Summary
@router.post("/summary")
def summary(data: SummaryRequest):
    summary_text = generate_summary(
        data.video_id,
        data.session_id
    )

    return {"summary": summary_text}