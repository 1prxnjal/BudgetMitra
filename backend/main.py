import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from groq import Groq
import time
import uuid
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="BudgetMitra API")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set Groq API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
MODEL_NAME = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = ("You are 'Budget Saathi', a Personal Finance Advisor for India. "
                 "You must always enforce the use of Indian Rupees (₹), Indian spending patterns, "
                 "and local examples (e.g., UPI, Swiggy, Zomato, Diwali planning). "
                 "Provide concise, actionable advice.")

# In-memory session store for conversation memory (stores up to 10 past exchanges)
# Dictionary mapping session_id -> list of chat history dicts
sessions = {}

class ChatRequest(BaseModel):
    message: str
    language: str
    session_id: Optional[str] = None
    conversation_history: Optional[List[dict]] = None

class AnalyzeRequest(BaseModel):
    income: float
    expenses: dict
    language: str

# Endpoints
@app.post("/chat")
async def chat(req: ChatRequest):
    session_id = req.session_id
    if not session_id or session_id not in sessions:
        session_id = session_id or str(uuid.uuid4())
        sessions[session_id] = []

    history = sessions[session_id]

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for entry in history:
        messages.append({"role": "user" if entry["role"] == "User" else "assistant", "content": entry["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.3,
            max_tokens=800
        )
        response_text = completion.choices[0].message.content
            
        # Update session memory
        history.append({"role": "User", "content": req.message})
        history.append({"role": "Budget Saathi", "content": response_text})
        
        # Keep only the last 10 exchanges (20 messages total)
        if len(history) > 20:
            history = history[-20:]
        sessions[session_id] = history

        return {"response": response_text, "session_id": session_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze")
async def analyze_spending(req: AnalyzeRequest):
    prompt = f"""
Language Requirement: Respond in {req.language}.

User Financial Data:
Monthly Income: ₹{req.income}
Expenses: {req.expenses}

Task: Provide a short spending analysis, personalized saving tips relevant to India, and a suggested budget strategy (like 50/30/20).
"""
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500
        )
        return {"insights": completion.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/budget")
async def get_budget():
    # Return current budget summary (Real demo data pre-filled)
    return {
        "income": 40000,
        "expenses": {
            "Rent": 15000,
            "Food": 6000,
            "Travel": 2000,
            "EMI": 5000,
            "Shopping": 2000,
        },
        "available_balance": 10000,
        "transactions": [
            {"merchant": "D-Mart Grocery", "category": "Shopping", "date": "Oct 24, 2023", "amount": -4250},
            {"merchant": "Jio Mobile Recharge", "category": "Utilities", "date": "Oct 22, 2023", "amount": -749},
            {"merchant": "Salary Credited", "category": "Income", "date": "Oct 01, 2023", "amount": 65000},
            {"merchant": "Ola Cabs", "category": "Travel", "date": "Sep 28, 2023", "amount": -350}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
