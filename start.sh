#!/bin/bash

echo "🚀 Starting Wesee Blockchain Game..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install contract dependencies
echo "Installing contract dependencies..."
cd contracts
npm install
cd ..

# Install backend dependencies
echo "Installing backend dependencies..."
cd api
npm install
cd ..

# Install leaderboard dependencies
echo "Installing leaderboard dependencies..."
cd tools
npm install
cd ..

echo "✅ Dependencies installed successfully!"

echo ""
echo "🔧 Next steps:"
echo "1. Deploy smart contracts:"
echo "   cd contracts"
echo "   npx hardhat node  # In a new terminal"
echo "   npx hardhat run scripts/deploy.js --network localhost"
echo ""
echo "2. Update .env files with contract addresses"
echo "3. Start backend: cd api && npm start"
echo "4. Start leaderboard: cd tools && npm start"
echo "5. Open frontend: open web/index.html"
echo ""
echo "📚 See README.md for detailed instructions"
echo ""
echo "🎮 Happy gaming!"
