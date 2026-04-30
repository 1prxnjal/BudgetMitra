from flask import Flask, request, jsonify, session, make_response, Response
from flask_cors import CORS
from groq import Groq
import os
from dotenv import load_dotenv
import logging
import json

load_dotenv()
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
app.secret_key = "budgetmitra_secret"

# Configure Groq
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
MODEL_NAME = "llama-3.3-70b-versatile" # Ultra-low latency, high performance model

def format_financial_context(budget_context):
    """Converts budgetState into a clean text summary for the AI."""
    if not budget_context:
        return "No financial data available."

    from datetime import datetime
    current_month = datetime.now().strftime("%Y-%m")
   
    balance = budget_context.get('available_balance', 0)
    income = budget_context.get('income', 0)
    txs = budget_context.get('transactions', [])
   
    # Portfolio Info
    investments = budget_context.get('investments', 0)
    fd = budget_context.get('fd', 0)
    savings = budget_context.get('savings', 0)
    loans = budget_context.get('loans', [])
   
    # Category summary (Current Month Only)
    categories = {}
    current_month_total_expense = 0
    for t in txs:
        date = t.get('date', '')
        if not date.startswith(current_month):
            continue
           
        cat = t.get('category', 'Other')
        amt = abs(t.get('amount', 0))
        if t.get('amount', 0) < 0: # Only expenses for summary
            categories[cat] = categories.get(cat, 0) + amt
            current_month_total_expense += amt
   
    cat_summary = ", ".join([f"{k}: ₹{v}" for k, v in categories.items()])
   
    # Derived Balance for the current month
    calculated_balance = income - current_month_total_expense
   
    # Loan summary
    loan_summary = ""
    if loans:
        total_emi = sum([float(l.get('emi', 0)) for l in loans])
        loan_list = "\n".join([f"  - {l.get('type')} at {l.get('lender')}: EMI ₹{l.get('emi')}, Principal ₹{l.get('principal')}" for l in loans])
        loan_summary = f"- ACTIVE LIABILITIES:\n{loan_list}\n  * Total Monthly EMI Commitment: ₹{total_emi}"
    else:
        loan_summary = "- ACTIVE LIABILITIES: None"

    # Recent transactions (last 10)
    recent = ""
    if txs:
        recent = "\n".join([f"- {t.get('date', 'N/A')}: {t.get('merchant', 'Unknown')} (₹{t.get('amount', 0)})" for t in txs[:10]])
    
    context = (
        f"USER FINANCIAL STATUS (AS OF {current_month}):\n"
        f"- Monthly Income: ₹{income}\n"
        f"- Current Month Total Expenses: ₹{current_month_total_expense}\n"
        f"- Calculated Available Balance (Income - This Month's Expenses): ₹{calculated_balance}\n"
        f"- PORTFOLIO ASSETS:\n"
        f"  * Total Savings: ₹{savings}\n"
        f"  * Fixed Deposits: ₹{fd}\n"
        f"  * Investments: ₹{investments}\n"
        f"{loan_summary}\n"
        f"- Spending Breakdown (Current Month): {cat_summary if cat_summary else 'No expenses recorded.'}\n"
        f"- Recent Transaction History:\n{recent if recent else 'No transactions recorded.'}"
    )
    return context

