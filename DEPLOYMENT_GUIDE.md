# 🚀 Island Health - Hosting & Deployment Guide

This guide details how to host your **Backend** on **Render** and your **Frontend Portals** on **Vercel**.

---

## 📋 Phase 1: Preparation (Done)

1.  **Codebase Refactoring**: We have already updated `apiClient.js` files to look for `VITE_API_URL` instead of hardcoded `localhost`.
2.  **GitHub**: Your code is pushed to: `https://github.com/dhineshkumar-2505/medical_evacuation`

---

## ☁️ Phase 2: Deploy Backend (Render)

We will deploy the Node.js server first.

1.  **Sign up/Login** to [Render.com](https://render.com).
2.  Click **"New +"** -> **"Web Service"**.
3.  **Connect GitHub**: Select your repository (`medical_evacuation`).
4.  **Configure Service**:
    *   **Name**: `island-health-backend` (or similar)
    *   **Root Directory**: `backend` (⚠️ Important: Do not leave empty)
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node src/index.js`
    *   **Plan**: Free (for hobby)
5.  **Environment Variables** (Scroll down to "Advanced"):
    *   `NODE_ENV`: `production`
    *   `SUPABASE_URL`: *(Your Supabase URL)*
    *   `SUPABASE_KEY`: *(Your Supabase Service Role Secret or Anon Key)*
    *   `ALLOWED_ORIGINS`: `*` (Temporarily set to `*` to allow initial connections. We will lock this down later.)
6.  Click **"Create Web Service"**.
7.  **Wait**: Render will deploy. Once valid, copy the **Backend URL** (e.g., `https://island-backend.onrender.com`).

---

## ⚡ Phase 3: Deploy Frontends (Vercel)

We will deploy each portal as a separate Vercel project from the *same* repository.

### 🏥 A. Hospital Portal
1.  **Login** to [Vercel.com](https://vercel.com).
2.  Click **"Add New..."** -> **"Project"**.
3.  **Import Git Repository**: Select `medical_evacuation`.
4.  **Configure Project**:
    *   **Project Name**: `island-hospital-portal`
    *   **Framework Preset**: Vite
    *   **Root Directory**: Click "Edit" and select `hospital-portal` folder.
5.  **Environment Variables**:
    *   `VITE_SUPABASE_URL`: *(Your Supabase URL)*
    *   `VITE_SUPABASE_ANON_KEY`: *(Your Supabase Anon Key)*
    *   `VITE_API_URL`: `https://island-backend.onrender.com/api` (The Render URL from Phase 2 + `/api`)
6.  Click **"Deploy"**.

### 🩺 B. Clinical Portal
*Repeat the steps above, but:*
*   **Project Name**: `island-clinical-portal`
*   **Root Directory**: `clinical-portal`
*   **Env Vars**: Same as above (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_API_URL`).

### 🛡️ C. Admin Portal
*Repeat steps:*
*   **Project Name**: `island-admin-portal`
*   **Root Directory**: `admin-portal`
*   **Env Vars**: Same as above.

### 🚑 D. Transport & Driver Apps
*Repeat steps:*
*   **Project Names**: `island-transport-app`, `island-driver-app`
*   **Root Directories**: `transport-provider-app`, `driver-app`
*   **Env Vars**: These only need `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. (They rely on Supabase directly).

---

## 🔒 Phase 4: Secure the Backend

Now that you have your Vercel domains (e.g., `https://island-hospital.vercel.app`), let's lock down the backend.

1.  Go back to **Render Dashboard** -> **Env Groups/Variables**.
2.  Edit `ALLOWED_ORIGINS`.
3.  Set it to a comma-separated list of your actual Vercel URLs:
    *   **Value**: `https://island-hospital-portal.vercel.app,https://island-clinical-portal.vercel.app,https://island-admin-portal.vercel.app` (Add all 5 domains).
4.  **Save Changes**. Render will auto-redeploy.

---

## ❓ FAQ: "What happens to localhost?"

*   **During Development**: You continue running `npm run dev` locally. The `.env` files on your computer still point to `localhost`.
*   **In Production**: The Deployment (Vercel/Render) uses the Environment Variables we set in their dashboards (`VITE_API_URL`). This overrides the local settings.
*   **Result**: Your local app talks to local backend. Your deployed app talks to deployed backend. Automatic magic! ✨
