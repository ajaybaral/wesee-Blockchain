# 🚀 Production Deployment Guide

## Overview
This guide covers deploying the Wesee Blockchain Gaming Platform to production environments including mainnet, testnets, and cloud infrastructure.

## 🏗️ Smart Contract Deployment

### 1. Network Configuration

Update `contracts/hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    // Mainnet
    mainnet: {
      url: process.env.MAINNET_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 1,
      gasPrice: 20000000000, // 20 gwei
    },
    // Polygon
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 137,
      gasPrice: 30000000000, // 30 gwei
    },
    // Arbitrum
    arbitrum: {
      url: process.env.ARBITRUM_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42161,
      gasPrice: 100000000, // 0.1 gwei
    },
    // Testnets
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11155111,
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
    }
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      arbitrum: process.env.ARBISCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      mumbai: process.env.POLYGONSCAN_API_KEY,
    }
  }
};
```

### 2. Environment Setup

Create `contracts/.env`:

```env
# Network RPC URLs
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-rpc.com
ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# Private Keys (NEVER commit these!)
PRIVATE_KEY=your_private_key_here

# API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key

# USDT Addresses (mainnet)
MAINNET_USDT=0xdAC17F958D2ee523a2206206994597C13D831ec7
POLYGON_USDT=0xc2132D05D31c914a87C6611C10748AEb04B58e8F
ARBITRUM_USDT=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9
```

### 3. Deploy to Target Network

```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Deploy to Polygon
npx hardhat run scripts/deploy.js --network polygon

# Deploy to testnet first
npx hardhat run scripts/deploy.js --network sepolia
```

### 4. Verify Contracts

```bash
# Verify on Etherscan
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS

# Verify on Polygonscan
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS
```

## ☁️ Backend API Deployment

### 1. Cloud Provider Options

#### AWS (Recommended)
```bash
# Install AWS CLI
aws configure

# Deploy with Elastic Beanstalk
eb init wesee-gaming-api
eb create production
eb deploy
```

#### Heroku
```bash
# Install Heroku CLI
heroku create wesee-gaming-api
git push heroku main
```

#### DigitalOcean App Platform
```bash
# Create app from GitHub repository
# Set environment variables in dashboard
```

### 2. Environment Configuration

Production `.env`:

```env
# Production Blockchain
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
CHAIN_ID=1
GAME_TOKEN_ADDRESS=0x... # Deployed address
TOKEN_STORE_ADDRESS=0x... # Deployed address
PLAY_GAME_ADDRESS=0x... # Deployed address
USDT_ADDRESS=0xdAC17F958D2ee523a2206206994597C13D831ec7

# Security
BACKEND_PRIVATE_KEY=your_production_private_key
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=https://yourdomain.com

# Performance
PORT=3001
NODE_ENV=production
REDIS_URL=redis://your-redis-url
DATABASE_URL=postgresql://user:pass@host:port/db
```

### 3. Database Setup

#### PostgreSQL
```sql
-- Create database
CREATE DATABASE wesee_gaming;

-- Create tables
CREATE TABLE players (
    address VARCHAR(42) PRIMARY KEY,
    wins INTEGER DEFAULT 0,
    total_gt_won DECIMAL(30,18) DEFAULT 0,
    matches_played INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matches (
    match_id VARCHAR(66) PRIMARY KEY,
    p1_address VARCHAR(42),
    p2_address VARCHAR(42),
    stake DECIMAL(30,18),
    status VARCHAR(20),
    winner VARCHAR(42),
    created_at TIMESTAMP DEFAULT NOW(),
    settled_at TIMESTAMP
);
```

#### Redis (for caching)
```bash
# Install Redis
sudo apt-get install redis-server

# Configure Redis
redis-cli
> CONFIG SET maxmemory 256mb
> CONFIG SET maxmemory-policy allkeys-lru
```

### 4. Load Balancer & SSL

#### Nginx Configuration
```nginx
upstream wesee_api {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://wesee_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🌐 Frontend Deployment

### 1. Static Hosting

#### Netlify
```bash
# Build and deploy
npm run build
netlify deploy --prod
```

#### Vercel
```bash
# Install Vercel CLI
npm i -g vercel
vercel --prod
```

#### AWS S3 + CloudFront
```bash
# Sync to S3
aws s3 sync web/ s3://your-bucket-name

