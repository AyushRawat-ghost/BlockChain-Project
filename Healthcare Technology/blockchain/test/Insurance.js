const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployInsuranceSetupFixture() {
    const [owner, insurer1, patient1, stranger] = await ethers.getSigners();

    const MockRegistryFactory = await ethers.getContractFactory("MockRegistry");
    const mockRegistry = await MockRegistryFactory.deploy();
    await mockRegistry.mockRegister(patient1.address);
    await mockRegistry.mockRegisterInsurer(insurer1.address);

    const InsuranceFactory = await ethers.getContractFactory("Insurance");
    const insurance = await InsuranceFactory.deploy(mockRegistry.target, mockRegistry.target);

    return { insurance, mockRegistry, owner, insurer1, patient1, stranger };
}

describe("Insurance System", function () {
    describe("Submitting Claims", function () {
        it("Should allow a registered patient to submit a claim", async function () {
            const { insurance, insurer1, patient1 } = await loadFixture(deployInsuranceSetupFixture);
            
            const cid = "QmClaimCID";
            const amount = ethers.parseEther("1.5");

            await expect(insurance.connect(patient1).submitClaim(insurer1.address, amount, cid))
                .to.emit(insurance, "ClaimSubmitted")
                .withArgs(1, patient1.address, insurer1.address, amount, cid);
            
            expect(await insurance.ownerOf(1)).to.equal(patient1.address);
        });
    });

    describe("Approving Claims", function () {
        it("Should allow the designated insurer to approve and pay out", async function () {
            const { insurance, insurer1, patient1 } = await loadFixture(deployInsuranceSetupFixture);
            
            const cid = "QmClaimCID";
            const amount = ethers.parseEther("1.0");

            await insurance.connect(patient1).submitClaim(insurer1.address, amount, cid);

            const initialBalance = await ethers.provider.getBalance(patient1.address);

            const payout = ethers.parseEther("0.8"); // Insurer approves 0.8 ETH
            const tx = await insurance.connect(insurer1).approveClaim(1, { value: payout });
            await tx.wait();

            const finalBalance = await ethers.provider.getBalance(patient1.address);
            expect(finalBalance - initialBalance).to.equal(payout);

            const claim = await insurance.claims(1);
            expect(claim.status).to.equal(1); // Approved
            expect(claim.amountApproved).to.equal(payout);
        });
    });
});
