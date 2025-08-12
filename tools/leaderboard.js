const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(cors());
const PORT = process.env.LEADERBOARD_PORT || 3002;

// In-memory storage for leaderboard data
let leaderboardData = new Map(); // address -> { wins, totalGTWon, matchesPlayed }

// Contract ABIs for events
const PLAY_GAME_ABI = [
    "event MatchCreated(bytes32 indexed matchId, address p1, address p2, uint256 stake)",
    "event Staked(bytes32 indexed matchId, address player)",
    "event Settled(bytes32 indexed matchId, address winner, uint256 amount)",
    "event Refunded(bytes32 indexed matchId, address p1, address p2, uint256 amount)"
];

const TOKEN_STORE_ABI = [
    "event Purchase(address indexed buyer, uint256 usdtAmount, uint256 gtOut)"
];

// Initialize blockchain connection
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const playGameContract = new ethers.Contract(process.env.PLAY_GAME_ADDRESS, PLAY_GAME_ABI, provider);
const tokenStoreContract = new ethers.Contract(process.env.TOKEN_STORE_ADDRESS, TOKEN_STORE_ABI, provider);

// Event listeners
function setupEventListeners() {
    console.log('🔍 Setting up event listeners...');

    // Listen to match events
    playGameContract.on('MatchCreated', (matchId, p1, p2, stake) => {
        console.log(`🎯 Match created: ${matchId} - ${p1} vs ${p2} (${ethers.formatUnits(stake, 18)} GT)`);
        
        // Initialize player stats if they don't exist
        if (!leaderboardData.has(p1)) {
            leaderboardData.set(p1, { wins: 0, totalGTWon: 0, matchesPlayed: 0 });
        }
        if (!leaderboardData.has(p2)) {
            leaderboardData.set(p2, { wins: 0, totalGTWon: 0, matchesPlayed: 0 });
        }
    });

    playGameContract.on('Staked', (matchId, player) => {
        console.log(`💰 Player ${player} staked for match ${matchId}`);
    });

    playGameContract.on('Settled', (matchId, winner, amount) => {
        console.log(`🏆 Match ${matchId} settled - Winner: ${winner}, Amount: ${ethers.formatUnits(amount, 18)} GT`);
        
        // Update winner stats
        if (leaderboardData.has(winner)) {
            const stats = leaderboardData.get(winner);
            stats.wins += 1;
            stats.totalGTWon += parseFloat(ethers.formatUnits(amount, 18));
            stats.matchesPlayed += 1;
            leaderboardData.set(winner, stats);
        } else {
            leaderboardData.set(winner, { 
                wins: 1, 
                totalGTWon: parseFloat(ethers.formatUnits(amount, 18)), 
                matchesPlayed: 1 
            });
        }

        // Find the loser and update their stats
        // We need to get match info to find both players
        updateLoserStats(matchId, winner);
    });

    playGameContract.on('Refunded', (matchId, p1, p2, amount) => {
        console.log(`🔄 Match ${matchId} refunded - ${p1} and ${p2} each got ${ethers.formatUnits(amount, 18)} GT back`);
        
        // Update match count for both players
        if (leaderboardData.has(p1)) {
            const stats = leaderboardData.get(p1);
            stats.matchesPlayed += 1;
            leaderboardData.set(p1, stats);
        }
        if (leaderboardData.has(p2)) {
            const stats = leaderboardData.get(p2);
            stats.matchesPlayed += 1;
            leaderboardData.set(p2, stats);
        }
    });

    // Listen to purchase events
    tokenStoreContract.on('Purchase', (buyer, usdtAmount, gtOut) => {
        console.log(`💸 Purchase: ${buyer} bought ${ethers.formatUnits(gtOut, 18)} GT for ${ethers.formatUnits(usdtAmount, 6)} USDT`);
        
        // Initialize buyer stats if they don't exist
        if (!leaderboardData.has(buyer)) {
            leaderboardData.set(buyer, { wins: 0, totalGTWon: 0, matchesPlayed: 0 });
        }
    });

    console.log('✅ Event listeners set up successfully');
}

