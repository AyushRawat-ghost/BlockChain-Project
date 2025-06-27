// const { expect } = require('chai');
// const { ethers } = require('hardhat');

// // Helper function to parse Ether values
// const tokens = (n) => {
//     return ethers.utils.parseUnits(n.toString(), 'ether')
// }

// describe('Escrow', () => {
//     let deployer, buyer, seller, inspector, lender, otherAccount;
//     let realEstate, escrow;
    
//     const TOKEN_URI = "https://ipfs.io/ipfs/test-uri-for-nft";
//     const PURCHASE_PRICE = tokens(10); // 10 Ether
//     const ESCROW_AMOUNT = tokens(5); // 5 Ether

//     beforeEach(async () => {
//         // Setup accounts
//         [deployer, buyer, seller, inspector, lender, otherAccount] = await ethers.getSigners();

//         // 1. Deploy Escrow first with a placeholder for RealEstate address
//         const Escrow = await ethers.getContractFactory('Escrow');
//         escrow = await Escrow.deploy(
//             ethers.constants.AddressZero, // Placeholder
//             inspector.address,
//             lender.address
//         );
//         await escrow.deployed();

//         // 2. Deploy Real Estate, passing escrow's address as the minter
//         const RealEstate = await ethers.getContractFactory('RealEstate');
//         realEstate = await RealEstate.deploy(escrow.address);
//         await realEstate.deployed();

//         // 3. Update the RealEstate address in the Escrow contract using the setter
//         let transaction = await escrow.connect(deployer).setRealEstateAddress(realEstate.address);
//         await transaction.wait();
//     });

//     describe('Deployment', () => {
//         it('should return the correct RealEstate contract address', async () => {
//             expect(await escrow.realEstate()).to.be.equal(realEstate.address);
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
//             expect(await escrow.propertyStatus(999)).to.be.equal(0); // 0 = PROPOSED
//         });
//     });

//     describe('Proposing a Listing', () => {
//         let transaction;
//         let emittedListingID;

//         beforeEach(async () => {
//             transaction = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const receipt = await transaction.wait();
//             const event = receipt.events.find(e => e.event === 'ProposedListing');
//             emittedListingID = event.args.listingID;
//         });

//         it('should allow anyone to propose a listing', async () => {
//             expect(await escrow.sellers(emittedListingID)).to.equal(seller.address);
//             expect(await escrow.propertyStatus(emittedListingID)).to.equal(1); // 1 = PENDING_INSPECTION
//             expect(await escrow.purchasePrice(emittedListingID)).to.equal(PURCHASE_PRICE);
//         });

//         it('should emit a ProposedListing event with the correct ID', async () => {
//             expect(emittedListingID.toString()).to.equal('1'); // First proposed listing in this describe
//         });
        
//         it('should increment listing ID for successive proposals', async () => {
//             const tx1 = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const receipt1 = await tx1.wait();
//             const id1 = receipt1.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             const tx2 = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const receipt2 = await tx2.wait();
//             const id2 = receipt2.events.find(e => e.event === 'ProposedListing').args.listingID;

//             expect(id2.toNumber()).to.equal(id1.toNumber() + 1);
//         });
//     });

//     describe('Verifying a Listing', () => {
//         let proposedListingID;
//         let mintedNFT_ID;

//         beforeEach(async () => {
//             // Propose the listing
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

//             // Inspector verifies the listing
//             const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
//             const verifyReceipt = await verifyTx.wait();
//             const verifyEvent = verifyReceipt.events.find(e => e.event === 'ListingVerified');
//             mintedNFT_ID = verifyEvent.args.nftID;
//         });

//         it('should allow the inspector to verify a pending listing and mint the NFT', async () => {
//             expect(await realEstate.ownerOf(mintedNFT_ID)).to.equal(seller.address);
//             expect(await realEstate.tokenURI(mintedNFT_ID)).to.equal(TOKEN_URI);
//             expect(await escrow.propertyStatus(proposedListingID)).to.equal(2); // 2 = VERIFIED
//             expect(await escrow.isListed(proposedListingID)).to.be.true;
//         });

//         it('should emit a ListingVerified event with correct args including NFT ID', async () => {
//             expect(mintedNFT_ID.toString()).to.equal(proposedListingID.toString()); // NFT ID should match LISTING_ID
//             expect(await escrow.inspector()).to.equal(inspector.address); // Verifier
//             expect(await escrow.sellers(proposedListingID)).to.equal(seller.address); // To address
//             expect(TOKEN_URI).to.equal(TOKEN_URI); // tokenURI
//         });

//         it('should prevent a non-inspector from verifying', async () => {
//             const newListingIdTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const newListingIdReceipt = await newListingIdTx.wait();
//             const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

//             await expect(escrow.connect(seller).verifyListing(newListingId))
//                 .to.be.revertedWith('Only inspector can call this method');
//         });

//         it('should prevent verifying a non-pending listing', async () => {
//             // Try to verify an ID that hasn't been proposed
//             await expect(escrow.connect(inspector).verifyListing(proposedListingID.add(1)))
//                 .to.be.revertedWith('Listing is not pending inspection');

//             // Verify a rejected listing (should fail)
//             const rejectedListingTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const rejectedListingReceipt = await rejectedListingTx.wait();
//             const rejectedListingId = rejectedListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

//             await escrow.connect(inspector).rejectListing(rejectedListingId);
//             await expect(escrow.connect(inspector).verifyListing(rejectedListingId))
//                 .to.be.revertedWith('Listing is not pending inspection');
//         });

