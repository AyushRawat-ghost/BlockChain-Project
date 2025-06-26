const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    // Correctly define all signer accounts
    let deployer, buyer, seller, inspector, lender;
    let realEstate, escrow;
    
    // Correctly define constants in the scope of the tests
    const NFT_ID = 1;
    const TOKEN_URI = "https://ipfs.io/ipfs/test-uri-for-nft";
    const PURCHASE_PRICE = tokens(10);
    const ESCROW_AMOUNT = tokens(5);

    beforeEach(async () => {
        // Setup accounts
        [deployer, buyer, seller, inspector, lender] = await ethers.getSigners();

        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(
            ethers.constants.AddressZero,
            inspector.address,
            lender.address
        );
        await escrow.deployed();

        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy(escrow.address);
        await realEstate.deployed();

        let transaction = await escrow.connect(deployer).setRealEstateAddress(realEstate.address);
        await transaction.wait();
        
    });

    describe('Deployment', () => {
        it('should return the correct RealEstate contract address', async () => {
            expect(await escrow.realEstate()).to.be.equal(realEstate.address);
        });

        it('should return the correct inspector address', async () => {
            const result = await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        });

        it('should return the correct lender address', async () => {
            const result = await escrow.lender();
            expect(result).to.be.equal(lender.address);
        });

        it('should initialize property status for a non-existent token as PROPOSED (0)', async () => {
            // Note: NFT_ID must be defined outside the beforeEach block.
            expect(await escrow.propertyStatus(NFT_ID)).to.be.equal(0);
        });

    });

        describe('Proposing a Listing', () => {
        let transaction;
        const LISTING_ID = 1;

        it('should allow anyone to propose a listing', async () => {
            transaction = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            await transaction.wait();

            // Verify that the seller for the listing ID is recorded
            expect(await escrow.sellers(LISTING_ID)).to.equal(seller.address);
            // Verify that the property status is updated to PENDING_INSPECTION
            expect(await escrow.propertyStatus(LISTING_ID)).to.equal(1); // 1 = PENDING_INSPECTION
            // Verify that the purchase price is recorded
            expect(await escrow.purchasePrice(LISTING_ID)).to.equal(PURCHASE_PRICE);
        });

        it('should emit a ProposedListing event', async () => {
            await expect(escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE))
                .to.emit(escrow, 'ProposedListing')
                .withArgs(
                    LISTING_ID,
                    seller.address,
                    PURCHASE_PRICE
                );
        });
    });

    describe('Verifying a Listing', () => {
        let transaction;
        const LISTING_ID = 1;
        const NFT_ID = 1;

        beforeEach(async () => {
            // First, propose the listing
            transaction = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            await transaction.wait();
        });

        it('should allow the inspector to verify a pending listing', async () => {
            // Inspector verifies the listing, which should trigger the mint
            transaction = await escrow.connect(inspector).verifyListing(LISTING_ID, TOKEN_URI);
            await transaction.wait();

            // Verify that the NFT has been minted and is owned by the seller
            expect(await realEstate.ownerOf(NFT_ID)).to.equal(seller.address);
            // Verify that the token URI is set correctly
            expect(await realEstate.tokenURI(NFT_ID)).to.equal(TOKEN_URI);
            // Verify that the property status is updated to VERIFIED
            expect(await escrow.propertyStatus(LISTING_ID)).to.equal(2); // 2 = VERIFIED
            // Verify that isListed is set to true
            expect(await escrow.isListed(LISTING_ID)).to.be.true;
        });

        it('should emit a ListingVerified event', async () => {
            await expect(escrow.connect(inspector).verifyListing(LISTING_ID, TOKEN_URI))
                .to.emit(escrow, 'ListingVerified')
                .withArgs(
                    NFT_ID,
                    inspector.address,
                    seller.address,
                    TOKEN_URI
                );
        });

        it('should prevent a non-inspector from verifying', async () => {
            await expect(escrow.connect(seller).verifyListing(LISTING_ID, TOKEN_URI))
                .to.be.revertedWith('Only inspector can call this method');
        });

        it('should prevent verifying a non-pending listing', async () => {
            // Revert with verification from non-pending status
            await expect(escrow.connect(inspector).verifyListing(LISTING_ID + 1, TOKEN_URI))
                .to.be.revertedWith('Property not pending inspection');
        });
    });

    describe('Rejecting a Listing', () => {
        let transaction;
        const LISTING_ID = 1;

        beforeEach(async () => {
            // First, propose the listing
            transaction = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            await transaction.wait();
        });

        it('should allow the inspector to reject a pending listing', async () => {
            transaction = await escrow.connect(inspector).rejectListing(LISTING_ID);
            await transaction.wait();

            // Verify that the property status is updated to REJECTED
            expect(await escrow.propertyStatus(LISTING_ID)).to.equal(3); // 3 = REJECTED
        });

        it('should emit a ListingRejected event', async () => {
            await expect(escrow.connect(inspector).rejectListing(LISTING_ID))
                .to.emit(escrow, 'ListingRejected')
                .withArgs(
                    LISTING_ID,
                    inspector.address
                );
        });

        it('should prevent a non-inspector from rejecting', async () => {
            await expect(escrow.connect(seller).rejectListing(LISTING_ID))
                .to.be.revertedWith('Only inspector can call this method');
        });

        it('should prevent rejecting a non-pending listing', async () => {
            // Verify the listing first to move it out of PENDING_INSPECTION
            await escrow.connect(inspector).verifyListing(LISTING_ID, TOKEN_URI);
            // Now, try to reject it
            await expect(escrow.connect(inspector).rejectListing(LISTING_ID))
                .to.be.revertedWith('Property not pending inspection');
        });
    });
});





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
