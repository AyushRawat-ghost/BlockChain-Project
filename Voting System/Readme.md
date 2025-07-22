Voting System DApp:
A full-stack voting application on Ethereum, featuring a Hardhat-powered smart contract backend and a React-based frontend styled with Tailwind CSS.

# Prerequisites

Node.js v18.x (install via nvm)
npm (comes with Node.js)
MetaMask or another Web3 wallet for frontend testing

# Installation
Clone the repo and move into its root directory:
git clone https://github.com/your-username/voting-dapp.git
cd voting-dapp


1. Backend Setup (Hardhat)

Initialize your Hardhat workspace and install dependencies:
# Ensure you’re on Node.js v18.x
nvm install 18.20.0
nvm use 18.20.0
# Initialize npm and install Hardhat toolbox + ethers v6
npm init -y
npm install --save-dev \
  @nomicfoundation/hardhat-toolbox \
  ethers@^6.14.0 \
  typescript ts-node \
  @typechain/hardhat @typechain/ethers-v6 \
  @types/chai @types/mocha \
  solidity-coverage hardhat-gas-reporter
# Scaffold basic Hardhat project
npx hardhat


2. Frontend Setup (React + Tailwind CSS)
Create and configure your React application:

cd frontend
# Scaffold React app
npx create-react-app .
# Install ethers.js for Web3 interactions
npm install ethers


3. Deployment
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to a local network
npx hardhat node        # Start local node
npx hardhat run scripts/deploy.js --network localhost

# Start development server
npm start

# Build for production
npm run build



