const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Blockchain setup
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

// Contract ABIs (simplified for demo - in production, use full ABIs)
const GAME_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

const TOKEN_STORE_ABI = [
  "function buy(uint256 usdtAmount)",
  "function gtPerUsdt() view returns (uint256)",
  "function usdt() view returns (address)",
  "function gameToken() view returns (address)"
];

const PLAY_GAME_ABI = [
  "function createMatch(bytes32 matchId, address p1, address p2, uint256 stake)",
  "function commitResult(bytes32 matchId, address winner)",
  "function matches(bytes32) view returns (address p1, address p2, uint256 stake, uint256 startTime, uint8 status, bool p1Staked, bool p2Staked)",
  "function backendOperator() view returns (address)"
];

// Contract instances
const gameToken = new ethers.Contract(process.env.GAME_TOKEN_ADDRESS, GAME_TOKEN_ABI, wallet);
const tokenStore = new ethers.Contract(process.env.TOKEN_STORE_ADDRESS, TOKEN_STORE_ABI, wallet);
const playGame = new ethers.Contract(process.env.PLAY_GAME_ADDRESS, PLAY_GAME_ABI, wallet);

// Routes

// GET /purchase?amount=USDT
app.get('/purchase', async (req, res) => {
  try {
    const { amount } = req.query;
    const usdtAmount = parseInt(amount);
    
    if (!amount || isNaN(usdtAmount) || usdtAmount <= 0) {
      return res.status(400).json({ error: 'Invalid USDT amount' });
    }

    // Convert USDT amount to wei (6 decimals)
    const usdtAmountWei = ethers.parseUnits(usdtAmount.toString(), 6);
    
    // Call TokenStore.buy() - this would require USDT approval first
    // For demo purposes, we'll just return the expected GT amount
    const gtPerUsdt = await tokenStore.gtPerUsdt();
    const gtOut = (usdtAmountWei * gtPerUsdt) / ethers.parseUnits("1", 6);
    
    res.json({
      success: true,
      usdtAmount: usdtAmount,
      gtOut: ethers.formatUnits(gtOut, 18),
      message: `Would mint ${ethers.formatUnits(gtOut, 18)} GT for ${usdtAmount} USDT`
    });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Purchase failed', details: error.message });
  }
});

// POST /match/start
app.post('/match/start', async (req, res) => {
  try {
    const { matchId, p1, p2, stake } = req.body;
    
    if (!matchId || !p1 || !p2 || !stake) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate addresses
    if (!ethers.isAddress(p1) || !ethers.isAddress(p2)) {
      return res.status(400).json({ error: 'Invalid addresses' });
    }
    
    // Convert stake to wei (18 decimals)
    const stakeWei = ethers.parseUnits(stake.toString(), 18);
    
    // Create match
    const tx = await playGame.createMatch(matchId, p1, p2, stakeWei);
    await tx.wait();
    
    res.json({
      success: true,
      matchId: matchId,
      transactionHash: tx.hash,
      message: 'Match created successfully'
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Failed to create match', details: error.message });
  }
});

// POST /match/result
app.post('/match/result', async (req, res) => {
  try {
    const { matchId, winner } = req.body;
    
    if (!matchId || !winner) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!ethers.isAddress(winner)) {
      return res.status(400).json({ error: 'Invalid winner address' });
    }
    
    // Commit result
    const tx = await playGame.commitResult(matchId, winner);
    await tx.wait();
    
    res.json({
      success: true,
      matchId: matchId,
      winner: winner,
      transactionHash: tx.hash,
      message: 'Result committed successfully'
    });
  } catch (error) {
    console.error('Commit result error:', error);
    res.status(500).json({ error: 'Failed to commit result', details: error.message });
  }
});

// GET /balance/:address
app.get('/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }
    
    const balance = await gameToken.balanceOf(address);
    
    res.json({
      address: address,
      balance: ethers.formatUnits(balance, 18),
      balanceWei: balance.toString()
    });
  } catch (error) {
    console.error('Balance check error:', error);
    res.status(500).json({ error: 'Failed to get balance', details: error.message });
  }
});

// GET /match/:matchId
app.get('/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await playGame.matches(matchId);
    
    const statusNames = ['PENDING', 'STAKED', 'SETTLED', 'REFUNDED'];
    
    res.json({
      matchId: matchId,
      p1: match.p1,
      p2: match.p2,
      stake: ethers.formatUnits(match.stake, 18),
      startTime: match.startTime.toString(),
      status: statusNames[match.status],
      p1Staked: match.p1Staked,
      p2Staked: match.p2Staked
    });
  } catch (error) {
    console.error('Match info error:', error);
    res.status(500).json({ error: 'Failed to get match info', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Wesee Game API running on port ${PORT}`);
  console.log(`📡 Connected to blockchain at ${process.env.RPC_URL}`);
  console.log(`🎮 Game Token: ${process.env.GAME_TOKEN_ADDRESS}`);
  console.log(`🏪 Token Store: ${process.env.TOKEN_STORE_ADDRESS}`);
  console.log(`🎯 Play Game: ${process.env.PLAY_GAME_ADDRESS}`);
});
