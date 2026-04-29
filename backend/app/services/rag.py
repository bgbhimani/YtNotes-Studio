import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from langchain_text_splitters import RecursiveCharacterTextSplitter
import google.generativeai as genai
from app.database import chunk_collection, chat_collection  # or fix path
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


print("Loading RAG service...")

genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
load_dotenv()

embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


def build_index(video_id: str, text: str):
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

    chunks = splitter.split_text(text)

    embeddings = embedding_model.encode(chunks).tolist()

    docs = []
    for i, chunk in enumerate(chunks):
        docs.append({"video_id": video_id, "text": chunk, "embedding": embeddings[i]})

    if docs:
        chunk_collection.insert_many(docs)

    return True


def search_chunks(query_embedding, video_id):
    try:
        results = chunk_collection.aggregate(
            [
                {
                    "$vectorSearch": {
                        "index": "vector_index",  # 🔥 ADD THIS
                        "queryVector": query_embedding,
                        "path": "embedding",
                        "numCandidates": 100,
                        "limit": 3,
                        "filter": {"video_id": video_id},
                    }
                }
            ]
        )
        return [doc["text"] for doc in results]

    except Exception as e:
        print("Vector search error:", e)
        return []


# def ask_with_llama(prompt: str):
#     try:
#         response = groq_client.chat.completions.create(
#             model="llama-3.1-8b-instant",
#             messages=[{"role": "user", "content": prompt}],
#         )

#         return response.choices[0].message.content

#     except Exception as e:
#         print("Llama error:", e)
#         return "⚠️ AI service temporarily unavailable."


