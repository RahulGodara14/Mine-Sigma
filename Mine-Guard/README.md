# MineGuard Platform

MineGuard is a privacy-preserving citizen reporting platform for illegal mining activities. Reports are pinned to IPFS (files + metadata) and registered on-chain in the `MineGuardRegistry` smart contract. The frontend uses Expo React Native (TypeScript); the backend is FastAPI; blockchain interactions (transaction signing) happen exclusively on the backend for security.

---

## Core Features

### Reporting Workflow (Current Architecture)
1. User captures media via [`MediaUploader`](src/components/MediaUploader.tsx).
2. User selects/enters location with [`LocationPicker`](src/components/LocationPicker.tsx) (web override: [`LocationPicker.web.tsx`](src/components/LocationPicker.web.tsx)).
3. User fills category, severity, description in [`UploadReportScreen`](src/screens/citizen/UploadReportScreen.tsx).
4. Frontend uploads each media file to backend IPFS proxy endpoint: `POST /ipfs/upload`.
5. Frontend posts aggregated JSON metadata (category, description, location, media hashes) to `POST /ipfs/upload-json`.
6. Frontend calls `POST /reports/submit-onchain` sending metadata IPFS hash + form details; backend:
	- Signs and submits `submitReport` transaction to contract.
	- Parses `ReportSubmitted` event and persists `contract_report_id` & `transaction_hash` with the report in DB.
7. Frontend updates local Zustand store (`reportStore`).

Older direct client-side ethers.js submission was removed to prevent exposing private keys and to improve reliability on mobile devices.

### Smart Contract
Location: [blockchain/contracts/MineGuardRegistry.sol](blockchain/contracts/MineGuardRegistry.sol)
- Status enum: Pending, UnderReview, Approved, Rejected
- Severity enum: Low, Medium, High, Critical
- Reward schedule configurable by admin
- Core functions: `submitReport`, `reviewReport`, `claimReward`, `getReport`, `getReporterReports`, `fundContract`, `getContractBalance`
- Events: `ReportSubmitted`, `ReportReviewed`, `RewardClaimed`

Reward defaults: Low = 0.1 ETH, Medium = 0.25 ETH, High = 0.5 ETH, Critical = 1.0 ETH.
Inline model: $R(severity)=\{0.1,0.25,0.5,1.0\}\,ETH.

### Security & Privacy
- Client never holds the admin private key; signing centralized in backend.
- JWT-based auth (FastAPI) with bcrypt password hashing.
- Only pseudonymous user identifier + wallet address used on-chain (no PII).
- Planned: optional encryption of metadata blobs before IPFS using utilities in [`encryption.ts`](src/utils/encryption.ts).

### Rewards
[`RewardDisplay`](src/components/RewardDisplay.tsx) renders reward tiers and claim states. Claim flows currently conceptual; backend endpoints for reward claiming can extend chain service.

### State Management
- Auth: [`authStore`](src/store/authStore.ts) (stores token, sets axios Authorization header).
- Reports: [`reportStore`](src/store/reportStore.ts).

### Navigation
Stack/Tab navigation defined in [`AppNavigator`](src/navigation/AppNavigator.tsx).

---

## Project Structure

```
.
├── App.tsx
├── index.ts
├── src/
│   ├── screens/
│   │   ├── auth/
│   │   │   └── ConnectWalletScreen.tsx
│   │   └── citizen/
│   │       ├── HomeScreen.tsx
│   │       ├── UploadReportScreen.tsx
│   │       ├── ReportHistoryScreen.tsx
│   │       ├── RewardsScreen.tsx
│   │       └── ProfileScreen.tsx
│   ├── components/
│   │   ├── MediaUploader.tsx
│   │   ├── LocationPicker.tsx / LocationPicker.web.tsx
│   │   ├── RewardDisplay.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   ├── services/
│   │   └── blockchain/
│   │       ├── contractService.ts
│   │       ├── ipfsService.ts
│   │       └── web3Service.ts
│   ├── store/
│   │   ├── authStore.ts
│   │   └── reportStore.ts
│   ├── utils/
│   │   ├── geolocation.ts
│   │   ├── validation.ts
│   │   └── encryption.ts
│   ├── navigation/AppNavigator.tsx
│   ├── theme/index.ts
│   └── types/index.ts
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── auth_service.py
│   ├── report_service.py (if present)
│   ├── blockchain_service.py
│   ├── ipfs_service.py
│   ├── config.py
│   ├── database.py
│   └── .env
├── blockchain/
│   └── contracts/MineGuardRegistry.sol
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`) – DO NOT COMMIT
````env
DATABASE_URL=sqlite:///./mineguard.db
SECRET_KEY=REPLACE_ME
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Blockchain (Hardhat local network)
ETHEREUM_RPC_URL=http://127.0.0.1:8545
CHAIN_ID=31337
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ADMIN_PRIVATE_KEY=REPLACE_ME # funded account from Hardhat (keep secret)

