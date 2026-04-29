# import re
# from youtube_transcript_api import YouTubeTranscriptApi

# def get_video_id(url):
#     m = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
#     return m.group(1) if m else None


# def fetch_transcript(url):
#     video_id = get_video_id(url)
#     api = YouTubeTranscriptApi()
#     transcript = api.fetch(video_id, languages=['hi', 'en'])

#     text = " ".join([t.text for t in transcript])
#     return text, video_id


import re
from youtube_transcript_api import YouTubeTranscriptApi
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.database import chunk_collection

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def extract_video_id(url: str):
    pattern = r"(?:v=|\/)([0-9A-Za-z_-]{11}).*"
    match = re.search(pattern, url)
    return match.group(1) if match else None

def process_video(url: str):
    video_id = extract_video_id(url)

    try:
        # Try English first
        transcript_list = YouTubeTranscriptApi().fetch(video_id, languages=["en", "hi"])
    except:
        try:
            # Fallback to Hindi
            transcript_list = YouTubeTranscriptApi().fetch(video_id, languages=["hi"])
        except:
            raise Exception("⚠️ No transcript available for this video")

    full_text = " ".join([t.text for t in transcript_list])

    # ✂️ Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_text(full_text)

    # 🔢 Generate embeddings
    embeddings = embedding_model.encode(chunks).tolist()

    # 💾 Store in MongoDB
    docs = []
    for i in range(len(chunks)):
        docs.append({
            "video_id": video_id,
            "text": chunks[i],
            "embedding": embeddings[i]
        })

    if docs:
        chunk_collection.insert_many(docs)

    return video_id