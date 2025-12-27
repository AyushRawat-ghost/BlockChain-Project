const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployAccessFixture() {
    const [owner, doctor1, patient1, stranger] = await ethers.getSigners();

    // Deploy Mock Registry
    const MockRegistryFactory = await ethers.getContractFactory("MockRegistry");
    const mockRegistry = await MockRegistryFactory.deploy();
    
    // Register doctor and patient in mock
    await mockRegistry.mockRegister(doctor1.address);
    await mockRegistry.mockRegister(patient1.address);

    // Deploy AccessRequest
    const AccessRequestFactory = await ethers.getContractFactory("AccessRequest");
    const accessRequest = await AccessRequestFactory.deploy(mockRegistry.target, mockRegistry.target);

    return { accessRequest, mockRegistry, owner, doctor1, patient1, stranger };
}

describe("AccessRequest Contract", function () {
    it("Should allow Admin to create a request", async function () {
        const { accessRequest, doctor1, patient1 } = await loadFixture(deployAccessFixture);
        
        await expect(accessRequest.createRequest(doctor1.address, patient1.address))
            .to.emit(accessRequest, "RequestCreated")
            .withArgs(0, anyValue, doctor1.address, patient1.address);
    });

    it("Should allow the assigned doctor to approve", async function () {
        const { accessRequest, owner, doctor1, patient1 } = await loadFixture(deployAccessFixture);
        
        await accessRequest.createRequest(doctor1.address, patient1.address);
        await expect(accessRequest.connect(doctor1).approveRequest(0))
            .to.emit(accessRequest, "RequestApproved");

        const [,,, status] = await accessRequest.getRequest(0);
        expect(status).to.equal(1); // 1 = Approved
    });

    it("Should fail if a stranger tries to approve", async function () {
        const { accessRequest, doctor1, patient1, stranger } = await loadFixture(deployAccessFixture);
        
        await accessRequest.createRequest(doctor1.address, patient1.address);
        await expect(accessRequest.connect(stranger).approveRequest(0))
            .to.be.revertedWith("Access: Only designated doctor can approve");
    });
});

// Simple helper for anyValue match
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");