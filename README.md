# 🎮 Wesee Blockchain Gaming Platform

A complete end-to-end blockchain gaming platform built with Solidity smart contracts, Node.js backend API, modern web frontend, and real-time leaderboard system.

## 🏗️ Architecture Overview

### Smart Contracts (Solidity)
- **GameToken.sol**: ERC-20 token (GT) with minting restrictions
- **TokenStore.sol**: USDT → GT conversion with security patterns
- **PlayGame.sol**: Match management with escrow and payout system
- **MockUSDT.sol**: Test USDT token for development

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

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Git
- Modern web browser

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd Wesee
```

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
# In new terminal
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
- **Frontend**: Open `web/index.html` in browser
- **Backend API**: `http://localhost:3001`
- **Leaderboard API**: `http://localhost:3002`

## 🎯 Core Features

### Token System
- **GT Token**: Game currency with 18 decimals
- **USDT Integration**: 1:1 conversion rate (configurable)
- **Secure Minting**: Only TokenStore can mint new tokens

### Game Mechanics
- **Match Creation**: Owner-controlled match setup
- **Staking System**: GT token escrow for matches
- **Result Submission**: Backend-verified outcomes
- **Automatic Payouts**: 2x stake to winners
- **Timeout Refunds**: 24-hour refund mechanism

### Security Features
- **ReentrancyGuard**: Prevents reentrancy attacks
- **Ownable Access**: Restricted administrative functions
- **CEI Pattern**: Checks-Effects-Interactions order
- **Input Validation**: Comprehensive parameter checking

## 🔧 API Endpoints

### Backend API (`/api`)
- `GET /purchase?amount=<usdt>` - Simulate GT purchase
- `POST /match/start` - Create new match
- `POST /match/result` - Submit match result
- `GET /balance/:address` - Check GT balance
- `GET /match/:matchId` - Get match information
- `GET /health` - Health check

### Leaderboard API (`/tools`)
- `GET /leaderboard` - Top 10 players
- `GET /player/:address` - Player statistics
- `GET /stats` - Overall game statistics
- `GET /health` - Health check
- `POST /reset` - Reset leaderboard (testing)

## 🧪 Testing

### Smart Contract Tests
```bash
cd contracts
npm test
```

### Manual Testing
```bash
# Run demo script
node demo.js
```

### Test Coverage
- Contract deployment and initialization
- Token minting and transfer restrictions
- Match creation and management
- Staking and payout mechanisms
- Event emission verification

## 🚀 Deployment

### Local Development
1. Hardhat local network
2. Contract deployment to localhost
3. Backend and leaderboard on local ports

### Production Deployment
1. **Smart Contracts**: Deploy to target network (Ethereum, Polygon, etc.)
2. **Backend**: Deploy to cloud provider (AWS, Azure, GCP)
3. **Frontend**: Deploy to CDN or hosting service
4. **Environment**: Update `.env` files with production values

### Network Configuration
```javascript
// hardhat.config.js
networks: {
  mainnet: {
    url: process.env.MAINNET_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  },
  polygon: {
    url: process.env.POLYGON_RPC_URL,
    accounts: [process.env.PRIVATE_KEY]
  }
}
```

## 📊 Performance & Scalability

### Current Implementation
- In-memory leaderboard storage
- Single-threaded event processing
- Basic error handling and retry logic

### Production Enhancements
- Database integration (PostgreSQL, MongoDB)
- Redis caching for leaderboard
- Load balancing for API endpoints
- Monitoring and alerting systems
- Rate limiting and DDoS protection

## 🔒 Security Considerations

### Smart Contract Security
- OpenZeppelin audited contracts
- Reentrancy protection
- Access control mechanisms
- Comprehensive input validation

### API Security
- CORS configuration
- Input sanitization
- Rate limiting (recommended)
- Private key management

### Frontend Security
- Client-side validation
- Secure API communication
- No sensitive data exposure

## 🛠️ Development Tools

### Smart Contracts
- **Hardhat**: Development framework
- **OpenZeppelin**: Security libraries
- **Solidity**: 0.8.20 compiler

### Backend
- **Node.js**: Runtime environment
- **Express**: Web framework
- **Ethers.js**: Blockchain interaction
- **Nodemon**: Development server

### Frontend
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: Responsive design
- **HTML5**: Semantic markup

## 📝 Assumptions & Limitations

### Current Assumptions
- USDT has 6 decimals (standard)
- GT token has 18 decimals (standard)
- 1:1 USDT to GT conversion rate
- 24-hour match timeout
- Single backend operator

### Known Limitations
- In-memory leaderboard (not persistent)
- Basic error handling
- No user authentication
- Single-threaded processing
- Local development focus

### Future Enhancements
- Database persistence
- Multi-operator support
- Advanced game mechanics
- Mobile application
- Social features

## 🎮 Game Flow Example

1. **Player Setup**
   - User connects wallet
   - Purchases GT tokens with USDT

2. **Match Creation**
   - Admin creates match with players and stake
   - Both players stake GT tokens

3. **Game Play**
   - Match status changes to "STAKED"
   - Game logic executes off-chain

4. **Result Submission**
   - Backend submits winner
   - Winner receives 2x stake
   - Loser's stake is transferred

5. **Leaderboard Update**
   - Event listeners capture results
   - Statistics updated in real-time
   - Rankings recalculated

## 🔧 Troubleshooting

### Common Issues
1. **Port Conflicts**: Change ports in `.env` files
2. **Contract Errors**: Verify addresses and deployment
3. **Connection Issues**: Check Hardhat node status
4. **Balance Errors**: Ensure sufficient funds

### Debug Commands
```bash
# Check contract deployment
npm run deploy

# Verify environment
Get-Content api\.env
Get-Content tools\.env

# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3002/health
```

## 📞 Support & Contact

- **Repository**: [GitHub Link]
- **Access**: careers@weseegpt.com
- **Documentation**: This README
- **Issues**: GitHub Issues

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ by the Wesee Team**

*Complete blockchain gaming platform with smart contracts, backend API, frontend, and leaderboard system.*
#   w e s e e - B l o c k c h a i n  
 