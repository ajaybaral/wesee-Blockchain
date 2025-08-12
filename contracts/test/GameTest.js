const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Wesee Blockchain Game", function () {
  let gameToken, tokenStore, playGame;
  let owner, player1, player2, backend;
  let usdtMock;

  beforeEach(async function () {
    [owner, player1, player2, backend] = await ethers.getSigners();

    // Deploy GameToken
    const GameToken = await ethers.getContractFactory("GameToken");
    gameToken = await GameToken.deploy();

    // Deploy mock USDT (6 decimals)
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    usdtMock = await MockUSDT.deploy();

    // Deploy TokenStore
    const TokenStore = await ethers.getContractFactory("TokenStore");
    tokenStore = await TokenStore.deploy(
      await usdtMock.getAddress(),
      await gameToken.getAddress(),
      ethers.parseUnits("1", 18) // 1 USDT = 1 GT
    );

    // Deploy PlayGame
    const PlayGame = await ethers.getContractFactory("PlayGame");
    playGame = await PlayGame.deploy(await gameToken.getAddress());

    // Set TokenStore as minter
    await gameToken.setTokenStore(await tokenStore.getAddress());

    // Set backend operator
    await playGame.setBackendOperator(backend.address);

    // Give some USDT to players
    await usdtMock.mint(player1.address, ethers.parseUnits("100", 6));
    await usdtMock.mint(player2.address, ethers.parseUnits("100", 6));
  });

  describe("GameToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await gameToken.name()).to.equal("GameToken");
      expect(await gameToken.symbol()).to.equal("GT");
      expect(await gameToken.decimals()).to.equal(18);
    });

    it("Should only allow TokenStore to mint", async function () {
      await expect(
        gameToken.connect(player1).mint(player1.address, ethers.parseUnits("100", 18))
      ).to.be.revertedWith("Only TokenStore can mint");
    });

    it("Should allow TokenStore to mint", async function () {
      await tokenStore.connect(player1).buy(ethers.parseUnits("10", 6));
      expect(await gameToken.balanceOf(player1.address)).to.equal(ethers.parseUnits("10", 18));
    });
  });

  describe("TokenStore", function () {
    it("Should convert USDT to GT correctly", async function () {
      const usdtAmount = ethers.parseUnits("10", 6);
      const expectedGT = ethers.parseUnits("10", 18);

      await usdtMock.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);
      await tokenStore.connect(player1).buy(usdtAmount);

      expect(await gameToken.balanceOf(player1.address)).to.equal(expectedGT);
    });

    it("Should emit Purchase event", async function () {
      const usdtAmount = ethers.parseUnits("5", 6);
      await usdtMock.connect(player1).approve(await tokenStore.getAddress(), usdtAmount);

      await expect(tokenStore.connect(player1).buy(usdtAmount))
        .to.emit(tokenStore, "Purchase")
        .withArgs(player1.address, usdtAmount, ethers.parseUnits("5", 18));
    });
  });

  describe("PlayGame", function () {
    beforeEach(async function () {
      // Give players some GT tokens
      await tokenStore.connect(player1).buy(ethers.parseUnits("20", 6));
      await tokenStore.connect(player2).buy(ethers.parseUnits("20", 6));
    });

    it("Should create match correctly", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("test-match"));
      const stake = ethers.parseUnits("10", 18);

      await playGame.createMatch(matchId, player1.address, player2.address, stake);

      const match = await playGame.matches(matchId);
      expect(match.p1).to.equal(player1.address);
      expect(match.p2).to.equal(player2.address);
      expect(match.stake).to.equal(stake);
    });

    it("Should allow players to stake", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("stake-test"));
      const stake = ethers.parseUnits("5", 18);

      await playGame.createMatch(matchId, player1.address, player2.address, stake);

      // Player 1 stakes
      await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
      await playGame.connect(player1).stake(matchId);

      // Player 2 stakes
      await gameToken.connect(player2).approve(await playGame.getAddress(), stake);
      await playGame.connect(player2).stake(matchId);

      const match = await playGame.matches(matchId);
      expect(match.status).to.equal(1); // STAKED
    });

    it("Should settle match and pay winner", async function () {
      const matchId = ethers.keccak256(ethers.toUtf8Bytes("settle-test"));
      const stake = ethers.parseUnits("10", 18);

      await playGame.createMatch(matchId, player1.address, player2.address, stake);

      // Both players stake
      await gameToken.connect(player1).approve(await playGame.getAddress(), stake);
      await gameToken.connect(player2).approve(await playGame.getAddress(), stake);
      await playGame.connect(player1).stake(matchId);
      await playGame.connect(player2).stake(matchId);

      // Backend settles match
      await playGame.connect(backend).commitResult(matchId, player1.address);

      const match = await playGame.matches(matchId);
      expect(match.status).to.equal(2); // SETTLED

      // Winner should have 2x stake
      expect(await gameToken.balanceOf(player1.address)).to.equal(ethers.parseUnits("20", 18));
    });
  });
});

// Mock USDT contract for testing
contract("MockUSDT", function () {
  let mockUSDT;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const MockUSDT = await ethers.getContractFactory("MockUSDT");
    mockUSDT = await MockUSDT.deploy();
  });

  it("Should mint tokens correctly", async function () {
    const amount = ethers.parseUnits("100", 6);
    await mockUSDT.mint(owner.address, amount);
    expect(await mockUSDT.balanceOf(owner.address)).to.equal(amount);
  });
});
