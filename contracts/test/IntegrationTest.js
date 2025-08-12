const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Wesee Blockchain Gaming Platform - Integration Tests", function () {
  let deployer, player1, player2, backendOperator;
  let gameToken, tokenStore, playGame, mockUsdt;
  let gtPerUsdt;

  beforeEach(async function () {
    [deployer, player1, player2, backendOperator] = await ethers.getSigners();
    
    // Deploy contracts
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUsdt = await MockUSDT.deploy();
    
    const GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy();
    
    gtPerUsdt = ethers.parseUnits("1", 18); // 1:1 conversion
    const TokenStore = await ethers.getContractFactory("TokenStore");
    tokenStore = await TokenStore.deploy(
      await mockUsdt.getAddress(),
      await gameToken.getAddress(),
      gtPerUsdt
    );
    
    const PlayGame = await ethers.getContractFactory("PlayGame");
    playGame = await PlayGame.deploy(await gameToken.getAddress());
    
    // Setup permissions
    await gameToken.setTokenStore(await tokenStore.getAddress());
    await playGame.setBackendOperator(backendOperator.address);
    
    // Mint USDT to players for testing
    await mockUsdt.mint(player1.address, 1_000_000n * 10n ** 6n); // 1M USDT
    await mockUsdt.mint(player2.address, 1_000_000n * 10n ** 6n); // 1M USDT
  });

  describe("Token System Integration", function () {
    it("Should allow USDT to GT conversion", async function () {
      const usdtAmount = 100_000n * 10n ** 6n; // 100 USDT
      
      // Approve TokenStore to spend USDT
      await mockUsdt.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
      
      // Buy GT tokens
      await tokenStore.connect(player1).buy(usdtAmount);
      
      // Check GT balance
      const gtBalance = await gameToken.balanceOf(player1.address);
      const expectedGT = (usdtAmount * gtPerUsdt) / (10n ** 6n);
      expect(gtBalance).to.equal(expectedGT);
    });

    it("Should emit Purchase event", async function () {
      const usdtAmount = 50_000n * 10n ** 6n; // 50 USDT
      
      await mockUsdt.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
      
      await expect(tokenStore.connect(player1).buy(usdtAmount))
        .to.emit(tokenStore, "Purchase")
        .withArgs(player1.address, usdtAmount, (usdtAmount * gtPerUsdt) / (10n ** 6n));
    });
  });

  describe("Game Flow Integration", function () {
    let matchId;
    const stake = ethers.parseUnits("100", 18); // 100 GT

    beforeEach(async function () {
      // Setup: Player1 buys GT tokens
      const usdtAmount = 200_000n * 10n ** 6n; // 200 USDT
      await mockUsdt.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
      await tokenStore.connect(player1).buy(usdtAmount);
      
      // Setup: Player2 buys GT tokens
      await mockUsdt.connect(player2).approve(await tokenStore.getAddress(), usdtAmount);
      await tokenStore.connect(player2).buy(usdtAmount);
      
      matchId = ethers.keccak256(ethers.toUtf8Bytes("test-match-1"));
    });

    it("Should complete full game cycle", async function () {
      // 1. Create match
      await playGame.connect(deployer).createMatch(matchId, player1.address, player2.address, stake);
      
      // 2. Player1 stakes
      await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
      await playGame.connect(player1).stake(matchId);
      
      // 3. Player2 stakes
      await gameToken.connect(player2).approve(await playGame.getAddress(), stake);
      await playGame.connect(player2).stake(matchId);
      
      // 4. Check match status
      const match = await playGame.matches(matchId);
      expect(match.status).to.equal(1); // STAKED
      expect(match.p1Staked).to.be.true;
      expect(match.p2Staked).to.be.true;
      
      // 5. Submit result (Player1 wins)
      await playGame.connect(backendOperator).commitResult(matchId, player1.address);
      
      // 6. Check final state
      const finalMatch = await playGame.matches(matchId);
      expect(finalMatch.status).to.equal(2); // SETTLED
      
      // 7. Check winner balance (should have 2x stake)
      const winnerBalance = await gameToken.balanceOf(player1.address);
      const expectedBalance = (200_000n * 10n ** 18n) - stake + (stake * 2n); // Initial - stake + 2x stake
      expect(winnerBalance).to.equal(expectedBalance);
    });

    it("Should emit all required events", async function () {
      // Create match
      await expect(playGame.connect(deployer).createMatch(matchId, player1.address, player2.address, stake))
        .to.emit(playGame, "MatchCreated")
        .withArgs(matchId, player1.address, player2.address, stake);
      
      // Stake events
      await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
      await expect(playGame.connect(player1).stake(matchId))
        .to.emit(playGame, "Staked")
        .withArgs(matchId, player1.address);
      
      await gameToken.connect(player2).approve(await playGame.getAddress(), stake);
      await expect(playGame.connect(player2).stake(matchId))
        .to.emit(playGame, "Staked")
        .withArgs(matchId, player2.address);
      
      // Result event
      await expect(playGame.connect(backendOperator).commitResult(matchId, player1.address))
        .to.emit(playGame, "Settled")
        .withArgs(matchId, player1.address, stake * 2n);
    });
  });

  describe("Security Integration", function () {
    it("Should prevent unauthorized minting", async function () {
      const amount = ethers.parseUnits("100", 18);
      
      await expect(gameToken.connect(player1).mint(player1.address, amount))
        .to.be.revertedWith("Only TokenStore can mint");
    });

    it("Should prevent unauthorized match creation", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("unauthorized-match"));
      const stake = ethers.parseUnits("100", 18);
      
      await expect(playGame.connect(player1).createMatch(matchId, player1.address, player2.address, stake))
        .to.be.revertedWithCustomError(playGame, "OwnableUnauthorizedAccount");
    });

    it("Should prevent unauthorized result submission", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("test-match"));
      const stake = ethers.parseUnits("100", 18);
      
      // Create match
      await playGame.connect(deployer).createMatch(matchId, player1.address, player2.address, stake);
      
      // Try to submit result as non-operator
      await expect(playGame.connect(player1).commitResult(matchId, player1.address))
        .to.be.revertedWith("Only backend can commit result");
    });
  });

  describe("Edge Cases Integration", function () {
    it("Should handle zero amounts correctly", async function () {
      await expect(tokenStore.connect(player1).buy(0))
        .to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should prevent duplicate match creation", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("duplicate-match"));
      const stake = ethers.parseUnits("100", 18);
      
      await playGame.connect(deployer).createMatch(matchId, player1.address, player2.address, stake);
      
      await expect(playGame.connect(deployer).createMatch(matchId, player1.address, player2.address, stake))
        .to.be.revertedWith("Match already exists");
    });

    it("Should prevent invalid winner addresses", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("invalid-winner"));
      const stake = ethers.parseUnits("100", 18);
      
      await playGame.connect(deployer).createMatch(matchId, player1.address, player2.address, stake);
      
      // Try to submit invalid winner
      await expect(playGame.connect(backendOperator).commitResult(matchId, deployer.address))
        .to.be.revertedWith("Invalid winner");
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for basic operations", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("gas-test"));
      const stake = ethers.parseUnits("100", 18);
      
      // Create match
      const createTx = await playGame.connect(deployer).createMatch(matchId, player1.address, player2.address, stake);
      const createReceipt = await createTx.wait();
      
      // Gas should be reasonable (under 200k for simple operations)
      expect(createReceipt.gasUsed).to.be.lessThan(200000n);
    });
  });

  describe("Multi-Player Integration", function () {
    it("Should handle multiple concurrent matches", async function () {
      const match1Id = ethers.keccak256(ethers.toUtf8Bytes("match-1"));
      const match2Id = ethers.keccak256(ethers.toUtf8Bytes("match-2"));
      const stake = ethers.parseUnits("50", 18);
      
      // Setup players with GT tokens
      const usdtAmount = 100_000n * 10n ** 6n;
      await mockUsdt.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
      await tokenStore.connect(player1).buy(usdtAmount);
      
      // Create two matches
      await playGame.connect(deployer).createMatch(match1Id, player1.address, player2.address, stake);
      await playGame.connect(deployer).createMatch(match2Id, player2.address, player1.address, stake);
      
      // Verify both matches exist
      const match1 = await playGame.matches(match1Id);
      const match2 = await playGame.matches(match2Id);
      
      expect(match1.p1).to.equal(player1.address);
      expect(match2.p1).to.equal(player2.address);
    });
  });
});
