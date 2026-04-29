# 🚀 BudgetMitra Setup & Execution Guide

Welcome to **BudgetMitra**! This guide will help you set up and run the project on your local machine from scratch.

---

## 🛠 Prerequisites

Before starting, ensure you have the following installed:
1.  **Node.js** (v18 or higher)
2.  **Python** (v3.9 or higher)
3.  **Git**

---

## 📂 Project Structure

- `/frontend`: React + Vite application (The UI)
- `/backend`: FastAPI + Gemini AI (The Logic)

---

## 🔑 Environment Setup (Crucial)

BudgetMitra requires a few API keys to function correctly.

### 1. Backend Environment
Create a `.env` file inside the `backend/` folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Frontend Environment
Create a `.env` file inside the `frontend/` folder:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 🏃‍♂️ Running the Application

### Step 1: Start the Backend (Server)
1.  Open your terminal and navigate to the backend:
    ```bash
    cd BudgetMitra/backend
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Start the server:
    ```bash
    python main.py
    ```
    *The server will run on `http://localhost:8000`*

### Step 2: Start the Frontend (UI)
1.  Open a **second** terminal and navigate to the frontend:
    ```bash
    cd BudgetMitra/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    *The app will run on `http://localhost:5173`*

---

## 📝 Important Notes for Developers

- **Supabase Configuration**: Ensure your Supabase project has **Authentication** enabled (Email/Google) and a table for `profile_data` if you want persistence.
- **Images**: If you see missing images on the login/loading screens, ensure you have added `developer.jpg`, `developer2.jpg`, and `developer3.jpg` to the `frontend/public/` folder.
- **AI Model**: The app uses `Gemini 1.5 Flash` for quick and intelligent financial advice.

---

## 🛠 Troubleshooting

- **CORS Error**: Ensure the backend `main.py` has the correct CORS origins allowed for `http://localhost:5173`.
- **Node Modules**: If the frontend fails to start, try deleting `node_modules` and running `npm install` again.
- **Python Path**: Use `python3` instead of `python` if you are on Mac/Linux.

---

**Happy Budgeting with BudgetMitra!** 🎯
