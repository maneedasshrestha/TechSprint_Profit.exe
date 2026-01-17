# Blockchain Voting System - Running Guide

## Overview
This guide explains how to run your blockchain-enabled voting system for local development.

---

## Prerequisites
- Node.js installed
- Backend dependencies installed (`npm install`)
- Supabase database configured with proposals and votes tables
- Local Hardhat blockchain setup complete

---

## Starting the System

### Every Time You Start Development:

#### Terminal 1: Start Local Blockchain
```bash
cd backend
npx hardhat node
```
**⚠️ IMPORTANT:** Keep this terminal running! This is your local blockchain. If you close it, all blockchain data is lost and you'll need to redeploy.

---

#### Terminal 2: Start Backend Server
```bash
cd backend
npm run dev
```

**✅ Server is Ready When You See:**
```
✅ Server running on port 5000
🗳️  Proposals API: http://localhost:5000/api/proposals
⛓️  Blockchain: Connected
```

---

## If Everything Was Closed and You're Restarting

### Scenario 1: Hardhat Node Was Closed (Blockchain Reset)

When you close the Hardhat node, the blockchain is wiped. You need to redeploy the contract:

#### Step 1: Start Hardhat Node (Terminal 1)
```bash
cd backend
npx hardhat node
```
**Keep this running!**

#### Step 2: Redeploy Contract (Terminal 2)
```bash
cd backend
npx hardhat run scripts/deploy.js --network localhost
```

#### Step 3: Update .env File
Copy the contract address from the deploy output and update `.env`:
```env
CONTRACT_ADDRESS=0xYourNewContractAddressHere
```

#### Step 4: Start Server (Terminal 2)
```bash
npm run dev
```

---

### Scenario 2: Only Server Stopped, Blockchain Still Running

If you only closed the server but Hardhat node is still running:

```bash
cd backend
npm run dev
```

That's it! No need to redeploy.

---

## API Endpoints

Base URL: `http://localhost:5000/api/proposals`

### Create Proposal
```
POST /api/proposals

Body:
{
  "title": "Proposal Title",
  "description": "Proposal description",
  "image_url": "https://example.com/image.jpg",
  "duration_days": 7,
  "creator_id": "user-123"
}

Response:
{
  "success": true,
  "proposal": { ... },
  "blockchain": {
    "proposalId": 1,
    "txHash": "0x..."
  }
}
```

### Get All Proposals
```
GET /api/proposals

Response:
{
  "success": true,
  "proposals": [ ... ]
}
```

### Get Single Proposal
```
GET /api/proposals/:id

Response:
{
  "success": true,
  "proposal": {
    ...
    "blockchain_vote_count": 5,
    "blockchain_is_active": true
  }
}
```

### Cast Vote
```
POST /api/proposals/:id/vote

Body:
{
  "voter_id": "user-456"
}

Response:
{
  "success": true,
  "vote": { ... },
  "voteCount": 1,
  "txHash": "0x..."
}
```

### Check If User Voted
```
GET /api/proposals/:id/voted/:voter_id

Response:
{
  "success": true,
  "hasVoted": true
}
```

---

## Testing the System

Run the automated test suite:

```bash
cd backend
node test-api.js
```

This will:
- ✅ Create a proposal
- ✅ List all proposals
- ✅ Cast a vote
- ✅ Verify blockchain integration
- ✅ Test duplicate vote prevention
- ✅ Show live vote counts

---

## Troubleshooting

### "Contract not initialized" Error
- Make sure `CONTRACT_ADDRESS` is set in `.env`
- Check if Hardhat node is running
- Redeploy the contract if needed

### Port 5000 Already in Use
```bash
# Kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:5000 | xargs kill -9
```

### "Connection Refused" or Blockchain Errors
- Ensure Hardhat node is running in Terminal 1
- Check if `BLOCKCHAIN_RPC_URL` in `.env` is `http://127.0.0.1:8545`
- Restart both Hardhat node and server

### Old Contract Data After Restart
- Remember: Local blockchain resets when Hardhat node closes
- Redeploy contract after restarting Hardhat node
- Supabase data persists (proposals/votes in database)

---

## Architecture

```
Frontend/Client
    ↓
Backend API (Express)
    ↓
├── Supabase (PostgreSQL)
│   └── Stores: proposal metadata, images, descriptions
│
└── Blockchain (Hardhat Local)
    └── Smart Contract
        └── Stores: immutable votes, vote counts
```

### Why Hybrid Approach?

- **Supabase**: Fast queries, images, user data, descriptions
- **Blockchain**: Immutable vote records, transparent counting, tamper-proof

---

## Environment Variables (.env)

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Blockchain Configuration (Local Development)
BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0xYourContractAddress

# Server
PORT=5000
NODE_ENV=development
```

---

## Notes

- **Local blockchain data is temporary** - resets when Hardhat node closes
- **Supabase data persists** - proposals and votes remain in database
- **One backend wallet** = one vote per proposal on blockchain (current limitation)
- **Supabase tracks individual users** - vote records by `voter_id`

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start blockchain | `npx hardhat node` |
| Deploy contract | `npx hardhat run scripts/deploy.js --network localhost` |
| Start server | `npm run dev` |
| Run tests | `node test-api.js` |
| Compile contract | `npx hardhat compile` |

---

## Success! 🎉

Your blockchain voting system is running when:
- ✅ Hardhat node shows "Started HTTP and WebSocket JSON-RPC server"
- ✅ Server shows "⛓️ Blockchain: Connected"
- ✅ Test script passes all tests

Happy coding! 🚀
