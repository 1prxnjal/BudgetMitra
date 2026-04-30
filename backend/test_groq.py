import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get("GROQ_API_KEY")
print(f"API Key found: {api_key[:5]}..." if api_key else "No API Key found")

client = Groq(api_key=api_key)
try:
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Hello"}],
    )
    print(f"Success: {completion.choices[0].message.content}")
except Exception as e:
    print(f"Error: {e}")
