const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy MockUSDT (6 decimals) for local testing
  const MockUSDT = await ethers.getContractFactory("MockUSDT");
  const mockUsdt = await MockUSDT.deploy();
  await mockUsdt.waitForDeployment();
  console.log("MockUSDT deployed to:", await mockUsdt.getAddress());

  // Mint some USDT to deployer for testing
  await (await mockUsdt.mint(deployer.address, 1_000_000n * 10n ** 6n)).wait();
  console.log("Minted 1,000,000 USDT to:", deployer.address);

  // Deploy GameToken
  const GameToken = await ethers.getContractFactory("GameToken");
  const gameToken = await GameToken.deploy();
  await gameToken.waitForDeployment();
  console.log("GameToken deployed to:", await gameToken.getAddress());

  // Deploy TokenStore with 1:1 conversion rate (1 USDT = 1 GT)
  const gtPerUsdt = ethers.parseUnits("1", 18); // 1e18
  const TokenStore = await ethers.getContractFactory("TokenStore");
  const tokenStore = await TokenStore.deploy(
    await mockUsdt.getAddress(),
    await gameToken.getAddress(),
    gtPerUsdt
  );
  await tokenStore.waitForDeployment();
  console.log("TokenStore deployed to:", await tokenStore.getAddress());

  // Deploy PlayGame
  const PlayGame = await ethers.getContractFactory("PlayGame");
  const playGame = await PlayGame.deploy(await gameToken.getAddress());
  await playGame.waitForDeployment();
  console.log("PlayGame deployed to:", await playGame.getAddress());

  // Set TokenStore as minter in GameToken
  await gameToken.setTokenStore(await tokenStore.getAddress());
  console.log("TokenStore set as minter in GameToken");

  // Set backend operator in PlayGame (for demo, using deployer)
  await playGame.setBackendOperator(deployer.address);
  console.log("Backend operator set in PlayGame");

  console.log("\nDeployment Summary:");
  console.log("===================");
  console.log("GameToken:", await gameToken.getAddress());
  console.log("TokenStore:", await tokenStore.getAddress());
  console.log("PlayGame:", await playGame.getAddress());
  console.log("GT per USDT:", ethers.formatUnits(gtPerUsdt, 18));
  console.log("Backend Operator:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