# Create CloudFront distribution
aws cloudfront create-distribution
```

### 2. Environment Configuration

Update frontend configuration:

```javascript
// config.js
const config = {
  development: {
    backendUrl: 'http://localhost:3001',
    leaderboardUrl: 'http://localhost:3002',
    networkId: 1337
  },
  production: {
    backendUrl: 'https://api.yourdomain.com',
    leaderboardUrl: 'https://api.yourdomain.com/leaderboard',
    networkId: 1 // Mainnet
  }
};

export default config[process.env.NODE_ENV || 'development'];
```

## 📊 Monitoring & Analytics

### 1. Application Monitoring

#### New Relic
```bash
# Install New Relic agent
npm install newrelic

# Configure newrelic.js
exports.config = {
  app_name: ['Wesee Gaming Platform'],
  license_key: 'your_license_key',
  logging: {
    level: 'info'
  }
};
```

#### DataDog
```bash
# Install DataDog agent
npm install dd-trace

# Initialize tracing
require('dd-trace').init();
```

### 2. Blockchain Monitoring

#### Tenderly
```javascript
// Add to hardhat config
tenderly: {
  project: "your-project-id",
  username: "your-username",
  privateVerification: true,
}
```

#### Alchemy Notifications
```javascript
// Set up webhook notifications for:
// - Failed transactions
// - High gas usage
// - Contract events
```

## 🔒 Security Hardening

### 1. Private Key Management

#### AWS Secrets Manager
```bash
# Store private keys securely
aws secretsmanager create-secret \
    --name "wesee/blockchain/private-key" \
    --secret-string "your-private-key"
```

#### HashiCorp Vault
```bash
# Install Vault
vault server -dev

# Store secrets
vault kv put secret/wesee blockchain-private-key=your-key
```

### 2. Rate Limiting

```javascript
// Add rate limiting middleware
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### 3. CORS Configuration

```javascript
// Production CORS
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 📈 Performance Optimization

### 1. Database Optimization

```sql
-- Add indexes
CREATE INDEX idx_players_wins ON players(wins DESC);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created ON matches(created_at);

-- Partition large tables
CREATE TABLE matches_2024 PARTITION OF matches
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### 2. Caching Strategy

```javascript
// Redis caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache leaderboard for 5 minutes
app.get('/leaderboard', async (req, res) => {
  const cached = await client.get('leaderboard');
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  const data = await generateLeaderboard();
  await client.setex('leaderboard', 300, JSON.stringify(data));
  res.json(data);
});
```

### 3. CDN Configuration

```bash
# CloudFront settings
- Cache based on query strings
- Compress objects automatically
- Use origin failover
- Enable real-time metrics
```

## 🚨 Disaster Recovery

### 1. Backup Strategy

```bash
# Database backups
pg_dump wesee_gaming > backup_$(date +%Y%m%d).sql

# Contract state backup
npx hardhat run scripts/backup-state.js --network mainnet

# Configuration backup
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env*
```

### 2. Failover Plan

```javascript
// Multiple RPC endpoints
const providers = [
  'https://eth-mainnet.alchemyapi.io/v2/key1',
  'https://eth-mainnet.alchemyapi.io/v2/key2',
  'https://eth-mainnet.infura.io/v3/key3'
];

let currentProvider = 0;

function getProvider() {
  return new ethers.JsonRpcProvider(providers[currentProvider]);
}

function switchProvider() {
  currentProvider = (currentProvider + 1) % providers.length;
}
```

## 📋 Deployment Checklist

- [ ] Smart contracts deployed and verified
- [ ] Environment variables configured
- [ ] Database schema created and migrated
- [ ] SSL certificates installed
- [ ] Load balancer configured
- [ ] Monitoring tools set up
- [ ] Security measures implemented
- [ ] Performance optimizations applied
- [ ] Backup systems configured
- [ ] Documentation updated
- [ ] Team access configured
- [ ] Emergency procedures documented

## 🆘 Support & Maintenance

### 1. Regular Maintenance

```bash
# Weekly tasks
- Review error logs
- Check gas usage trends
- Update dependencies
- Monitor performance metrics

# Monthly tasks
- Security audit review
- Database optimization
- Backup verification
- Cost analysis
```

### 2. Emergency Procedures

```bash
# Incident response
1. Assess impact
2. Implement immediate fixes
3. Communicate to stakeholders
4. Document incident
5. Implement preventive measures
```

---

**Remember**: Always test on testnets before mainnet deployment, and maintain comprehensive monitoring and alerting systems.