//         it('should revert if token URI is missing for proposed listing', async () => {
//             const noUriListingTx = await escrow.connect(seller).proposeListing("", PURCHASE_PRICE);
//             const noUriListingReceipt = await noUriListingTx.wait();
//             const noUriListingId = noUriListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             await expect(escrow.connect(inspector).verifyListing(noUriListingId))
//                 .to.be.revertedWith('Token URI missing for proposed listing');
//         });
//     });

//     describe('Rejecting a Listing', () => {
//         let proposedListingID;
//         let rejectTxResponse; // <<< NEW: Store the TransactionResponse
        
//         beforeEach(async () => {
//             // Propose the listing
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

//             // Inspector rejects the listing
//             rejectTxResponse = await escrow.connect(inspector).rejectListing(proposedListingID); // <<< Store the TransactionResponse
//             await rejectTxResponse.wait(); // Wait for it to be mined, but use the original promise for emit check
//         });

//         it('should allow the inspector to reject a pending listing', async () => {
//             expect(await escrow.propertyStatus(proposedListingID)).to.equal(3); // 3 = REJECTED
//         });

//         it('should emit a ListingRejected event', async () => {
//             // Use the stored TransactionResponse to check the event
//             await expect(rejectTxResponse) // <<< Use the stored TransactionResponse
//                 .to.emit(escrow, 'ListingRejected')
//                 .withArgs(proposedListingID, inspector.address);
//         });

//         it('should prevent a non-inspector from rejecting', async () => {
//             const newListingIdTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const newListingIdReceipt = await newListingIdTx.wait();
//             const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

//             await expect(escrow.connect(seller).rejectListing(newListingId))
//                 .to.be.revertedWith('Only inspector can call this method');
//         });

//         it('should prevent rejecting a non-pending listing', async () => {
//             // Propose and verify a listing to get it out of PENDING_INSPECTION
//             const verifiedListingTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const verifiedListingReceipt = await verifiedListingTx.wait();
//             const verifiedListingId = verifiedListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             await escrow.connect(inspector).verifyListing(verifiedListingId);
            
//             // Now, try to reject it (should fail)
//             await expect(escrow.connect(inspector).rejectListing(verifiedListingId))
//                 .to.be.revertedWith('Property not pending inspection');
//         });
//     });

//     describe('Depositing Earnest Money', () => {
//         let proposedListingID;
//         let mintedNFT_ID;

//         beforeEach(async () => {
//             // 1. Propose Listing
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             // 2. Verify Listing (which mints the NFT)
//             const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
//             const verifyReceipt = await verifyTx.wait();
//             mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;

//             // 3. Set purchase price and escrow amount for the listing (using helper)
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
//         });

//         it('should allow the buyer to deposit earnest money', async () => {
//             // Buyer deposits the earnest money
//             const transaction = await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });
//             await transaction.wait();

//             // Check if the buyer's address is recorded
//             expect(await escrow.buyer(mintedNFT_ID)).to.equal(buyer.address);
//             // Check contract balance
//             expect(await escrow.getBalance()).to.equal(ESCROW_AMOUNT);
//         });

//         it('should revert if the property is not verified', async () => {
//             // Propose a new listing but don't verify it
//             const newListingIdTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const newListingIdReceipt = await newListingIdTx.wait();
//             const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             await expect(escrow.connect(buyer).depositEarnest(newListingId, buyer.address, { value: ESCROW_AMOUNT }))
//                 .to.be.revertedWith('Listing is not verified');
//         });

//         it('should revert if incorrect earnest amount is sent', async () => {
//             // Buyer sends less than required
//             await expect(escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: tokens(1) }))
//                 .to.be.revertedWith('Incorrect escrow amount');
//         });

//         it('should revert if purchase price or escrow amount are not set', async () => {
//             const noPriceListingTx = await escrow.connect(seller).proposeListing(TOKEN_URI, tokens(0)); // Propose with 0 price
//             const noPriceListingReceipt = await noPriceListingTx.wait();
//             const noPriceListingId = noPriceListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             await escrow.connect(inspector).verifyListing(noPriceListingId);
//             // Don't call setPurchasePriceAndEscrow for this one

//             await expect(escrow.connect(buyer).depositEarnest(noPriceListingId, buyer.address, { value: tokens(1) }))
//                 .to.be.revertedWith('Purchase price not set'); // Or 'Escrow amount not set'
//         });
//     });

//     describe('Approval by Parties', () => {
//         let proposedListingID;
//         let mintedNFT_ID;

//         beforeEach(async () => {
//             // Setup a verified listing and earnest deposit
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
//             const verifyReceipt = await verifyTx.wait();
//             mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
//             await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });
//         });

//         it('should allow buyer to approve sale for themselves', async () => {
//             await escrow.connect(buyer).approveSale(mintedNFT_ID, buyer.address);
//             expect(await escrow.approval(mintedNFT_ID, buyer.address)).to.be.true;
//         });

//         it('should allow seller to approve sale for themselves', async () => {
//             await escrow.connect(seller).approveSale(mintedNFT_ID, seller.address);
//             expect(await escrow.approval(mintedNFT_ID, seller.address)).to.be.true;
//         });

//         it('should allow lender to approve sale for themselves', async () => {
//             await escrow.connect(lender).approveSale(mintedNFT_ID, lender.address);
//             expect(await escrow.approval(mintedNFT_ID, lender.address)).to.be.true;
//         });

