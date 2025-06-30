const { ethers } = require("hardhat");

async function main() {
  // 1) Fetch our three roles
  const [deployer, inspector, lender] = await ethers.getSigners();
  console.log("Accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  Inspector:", inspector.address);
  console.log("  Lender:   ", lender.address);

  // 2) Deploy Escrow first with a dummy RealEstate address (zero)
  console.log("\nDeploying Escrow…");
  const Escrow = await ethers.getContractFactory("Escrow", deployer);
  const escrow = await Escrow.deploy(
    ethers.constants.AddressZero,  // placeholder
    inspector.address,
    lender.address
  );
  await escrow.deployed();
  console.log("  ↳ Escrow deployed to:", escrow.address);

  // 3) Deploy RealEstate next, passing in the Escrow address as the authorized minter
  console.log("\nDeploying RealEstate…");
  const RealEstate = await ethers.getContractFactory("RealEstate", deployer);
  const realEstate = await RealEstate.deploy(escrow.address);
  await realEstate.deployed();
  console.log("  ↳ RealEstate deployed to:", realEstate.address);

  // 4) Link them up: set the RealEstate address inside the Escrow contract  
  console.log("\nLinking Escrow → RealEstate…");
  const tx = await escrow.setRealEstateAddress(realEstate.address);
  await tx.wait();
  console.log("  ↳ Escrow now pointing at RealEstate");

  // 5) Print out final addresses for your frontend/config
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log(`RealEstate: ${realEstate.address}`);
  console.log(`Escrow:     ${escrow.address}`);
  console.log("\nAdd these to your config.json under network 31337:");
  console.log(`"realEstate": { "address": "${realEstate.address}" },`);
  console.log(`"escrow":     { "address": "${escrow.address}" }`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });