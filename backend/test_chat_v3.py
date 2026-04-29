import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
key = os.environ.get("GEMINI_API_KEY")
genai.configure(api_key=key)

model = genai.GenerativeModel('models/gemini-flash-latest')

try:
    print("Sending test message...")
    response = model.generate_content("Hi, tell me a quick finance tip.")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