HOST=0.0.0.0
PORT=3000
DEBUG=True
CORS_ORIGINS=["http://localhost:19006","http://localhost:3000"]

# Pinata (server-side IPFS proxy)
PINATA_API_KEY=REPLACE_ME
PINATA_SECRET_KEY=REPLACE_ME
PINATA_JWT=REPLACE_ME
````

### Frontend (Expo `app.json` -> `expo.extra`)
These values are embedded at build/runtime; avoid putting secrets here.
````jsonc
{
	"expo": {
		"extra": {
			"backendApiUrl": "http://localhost:3000",
			"ethereumRpcUrl": "http://127.0.0.1:8545",
			"contractAddress": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
			"chainId": 31337,
			"network": "hardhat"
		}
	}
}
````

### Sensitive Files & Git Hygiene
- `.gitignore` excludes `backend/.env`, root `.env`, database file, build artifacts, caches.
- If `backend/.env` was committed earlier: run `git rm --cached backend/.env` before next commit.

---

## Key Backend Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/signup | Register user |
| POST | /auth/login | Obtain JWT |
| GET  | /health | Basic health check |
| POST | /ipfs/upload | Pin a single media file via Pinata |
| POST | /ipfs/upload-json | Pin metadata JSON |
| POST | /reports/submit-onchain | Submit report on-chain & persist DB record |
| GET  | /reports | List user reports (includes tx hash & contract id) |

---

## Development Workflow
1. Start Hardhat node: `npx hardhat node` (chainId 31337).
2. Deploy contract: `npx hardhat run scripts/deploy.js --network localhost` -> update `CONTRACT_ADDRESS`.
3. Create/update `backend/.env` with new contract address & funded private key.
4. Start backend: `uvicorn backend.main:app --reload --port 3000` (or `python backend/main.py` if entrypoint provided).
5. Run Expo: `npx expo start` (web or device). Use LAN mode if testing on physical device.
6. Submit a report via UI; verify DB persistence + transaction events.

### Mobile Device Tips
- Physical device: ensure same Wi‑Fi; use Expo's LAN URL.
- Android emulator: RPC/Backend often accessible via `10.0.2.2`; consider adding fallback logic if needed.
- If using USB debugging: `adb reverse tcp:3000 tcp:3000` forwards backend port.

---

## Testing & Troubleshooting
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| 422 validation errors | Field casing mismatch | Ensure Pydantic aliasing (`populate_by_name=True`) |
| "could not detect network" | RPC not running / wrong URL | Check Hardhat node, update `ETHEREUM_RPC_URL` |
| Chain ID mismatch (HH101) | Different chainId in components | Align Hardhat config + backend `.env` + `app.json` to 31337 |
| IPFS upload fails | Pinata creds invalid | Regenerate & update backend `.env` |
| Missing `contract_report_id` | Event parsing failure | Confirm contract address & ABI match deployment |

---

## Future Enhancements
- Encrypt metadata before IPFS for stronger privacy.
- Add admin dashboard for reviewing reports & adjusting rewards.
- Implement reward claiming flow via backend endpoint wrapping `claimReward`.
- Add pagination & filtering for report history.
- Integrate push notifications (report status changes).

---

## License
Internal / proprietary for now (add explicit license if open-sourcing later).

---

## Contributing
1. Fork / create feature branch.
2. Make changes with minimal, focused commits.
3. Run linters & tests (to be added).
4. Submit PR with clear description (include endpoint or UI screenshots if relevant).

---

## Security Notes
- Never expose `ADMIN_PRIVATE_KEY` to the client.
- Rotate `SECRET_KEY` and Pinata credentials on compromise.
- Consider rate limiting and CAPTCHA for signup in production.

---

## Acknowledgements
Built with FastAPI, Hardhat, Expo, Ethers.js, Pinata, SQLite, and community tooling.
