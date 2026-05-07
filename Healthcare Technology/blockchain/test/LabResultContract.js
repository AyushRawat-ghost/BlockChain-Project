const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployLabSetupFixture() {
    const [owner, labTech, patient, stranger] = await ethers.getSigners();

    const MockRegistryFactory = await ethers.getContractFactory("MockRegistry");
    const mockRegistry = await MockRegistryFactory.deploy();
    await mockRegistry.mockRegister(labTech.address);
    await mockRegistry.mockRegister(patient.address);

    const LabFactory = await ethers.getContractFactory("LabResultContract");
    const lab = await LabFactory.deploy(mockRegistry.target);

    return { lab, mockRegistry, owner, labTech, patient, stranger };
}

describe("Lab Result System", function () {
    it("Should allow registered lab/doctor to upload a result", async function () {
        const { lab, labTech, patient } = await loadFixture(deployLabSetupFixture);
        
        await expect(lab.connect(labTech).uploadResult(patient.address, "BloodTest", "QmLabResult"))
            .to.emit(lab, "ResultUploaded")
            .withArgs(1, labTech.address, patient.address, "BloodTest", "QmLabResult");
    });

    it("Should allow patient to view their result", async function () {
        const { lab, labTech, patient } = await loadFixture(deployLabSetupFixture);
        
        await lab.connect(labTech).uploadResult(patient.address, "BloodTest", "QmLabResult");

        const result = await lab.connect(patient).getResult(1);
        expect(result.cid).to.equal("QmLabResult");
    });

    it("Should prevent stranger from viewing result", async function () {
        const { lab, labTech, patient, stranger } = await loadFixture(deployLabSetupFixture);
        
        await lab.connect(labTech).uploadResult(patient.address, "BloodTest", "QmLabResult");

        await expect(lab.connect(stranger).getResult(1))
            .to.be.revertedWith("Not authorized to view");
    });
});
