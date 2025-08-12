````markdown
# 🎮 Wesee Blockchain Gaming Platform

A complete **end-to-end blockchain gaming platform** built with Solidity smart contracts, Node.js backend API, a modern web frontend, and a real-time leaderboard system.

---

## 🏗️ Architecture Overview

### Smart Contracts (Solidity)
- **GameToken.sol** — ERC-20 token (GT) with minting restrictions
- **TokenStore.sol** — USDT → GT conversion with security patterns
- **PlayGame.sol** — Match management with escrow & payout system
- **MockUSDT.sol** — Test USDT token for development

### Backend API (Node.js + Express)
- RESTful API endpoints for game operations
- Blockchain interaction via Ethers.js
- Event-driven architecture for real-time updates

### Frontend (HTML + CSS + JavaScript)
- Modern, responsive web interface
- Real-time blockchain interaction
- User-friendly game management

### Leaderboard System (Node.js)
- Event listener for blockchain events
- Real-time statistics tracking
- RESTful API for leaderboard data

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Git
- Modern web browser

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd Wesee
````

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Start Local Blockchain

```bash
cd contracts
npx hardhat node
```

### 4. Deploy Smart Contracts

```bash
npm run deploy
```

### 5. Configure Environment

Update `.env` files with deployed contract addresses:

**Backend (`api/.env`):**

```env
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337
GAME_TOKEN_ADDRESS=<deployed-address>
TOKEN_STORE_ADDRESS=<deployed-address>
PLAY_GAME_ADDRESS=<deployed-address>
USDT_ADDRESS=<deployed-address>
BACKEND_PRIVATE_KEY=<hardhat-private-key>
PORT=3001
```

**Leaderboard (`tools/.env`):**

```env
RPC_URL=http://127.0.0.1:8545
CHAIN_ID=1337
GAME_TOKEN_ADDRESS=<deployed-address>
TOKEN_STORE_ADDRESS=<deployed-address>
PLAY_GAME_ADDRESS=<deployed-address>
USDT_ADDRESS=<deployed-address>
LEADERBOARD_PORT=3002
```

### 6. Start Services

```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Leaderboard
npm run dev:leaderboard
```

### 7. Access Application

* **Frontend**: Open `web/index.html` in browser
* **Backend API**: `http://localhost:3001`
* **Leaderboard API**: `http://localhost:3002`

---

## 🎯 Core Features

### Token System

* **GT Token** — Game currency with 18 decimals
* **USDT Integration** — 1:1 conversion rate (configurable)
* **Secure Minting** — Only TokenStore can mint new tokens

### Game Mechanics

* **Match Creation** — Owner-controlled match setup
* **Staking System** — GT token escrow for matches
* **Result Submission** — Backend-verified outcomes
* **Automatic Payouts** — 2× stake to winners
* **Timeout Refunds** — 24-hour refund mechanism

### Security Features

* **ReentrancyGuard** — Prevents reentrancy attacks
* **Ownable Access** — Restricted administrative functions
* **CEI Pattern** — Checks-Effects-Interactions order
* **Input Validation** — Comprehensive parameter checking

---

## 🔧 API Endpoints

### Backend API (`/api`)

* `GET /purchase?amount=<usdt>` — Simulate GT purchase
* `POST /match/start` — Create new match
* `POST /match/result` — Submit match result
* `GET /balance/:address` — Check GT balance
* `GET /match/:matchId` — Get match information
* `GET /health` — Health check

### Leaderboard API (`/tools`)

* `GET /leaderboard` — Top 10 players
* `GET /player/:address` — Player statistics
* `GET /stats` — Overall game statistics
* `GET /health` — Health check
* `POST /reset` — Reset leaderboard (testing)

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
npm test
```

### Manual Testing

```bash
node demo.js
```

---
