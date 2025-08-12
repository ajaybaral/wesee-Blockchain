#!/usr/bin/env node

/**
 * Wesee Blockchain Game Demo Script
 * 
 * This script demonstrates the complete functionality of the blockchain game:
 * 1. Token purchase (USDT → GT)
 * 2. Match creation and staking
 * 3. Result submission and payout
 * 4. Leaderboard tracking
 * 
 * Prerequisites:
 * - Smart contracts deployed
 * - Backend API running on port 3001
 * - Leaderboard service running on port 3002
 */

const { ethers } = require('ethers');

// Configuration
const API_BASE = 'http://localhost:3001';
const LEADERBOARD_BASE = 'http://localhost:3002';

// Demo addresses (replace with actual addresses after deployment)
const DEMO_ADDRESSES = {
    player1: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    player2: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    backend: '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
};

// Demo match data
const DEMO_MATCH = {
    id: ethers.keccak256(ethers.toUtf8Bytes('demo-match-' + Date.now())),
    stake: 100 // 100 GT
};

// Utility functions
async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return { success: response.ok, data, status: response.status };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const emoji = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        step: '🔹'
    };
    console.log(`${emoji[type]} [${timestamp}] ${message}`);
}

// Demo functions
async function checkSystemHealth() {
    log('Checking system health...', 'step');
    
    // Check backend API
    const backendHealth = await makeRequest(`${API_BASE}/health`);
    if (!backendHealth.success) {
        log('Backend API is not running', 'error');
        return false;
    }
    log('Backend API is healthy', 'success');
    
    // Check leaderboard service
    const leaderboardHealth = await makeRequest(`${LEADERBOARD_BASE}/health`);
    if (!leaderboardHealth.success) {
        log('Leaderboard service is not running', 'error');
        return false;
    }
    log('Leaderboard service is healthy', 'success');
    
    return true;
}

async function demonstrateTokenPurchase() {
    log('Demonstrating token purchase (USDT → GT)...', 'step');
    
    const purchaseResult = await makeRequest(`${API_BASE}/purchase?amount=50`);
    if (purchaseResult.success) {
        log(`Token purchase simulation: ${purchaseResult.data.message}`, 'success');
    } else {
        log(`Token purchase failed: ${purchaseResult.data.error}`, 'error');
    }
    
    await sleep(1000);
}

async function demonstrateMatchCreation() {
    log('Demonstrating match creation...', 'step');
    
    const matchData = {
        matchId: DEMO_MATCH.id,
        p1: DEMO_ADDRESSES.player1,
        p2: DEMO_ADDRESSES.player2,
        stake: DEMO_MATCH.stake
    };
    
    const createResult = await makeRequest(`${API_BASE}/match/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchData)
    });
    
    if (createResult.success) {
        log(`Match created successfully: ${createResult.data.message}`, 'success');
        log(`Transaction hash: ${createResult.data.transactionHash}`, 'info');
    } else {
        log(`Match creation failed: ${createResult.data.error}`, 'error');
    }
    
    await sleep(1000);
}

async function demonstrateResultSubmission() {
    log('Demonstrating result submission...', 'step');
    
    const resultData = {
        matchId: DEMO_MATCH.id,
        winner: DEMO_ADDRESSES.player1
    };
    
    const resultResult = await makeRequest(`${API_BASE}/match/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resultData)
    });
    
    if (resultResult.success) {
        log(`Result submitted successfully: ${resultResult.data.message}`, 'success');
        log(`Transaction hash: ${resultResult.data.transactionHash}`, 'info');
    } else {
        log(`Result submission failed: ${resultResult.data.error}`, 'error');
    }
    
    await sleep(1000);
}

async function demonstrateMatchInfo() {
    log('Demonstrating match information retrieval...', 'step');
    
    const matchInfo = await makeRequest(`${API_BASE}/match/${DEMO_MATCH.id}`);
    if (matchInfo.success) {
        log('Match information retrieved:', 'success');
        console.log(`  Match ID: ${matchInfo.data.matchId}`);
        console.log(`  Player 1: ${matchInfo.data.p1}`);
        console.log(`  Player 2: ${matchInfo.data.p2}`);
        console.log(`  Stake: ${matchInfo.data.stake} GT`);
        console.log(`  Status: ${matchInfo.data.status}`);
    } else {
        log(`Failed to get match info: ${matchInfo.data.error}`, 'error');
    }
    
    await sleep(1000);
}

