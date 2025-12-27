const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployHospitalServicesFixture() {
    const [owner, doctor, patient, insurer, stranger] = await ethers.getSigners();

    // 1. Deploy Mock Registry
    const MockRegistryFactory = await ethers.getContractFactory("MockRegistry");
    const mockRegistry = await MockRegistryFactory.deploy();

    // 2. Setup Roles in Mock
    await mockRegistry.mockRegister(doctor.address); // Marks as doctor
    await mockRegistry.mockRegister(patient.address); // Marks as patient
    // We need to ensure the Mock has an 'isInsurer' function
    await mockRegistry.mockRegisterInsurer(insurer.address); 

    // 3. Deploy HospitalServices
    const HospitalServicesFactory = await ethers.getContractFactory("HospitalServices");
    const hospitalServices = await HospitalServicesFactory.deploy(mockRegistry.target);

    return { hospitalServices, mockRegistry, owner, doctor, patient, insurer, stranger };
}

describe("Hospital Management (Services)", function () {

    describe("Appointment Workflow", function () {
        it("Should allow a patient to book an appointment", async function () {
            const { hospitalServices, doctor, patient } = await loadFixture(deployHospitalServicesFixture);
            
            const timestamp = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
            await hospitalServices.connect(patient).bookAppointment(doctor.address, timestamp);
            
            const appt = await hospitalServices.appointments(0);
            expect(appt.patient).to.equal(patient.address);
            expect(appt.status).to.equal(0); // 0 = Pending
        });

        it("Should allow a doctor to confirm an appointment", async function () {
            const { hospitalServices, doctor, patient } = await loadFixture(deployHospitalServicesFixture);
            
            await hospitalServices.connect(patient).bookAppointment(doctor.address, 1234567890);
            await hospitalServices.connect(doctor).updateAppointmentStatus(0, 1); // 1 = Confirmed
            
            const appt = await hospitalServices.appointments(0);
            expect(appt.status).to.equal(1);
        });

it("Should prevent a stranger from updating appointment status", async function () {
    const { hospitalServices, mockRegistry, doctor, patient, stranger } = await loadFixture(deployHospitalServicesFixture);
    
    // 1. Make the 'stranger' a registered doctor so the booking doesn't revert
    await mockRegistry.mockRegister(stranger.address); 
    
    // 2. Patient books with the REAL doctor
    await hospitalServices.connect(patient).bookAppointment(doctor.address, 1234567890);
    
    // 3. Now the stranger (who is a doctor, but NOT the doctor for this appt) 
    // tries to update it. This should fail.
    await expect(hospitalServices.connect(stranger).updateAppointmentStatus(0, 1))
        .to.be.revertedWith("Only the doctor can update status");
});
    });

    describe("Insurance Workflow", function () {
        it("Should allow a patient to submit an insurance claim", async function () {
            const { hospitalServices, patient, insurer } = await loadFixture(deployHospitalServicesFixture);
            
            const recordId = 1; // Assume MedicalRecord ID 1
            const amount = ethers.parseEther("1.0");
            
            await hospitalServices.connect(patient).submitClaim(recordId, insurer.address, amount);
            
            const claim = await hospitalServices.claims(0);
            expect(claim.patient).to.equal(patient.address);
            expect(claim.status).to.equal(0); // 0 = Submitted
        });

        it("Should allow the insurer to approve/pay a claim", async function () {
            const { hospitalServices, patient, insurer } = await loadFixture(deployHospitalServicesFixture);
            
            await hospitalServices.connect(patient).submitClaim(1, insurer.address, 500);
            await hospitalServices.connect(insurer).processClaim(0, 2); // 2 = Paid
            
            const claim = await hospitalServices.claims(0);
            expect(claim.status).to.equal(2);
        });
    });
});