def ask_with_llama(prompt: str):
    """
    Sends a prompt to Llama via Groq.
    Includes a character limit to prevent 413 'Payload Too Large' errors.
    """
    # 413 Error Prevention: Groq has a character/payload limit.
    # 30,000 chars is a safe ceiling for most RAG context injections.
    MAX_CHARACTER_LIMIT = 30000
    if len(prompt) > MAX_CHARACTER_LIMIT:
        prompt = prompt[:MAX_CHARACTER_LIMIT] + "...[truncated]"

    try:
        response = groq_client.chat.completions.create(
            # Using 3.3-70b for better reasoning in RAG tasks
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": """
                    
Context:
You are an intelligent, articulate, and professional AI assistant designed to provide clear, helpful, and human-like responses.

You are given contextual information extracted from a source (such as a YouTube transcript). Your job is to use this context to answer the user's question accurately, while maintaining a natural, engaging conversational tone.

--- BEHAVIOR RULES ---

1. CONTEXT USAGE
- Use the provided context as your primary source of truth.
- If the answer is clearly present in the context, answer confidently.
- If the context is incomplete, combine it with general knowledge, but clearly indicate when you are doing so.
- If the answer is not available, say so honestly. Do NOT hallucinate.

2. TONE & STYLE
- Sound natural, human, and slightly conversational — not robotic.
- Be confident but not arrogant.
- Avoid phrases like "According to the provided context..."
- Instead, respond as if you naturally know the information.

3. STRUCTURE
- Start with a direct answer.
- Then explain or expand if needed.
- Use bullet points or short paragraphs for clarity when helpful.
- Make Sure to Give output in markdown format.  

4. CLARITY
- Simplify complex ideas without dumbing them down.
- Avoid unnecessary jargon unless the user asks for technical detail.

5. ENGAGEMENT
- When appropriate, add a small helpful insight, example, or clarification.
- If the question is vague, ask a follow-up question.

6. MEMORY AWARENESS
- Treat this as part of an ongoing conversation when applicable.

--- OUTPUT FORMAT ---
- Clear, well-structured answer
- No meta-commentary about "context"
- No raw transcript references unless explicitly asked
- do not tell that you have the transcript or that you are using it. Just answer naturally.


--- RESPONSE ---
                    """,
                },
                {"role": "user", "content": prompt},
            ],
            # Low temperature (0.1 - 0.2) is best for RAG to prevent "hallucinations"
            temperature=0.2,
            max_tokens=1024,
        )

        return response.choices[0].message.content

    except Exception as e:
        # This will catch and print the specific error (Auth, Rate Limit, etc.)
        print(f"Groq API Error: {e}")
        return "⚠️ I'm sorry, I'm having trouble processing that request right now."


def ask_question(video_id, question, session_id):
    query_vec = embedding_model.encode([question])[0].tolist()

    chunks = search_chunks(query_vec, video_id)

    if not chunks:
        return "⚠️ No data found. Please process the video first."

    context = "\n".join(chunks)

    prompt = f"""
Context:
You are an intelligent, articulate, and professional AI assistant designed to provide clear, helpful, and human-like responses.

You are given contextual information extracted from a source (such as a YouTube transcript). Your job is to use this context to answer the user's question accurately, while maintaining a natural, engaging conversational tone.

--- BEHAVIOR RULES ---

1. CONTEXT USAGE
- Use the provided context as your primary source of truth.
- If the answer is clearly present in the context, answer confidently.
- If the context is incomplete, combine it with general knowledge, but clearly indicate when you are doing so.
- If the answer is not available, say so honestly. Do NOT hallucinate.

2. TONE & STYLE
- Sound natural, human, and slightly conversational — not robotic.
- Be confident but not arrogant.
- Avoid phrases like "According to the provided context..."
- Instead, respond as if you naturally know the information.

3. STRUCTURE
- Start with a direct answer.
- Then explain or expand if needed.
- Use bullet points or short paragraphs for clarity when helpful.

4. CLARITY
- Simplify complex ideas without dumbing them down.
- Avoid unnecessary jargon unless the user asks for technical detail.

5. ENGAGEMENT
- When appropriate, add a small helpful insight, example, or clarification.
- If the question is vague, ask a follow-up question.

6. MEMORY AWARENESS
- Treat this as part of an ongoing conversation when applicable.

--- OUTPUT FORMAT ---
- Clear, well-structured answer
- No meta-commentary about "context"
- No raw transcript references unless explicitly asked
- do not tell that you have the transcript or that you are using it. Just answer naturally.
--- CONTEXT ---
{context}

--- USER QUESTION ---
{question}

--- RESPONSE ---
"""

    provider = "gemini"
    answer = ""

    # 🔹 Try Gemini first
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        answer = response.text

    except Exception as e:
        print("Gemini failed:", e)

        # 🔹 Fallback to Llama
        provider = "llama"
        answer = ask_with_llama(prompt)

    # 🔹 Store in MongoDB
    chat_collection.insert_one(
        {
            "session_id": session_id,
            "video_id": video_id,
            "question": question,
            "answer": answer,
            "provider": provider,
        }
    )

    return answer


def generate_summary(video_id: str, session_id: str):
    docs = chunk_collection.find({"video_id": video_id})

    texts = [doc["text"] for doc in docs]

    if not texts:
        return "⚠️ No data found to summarize."

    full_text = " ".join(texts)

    prompt = f"""
Summarize this YouTube video transcript:

{full_text}
"""

    provider = "gemini"
    answer = ""

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        answer = response.text

    except Exception as e:
        print("Gemini failed:", e)

        provider = "llama"
        answer = ask_with_llama(prompt)

    chat_collection.insert_one(
        {
            "session_id": session_id,
            "video_id": video_id,
            "question": "summary",
            "answer": answer,
            "provider": provider,
        }
    )

    return answer


# def ask_question(video_id, question):
#     query_vec = embedding_model.encode([question])[0].tolist()

#     chunks = search_chunks(query_vec, video_id)

#     if not chunks:
#         return "⚠️ No data found. Please process the video first."

#     context = "\n".join(chunks)

#     model = genai.GenerativeModel("gemini-2.5-flash")

#     prompt = f"""
#                 Context:
#                 {context}

#                 Question:
#                 {question}
#                 """

#     response = model.generate_content(prompt)

#     return response.text


# def generate_summary(video_id: str):
#     docs = chunk_collection.find({"video_id": video_id})

#     texts = [doc["text"] for doc in docs]

#     if not texts:
#         return "⚠️ No data found to summarize."

#     full_text = " ".join(texts)

#     model = genai.GenerativeModel("gemini-2.5-flash")

#     prompt = f"""
# Summarize this YouTube video transcript:

# {full_text}
# """

#     response = model.generate_content(prompt)

#     return response.text
