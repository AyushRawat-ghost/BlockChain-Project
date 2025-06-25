// const { expect } = require('chai');
// const { ethers } = require('hardhat');

// const tokens = (n) => {
//     return ethers.utils.parseUnits(n.toString(), 'ether')
// }

// describe('Escrow', () => {
//     let deployer, buyer, seller, inspector, lender; // Added deployer
//     let realEstate, escrow;
//     const NFT_ID = 1; // Standardized NFT ID for testing (will be minted later)
//     const TOKEN_URI = "https://ipfs.io/ipfs/test-uri-for-nft"; // Standardized Token URI
//     const PURCHASE_PRICE = tokens(10);
//     const ESCROW_AMOUNT = tokens(5);

//     beforeEach(async () => {
//         // Setup accounts
//         [deployer, buyer, seller, inspector, lender] = await ethers.getSigners(); // Get deployer too

// // Deploy Escrow contract
//         const Escrow = await ethers.getContractFactory('Escrow');
//         escrow = await Escrow.deploy(
//             ethers.constants.AddressZero,
//             inspector.address,
//             lender.address
//         );
//         await escrow.deployed();

//         // Deploy RealEstate contract with the escrow address
//         const RealEstate = await ethers.getContractFactory('RealEstate');
//         realEstate = await RealEstate.deploy(escrow.address);
//         await realEstate.deployed();
//     });

//     describe('Deployment', () => {
//         it('should return the correct RealEstate contract address', async () => {
//             expect(await escrow.realEstate()).to.be.equal(ethers.constants.AddressZero);
//         });

//         it('should return the correct inspector address', async () => {
//             const result = await escrow.inspector();
//             expect(result).to.be.equal(inspector.address);
//         });

//         it('should return the correct lender address', async () => {
//             const result = await escrow.lender();
//             expect(result).to.be.equal(lender.address);
//         });

//         it('should initialize property status for a non-existent token as PROPOSED (0)', async () => {
//             expect(await escrow.propertyStatus(NFT_ID)).to.be.equal(0);
//         });

//     });
// });