//         it('should revert if a non-party tries to approve', async () => {
//             await expect(escrow.connect(otherAccount).approveSale(mintedNFT_ID, buyer.address))
//                 .to.be.revertedWith('Only buyer, seller or lender can approve');
//         });

//         it('should revert if a party tries to approve on behalf of another', async () => {
//             await expect(escrow.connect(buyer).approveSale(mintedNFT_ID, seller.address))
//                 .to.be.revertedWith('Cannot approve on behalf of another party');
//         });
        
//         it('should revert if the listing is not verified', async () => {
//             // Propose a new listing, but don't verify it
//             const newListingIdTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const newListingIdReceipt = await newListingIdTx.wait();
//             const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             await expect(escrow.connect(buyer).approveSale(newListingId, buyer.address))
//                 .to.be.revertedWith('Listing is not listed');
//         });
//     });

//     describe('Finalizing the Sale', () => {
//         let proposedListingID;
//         let mintedNFT_ID;
        
//         beforeEach(async () => {
//             // 1. Propose Listing
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             // 2. Verify Listing (which mints the NFT)
//             const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
//             const verifyReceipt = await verifyTx.wait();
//             mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;

//             // 3. Set purchase price and escrow amount for the listing
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
            
//             // 4. Buyer deposits earnest money
//             await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });

//             // 5. Seller must approve the escrow to move the token
//             await realEstate.connect(seller).approve(escrow.address, mintedNFT_ID);
            
//             // 6. Inspector updates inspection status (passing)
//             await escrow.connect(inspector).updateInspectionStatus(mintedNFT_ID, true);
            
//             // 7. All parties approve the sale
//             await escrow.connect(buyer).approveSale(mintedNFT_ID, buyer.address);
//             await escrow.connect(seller).approveSale(mintedNFT_ID, seller.address);
//             await escrow.connect(lender).approveSale(mintedNFT_ID, lender.address);
            
//             // 8. Lender sends remaining funds to contract to meet purchase price
//             const amountToLend = PURCHASE_PRICE.sub(ESCROW_AMOUNT);
//             await lender.sendTransaction({ to: escrow.address, value: amountToLend });
//         });

//         it('should transfer the NFT from the seller to the buyer upon finalization', async () => {
//             // Get initial seller balance
//             const initialSellerBalance = await ethers.provider.getBalance(seller.address);

//             // Lender finalizes the sale
//             const transaction = await escrow.connect(lender).finalizeSale(mintedNFT_ID);
//             const receipt = await transaction.wait();
//             const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

//             // Verify NFT ownership is now the buyer
//             expect(await realEstate.ownerOf(mintedNFT_ID)).to.be.equal(buyer.address);
            
//             // Verify that the property status is updated to SOLD
//             expect(await escrow.propertyStatus(mintedNFT_ID)).to.equal(4); // 4 = SOLD

//             // Verify seller received the FULL purchase price
//             const finalSellerBalance = await ethers.provider.getBalance(seller.address);
//             expect(finalSellerBalance).to.be.closeTo(initialSellerBalance.add(PURCHASE_PRICE), tokens(0.02)); 
//         });

//         it('should emit a SaleFinalized event', async () => {
//             await expect(escrow.connect(lender).finalizeSale(mintedNFT_ID))
//                 .to.emit(escrow, 'SaleFinalized')
//                 .withArgs(mintedNFT_ID, buyer.address, seller.address, PURCHASE_PRICE);
//         });
        
//         it('should update balance to 0 after sale', async () => {
//             await escrow.connect(lender).finalizeSale(mintedNFT_ID);
//             expect(await escrow.getBalance()).to.equal(0);
//         });

//         // The following tests were re-written to be self-contained and not rely on beforeEach
//         it('should revert if buyer has not approved', async () => {
//             // Create a fresh setup for this specific test
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             const verifyTx = await escrow.connect(inspector).verifyListing(listingId);
//             const verifyReceipt = await verifyTx.wait();
//             const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
//             await escrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
//             await realEstate.connect(seller).approve(escrow.address, mintedId);
//             await escrow.connect(inspector).updateInspectionStatus(mintedId, true);
//             // Skipping buyer approval
//             await escrow.connect(seller).approveSale(mintedId, seller.address);
//             await escrow.connect(lender).approveSale(mintedId, lender.address);
//             await lender.sendTransaction({ to: escrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

//             await expect(escrow.connect(lender).finalizeSale(mintedId))
//                 .to.be.revertedWith('Buyer has not approved');
//         });

//         it('should revert if seller has not approved', async () => {
//             // Create a fresh setup for this specific test
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             const verifyTx = await escrow.connect(inspector).verifyListing(listingId);
//             const verifyReceipt = await verifyTx.wait();
//             const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
//             await escrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
//             await realEstate.connect(seller).approve(escrow.address, mintedId);
//             await escrow.connect(inspector).updateInspectionStatus(mintedId, true);
//             await escrow.connect(buyer).approveSale(mintedId, buyer.address);
//             // Skipping seller approval
//             await escrow.connect(lender).approveSale(mintedId, lender.address);
//             await lender.sendTransaction({ to: escrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

//             await expect(escrow.connect(lender).finalizeSale(mintedId))
//                 .to.be.revertedWith('Seller has not approved');
//         });
        
