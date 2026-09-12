# 🚀 Isles of Hexara — Deployment Guide

This guide provides end-to-end instructions for deploying the **Isles of Hexara** stack:
- **Backend (`apps/server`)**: Persistent Web Service on **Render** (Node.js + Socket.IO)
- **Frontend (`apps/web`)**: Static / Client SPA on **Vercel**
- **Persistence**: MongoDB Atlas Free Tier (or automated Zero-Docker in-memory fallback)

---

## 1. Architecture Overview

```
┌───────────────────────────────┐                  ┌─────────────────────────────────┐
│     Frontend (apps/web)       │                  │     Backend (apps/server)       │
│     Hosted on Vercel SPA      │                  │     Hosted on Render (Node.js)  │
│  isles-of-hexara.vercel.app   │                  │  isles-of-hexara.onrender.com   │
└──────────────┬────────────────┘                  └────────────────┬────────────────┘
               │                                                    │
               │ HTTP Guest Auth / REST API                         │
               ├───────────────────────────────────────────────────►│
               │                                                    │
               │ Persistent WebSocket (Socket.IO + JWT)            │
               │◄══════════════════════════════════════════════════►│
               │ (Real-time Authoritative Turns & State Sync)       │
                                                                    │
                                                   ┌────────────────┴────────────────┐
                                                   │ MongoDB Atlas (or In-Memory)   │
                                                   │ Game Records & Profiles Store   │
                                                   └─────────────────────────────────┘
```

---

## 2. Deploying Backend to Render

### Option A: One-Click Render Blueprint (Recommended)
1. Fork or push this repository to GitHub.
2. Log in to [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your repository and select `render.yaml`.
5. Render will automatically configure the build and start commands.

### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `isles-of-hexara-server`
   - **Region**: Oregon (or nearest to your players)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     pnpm --filter @hexara/shared build && pnpm --filter @hexara/game-core build && pnpm --filter @hexara/protocol build && pnpm --filter @hexara/server build
     ```
   - **Start Command**:
     ```bash
     pnpm --filter @hexara/server start
     ```
   - **Plan**: `Free`
   - **Health Check Path**: `/health`

---

## 3. Environment Variables Configuration

In Render's **Environment** tab, set the following environment variables:

| Variable | Description | Example / Default | Required |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` | Yes |
| `PORT` | HTTP & WebSocket Port | `10000` (Render default) | Yes |
| `HOST` | Server bind host | `0.0.0.0` | Yes |
| `CORS_ORIGIN` | Comma-separated allowed origins | `https://isles-of-hexara.vercel.app,http://localhost:3000` | Yes |
| `JWT_SECRET` | Secret key for signing guest JWT tokens | `generate a 32+ char random string` | Yes |
| `MONGODB_URI` | MongoDB connection URI | `mongodb+srv://...` (or leave empty for memory mode) | Optional |
| `REDIS_URL` | Redis connection URL | `redis://...` (or leave empty for memory mode) | Optional |

> [!TIP]
> **Zero-Docker In-Memory Mode**: If `MONGODB_URI` is omitted or unavailable, the server automatically starts in zero-docker in-memory mode, persisting games and profiles in memory.

---

## 4. Connecting Vercel Frontend to Render Backend

1. In your **Vercel Project Settings** for `isles-of-hexara`:
   - Navigate to **Settings** → **Environment Variables**.
   - Add:
     - **Key**: `VITE_GAME_SERVER_URL` (and/or `NEXT_PUBLIC_GAME_SERVER_URL`)
     - **Value**: `https://<your-render-app-name>.onrender.com`
2. Redeploy the frontend on Vercel.

---

## 5. Verification & Health Check

After deployment, test the health check endpoint in your browser or terminal:

```bash
curl https://<your-render-app-name>.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "storage": "memory",
  "uptime": 42,
  "timestamp": "2026-09-10T08:00:00.000Z",
  "game": "Isles of Hexara"
}
```

---

## 6. Troubleshooting

- **Render Free Tier Cold Starts**: Render's free instances spin down after 15 minutes of inactivity. When a player connects after inactivity, initial spin-up may take ~30–50 seconds.
- **WebSocket Upgrade Issues**: Ensure transport order includes `['websocket', 'polling']` (configured by default in `@hexara/protocol` and socket server).
- **CORS Errors**: If browser console reports CORS errors, verify that your exact Vercel production domain and preview URLs are listed in `CORS_ORIGIN`.