// Helper function to update loser stats
async function updateLoserStats(matchId, winner) {
    try {
        // Get match info to find both players
        const match = await playGameContract.matches(matchId);
        const loser = match.p1 === winner ? match.p2 : match.p1;
        
        if (leaderboardData.has(loser)) {
            const stats = leaderboardData.get(loser);
            stats.matchesPlayed += 1;
            leaderboardData.set(loser, stats);
        } else {
            leaderboardData.set(loser, { wins: 0, totalGTWon: 0, matchesPlayed: 1 });
        }
    } catch (error) {
        console.error('Error updating loser stats:', error);
    }
}

// API Routes
app.use(express.json());

// GET /leaderboard - Get top 10 players by GT won
app.get('/leaderboard', (req, res) => {
    try {
        // Convert Map to array and sort by total GT won
        const sortedPlayers = Array.from(leaderboardData.entries())
            .map(([address, stats]) => ({
                address,
                wins: stats.wins,
                totalGTWon: stats.totalGTWon,
                matchesPlayed: stats.matchesPlayed
            }))
            .sort((a, b) => b.totalGTWon - a.totalGTWon)
            .slice(0, 10);

        res.json({
            success: true,
            leaderboard: sortedPlayers,
            totalPlayers: leaderboardData.size,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// GET /player/:address - Get specific player stats
app.get('/player/:address', (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }

        const stats = leaderboardData.get(address);
        
        if (!stats) {
            return res.json({
                address,
                wins: 0,
                totalGTWon: 0,
                matchesPlayed: 0,
                message: 'Player not found in leaderboard'
            });
        }

        res.json({
            address,
            wins: stats.wins,
            totalGTWon: stats.totalGTWon,
            matchesPlayed: stats.matchesPlayed
        });
    } catch (error) {
        console.error('Player stats error:', error);
        res.status(500).json({ error: 'Failed to get player stats' });
    }
});

// GET /stats - Get overall statistics
app.get('/stats', (req, res) => {
    try {
        const totalPlayers = leaderboardData.size;
        let totalWins = 0;
        let totalGTWon = 0;
        let totalMatches = 0;

        leaderboardData.forEach((stats) => {
            totalWins += stats.wins;
            totalGTWon += stats.totalGTWon;
            totalMatches += stats.matchesPlayed;
        });

        res.json({
            totalPlayers,
            totalWins,
            totalGTWon: parseFloat(totalGTWon.toFixed(2)),
            totalMatches,
            averageGTPerPlayer: totalPlayers > 0 ? parseFloat((totalGTWon / totalPlayers).toFixed(2)) : 0,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// POST /reset - Reset leaderboard (for testing)
app.post('/reset', (req, res) => {
    try {
        leaderboardData.clear();
        res.json({ success: true, message: 'Leaderboard reset successfully' });
    } catch (error) {
        console.error('Reset error:', error);
        res.status(500).json({ error: 'Failed to reset leaderboard' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        connectedPlayers: leaderboardData.size,
        blockchain: process.env.RPC_URL
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🏆 Leaderboard API running on port ${PORT}`);
    console.log(`📡 Connected to blockchain at ${process.env.RPC_URL}`);
    console.log(`🎯 Play Game Contract: ${process.env.PLAY_GAME_ADDRESS}`);
    console.log(`🏪 Token Store Contract: ${process.env.TOKEN_STORE_ADDRESS}`);
    
    // Setup event listeners
    setupEventListeners();
    
    console.log(`\n📊 Available endpoints:`);
    console.log(`   GET  /leaderboard - Top 10 players`);
    console.log(`   GET  /player/:address - Player stats`);
    console.log(`   GET  /stats - Overall statistics`);
    console.log(`   GET  /health - Health check`);
    console.log(`   POST /reset - Reset leaderboard (testing)`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down leaderboard service...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down leaderboard service...');
    process.exit(0);
});
