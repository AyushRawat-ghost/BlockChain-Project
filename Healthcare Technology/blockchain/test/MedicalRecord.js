const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployMedicalSetupFixture() {
    const [owner, doctor1, patient1, stranger] = await ethers.getSigners();

    // 1. Deploy Mock Registry
    const MockRegistryFactory = await ethers.getContractFactory("MockRegistry");
    const mockRegistry = await MockRegistryFactory.deploy();
    await mockRegistry.mockRegister(doctor1.address);
    await mockRegistry.mockRegister(patient1.address);

    // 2. Deploy AccessRequest (Mocking the interface)
    // For simplicity in this test, we use the real AccessRequest logic 
    // because we already fixed it!
    const AccessRequestFactory = await ethers.getContractFactory("AccessRequest");
    const accessRequest = await AccessRequestFactory.deploy(
        mockRegistry.target, 
        mockRegistry.target
    );

    // 3. Deploy MedicalRecord
    const MedicalRecordFactory = await ethers.getContractFactory("MedicalRecord");
    const medicalRecord = await MedicalRecordFactory.deploy(
        mockRegistry.target, 
        accessRequest.target
    );

    return { 
        medicalRecord, 
        accessRequest, 
        mockRegistry, 
        owner, 
        doctor1, 
        patient1, 
        stranger 
    };
}

describe("MedicalRecord System", function () {
    
    describe("Adding Records", function () {
        it("Should allow a registered doctor to add a record", async function () {
            const { medicalRecord, doctor1, patient1 } = await loadFixture(deployMedicalSetupFixture);
            
            const cid = "QmTest123456789";
            await expect(medicalRecord.connect(doctor1).addRecord(patient1.address, cid))
                .to.emit(medicalRecord, "RecordAdded");
            
            const records = await medicalRecord.getPatientRecords(patient1.address);
            expect(records.length).to.equal(1);
        });

        it("Should revert if a non-doctor tries to add a record", async function () {
            const { medicalRecord, stranger, patient1 } = await loadFixture(deployMedicalSetupFixture);
            await expect(medicalRecord.connect(stranger).addRecord(patient1.address, "bad-cid"))
                .to.be.revertedWith("Only registered doctors can add records");
        });
    });

    describe("Accessing CID (Privacy Check)", function () {
        const cid = "SecretMedicalData";

        async function recordFixture() {
            const setup = await deployMedicalSetupFixture();
            await setup.medicalRecord.connect(setup.doctor1).addRecord(setup.patient1.address, cid);
            return setup;
        }

        it("Should allow the patient to view their own CID", async function () {
            const { medicalRecord, patient1 } = await loadFixture(recordFixture);
            // Request ID 999 (doesn't matter for patient)
            const result = await medicalRecord.connect(patient1).getRecordCID(1, 999);
            expect(result).to.equal(cid);
        });

        it("Should allow the creator doctor to view the CID", async function () {
            const { medicalRecord, doctor1 } = await loadFixture(recordFixture);
            const result = await medicalRecord.connect(doctor1).getRecordCID(1, 999);
            expect(result).to.equal(cid);
        });

        it("Should block strangers from viewing the CID", async function () {
            const { medicalRecord, stranger } = await loadFixture(recordFixture);
            await expect(medicalRecord.connect(stranger).getRecordCID(1, 999))
                .to.be.revertedWith("Not authorized to view this record");
        });

        it("Should allow Admin to view if AccessRequest is Approved", async function () {
            const { medicalRecord, accessRequest, owner, doctor1, patient1 } = await loadFixture(recordFixture);
            
            // 1. Admin creates request
            await accessRequest.connect(owner).createRequest(doctor1.address, patient1.address);
            
            // 2. Doctor approves request (ID 0)
            await accessRequest.connect(doctor1).approveRequest(0);

            // 3. Admin views CID using Request ID 0
            const result = await medicalRecord.connect(owner).getRecordCID(1, 0);
            expect(result).to.equal(cid);
        });
    });
});