async function demonstrateBalanceCheck() {
    log('Demonstrating balance checking...', 'step');
    
    const balance1 = await makeRequest(`${API_BASE}/balance/${DEMO_ADDRESSES.player1}`);
    const balance2 = await makeRequest(`${API_BASE}/balance/${DEMO_ADDRESSES.player2}`);
    
    if (balance1.success && balance2.success) {
        log('Player balances:', 'success');
        console.log(`  Player 1: ${balance1.data.balance} GT`);
        console.log(`  Player 2: ${balance2.data.balance} GT`);
    } else {
        log('Failed to get player balances', 'error');
    }
    
    await sleep(1000);
}

async function demonstrateLeaderboard() {
    log('Demonstrating leaderboard functionality...', 'step');
    
    // Wait a bit for events to be processed
    await sleep(2000);
    
    const leaderboard = await makeRequest(`${LEADERBOARD_BASE}/leaderboard`);
    if (leaderboard.success) {
        log('Leaderboard data:', 'success');
        console.log(`  Total players: ${leaderboard.data.totalPlayers}`);
        if (leaderboard.data.leaderboard.length > 0) {
            console.log('  Top players:');
            leaderboard.data.leaderboard.slice(0, 3).forEach((player, index) => {
                console.log(`    ${index + 1}. ${player.address} - ${player.totalGTWon} GT won`);
            });
        }
    } else {
        log('Failed to get leaderboard data', 'error');
    }
    
    await sleep(1000);
}

async function demonstrateStatistics() {
    log('Demonstrating statistics...', 'step');
    
    const stats = await makeRequest(`${LEADERBOARD_BASE}/stats`);
    if (stats.success) {
        log('Game statistics:', 'success');
        console.log(`  Total players: ${stats.data.totalPlayers}`);
        console.log(`  Total wins: ${stats.data.totalWins}`);
        console.log(`  Total GT won: ${stats.data.totalGTWon}`);
        console.log(`  Total matches: ${stats.data.totalMatches}`);
        console.log(`  Average GT per player: ${stats.data.averageGTPerPlayer}`);
    } else {
        log('Failed to get statistics', 'error');
    }
    
    await sleep(1000);
}

// Main demo function
async function runDemo() {
    log('🎮 Starting Wesee Blockchain Game Demo', 'info');
    log('=====================================', 'info');
    
    // Check system health
    const isHealthy = await checkSystemHealth();
    if (!isHealthy) {
        log('System is not healthy. Please ensure all services are running.', 'error');
        log('1. Start backend: cd api && npm start', 'warning');
        log('2. Start leaderboard: cd tools && npm start', 'warning');
        return;
    }
    
    log('All systems are healthy. Starting demo...', 'success');
    await sleep(2000);
    
    try {
        // Run demo scenarios
        await demonstrateTokenPurchase();
        await demonstrateMatchCreation();
        await demonstrateResultSubmission();
        await demonstrateMatchInfo();
        await demonstrateBalanceCheck();
        await demonstrateLeaderboard();
        await demonstrateStatistics();
        
        log('🎉 Demo completed successfully!', 'success');
        log('=====================================', 'info');
        log('What we demonstrated:', 'info');
        log('✅ Token purchase simulation', 'step');
        log('✅ Match creation and management', 'step');
        log('✅ Result submission and settlement', 'step');
        log('✅ Real-time data retrieval', 'step');
        log('✅ Balance checking', 'step');
        log('✅ Leaderboard tracking', 'step');
        log('✅ Game statistics', 'step');
        
        log('Next steps:', 'info');
        log('1. Open web/index.html in your browser', 'step');
        log('2. Try the frontend interface', 'step');
        log('3. Create more matches and test different scenarios', 'step');
        log('4. Check the leaderboard for real-time updates', 'step');
        
    } catch (error) {
        log(`Demo failed with error: ${error.message}`, 'error');
    }
}

// Run demo if this script is executed directly
if (require.main === module) {
    runDemo().catch(console.error);
}

module.exports = {
    runDemo,
    checkSystemHealth,
    demonstrateTokenPurchase,
    demonstrateMatchCreation,
    demonstrateResultSubmission,
    demonstrateMatchInfo,
    demonstrateBalanceCheck,
    demonstrateLeaderboard,
    demonstrateStatistics
};