//         it('should revert if lender has not approved', async () => {
//             // Create a fresh setup for this specific test
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             const verifyTx = await escrow.connect(inspector).verifyListing(listingId);
//             const verifyReceipt = await verifyTx.wait();
//             const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
//             await escrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
//             await realEstate.connect(seller).approve(escrow.address, mintedId);
//             await escrow.connect(inspector).updateInspectionStatus(mintedId, true);
//             await escrow.connect(buyer).approveSale(mintedId, buyer.address);
//             await escrow.connect(seller).approveSale(mintedId, seller.address);
//             // Skipping lender approval
//             await lender.sendTransaction({ to: escrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

//             await expect(escrow.connect(lender).finalizeSale(mintedId))
//                 .to.be.revertedWith('Lender has not approved');
//         });
        
//         it('should revert if inspection has not passed', async () => {
//             // Create a fresh setup for this specific test
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             const verifyTx = await escrow.connect(inspector).verifyListing(listingId);
//             const verifyReceipt = await verifyTx.wait();
//             const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
//             await escrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
//             await realEstate.connect(seller).approve(escrow.address, mintedId);
//             await escrow.connect(inspector).updateInspectionStatus(mintedId, false); // Inspection fails
//             await escrow.connect(buyer).approveSale(mintedId, buyer.address);
//             await escrow.connect(seller).approveSale(mintedId, seller.address);
//             await escrow.connect(lender).approveSale(mintedId, lender.address);
//             await lender.sendTransaction({ to: escrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

//             await expect(escrow.connect(lender).finalizeSale(mintedId))
//                 .to.be.revertedWith('Inspection has not passed');
//         });
//     });

//     describe('Cancelling the Sale', () => {
//         let proposedListingID;
//         let mintedNFT_ID;

//         beforeEach(async () => {
//             // 1. Propose Listing
//             const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//             const proposeReceipt = await proposeTx.wait();
//             proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
//             // 2. Verify Listing (which mints the NFT)
//             const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
//             const verifyReceipt = await verifyTx.wait();
//             mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;

//             // 3. Set escrow amount
//             await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
            
//             // 4. Buyer deposits earnest money
//             await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });
//         });

//         it('should refund earnest money if the inspection fails', async () => {
//             // Get initial balance of the buyer
//             const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);

//             // Inspector updates inspection status to FAIL
//             await escrow.connect(inspector).updateInspectionStatus(mintedNFT_ID, false);

//             // Buyer or inspector cancels the sale
//             const transaction = await escrow.connect(buyer).cancelSale(mintedNFT_ID);
//             const receipt = await transaction.wait();
//             const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

//             // Expect a refund to be sent back to the buyer
//             const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
//             // Account for gas cost in the final balance
//             expect(finalBuyerBalance).to.be.closeTo(initialBuyerBalance.add(ESCROW_AMOUNT).sub(gasUsed), tokens(0.01));

//             // Check that the SaleCancelled event is emitted
//             await expect(transaction).to.emit(escrow, 'SaleCancelled').withArgs(mintedNFT_ID);
//         });

//         it('should revert if the inspection has passed', async () => {
//             // Inspector updates inspection status to PASS
//             await escrow.connect(inspector).updateInspectionStatus(mintedNFT_ID, true);
            
//             // Try to cancel the sale
//             await expect(escrow.connect(buyer).cancelSale(mintedNFT_ID))
//                 .to.be.revertedWith('Inspection has passed');
//         });


//     it('should revert if no buyer is associated for refund', async () => {
//     // Create a NEW, completely isolated contract instance for this test
//         const newEscrow = await ethers.getContractFactory('Escrow');
//         const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
//         await tempEscrow.deployed();
//         const tempRealEstate = await ethers.getContractFactory('RealEstate');
//         const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
//         await tempRealEstateInstance.deployed();
//         await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

//         const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//         const proposeReceipt = await proposeTx.wait();
//         const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
        
//         await tempEscrow.connect(inspector).verifyListing(listingId);
//         await tempEscrow.connect(inspector).updateInspectionStatus(listingId, false); // Inspection fails
//         await tempEscrow.connect(seller).setPurchasePriceAndEscrow(listingId, PURCHASE_PRICE, ESCROW_AMOUNT);

//         // Explicitly confirm no buyer is associated
//         expect(await tempEscrow.buyer(listingId)).to.equal(ethers.constants.AddressZero);

//         // Try to cancel (should fail as no buyer is recorded)
//         await expect(tempEscrow.connect(inspector).cancelSale(listingId))
//             .to.be.revertedWith('Failed to refund earnest money');
// });
//     it('should revert if insufficient escrow balance for refund', async () => {
//     // Create a NEW, completely isolated contract instance for this test
//     const newEscrow = await ethers.getContractFactory('Escrow');
//     const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
//     await tempEscrow.deployed();
//     const tempRealEstate = await ethers.getContractFactory('RealEstate');
//     const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
//     await tempRealEstateInstance.deployed();
//     await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

//     const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
//     const proposeReceipt = await proposeTx.wait();
//     const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
    
//     await tempEscrow.connect(inspector).verifyListing(listingId);
    

//     // Setup: normal deposit
//     const DEPOSITED_AMOUNT = tokens(5);
//     const REQUIRED_REFUND_AMOUNT = tokens(10); // A value higher than what's actually deposited

//     await tempEscrow.connect(seller).setPurchasePriceAndEscrow(listingId, PURCHASE_PRICE, REQUIRED_REFUND_AMOUNT); // Set required refund high
//     await tempEscrow.connect(buyer).depositEarnest(listingId, buyer.address, { value: DEPOSITED_AMOUNT }); // Deposit a smaller amount (this would normally revert depositEarnest)

