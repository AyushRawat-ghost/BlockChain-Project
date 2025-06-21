const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

// Assigns address to diff person involved and deploy the contracts
let buyer,seller,inspector,lender
let realEstate,escrow
beforeEach(async()=>{
    [buyer,seller,inspector,lender]=await ethers.getSigners()
    
    // deploys Real Estate Smart Contract
    const RealEstate=await ethers.getContractFactory('RealEstate')
    realEstate=await RealEstate.deploy()
    console.log(realEstate.address)

    // minting
    let transaction=await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png");
    await transaction.wait();

    // Deploys Escrow Contract
    const Escrow=await ethers.getContractFactory('Escrow')
    escrow=await Escrow.deploy(
        realEstate.address,
        seller.address,
        inspector.address,
        lender.address
    )

    // Approve Property
    transaction = await realEstate.connect(seller).approve(escrow.address,1)
    await transaction.wait()

    // List Property
    transaction = await escrow.connect(seller).list(1,buyer.address,tokens(10),tokens(5))
    await transaction.wait()
})

// Verifies if address is been saved correctly
describe('deployment',()=>{
    it ('Returns the NFT address',async()=>{
        const result=await escrow.nftAddress()
        expect(result).to.be.equal(realEstate.address)
    })

    it ('Returns the Seller address',async()=>{
        const result=await escrow.seller()
        expect(result).to.be.equal(seller.address)
    })

    it ('Returns the Inspector address',async()=>{
        const result=await escrow.inspector()
        expect(result).to.be.equal(inspector.address)
    })
})


// Listing Func
describe('Listing', () => {
    it('Checks if property is listed',async () => {
        const result = await escrow.isListed(1)
        expect(result).to.be.equal(true)
    })

    it('Checks Transfer of owner',async () => {
        expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
    })

    it ('Returns the buyer address',async()=>{
    const result=await escrow.buyer(1)
    expect(result).to.be.equal(buyer.address)
    })

    it ('Returns the Purchase Price',async()=>{
    const result=await escrow.purchasePrice(1)
    expect(result).to.be.equal(tokens(10))
    })

    it ('Returns the Escrow Amount',async()=>{
    const result=await escrow.escrowAmount(1)
    expect(result).to.be.equal(tokens(5))
    })

})


// Deposit Func
describe('Deposit', () => {

    it('Updates contract balance', async () => {
        const transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
        await transaction.wait()

        const result = await escrow.getBalance()
        expect(result).to.be.equal(tokens(5))
    })
})


// Inspector func
describe('Inspection', () => {

    it('Updates Inspection status', async () => {
        const transaction = await escrow.connect(inspector).updateInspectionStatus(1,true)
        await transaction.wait()

        const result = await escrow.inspectionPassed(1)
        expect(result).to.be.equal(true)
    })
})


// Approval func
describe('Approval ', () => {

    it('Updates Approval status', async () => {
        let transaction = await escrow.connect(buyer).approveSale(1)
        await transaction.wait()

        transaction = await escrow.connect(seller).approveSale(1)
        await transaction.wait()

        transaction = await escrow.connect(lender).approveSale(1)
        await transaction.wait()

        expect(await escrow.approval(1,buyer.address)).to.be.equal(true)
        expect(await escrow.approval(1,seller.address)).to.be.equal(true)
        expect(await escrow.approval(1,lender.address)).to.be.equal(true)
        
    })
})

describe('Sale',async()=>{
    beforeEach(async()=>{
        let transaction = await escrow.connect(buyer).approveSale(1)
        await transaction.wait()

        transaction = await escrow.connect(seller).approveSale(1)
        await transaction.wait()

        transaction = await escrow.connect(lender).approveSale(1)
        await transaction.wait()

        transaction = await escrow.connect(inspector).updateInspectionStatus(1,true)
        await transaction.wait()

        transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) })
        await transaction.wait()

        await lender.sendTransaction({to:escrow.address,value:tokens(5)})

        transaction = await escrow.connect(seller).finalizeSale(1)
        await transaction.wait()
    })
    it('Updates Balance',async()=>{
        expect(await escrow.getBalance()).to.be.equal(0)
    })
    it('Updates Ownership',async()=>{
        expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address)
    })


})