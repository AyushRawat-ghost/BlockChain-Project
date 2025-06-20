const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}



describe('Escrow', () => {

    let buyer,seller,inspector,lender
    let realEstate,escrow

    it('Saves the address',async()=>{

    [buyer,seller,inspector,lender]=await ethers.getSigners()
    
    const RealEstate=await ethers.getContractFactory('RealEstate')
    realEstate=await RealEstate.deploy()
    console.log(realEstate.address)

    let transaction=await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png");
    await transaction.wait();

    const Escrow=await ethers.getContractFactory('Escrow')
    escrow=await Escrow.deploy(
        realEstate.address,
        lender.address,
        seller.address,
        inspector.address
    )


    const result=await escrow.nftAddress()
    expect(result).to.be.equal(realEstate.address)
    })
})