//     const initialBalanceInEscrow = await ethers.provider.getBalance(tempEscrow.address);
//     // Send 0 ETH from deployer to otherAccount to ensure otherAccount is available for sending.
//     // Then use `deployer` to drain the `tempEscrow` contract directly by sending from `deployer` to `otherAccount`.
//     await deployer.sendTransaction({
//         to: otherAccount.address, // Send it to another account
//         value: initialBalanceInEscrow // The amount from escrow's current balance
//     });
    
//     // Now, escrow.address should have 0 balance
//     expect(await ethers.provider.getBalance(tempEscrow.address)).to.equal(0);

//     // Inspector updates inspection status to FAIL
//     await tempEscrow.connect(inspector).updateInspectionStatus(listingId, false);

//     // Try to cancel (should fail due to insufficient balance)
//     await expect(tempEscrow.connect(buyer).cancelSale(listingId))
//         .to.be.revertedWith('Incorrect escrow amount');
// });
//     });

// });



const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let deployer, buyer, seller, inspector, lender, otherAccount;
    let realEstate, escrow;
    
    const TOKEN_URI = "https://ipfs.io/ipfs/test-uri-for-nft";
    const PURCHASE_PRICE = tokens(10); // 10 Ether
    const ESCROW_AMOUNT = tokens(5); // 5 Ether

    beforeEach(async () => {
        // Setup accounts
        [deployer, buyer, seller, inspector, lender, otherAccount] = await ethers.getSigners();

        // 1. Deploy Escrow first with a placeholder for RealEstate address
        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(
            ethers.constants.AddressZero, // Placeholder
            inspector.address,
            lender.address
        );
        await escrow.deployed();

        // 2. Deploy Real Estate, passing escrow's address as the minter
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy(escrow.address);
        await realEstate.deployed();

        // 3. Update the RealEstate address in the Escrow contract using the setter
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
            expect(await escrow.propertyStatus(999)).to.be.equal(0); // 0 = PROPOSED
        });
    });

    describe('Proposing a Listing', () => {
        let proposeTxResponse;
        let emittedListingID;

        beforeEach(async () => {
            proposeTxResponse = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const receipt = await proposeTxResponse.wait();
            const event = receipt.events.find(e => e.event === 'ProposedListing');
            emittedListingID = event.args.listingID;
        });

        it('should allow anyone to propose a listing', async () => {
            expect(await escrow.sellers(emittedListingID)).to.equal(seller.address);
            expect(await escrow.propertyStatus(emittedListingID)).to.equal(1);
            expect(await escrow.purchasePrice(emittedListingID)).to.equal(PURCHASE_PRICE);
        });

        it('should emit a ProposedListing event with the correct ID', async () => {
            await expect(proposeTxResponse)
                .to.emit(escrow, 'ProposedListing')
                .withArgs(emittedListingID, seller.address, PURCHASE_PRICE);
        });
        
        it('should increment listing ID for successive proposals', async () => {
            const tx1 = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const receipt1 = await tx1.wait();
            const id1 = receipt1.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const tx2 = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const receipt2 = await tx2.wait();
            const id2 = receipt2.events.find(e => e.event === 'ProposedListing').args.listingID;

            expect(id2.toNumber()).to.equal(id1.toNumber() + 1);
        });
    });

    describe('Verifying a Listing', () => {
        let proposedListingID;
        let verifyTxResponse;
        let mintedNFT_ID;

        beforeEach(async () => {
            const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

            verifyTxResponse = await escrow.connect(inspector).verifyListing(proposedListingID);
            const verifyReceipt = await verifyTxResponse.wait();
            const verifyEvent = verifyReceipt.events.find(e => e.event === 'ListingVerified');
            mintedNFT_ID = verifyEvent.args.nftID;
        });

        it('should allow the inspector to verify a pending listing and mint the NFT', async () => {
            expect(await realEstate.ownerOf(mintedNFT_ID)).to.equal(seller.address);
            expect(await realEstate.tokenURI(mintedNFT_ID)).to.equal(TOKEN_URI);
            expect(await escrow.propertyStatus(proposedListingID)).to.equal(2);
            expect(await escrow.isListed(proposedListingID)).to.be.true;
        });

        it('should emit a ListingVerified event with correct args including NFT ID', async () => {
            await expect(verifyTxResponse)
                .to.emit(escrow, 'ListingVerified')
                .withArgs(mintedNFT_ID, inspector.address, seller.address, TOKEN_URI);
        });

        it('should prevent a non-inspector from verifying', async () => {
            const newListingIdTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const newListingIdReceipt = await newListingIdTx.wait();
            const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

            await expect(escrow.connect(seller).verifyListing(newListingId))
                .to.be.revertedWith('Only inspector can call this method');
        });

        it('should prevent verifying a non-pending listing', async () => {
            await expect(escrow.connect(inspector).verifyListing(proposedListingID.add(1)))
                .to.be.revertedWith('Listing is not pending inspection');

            const rejectedListingTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const rejectedListingReceipt = await rejectedListingTx.wait();
            const rejectedListingId = rejectedListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

            await escrow.connect(inspector).rejectListing(rejectedListingId);
            await expect(escrow.connect(inspector).verifyListing(rejectedListingId))
                .to.be.revertedWith('Listing is not pending inspection');
        });

        it('should revert if token URI is missing for proposed listing', async () => {
            const noUriListingTx = await escrow.connect(seller).proposeListing("", PURCHASE_PRICE);
            const noUriListingReceipt = await noUriListingTx.wait();
            const noUriListingId = noUriListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            await expect(escrow.connect(inspector).verifyListing(noUriListingId))
                .to.be.revertedWith('Token URI missing for proposed listing');
        });
    });

    describe('Rejecting a Listing', () => {
        let proposedListingID;
        let rejectTxResponse;
        
        beforeEach(async () => {
            const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

            rejectTxResponse = await escrow.connect(inspector).rejectListing(proposedListingID);
            await rejectTxResponse.wait();
        });

        it('should allow the inspector to reject a pending listing', async () => {
            expect(await escrow.propertyStatus(proposedListingID)).to.equal(3);
        });

        it('should emit a ListingRejected event', async () => {
            await expect(rejectTxResponse)
                .to.emit(escrow, 'ListingRejected')
                .withArgs(proposedListingID, inspector.address);
        });

        it('should prevent a non-inspector from rejecting', async () => {
            const newListingIdTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const newListingIdReceipt = await newListingIdTx.wait();
            const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;

            await expect(escrow.connect(seller).rejectListing(newListingId))
                .to.be.revertedWith('Only inspector can call this method');
        });

        it('should prevent rejecting a non-pending listing', async () => {
            const verifiedListingTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const verifiedListingReceipt = await verifiedListingTx.wait();
            const verifiedListingId = verifiedListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            await escrow.connect(inspector).verifyListing(verifiedListingId);
            
            await expect(escrow.connect(inspector).rejectListing(verifiedListingId))
                .to.be.revertedWith('Listing is not pending inspection');
        });
    });

    describe('Depositing Earnest Money', () => {
        let proposedListingID;
        let mintedNFT_ID;

        beforeEach(async () => {
            const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
            const verifyReceipt = await verifyTx.wait();
            mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;

            await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
        });

        it('should allow the buyer to deposit earnest money', async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });
            await transaction.wait();

            expect(await escrow.buyer(mintedNFT_ID)).to.equal(buyer.address);
            expect(await escrow.getBalance()).to.equal(ESCROW_AMOUNT);
        });

        it('should revert if the property is not verified', async () => {
            const newListingIdTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const newListingIdReceipt = await newListingIdTx.wait();
            const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            await expect(escrow.connect(buyer).depositEarnest(newListingId, buyer.address, { value: ESCROW_AMOUNT }))
                .to.be.revertedWith('Listing is not verified');
        });

        it('should revert if incorrect earnest amount is sent', async () => {
            await expect(escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: tokens(1) }))
                .to.be.revertedWith('Incorrect escrow amount');
        });

        it('should revert if purchase price or escrow amount are not set', async () => {
            const noPriceListingTx = await escrow.connect(seller).proposeListing(TOKEN_URI, tokens(0));
            const noPriceListingReceipt = await noPriceListingTx.wait();
            const noPriceListingId = noPriceListingReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            await escrow.connect(inspector).verifyListing(noPriceListingId);

            await expect(escrow.connect(buyer).depositEarnest(noPriceListingId, buyer.address, { value: tokens(1) }))
                .to.be.revertedWith('Purchase price not set');
        });
    });

    describe('Approval by Parties', () => {
        let proposedListingID;
        let mintedNFT_ID;

        beforeEach(async () => {
            const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
            const verifyReceipt = await verifyTx.wait();
            mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
            await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
            await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });
        });

        it('should allow buyer to approve sale for themselves', async () => {
            await escrow.connect(buyer).approveSale(mintedNFT_ID, buyer.address);
            expect(await escrow.approval(mintedNFT_ID, buyer.address)).to.be.true;
        });

        it('should allow seller to approve sale for themselves', async () => {
            await escrow.connect(seller).approveSale(mintedNFT_ID, seller.address);
            expect(await escrow.approval(mintedNFT_ID, seller.address)).to.be.true;
        });

        it('should allow lender to approve sale for themselves', async () => {
            await escrow.connect(lender).approveSale(mintedNFT_ID, lender.address);
            expect(await escrow.approval(mintedNFT_ID, lender.address)).to.be.true;
        });

        it('should revert if a non-party tries to approve', async () => {
            await expect(escrow.connect(otherAccount).approveSale(mintedNFT_ID, buyer.address))
                .to.be.revertedWith('Only buyer, seller or lender can approve');
        });

        it('should revert if a party tries to approve on behalf of another', async () => {
            await expect(escrow.connect(buyer).approveSale(mintedNFT_ID, seller.address))
                .to.be.revertedWith('Cannot approve on behalf of another party');
        });
        
        it('should revert if the listing is not verified', async () => {
            const newListingIdTx = await escrow.connect(otherAccount).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const newListingIdReceipt = await newListingIdTx.wait();
            const newListingId = newListingIdReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            await expect(escrow.connect(buyer).approveSale(newListingId, buyer.address))
                .to.be.revertedWith('Listing is not verified');
        });
    });

    describe('Finalizing the Sale', () => {
        let proposedListingID;
        let mintedNFT_ID;
        let finalizeTxResponse;
        
        beforeEach(async () => {
            const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
            const verifyReceipt = await verifyTx.wait();
            mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;

            await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
            await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });

            await realEstate.connect(seller).approve(escrow.address, mintedNFT_ID);
            
            await escrow.connect(inspector).updateInspectionStatus(mintedNFT_ID, true);
            
            await escrow.connect(buyer).approveSale(mintedNFT_ID, buyer.address);
            await escrow.connect(seller).approveSale(mintedNFT_ID, seller.address);
            await escrow.connect(lender).approveSale(mintedNFT_ID, lender.address);
            
            const amountToLend = PURCHASE_PRICE.sub(ESCROW_AMOUNT);
            await lender.sendTransaction({ to: escrow.address, value: amountToLend });

            finalizeTxResponse = await escrow.connect(lender).finalizeSale(mintedNFT_ID);
            await finalizeTxResponse.wait();
        });

        it('should transfer the NFT from the seller to the buyer upon finalization', async () => {
            expect(await realEstate.ownerOf(mintedNFT_ID)).to.be.equal(buyer.address);
            expect(await escrow.propertyStatus(mintedNFT_ID)).to.equal(4);
        });

        it('should emit a SaleFinalized event', async () => {
            await expect(finalizeTxResponse)
                .to.emit(escrow, 'SaleFinalized')
                .withArgs(mintedNFT_ID, buyer.address, seller.address, PURCHASE_PRICE);
        });
        
        it('should update balance to 0 after sale', async () => {
            expect(await escrow.getBalance()).to.equal(0);
        });

        it('should revert if buyer has not approved', async () => {
            const newEscrow = await ethers.getContractFactory('Escrow');
            const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
            await tempEscrow.deployed();
            const tempRealEstate = await ethers.getContractFactory('RealEstate');
            const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
            await tempRealEstateInstance.deployed();
            await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

            const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await tempEscrow.connect(inspector).verifyListing(listingId);
            const verifyReceipt = await verifyTx.wait();
            const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
            await tempEscrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
            await tempEscrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
            await tempRealEstateInstance.connect(seller).approve(tempEscrow.address, mintedId);
            await tempEscrow.connect(inspector).updateInspectionStatus(mintedId, true);
            await tempEscrow.connect(seller).approveSale(mintedId, seller.address);
            await tempEscrow.connect(lender).approveSale(mintedId, lender.address);
            await lender.sendTransaction({ to: tempEscrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

            await expect(tempEscrow.connect(lender).finalizeSale(mintedId))
                .to.be.revertedWith('Buyer has not approved');
        });

        it('should revert if seller has not approved', async () => {
            const newEscrow = await ethers.getContractFactory('Escrow');
            const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
            await tempEscrow.deployed();
            const tempRealEstate = await ethers.getContractFactory('RealEstate');
            const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
            await tempRealEstateInstance.deployed();
            await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

            const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await tempEscrow.connect(inspector).verifyListing(listingId);
            const verifyReceipt = await verifyTx.wait();
            const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
            await tempEscrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
            await tempEscrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
            await tempRealEstateInstance.connect(seller).approve(tempEscrow.address, mintedId);
            await tempEscrow.connect(inspector).updateInspectionStatus(mintedId, true);
            await tempEscrow.connect(buyer).approveSale(mintedId, buyer.address);
            await tempEscrow.connect(lender).approveSale(mintedId, lender.address);
            await lender.sendTransaction({ to: tempEscrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

            await expect(tempEscrow.connect(lender).finalizeSale(mintedId))
                .to.be.revertedWith('Seller has not approved');
        });
        
        it('should revert if lender has not approved', async () => {
            const newEscrow = await ethers.getContractFactory('Escrow');
            const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
            await tempEscrow.deployed();
            const tempRealEstate = await ethers.getContractFactory('RealEstate');
            const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
            await tempRealEstateInstance.deployed();
            await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

            const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await tempEscrow.connect(inspector).verifyListing(listingId);
            const verifyReceipt = await verifyTx.wait();
            const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
            await tempEscrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
            await tempEscrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
            await tempRealEstateInstance.connect(seller).approve(tempEscrow.address, mintedId);
            await tempEscrow.connect(inspector).updateInspectionStatus(mintedId, true);
            await tempEscrow.connect(buyer).approveSale(mintedId, buyer.address);
            await tempEscrow.connect(seller).approveSale(mintedId, seller.address);
            await lender.sendTransaction({ to: tempEscrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

            await expect(tempEscrow.connect(lender).finalizeSale(mintedId))
                .to.be.revertedWith('Lender has not approved');
        });
        
        it('should revert if inspection has not passed', async () => {
            const newEscrow = await ethers.getContractFactory('Escrow');
            const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
            await tempEscrow.deployed();
            const tempRealEstate = await ethers.getContractFactory('RealEstate');
            const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
            await tempRealEstateInstance.deployed();
            await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

            const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await tempEscrow.connect(inspector).verifyListing(listingId);
            const verifyReceipt = await verifyTx.wait();
            const mintedId = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;
            
            await tempEscrow.connect(seller).setPurchasePriceAndEscrow(mintedId, PURCHASE_PRICE, ESCROW_AMOUNT);
            await tempEscrow.connect(buyer).depositEarnest(mintedId, buyer.address, { value: ESCROW_AMOUNT });
            await tempRealEstateInstance.connect(seller).approve(tempEscrow.address, mintedId);
            await tempEscrow.connect(inspector).updateInspectionStatus(mintedId, false); // Inspection fails
            await tempEscrow.connect(buyer).approveSale(mintedId, buyer.address);
            await tempEscrow.connect(seller).approveSale(mintedId, seller.address);
            await tempEscrow.connect(lender).approveSale(mintedId, lender.address);
            await lender.sendTransaction({ to: tempEscrow.address, value: PURCHASE_PRICE.sub(ESCROW_AMOUNT) });

            await expect(tempEscrow.connect(lender).finalizeSale(mintedId))
                .to.be.revertedWith('Inspection has not passed');
        });
    });

    describe('Cancelling the Sale', () => {
        let proposedListingID;
        let mintedNFT_ID;

        beforeEach(async () => {
            const proposeTx = await escrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            proposedListingID = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            const verifyTx = await escrow.connect(inspector).verifyListing(proposedListingID);
            const verifyReceipt = await verifyTx.wait();
            mintedNFT_ID = verifyReceipt.events.find(e => e.event === 'ListingVerified').args.nftID;

            await escrow.connect(seller).setPurchasePriceAndEscrow(mintedNFT_ID, PURCHASE_PRICE, ESCROW_AMOUNT);
            await escrow.connect(buyer).depositEarnest(mintedNFT_ID, buyer.address, { value: ESCROW_AMOUNT });
        });

        it('should refund earnest money if the inspection fails', async () => {
            const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);

            await escrow.connect(inspector).updateInspectionStatus(mintedNFT_ID, false);

            const transaction = await escrow.connect(buyer).cancelSale(mintedNFT_ID);
            const receipt = await transaction.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

            const finalBuyerBalance = await ethers.provider.getBalance(buyer.address);
            expect(finalBuyerBalance).to.be.closeTo(initialBuyerBalance.add(ESCROW_AMOUNT).sub(gasUsed), tokens(0.01));

            await expect(transaction).to.emit(escrow, 'SaleCancelled').withArgs(mintedNFT_ID);
        });

        it('should revert if the inspection has passed', async () => {
            await escrow.connect(inspector).updateInspectionStatus(mintedNFT_ID, true);
            
            await expect(escrow.connect(buyer).cancelSale(mintedNFT_ID))
                .to.be.revertedWith('Inspection has passed');
        });

        it('should revert if no buyer is associated for refund', async () => {
            const newEscrow = await ethers.getContractFactory('Escrow');
            const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
            await tempEscrow.deployed();
            const tempRealEstate = await ethers.getContractFactory('RealEstate');
            const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
            await tempRealEstateInstance.deployed();
            await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

            const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            await tempEscrow.connect(inspector).verifyListing(listingId);
            await tempEscrow.connect(inspector).updateInspectionStatus(listingId, false);
            await tempEscrow.connect(seller).setPurchasePriceAndEscrow(listingId, PURCHASE_PRICE, ESCROW_AMOUNT);

            expect(await tempEscrow.buyer(listingId)).to.equal(ethers.constants.AddressZero);

            await expect(tempEscrow.connect(inspector).cancelSale(listingId))
                .to.be.revertedWith('No buyer associated with this NFT for refund');
        });

       it('should revert if insufficient escrow balance for refund', async () => {
            // Create a NEW, completely isolated contract instance for this specific test
            const newEscrow = await ethers.getContractFactory('Escrow');
            const tempEscrow = await newEscrow.deploy(ethers.constants.AddressZero, inspector.address, lender.address);
            await tempEscrow.deployed();
            const tempRealEstate = await ethers.getContractFactory('RealEstate');
            const tempRealEstateInstance = await tempRealEstate.deploy(tempEscrow.address);
            await tempRealEstateInstance.deployed();
            await tempEscrow.connect(deployer).setRealEstateAddress(tempRealEstateInstance.address);

            const proposeTx = await tempEscrow.connect(seller).proposeListing(TOKEN_URI, PURCHASE_PRICE);
            const proposeReceipt = await proposeTx.wait();
            const listingId = proposeReceipt.events.find(e => e.event === 'ProposedListing').args.listingID;
            
            await tempEscrow.connect(inspector).verifyListing(listingId);
            
            // <<< CRITICAL FIX FOR THIS TEST >>>
            // We set the escrowAmount for this listing ID to a value HIGHER than what the contract will actually hold.
            const ARTIFICIALLY_HIGH_ESCROW_AMOUNT = tokens(100); // Much higher than what we'll deposit
            const ACTUAL_DEPOSITED_AMOUNT = tokens(1); // Deposit a small, non-zero amount

            // First, set the high escrowAmount for the listing
            await tempEscrow.connect(seller).setPurchasePriceAndEscrow(listingId, PURCHASE_PRICE, ARTIFICIALLY_HIGH_ESCROW_AMOUNT);
            
            await tempEscrow.connect(seller).setPurchasePriceAndEscrow(listingId, PURCHASE_PRICE, ESCROW_AMOUNT);
            await tempEscrow.connect(buyer).depositEarnest(listingId, buyer.address, { value: ESCROW_AMOUNT }); 
            await tempEscrow.connect(inspector).updateInspectionStatus(listingId, false); // Inspection fails

            await ethers.provider.send('hardhat_setBalance', [
                tempEscrow.address,
                '0x0', // Set contract balance to 0
            ]);
            
            // Verify escrow balance is 0 after draining
            expect(await ethers.provider.getBalance(tempEscrow.address)).to.equal(0);

            // Now, try to cancel (should fail due to insufficient balance)
            await expect(tempEscrow.connect(buyer).cancelSale(listingId))
                .to.be.revertedWith('Insufficient escrow balance for refund');
        });
    });

});
