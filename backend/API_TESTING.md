# Blockchain Voting API Testing Guide

Base URL: `http://localhost:5000`

## 1. Create a Proposal

**POST** `/api/proposals`

```json
{
  "title": "Should we add a new park in Ward 5?",
  "description": "Proposal to build a community park with playground equipment for children and green spaces for families.",
  "image_url": "https://example.com/park.jpg",
  "duration_days": 7,
  "creator_id": "user123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "proposal": {
    "id": "uuid-here",
    "title": "Should we add a new park in Ward 5?",
    "description": "...",
    "proposal_blockchain_id": 0,
    "blockchain_tx_hash": "0x..."
  },
  "blockchain": {
    "proposalId": 0,
    "txHash": "0x..."
  }
}
```

---

## 2. Get All Proposals

**GET** `/api/proposals`

**Expected Response:**
```json
{
  "success": true,
  "proposals": [
    {
      "id": "uuid",
      "title": "Should we add a new park in Ward 5?",
      "description": "...",
      "status": "active",
      "votes": [{ "count": 0 }]
    }
  ]
}
```

---

## 3. Cast a Vote

**POST** `/api/proposals/:id/vote`

```json
{
  "voter_id": "user456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "vote": {
    "id": "uuid",
    "proposal_id": "uuid",
    "voter_id": "user456",
    "blockchain_tx_hash": "0x..."
  },
  "voteCount": 1,
  "txHash": "0x..."
}
```

---

## 4. Get Single Proposal with Blockchain Data

**GET** `/api/proposals/:id`

**Expected Response:**
```json
{
  "success": true,
  "proposal": {
    "id": "uuid",
    "title": "Should we add a new park in Ward 5?",
    "blockchain_vote_count": 1,
    "blockchain_is_active": true
  }
}
```

---

## 5. Check if User Voted

**GET** `/api/proposals/:id/voted/:voter_id`

**Expected Response:**
```json
{
  "success": true,
  "hasVoted": true
}
```

---

## Testing with cURL (PowerShell)

### Create Proposal
```powershell
curl -X POST http://localhost:5000/api/proposals `
  -H "Content-Type: application/json" `
  -d '{\"title\":\"New Park Proposal\",\"description\":\"Build a community park\",\"duration_days\":7,\"creator_id\":\"user123\"}'
```

### Get All Proposals
```powershell
curl http://localhost:5000/api/proposals
```

### Cast Vote (replace PROPOSAL_ID)
```powershell
curl -X POST http://localhost:5000/api/proposals/PROPOSAL_ID/vote `
  -H "Content-Type: application/json" `
  -d '{\"voter_id\":\"user456\"}'
```

---

## Testing with Postman

1. Import these requests into Postman
2. Set environment variable: `base_url = http://localhost:5000`
3. Test each endpoint sequentially
4. Verify blockchain transactions on your local Hardhat console

---

## What Happens Behind the Scenes:

1. **Create Proposal** → Writes to blockchain first → Saves to Supabase with blockchain reference
2. **Cast Vote** → Checks Supabase for duplicates → Records on blockchain → Saves to Supabase
3. **Get Results** → Fetches from Supabase → Verifies vote count from blockchain

**Blockchain ensures immutability, Supabase provides fast queries!**
