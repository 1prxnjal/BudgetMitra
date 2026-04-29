# 🚀 Step-by-Step Vercel Deployment Guide

Don't worry! Deploying to Vercel is very simple. Follow these steps exactly, and you'll have **BudgetMitra** live on the internet in minutes.

---

## Step 1: Upload your code to GitHub
Vercel works best when your code is on GitHub.
1. Go to [GitHub.com](https://github.com) and create a new repository (e.g., `BudgetMitra`).
2. Upload your entire project folder to that repository.

---

## Step 2: Create a Vercel Account
1. Go to [Vercel.com](https://vercel.com) and click **Sign Up**.
2. Choose **Continue with GitHub**. This will link your code to Vercel automatically.

---

## Step 3: Deploy the Backend (The Brain)
We will deploy the `backend` folder first.
1. On the Vercel Dashboard, click **Add New** -> **Project**.
2. Select your `BudgetMitra` repository.
3. In the setup screen:
   - **Project Name**: `budgetmitra-backend`
   - **Root Directory**: Click "Edit" and select the **`backend`** folder.
4. Open the **Environment Variables** section and add:
   - `GROQ_API_KEY` = (Paste your Groq key here)
5. Click **Deploy**.
6. **Wait**: Once it's finished, Vercel will give you a URL (e.g., `https://budgetmitra-backend.vercel.app`). **Copy this URL.**

---

## Step 4: Deploy the Frontend (The UI)
Now we deploy the `frontend` folder.
1. Go back to the Vercel Dashboard and click **Add New** -> **Project** again.
2. Select the same `BudgetMitra` repository.
3. In the setup screen:
   - **Project Name**: `budgetmitra-app`
   - **Root Directory**: Click "Edit" and select the **`frontend`** folder.
4. Open the **Environment Variables** section and add these:
   - `VITE_API_URL` = (Paste the Backend URL you copied in Step 3)
   - `VITE_SUPABASE_URL` = (Your Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (Your Supabase Anon Key)
5. Click **Deploy**.

---

## Step 5: Update CORS (Final Polish)
To make sure the Frontend can talk to the Backend safely:
1. Open your `backend/app.py` file.
2. Ensure the `CORS` line looks like this (I have already updated this for you to be permissive):
   `CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)`

---

## 🎉 You are LIVE!
Open the URL Vercel gave you for the **Frontend**. You can now access BudgetMitra from any phone or laptop in the world!

### 💡 Pro Tip for Presentations:
If you are showing this to a teacher or a client, open the **Vercel Dashboard** and show them the "Deployment Logs" – it looks very professional!
