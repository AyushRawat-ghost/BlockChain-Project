const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DoctorRegistry", function () {
    /**
     * @dev Fixture to deploy the contract and establish test accounts/data.
     */
    async function deployRegistryFixture() {
        const [owner, doctor1, doctor2, randomUser] = await ethers.getSigners();

        const DoctorRegistry = await ethers.getContractFactory("DoctorRegistry");
        const registry = await DoctorRegistry.deploy();

        const doc1Data = {
            address: doctor1.address,
            name: "Dr. Alice Smith",
            specialization: "Cardiology",
            ipfsProfile: "QmX1Y2Z3A4B5C6D7E8F9G0H1I2J3K4L5M6N7O8P9Q0",
        };
        const doc2Data = {
            address: doctor2.address,
            name: "Dr. Bob Johnson",
            specialization: "Neurology",
            ipfsProfile: "QmP1O2U3V4W5X6Y7Z8A9B0C1D2E3F4G5H6I7J8K9L0",
        };

        return { registry, owner, doctor1, doctor2, randomUser, doc1Data, doc2Data };
    }

    /**
     * @dev Test Block: Contract Deployment & Ownership
     */
    describe("Deployment", function () {
        it("Should set the deployer as the contract owner", async function () {
            const { registry, owner } = await loadFixture(deployRegistryFixture);
            expect(await registry.owner()).to.equal(owner.address);
        });
    });

    /**
     * @dev Test Block: Access Control using Ownable
     */
    describe("Access Control", function () {
        it("Should allow the owner to add a doctor", async function () {
            const { registry, doc1Data } = await loadFixture(deployRegistryFixture);
            await expect(
                registry.addDoctor(
                    doc1Data.address,
                    doc1Data.name,
                    doc1Data.specialization,
                    doc1Data.ipfsProfile
                )
            ).to.not.be.reverted;
        });

        it("Should revert if a non-owner tries to add a doctor", async function () {
            const { registry, randomUser, doc1Data } = await loadFixture(deployRegistryFixture);
            
            await expect(
                registry.connect(randomUser).addDoctor(
                    doc1Data.address,
                    doc1Data.name,
                    doc1Data.specialization,
                    doc1Data.ipfsProfile
                )
            ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
        });
    });

    /**
     * @dev Test Block: Doctor Addition and Data Verification
     */
    describe("Doctor Management (Add and IsDoctor)", function () {
        it("Should register a doctor, update status, and store data correctly", async function () {
            const { registry, doctor1, doc1Data } = await loadFixture(deployRegistryFixture);

            expect(await registry.isDoctor(doctor1.address)).to.equal(false);

            await registry.addDoctor(
                doc1Data.address,
                doc1Data.name,
                doc1Data.specialization,
                doc1Data.ipfsProfile
            );

            expect(await registry.isDoctor(doctor1.address)).to.equal(true);

            const doctorProfile = await registry.doctors(doctor1.address);
            expect(doctorProfile.exists).to.equal(true);
            expect(doctorProfile.name).to.equal(doc1Data.name);
            expect(doctorProfile.specialization).to.equal(doc1Data.specialization);
        });

        it("Should emit a DoctorAdded event on successful registration", async function () {
            const { registry, doc1Data } = await loadFixture(deployRegistryFixture);

            await expect(
                registry.addDoctor(
                    doc1Data.address,
                    doc1Data.name,
                    doc1Data.specialization,
                    doc1Data.ipfsProfile
                )
            )
                .to.emit(registry, "DoctorAdded")
                .withArgs(doc1Data.address, doc1Data.name, doc1Data.specialization);
        });

        it("Should revert if trying to register an already registered doctor", async function () {
            const { registry, doc1Data } = await loadFixture(deployRegistryFixture);

            await registry.addDoctor(
                doc1Data.address,
                doc1Data.name,
                doc1Data.specialization,
                doc1Data.ipfsProfile
            );

            await expect(
                registry.addDoctor(
                    doc1Data.address,
                    doc1Data.name,
                    doc1Data.specialization,
                    doc1Data.ipfsProfile
                )
            ).to.be.revertedWith("Registry: Already registered");
        });
    });

    /**
     * @dev Test Block: Doctor Removal and Array Integrity (Testing O(1) swap logic)
     */
    describe("Doctor Management (Remove and List Integrity)", function () {
        it("Should correctly remove a doctor (last element case - NO swap)", async function () {
            const { registry, doctor1, doctor2, doc1Data, doc2Data } = await loadFixture(deployRegistryFixture);

            await registry.addDoctor(doc1Data.address, doc1Data.name, doc1Data.specialization, doc1Data.ipfsProfile);
            await registry.addDoctor(doc2Data.address, doc2Data.name, doc2Data.specialization, doc2Data.ipfsProfile);

            expect(await registry.getDoctorList()).to.deep.equal([doctor1.address, doctor2.address]);

            await expect(registry.removeDoctor(doctor2.address))
                .to.emit(registry, "DoctorRemoved").withArgs(doctor2.address);

            expect(await registry.isDoctor(doctor2.address)).to.equal(false);
            expect(await registry.getDoctorList()).to.deep.equal([doctor1.address]);
        });

        it("Should correctly remove a doctor (middle element case - SWAP)", async function () {
            const { registry, doctor1, doctor2, randomUser, doc1Data, doc2Data } = await loadFixture(deployRegistryFixture);
            
            const doc3Data = {
                address: randomUser.address,
                name: "Dr. Charlie Brown",
                specialization: "Pediatrics",
                ipfsProfile: "QmX1Y2Z3...",
            };

            await registry.addDoctor(doc1Data.address, doc1Data.name, doc1Data.specialization, doc1Data.ipfsProfile);
            await registry.addDoctor(doc3Data.address, doc3Data.name, doc3Data.specialization, doc3Data.ipfsProfile);
            await registry.addDoctor(doc2Data.address, doc2Data.name, doc2Data.specialization, doc2Data.ipfsProfile);

            expect(await registry.getDoctorList()).to.deep.equal([doc1Data.address, doc3Data.address, doc2Data.address]);

            await registry.removeDoctor(doc3Data.address);

            expect(await registry.isDoctor(doc3Data.address)).to.equal(false);
            
            const expectedList = [doc1Data.address, doc2Data.address];
            expect(await registry.getDoctorList()).to.deep.equal(expectedList);
        });
        
        it("Should revert if trying to remove a non-existent doctor", async function () {
            const { registry, doctor1 } = await loadFixture(deployRegistryFixture);

            await expect(registry.removeDoctor(doctor1.address)).to.be.revertedWith("Registry: Not found");
        });
    });
});