@app.route('/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return make_response('', 200)
   
    try:
        data = request.json
        logger.info(f"STREAMING REQUEST RECEIVED")
       
        if not client:
            return jsonify({"reply": "Saathi is currently offline."}), 503

        message = data.get('message', '')
        language = data.get('language', 'English')
        history = data.get('history', [])
        budget_context = data.get('budget_context', {})

        fin_context = format_financial_context(budget_context)
       
        def generate():
            try:
                system_instruction = (
                    f"You are Saathi, a wise, friendly, and expert Indian Personal Finance Assistant. "
                    f"Your goal is to help the user manage their budget, save money, and make smart financial decisions.\n\n"
                    f"STRICT DOMAIN LOCK (GUARDRAIL):\n"
                    f"1. **FINANCE ONLY**: You are strictly a Personal Finance Advisor. You must NOT answer questions about movies, sports, history, coding, or any non-financial topics.\n"
                    f"2. **OFF-TOPIC REFUSAL**: If a user asks an off-topic question, politely say: 'I am Saathi, your Personal Finance Saathi. I can only assist you with budgeting, saving, and financial planning. Please ask me something related to your money! 💰'\n"
                    f"3. **SAMPLE PROMPTS**: After an off-topic refusal, always list 3 sample prompts the user CAN ask, like:\n"
                    f"   - 'How can I reduce my food expenses? 🍔'\n"
                    f"   - 'Can you analyze my spending for this month? 📊'\n"
                    f"   - 'What is the best way to save for a new bike? 🏍️'\n\n"
                    f"STRICT MARKDOWN & STYLE RULES:\n"
                    f"1. **NO SPACES IN BOLD**: Use **₹4,750**, never ** ₹ 4,750 **.\n"
                    f"2. **HEADERS & SEPARATION**: Use `###` and `---` horizontal rules.\n"
                    f"3. **TABLES FOR DATA**: Always use Markdown Tables for categorized expenses.\n"
                    f"4. **FINANCIAL REPORT STYLE**: Professional, structured, and clean.\n"
                    f"5. **CRITICAL LIABILITIES**: Always incorporate EMI impact from active loans.\n\n"
                    f"Respond ONLY in {language}.\n\n"
                    f"USER CONTEXT:\n{fin_context}"
                )

                messages = [
                    {"role": "system", "content": system_instruction},
                ]
               
                # Add history
                for m in (history or [])[-10:]:
                    if m.get('user'): messages.append({"role": "user", "content": m.get('user')})
                    if m.get('assistant'): messages.append({"role": "assistant", "content": m.get('assistant')})
               
                messages.append({"role": "user", "content": message})

                completion = client.chat.completions.create(
                    model=MODEL_NAME,
                    messages=messages,
                    temperature=0.7,
                    max_tokens=800,
                    stream=True,
                )
               
                for chunk in completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content
            except Exception as e:
                logger.error(f"Generation Error: {str(e)}")
                yield " [Saathi is having a small technical hiccup. Please try again.]"

        return Response(generate(), mimetype='text/plain')

    except Exception as e:
        logger.error(f"Endpoint Error: {str(e)}")
        return jsonify({"reply": "Saathi is resting. Please try again."}), 500

@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.json
    spending = data.get('spending_data', 'No data')
    lang = data.get('language', 'English')
    
    prompt = (
        f"Analyze the following spending data and provide 3 actionable financial tips in {lang}.\n\n"
        f"DATA:\n{spending}"
    )
    
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=400
        )
        return jsonify({"insights": completion.choices[0].message.content if completion else "Stay disciplined with your spending!"})
    except Exception as e:
        logger.error(f"Analyze Error: {str(e)}")
        return jsonify({"insights": "Keep tracking your expenses to see patterns."})

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "active", "ai_ready": client is not None})

@app.route('/test_ai', methods=['GET'])
def test_ai():
    if not client: return jsonify({"error": "Groq client not initialized"})
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": "Say hello"}],
            max_tokens=10
        )
        return jsonify({"reply": completion.choices[0].message.content})
    except Exception as e:
        logger.error(f"Test AI failed: {str(e)}")
        return jsonify({"error": str(e)})

@app.route('/suggest_prompts', methods=['POST'])
def suggest_prompts():
    try:
        data = request.json
        budget_context = data.get('budget_context', {})
        fin_context = format_financial_context(budget_context)
       
        prompt = (
            f"Based on the following user financial data, generate 4 very short (max 6 words each) "
            f"and helpful question suggestions that the user might want to ask Saathi (the AI advisor).\n\n"
            f"USER CONTEXT:\n{fin_context}\n\n"
            f"Return ONLY a JSON list of strings. No extra text. Example: ['How to save on my SBI loan?', 'Analyze my food spend', 'Help me save ₹5000']"
        )
       
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=150
        )
       
        res_text = completion.choices[0].message.content.strip()
        # Clean up potential markdown formatting if model includes it
        if "```json" in res_text:
            res_text = res_text.split("```json")[1].split("```")[0].strip()
        elif "```" in res_text:
            res_text = res_text.split("```")[1].split("```")[0].strip()
           
        suggestions = json.loads(res_text)
        return jsonify(suggestions[:4])
    except Exception as e:
        logger.error(f"Suggestion Error: {str(e)}")
        return jsonify([
            "Analyze my spending 📊",
            "How can I save more? 💰",
            "Debt management tips 🏦",
            "Investment basics 📈"
        ])

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=5000)