const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployEmergencyFixture() {
    const [owner, doc1, doc2, doc3, patient1, stranger] = await ethers.getSigners();

    // 1. Deploy Mock Registry
    const MockRegistryFactory = await ethers.getContractFactory("MockRegistry");
    const mockRegistry = await MockRegistryFactory.deploy();

    // 2. Register 3 doctors in the mock
    await mockRegistry.mockRegister(doc1.address);
    await mockRegistry.mockRegister(doc2.address);
    await mockRegistry.mockRegister(doc3.address);
    
    // NOTE: Ensure your MockRegistry has a doctorCount() function returning 3
    // If using the simple mock, you might need to add a manual count or list.

    // 3. Deploy EmergencyProtocol
    const EmergencyFactory = await ethers.getContractFactory("EmergencyProtocol");
    const emergency = await EmergencyFactory.deploy(mockRegistry.target);

    return { emergency, mockRegistry, owner, doc1, doc2, doc3, patient1, stranger };
}

describe("EmergencyProtocol (2/3 Voting)", function () {
    
    it("Should allow Admin to raise an emergency ticket", async function () {
        const { emergency, owner, patient1 } = await loadFixture(deployEmergencyFixture);
        
        await expect(emergency.connect(owner).raiseEmergency(patient1.address))
            .to.emit(emergency, "EmergencyRaised")
            .withArgs(0, patient1.address);
    });

    it("Should NOT grant access with only 1/3 of votes", async function () {
        const { emergency, owner, doc1, patient1 } = await loadFixture(deployEmergencyFixture);
        
        await emergency.connect(owner).raiseEmergency(patient1.address);
        await emergency.connect(doc1).vote(0); // 1 vote out of 3

        expect(await emergency.isAccessGranted(patient1.address)).to.equal(false);
    });

    it("Should grant access when 2/3 majority is reached", async function () {
        const { emergency, owner, doc1, doc2, patient1 } = await loadFixture(deployEmergencyFixture);
        
        await emergency.connect(owner).raiseEmergency(patient1.address);
        
        // Vote 1
        await emergency.connect(doc1).vote(0);
        // Vote 2 (This hits the 2/3 threshold)
        await expect(emergency.connect(doc2).vote(0))
            .to.emit(emergency, "EmergencyApproved")
            .withArgs(0, patient1.address);

        expect(await emergency.isAccessGranted(patient1.address)).to.equal(true);
    });

    it("Should prevent double voting by the same doctor", async function () {
        const { emergency, owner, doc1, patient1 } = await loadFixture(deployEmergencyFixture);
        
        await emergency.connect(owner).raiseEmergency(patient1.address);
        await emergency.connect(doc1).vote(0);
        
        await expect(emergency.connect(doc1).vote(0))
            .to.be.revertedWith("Doctor has already voted");
    });

    it("Should revert if a non-doctor tries to vote", async function () {
        const { emergency, owner, stranger, patient1 } = await loadFixture(deployEmergencyFixture);
        
        await emergency.connect(owner).raiseEmergency(patient1.address);
        await expect(emergency.connect(stranger).vote(0))
            .to.be.revertedWith("Only registered doctors can vote");
    });
});