# MineGuard Smart Contract - Quick Start

## Step 1: Install Dependencies

```bash
cd blockchain
npm install
```

## Step 2: Start Ganache

Open a new PowerShell terminal:

```powershell
# Option A: Using npm globally
ganache-cli --host 0.0.0.0 --mnemonic "test test test test test test test test test test test junk" --accounts 10 --initial-balance 100

# Option B: Using npx (if ganache-cli not installed globally)
npx ganache-cli --host 0.0.0.0 --mnemonic "test test test test test test test test test test test junk" --accounts 10 --initial-balance 100

# Option C: Using Docker
docker run -d -p 8545:8545 trufflesuite/ganache:latest --host 0.0.0.0 --mnemonic "test test test test test test test test test test test junk" --accounts 10 --initial-balance 100
```

**You should see output like:**
```
Listening on 127.0.0.1:8545
Available Accounts
==================
(0) 0x627306090abaB3A6e1400e9345bC60c78a8BEf57 (100 ETH)
(1) 0xf17f52151EbEF6C7334FAD080c5704DAAA16b732 (100 ETH)
(2) 0xdafea492d9c6733c3d3b402b5c9547ccf5d5e5df (100 ETH)
...
```

## Step 3: Compile Smart Contract

In another PowerShell terminal:

```powershell
cd blockchain
npm run compile
```

**Expected output:**
```
Compiling 1 file with 0.8.0
Compilation successful
```

## Step 4: Deploy to Ganache

```powershell
npm run deploy
```

**Expected output:**
```
✅ MineGuardRegistry deployed successfully!
📝 Contract Address: 0x5FbDB2315678afccb333f8a9c60582d...
🔗 Network: ganache
📄 Deployment info saved to: blockchain\deployments.json
🚀 Update your .env file with:
EXPO_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c60582d...
```

## Step 5: Update Backend Configuration

Copy the contract address and update these files:

### `backend/.env`
```env
ETHEREUM_RPC_URL=http://localhost:8545
CHAIN_ID=1337
CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c60582d...
ADMIN_PRIVATE_KEY=0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0be6064d
```

### `frontend/.env` (if needed)
```env
EXPO_PUBLIC_CONTRACT_ADDRESS=0x5FbDB2315678afccb333f8a9c60582d...
EXPO_PUBLIC_ETHEREUM_RPC_URL=http://localhost:8545
EXPO_PUBLIC_CHAIN_ID=1337
```

## Ganache Account Details

When using the mnemonic: `test test test test test test test test test test test junk`

| # | Address | Private Key | Balance |
|---|---------|-------------|---------|
| 0 (Admin) | 0x627306090abaB3A6e1400e9345bC60c78a8BEf57 | 0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0be6064d | 100 ETH |
| 1 | 0xf17f52151EbEF6C7334FAD080c5704DAAA16b732 | 0x6af46db1dc5d21a8cfc0373f6e01f3b1df83c4e4cf4e5e5df7c86d1b6c85c8f | 100 ETH |
| 2 | 0xdafea492d9c6733c3d3b402b5c9547ccf5d5e5df | 0x6c5e9e048b1ed51f9b81a96b8c87e02da8e8c8a8e2d67c14c8e2e1b1a9c8d8c | 100 ETH |

## Verify Deployment

Check that `blockchain/deployments.json` was created with your contract address:

```bash
cat blockchain/deployments.json
```

You should see:
```json
{
  "network": "ganache",
  "contractAddress": "0x5FbDB2315678afccb333f8a9c60582d...",
  "deployedAt": "2025-11-26T...",
  "chainId": 1337
}
```

## Troubleshooting

### Error: "connect ECONNREFUSED 127.0.0.1:8545"
Ganache is not running. Start it first in a separate terminal.

### Error: "Contract does not exist"
Make sure you compiled the contract: `npm run compile`

### Error: "timeout of 40000ms exceeded"
Ganache might be slow. Increase timeout or check system resources.

### Contract not showing in Ganache
Check that Ganache is listening on `http://127.0.0.1:8545`

## Next Steps

1. ✅ Compile contract
2. ✅ Deploy to Ganache
3. ✅ Get contract address
4. → Update backend `.env`
5. → Start backend server
6. → Run frontend with `npm run web`

## File Structure

```
blockchain/
├── contracts/
│   └── MineGuardRegistry.sol     (Smart contract)
├── scripts/
│   └── deploy.js                 (Deployment script)
├── hardhat.config.js             (Network config)
├── package.json                  (Dependencies)
├── deployments.json              (Generated after deploy)
└── artifacts/                    (Generated after compile)
```

## Commands Reference

```bash
# Compile contract
npm run compile

# Deploy to Ganache
npm run deploy

# Deploy to localhost
npm run deploy-local

# View compiled artifacts
ls artifacts/contracts/MineGuardRegistry.sol/
```

---
**Created: 2025-11-26**
**Network: Ganache (Local)**
**Chain ID: 1337**
