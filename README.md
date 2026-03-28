# Mine-Sigma – Full Stack Project (Web Portals + Mobile App + Blockchain)

This repository contains the complete Mine-Sigma system:

- **Web Portal (Next.js)**: Admin + Officer dashboards and citizen-facing pages
- **Core Backend (FastAPI + PostgreSQL)**: Auth, Alerts, Zones, Analytics, Complaints, Reports, Satellite analysis endpoints
- **Mine-Guard Mobile App (Expo React Native)**: Citizen reporting app
- **Mine-Guard Backend (FastAPI + DB)**: Auth, IPFS proxy, on-chain submission, and proxying citizen complaints into core backend
- **Smart Contracts (Hardhat)**: `MineGuardRegistry` contract for report anchoring & rewards

---

## 1) Folder Structure

- `frontend/` – Next.js web app (Admin / Officer portals)
- `backend/` – Core FastAPI backend (port `8000`)
- `ai_engine/` – Mining analysis / audit engine
- `Mine-Guard/` – Expo mobile app
- `Mine-Guard/backend/` – Mine-Guard FastAPI backend (recommended port `3001`)
- `Mine-Guard/blockchain/` – Hardhat project (local RPC port `8545`)

---

## 2) Prerequisites (Windows)

- **Python**: 3.10+ recommended
- **Node.js**: 18+ recommended
- **npm**: comes with Node
- **Git**

Optional but useful:
- **PostgreSQL** (if you want a local DB instead of Neon)
- **Expo Go** app on your phone (for mobile testing)

---

## 3) Ports (Default)

- **Core backend**: `http://localhost:8000`
- **Core backend API base**: `http://localhost:8000/api`
- **Web frontend**: `http://localhost:3000`
- **Mine-Guard backend**: `http://localhost:3001`
- **Hardhat local RPC**: `http://127.0.0.1:8545` (chainId `31337`)

---

## 4) Environment Variables

### 4.1 Core Backend (`backend/.env`) (create this file)

Create `backend/.env` (do not commit it):

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
SECRET_KEY=replace_me_with_a_long_random_secret
```

Notes:
- The core backend uses async SQLAlchemy + `asyncpg`.
- If you use **Neon**, use the connection string you get from Neon.

### 4.2 Web Frontend (`frontend/.env.local`) (create this file)

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
```

If you want to test on your LAN (mobile devices), replace `localhost` with your LAN IPv4.

### 4.3 Mine-Guard Backend (`Mine-Guard/backend/.env`)

You can start from the example file:

- Copy `Mine-Guard/backend/.env.example` to `Mine-Guard/backend/.env`
- Update values as needed

Important variables:
- `PORT` (recommended **3001** to avoid conflicting with Next.js on 3000)
- `CORE_BACKEND_API_BASE` should be `http://127.0.0.1:8000/api` (or LAN IP)
- `ADMIN_PRIVATE_KEY` must be a funded account from Hardhat (local dev)

### 4.4 Mine-Guard Mobile App config (`Mine-Guard/app.json`)

The Expo app reads backend/RPC addresses from `expo.extra`:

- `EXPO_PUBLIC_BACKEND_API_URL` (Mine-Guard backend, ex: `http://localhost:3001`)
- `EXPO_PUBLIC_ETHEREUM_RPC_URL` (Hardhat node, ex: `http://localhost:8545`)
- `EXPO_PUBLIC_CONTRACT_ADDRESS` (updated after deploy)
- `EXPO_PUBLIC_CHAIN_ID` (usually `31337` for Hardhat)

For physical-device testing, replace `localhost` with your PC LAN IPv4.

---

## 5) Run Instructions (Local Dev)

### Step 0: Install dependencies

#### Core backend (FastAPI)

```bash
python -m venv .venv
.\.venv\Scripts\activate
pip install -r backend/requirements.txt
```

#### Web frontend (Next.js)

```bash
cd frontend
npm install
```

#### Mine-Guard mobile app (Expo)

```bash
cd Mine-Guard
npm install
```

#### Mine-Guard blockchain (Hardhat)

```bash
cd Mine-Guard\blockchain
npm install
```

---

## 6) Start Services (recommended order)

### 6.1 Start Core Backend (port 8000)

From `backend/` folder you can run either:

```bash
python backend/main.py
```

Or directly:

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:
- `GET http://localhost:8000/api/health`

(Optional) Seed demo users:

```bash
python backend/scripts/seed_users.py
```

---

### 6.2 Start Web Frontend (port 3000)

```bash
cd frontend
npm run dev
```

Open:
- `http://localhost:3000`

---

### 6.3 Start Hardhat local chain (port 8545)

```bash
cd Mine-Guard\blockchain
npx hardhat node
```

Deploy contract to localhost network:

```bash
npm run deploy-local 
```

After deploy:
- Copy the deployed contract address into:
  - `Mine-Guard/backend/.env` (`CONTRACT_ADDRESS=...`)
  - `Mine-Guard/app.json` (`EXPO_PUBLIC_CONTRACT_ADDRESS`)

---

### 6.4 Start Mine-Guard Backend (recommended port 3001)

Set in `Mine-Guard/backend/.env`:

```env
PORT=3001
CORE_BACKEND_API_BASE=http://127.0.0.1:8000/api
```

Run:

```bash
python Mine-Guard/backend/main.py
```

---

### 6.5 Start Mine-Guard Mobile App (Expo)

```bash
cd Mine-Guard
npm run start
```

- Press `w` to run in web
- Use Expo Go for Android/iOS

---

## 7) Common Workflows

### 7.1 Admin alerts
- Upload lease doc in the web portal
- `POST /analyze-mine` runs the audit engine
- If illegal area detected, a new alert is auto-created

### 7.2 Citizen reports (Mine-Guard)
- App uploads media to Mine-Guard backend
- Mine-Guard backend pins to IPFS (Pinata)
- Mine-Guard backend submits report on-chain via Hardhat RPC
- Mine-Guard backend also mirrors a complaint into the core backend

---

## 8) Troubleshooting

- **Frontend shows API errors**: verify `frontend/.env.local` points to the correct `NEXT_PUBLIC_API_BASE_URL`.
- **Mine-Guard app on phone cannot reach localhost**: use your LAN IPv4 instead of `localhost`.
- **Contract calls fail**: confirm Hardhat node is running and contract address matches deployed network.
- **DB errors on startup**: verify `backend/.env` has a valid `DATABASE_URL`.

---

## 9) Security Notes

- Never commit `.env` files.
- Never expose private keys in production builds.
- Rotate keys if they were ever committed.
