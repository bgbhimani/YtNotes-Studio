import os
from groq import Groq

# Initialize client - ensure your API key is set in environment variables
# or pass it directly: Groq(api_key="gsk_...")
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

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
        response = client.chat.completions.create(
            # Using 3.3-70b for better reasoning in RAG tasks
            model="llama-3.3-70b-versatile", 
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on provided context."},
                {"role": "user", "content": prompt}
            ],
            # Low temperature (0.1 - 0.2) is best for RAG to prevent "hallucinations"
            temperature=0.2,
            max_tokens=1024
        )

        return response.choices[0].message.content

    except Exception as e:
        # This will catch and print the specific error (Auth, Rate Limit, etc.)
        print(f"Groq API Error: {e}")
        return "⚠️ I'm sorry, I'm having trouble processing that request right now."

# Example Usage:
context = "The capital of France is Paris."
query = "What is the capital of France?"
print(ask_with_llama(f"Context: {context}\nQuestion: {query}"))