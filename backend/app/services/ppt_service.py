import os
import json
import google.generativeai as genai

from app.database import (
    chunk_collection,
    ppt_collection,
)

from app.services.ppt_generate import generate_ppt

# =====================================================
# GENERATE PPT
# =====================================================


def generate_ppt_from_video(video_id, session_id):

    # 🔹 Fetch transcript chunks
    docs = chunk_collection.find({"video_id": video_id})

    texts = [doc["text"] for doc in docs]

    if not texts:
        return None

    transcript = " ".join(texts[:60])

    # 🔹 Gemini
    model = genai.GenerativeModel("gemini-2.5-flash")

    prompt = f"""
Create presentation slide data.

Use ONLY these layouts:
- title
- section
- content

Return ONLY valid JSON array.

Format:
[
  {{
    "layout": "title",
    "title": "Main Title",
    "subtitle": "Subtitle"
  }},
  {{
    "layout": "section",
    "title": "Topic",
    "subtitle": "Subtitle"
  }},
  {{
    "layout": "content",
    "title": "Topic",
    "bullets": [
      "point 1",
      "point 2"
    ]
  }}
]

Give me Just JSON not any other word should be there.

Transcript:
{transcript}
"""

    response = model.generate_content(prompt)

    text = response.text.strip()

    # 🔥 remove markdown wrappers
    text = text.replace("```json", "")
    text = text.replace("```", "")

    slides_data = json.loads(text)

    # =====================================================
    # OUTPUT PATH
    # =====================================================

    os.makedirs("generated_ppts", exist_ok=True)

    filename = f"{video_id}_{session_id}.pptx"

    output_path = os.path.join("generated_ppts", filename)

    # =====================================================
    # GENERATE PPT
    # =====================================================

    generate_ppt(
        slides_data=slides_data,
        output_file=output_path,
        template_path="app/src/Demo.pptx",
    )

    # =====================================================
    # STORE IN DB
    # =====================================================

    ppt_collection.insert_one(
        {
            "video_id": video_id,
            "session_id": session_id,
            "path": output_path.replace("\\", "/"),
            "filename": filename,
        }
    )

    return output_path
