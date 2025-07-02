async function main() {
  const [deployer, inspector, lender] = await ethers.getSigners();

  // 1) Deploy RealEstate
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.deployed();
  console.log("RealEstate deployed to:", realEstate.address);

  // 2) Deploy Escrow (now that realEstate.address exists)
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.address,
    inspector.address,
    lender.address
  );
  await escrow.deployed();
  console.log("Escrow deployed to:", escrow.address);

  // 3) Allow Escrow to mint NFTs
  const tx = await realEstate.setEscrowMinter(escrow.address);
  await tx.wait();
  console.log("Escrow set as minter on RealEstate");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});