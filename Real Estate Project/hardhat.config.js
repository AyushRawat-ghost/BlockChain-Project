// require("@nomicfoundation/hardhat-toolbox"); // Or your specific Hardhat plugins

// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.18", // Ensure this matches your contract's Solidity version
//   networks: {
//     localhost: {
//       url: "http://127.0.0.1:8545", // Default Hardhat node URL
//       chainId: 31337, // Explicitly set chainId for localhost
//       // --- NEW LINE TO FIX ENS ERROR ---
//       ensAddress: undefined, // Prevents ethers.js from trying to resolve ENS names
//     }
//     // You can add other networks here for deployment to testnets/mainnet
//     /*
//     sepolia: {
//       url: "YOUR_SEPOLIA_RPC_URL",
//       accounts: ["YOUR_PRIVATE_KEY"]
//     }
//     */
//   }
// };
require("@nomiclabs/hardhat-ethers"); // Or your specific Hardhat plugins

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.18", // IMPORTANT: Ensure this matches your contract's Solidity version
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545", // Default Hardhat node URL
      chainId: 31337, // Explicitly set chainId for localhost
      // --- THIS IS THE CRITICAL LINE ---
      ensAddress: undefined, // Prevents ethers.js from trying to resolve ENS names
      name:"localhost"
    }
  }
};