// test/RealEstateMinter.test.js

const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('RealEstate Minter Role', () => {
  let realEstate;
  let deployer;
  let minterAccount;
  let nonMinter;
  let buyer;

  beforeEach(async () => {
    [deployer, minterAccount, nonMinter, buyer,otherAccount] = await ethers.getSigners();

    const RealEstate = await ethers.getContractFactory('RealEstate');
    realEstate = await RealEstate.deploy(minterAccount.address); 
    await realEstate.deployed();
  });

  describe('Deployment', () => {
    it('Sets the correct minter address', async () => {
      expect(await realEstate.escrowMinter()).to.equal(minterAccount.address);
    });

    it('Has the correct name and symbol', async () => {
      expect(await realEstate.name()).to.equal('Real Estate'); 
      expect(await realEstate.symbol()).to.equal('REAL');     
    });
  });

  describe('Minting', () => {
    const testTokenURI = 'ipfs://test-uri-1'; 

    it('Allows the minter to mint a new NFT to a specified recipient', async () => {
      await realEstate.connect(minterAccount).mint(buyer.address, testTokenURI);
      expect(await realEstate.ownerOf(1)).to.equal(buyer.address);
      expect(await realEstate.tokenURI(1)).to.equal(testTokenURI);
      expect(await realEstate.totalSupply()).to.equal(1);
    });

    it('Prevents non-minter from minting an NFT', async () => {
      await expect(
        realEstate.connect(deployer).mint(buyer.address, testTokenURI)
      ).to.be.revertedWith('Only escrow minter can mint tokens');
    });

    it('Increments tokenId correctly for multiple mints', async () => {
        await realEstate.connect(minterAccount).mint(buyer.address, "uri1");
        await realEstate.connect(minterAccount).mint(otherAccount.address, "uri2");

        // Verify properties of the first token
        expect(await realEstate.ownerOf(1)).to.equal(buyer.address);
        expect(await realEstate.tokenURI(1)).to.equal("uri1");

        // Verify properties of the second token
        expect(await realEstate.ownerOf(2)).to.equal(otherAccount.address);
        expect(await realEstate.tokenURI(2)).to.equal("uri2");

        // Verify total supply
        expect(await realEstate.totalSupply()).to.equal(2);
    });

    // Not Required
    // it('Prevents minting an existing token ID (handled by ERC721 _mint internal logic)', async () => {
    //     await realEstate.connect(minterAccount).mint(buyer.address, testTokenURI);
    //     await expect(
    //         realEstate.connect(minterAccount).mint(otherAccount.address, "another-uri")
    //     ).to.be.revertedWith('ERC721: token already minted');
    // });
  })
});