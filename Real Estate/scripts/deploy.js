const hre = require("hardhat");

const token=(n)=>{
  return ethers.utils.parseUnits(n.toString(), "ether");
}

async function main() {
  const [buyer,seller,inspector,lender]=await ethers.getSigners()

  // Deploy Real Estate
  const RealEstate = await ethers.getContractFactory("RealEstate")
  const realEstate = await RealEstate.deploy()
  await realEstate.deployed()
  console.log("Real Estate deployed to:", realEstate.address)


  // Minting properties
  console.log("\n Mining 3 properties")
  for (let i=0;i<3;i++){
    const transaction=await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`)
    await transaction.wait();
  }


  // Escrow Deployment
  const Escrow=await ethers.getContractFactory("Escrow")
  const escrow=await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  )
  await escrow.deployed()
  console.log("Escrow deployed to:", escrow.address)

  
  // Transaction Approval
  for(let i=0;i<3;i++){
    let transaction=await realEstate.connect(seller).approve(escrow.address, i + 1)
    await transaction.wait();
  }

  // Listing Properties
  transaction = await escrow.connect(seller).list(1,buyer.address,token(20),token(10))
  await transaction.wait();
  transaction = await escrow.connect(seller).list(2,buyer.address,token(20),token(10))
  await transaction.wait();
  transaction = await escrow.connect(seller).list(3,buyer.address,token(20),token(10))
  await transaction.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
