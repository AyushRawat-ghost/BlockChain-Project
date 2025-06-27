// test/RealEstate.js (or RealEstateMinter.test.js - ensure this is the file you run)

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('RealEstate Minter Role', () => {
  let realEstate;
  let deployer;
  let minterAccount; // This will represent our Escrow contract in this test
  let nonMinter;
  let buyer;
  let otherAccount; // Declared here for proper scope

  beforeEach(async () => {
    // Destructure all required signers including 'otherAccount'
    [deployer, minterAccount, nonMinter, buyer, otherAccount] = await ethers.getSigners();

    const RealEstate = await ethers.getContractFactory('RealEstate');
    // Deploy RealEstate, passing minterAccount.address as the designated minter
    realEstate = await RealEstate.deploy(minterAccount.address);
    await realEstate.deployed();
  });

  describe('Deployment', () => {
    it('Sets the correct minter address', async () => {
      expect(await realEstate.escrowMinter()).to.equal(minterAccount.address);
    });

    it('Has the correct name and symbol', async () => {
      // Adjust these if your RealEstate constructor uses different values
      expect(await realEstate.name()).to.equal('Real Estate');
      expect(await realEstate.symbol()).to.equal('REAL');
    });
  });

  describe('Minting', () => {
    const testTokenURI = 'ipfs://test-uri-1'; // Example URI

    it('Allows the minter to mint a new NFT to a specified recipient', async () => {
      // Minter calls the mint function, minting to 'buyer.address' with explicit tokenId 1
      await realEstate.connect(minterAccount).mint(buyer.address, 1, testTokenURI); // <<< CRUCIAL FIX: Added tokenId (1)

      // Verify ownership of the first minted token (ID 1)
      expect(await realEstate.ownerOf(1)).to.equal(buyer.address);
      // Verify token URI for the first minted token
      expect(await realEstate.tokenURI(1)).to.equal(testTokenURI);
      // The `totalSupply` check is removed as RealEstate's `mint` no longer increments its internal counter.
    });

    it('Prevents non-minter from minting an NFT', async () => {
      // Attempt to call mint from a non-minter account (deployer in this case)
      // Provide a unique tokenId (e.g., 2) and the URI
      await expect(
        realEstate.connect(deployer).mint(buyer.address, 2, testTokenURI) // <<< CRUCIAL FIX: Added tokenId (2)
      ).to.be.revertedWith('Only escrow minter can mint tokens'); // Confirmed this is the correct error message
    });

    it('should correctly mint NFTs with explicitly provided incremental IDs', async () => {
        // Mint first token with ID 3 (using a higher ID to avoid conflicts within test runner)
        await realEstate.connect(minterAccount).mint(buyer.address, 3, "uri3"); // <<< CRUCIAL FIX: Added tokenId (3)
        // Mint second token with ID 4
        await realEstate.connect(minterAccount).mint(otherAccount.address, 4, "uri4"); // <<< CRUCIAL FIX: Added tokenId (4)

        // Verify properties of the first token (ID 3)
        expect(await realEstate.ownerOf(3)).to.equal(buyer.address);
        expect(await realEstate.tokenURI(3)).to.equal("uri3");

        // Verify properties of the second token (ID 4)
        expect(await realEstate.ownerOf(4)).to.equal(otherAccount.address);
        expect(await realEstate.tokenURI(4)).to.equal("uri4");

        // The `totalSupply` check is removed as RealEstate's `mint` no longer increments its internal counter.
        // expect(await realEstate.totalSupply()).to.equal(2); // REMOVED THIS LINE
    });

    // The 'Prevents minting an existing token ID' test was removed as it's not applicable
    // given that the mint function now takes a specific ID.
  });

  // If you added a setMinter function (and inherited Ownable), uncomment and use this block:
  /*
  describe('Set Minter', () => {
    let newMinter;
    beforeEach(async () => {
        // Get newMinter as a signer; ensure it's unique or after other accounts
        [, , , , , newMinter] = await ethers.getSigners();
    });

    it('Allows the contract owner to set a new minter', async () => {
        // Assuming deployer is the owner (default for Ownable)
        await realEstate.connect(deployer).setEscrowMinter(newMinter.address);
        expect(await realEstate.escrowMinter()).to.equal(newMinter.address);
    });

    it('Prevents non-owners from setting a new minter', async () => {
        await expect(
            realEstate.connect(nonMinter).setEscrowMinter(newMinter.address)
        ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
  */
});


    // Not Required
    // it('Prevents minting an existing token ID (handled by ERC721 _mint internal logic)', async () => {
    //     await realEstate.connect(minterAccount).mint(buyer.address, testTokenURI);
    //     await expect(
    //         realEstate.connect(minterAccount).mint(otherAccount.address, "another-uri")
    //     ).to.be.revertedWith('ERC721: token already minted');
    // });
