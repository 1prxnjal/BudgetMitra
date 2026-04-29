# 📄 BudgetMitra: Project Documentation & Technical Overview

BudgetMitra is a state-of-the-art personal finance assistant designed to provide Indian users with a seamless, intelligent, and secure way to manage their wealth. This document provides a deep dive into the technology, features, and AI integration that power the platform.

---

## 💻 Technical Stack

BudgetMitra is built using a modern, scalable architecture:

### Frontend (User Interface)
- **Framework**: React.js with Vite (for lightning-fast build times).
- **Icons**: Lucide React (premium, consistent iconography).
- **State Management**: React Hooks (useState, useEffect) for real-time UI updates.
- **Communication**: Axios for robust API interactions with the backend and Supabase.
- **Styling**: Vanilla CSS with modern practices (Glassmorphism, Flexbox, Grid).

### Backend (Logic & AI)
- **Framework**: FastAPI (High-performance Python framework).
- **AI Integration**: Google Generative AI SDK (Gemini).
- **Server**: Uvicorn (ASGI server implementation).

### Infrastructure (Data & Auth)
- **Database**: Supabase (PostgreSQL) for secure, real-time data persistence.
- **Authentication**: Supabase Auth (Supporting Email/Password and OAuth).
- **Hosting**: Designed for deployment on Vercel/Render.

---

## 🚀 Key Features

1.  **Dynamic Financial Health Dashboard**: Real-time visualization of spending, savings rate, and budget utilization.
2.  **Wealth Portfolio**: Centralized management of Savings, Fixed Deposits (FDs), and Investments (Stocks/Mutual Funds).
3.  **Loan Manager**: Advanced tracker for liabilities, total outstanding debt, and EMI schedules.
4.  **Transaction Engine**: Intelligent expense logging with categorized history and live balance updates.
5.  **Secure Profile**: User-centric profile management with dynamic joining dates and secure avatar handling.

---

## 🤖 Saathi AI: The Heart of BudgetMitra

BudgetMitra features "Saathi AI," a personalized financial companion.

### AI Model Details (Groq Integration)
- **Model**: `llama-3.3-70b-versatile`
- **Provider**: Groq Cloud
- **Optimizations**: 
    - **Latency**: We use Groq's LPU™ (Language Processing Unit) technology specifically for **instant** response times, ensuring Saathi AI feels faster than a real-time conversation.
    - **Temperature (0.3)**: Set to provide factual, deterministic financial advice while avoiding creative hallucinations.
    - **Context Window**: Optimized with a 128k token limit, allowing for extensive conversation memory and complex financial analysis.

### Prompt Engineering
The AI is "System Primed" to act as an expert Indian Financial Advisor. It understands:
- **Currency**: Always communicates in Indian Rupees (₹).
- **Context**: Knowledge of Indian financial instruments (UPI, FD, LIC, 80C deductions).
- **Tone**: Professional, encouraging, and pro-active.

---

## 📊 Performance & Security

### Security
- **AES-256 Encryption**: All data transmitted between the frontend and backend is encrypted.
- **Liability Shield**: Proprietary logic in the state management layer ensures that loan data cannot be accidentally overwritten during portfolio updates.
- **Supabase RLS**: Row Level Security ensures that users can only access their own financial data.

### Latency
- **UI Responsiveness**: All UI transitions are under 100ms.
- **Data Sync**: Debounced auto-save logic ensures data is persisted to the cloud every 1.5 seconds after a change, preventing database bottlenecks.

---

**BudgetMitra: Empowering every Indian to achieve financial freedom.** 🇮🇳
