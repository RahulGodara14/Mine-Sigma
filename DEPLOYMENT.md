# Mine-Sigma Cloud Deployment Guide

This repository is configured and ready for live cloud deployment:
- **Frontend**: [Vercel](https://vercel.com) (Next.js with Turbopack)
- **Core Backend**: [Render](https://render.com) or [Railway](https://railway.app) (FastAPI Docker container)
- **Database**: [Neon PostgreSQL](https://neon.tech) (Already live & configured)

---

## Step 1: Deploy Backend to Render (Free)

Render automatically detects the root [`render.yaml`](file:///e:/sih/mine-sigma2/mine-sigma/render.yaml) blueprint and uses [`backend/Dockerfile`](file:///e:/sih/mine-sigma2/mine-sigma/backend/Dockerfile).

1. Go to [Render Dashboard](https://dashboard.render.com/) and sign in with GitHub.
2. Click **New +** ➔ **Blueprint** (or **Web Service**).
3. Connect your repository: `RahulGodara14/Mine-Sigma`.
4. If using **Web Service** manually:
   - **Name**: `mine-sigma-backend`
   - **Language**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Docker Context Directory**: `backend`
   - **Instance Type**: Free
5. Set the **Environment Variables**:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_6EZnIokKUPG4@ep-gentle-scene-adkz9mjz-pooler.c-2.us-east-1.aws.neon.tech/neondb`
   - `SECRET_KEY`: *(Enter any secure random string, e.g. `mine-sigma-super-secret-key-2026`)*
   - `DEBUG`: `false`
   - `PORT`: `8000`
6. Click **Deploy Web Service**.
7. Once deployed, Render will provide your public backend URL:
   `https://mine-sigma-backend.onrender.com` (note this down for Step 2).

---

## Step 2: Deploy Frontend to Vercel (Free)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and sign in with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Import your repository: `RahulGodara14/Mine-Sigma`.
4. Configure the project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click **Edit** and choose `frontend`
5. Expand **Environment Variables** and add:
   - **Key**: `NEXT_PUBLIC_API_BASE_URL`
   - **Value**: `https://mine-sigma-backend.onrender.com/api` *(replace with your actual Render URL from Step 1)*
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://neondb_owner:npg_6EZnIokKUPG4@ep-gentle-scene-adkz9mjz-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require`
6. Click **Deploy**.
7. In ~60 seconds, your site will be live at `https://mine-sigma-frontend.vercel.app` (or your custom domain).

---

## Step 3: Verification

1. Open your live Vercel URL.
2. Test the Admin and Officer login pages:
   - Default seeded credentials or create an account via the signup flow.
3. Test GIS Map Viewer, AOI polygon creation, and satellite analysis.
