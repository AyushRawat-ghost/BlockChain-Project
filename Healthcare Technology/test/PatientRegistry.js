const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PatientRegistry (with SBT)", function () {
    /**
     * @dev Fixture to deploy the contract and establish test accounts/data.
     */
    async function deployRegistryFixture() {
        const [owner, patient1, patient2, randomUser] = await ethers.getSigners();

        const PatientRegistry = await ethers.getContractFactory("PatientRegistry");
        const registry = await PatientRegistry.deploy();

        const pat1Data = {
            address: patient1.address,
            name: "Rahul Sharma",
            ipfsProfile: "Qm_RS_Profile_Hash_1",
        };
        const pat2Data = {
            address: patient2.address,
            name: "Priya Verma",
            ipfsProfile: "Qm_PV_Profile_Hash_2",
        };

        return { registry, owner, patient1, patient2, randomUser, pat1Data, pat2Data };
    }

    // --- Deployment & Access Control ---
    describe("Deployment & Access Control", function () {
        it("Should set the SBT name and symbol correctly", async function () {
            const { registry } = await loadFixture(deployRegistryFixture);
            expect(await registry.name()).to.equal("PatientIdentitySBT");
            expect(await registry.symbol()).to.equal("PID");
        });

        it("Should revert if a non-owner tries to add a patient", async function () {
            const { registry, randomUser, pat1Data } = await loadFixture(deployRegistryFixture);
            
            await expect(
                registry.connect(randomUser).addPatient(
                    pat1Data.address,
                    pat1Data.name,
                    pat1Data.ipfsProfile
                )
            ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
        });
    });

    // --- Patient Addition, Data, and SBT Minting ---
    describe("Patient Management (Add and SBT)", function () {
        it("Should register a patient, mint an SBT, and store data correctly", async function () {
            const { registry, patient1, pat1Data } = await loadFixture(deployRegistryFixture);

            // Check initial status
            expect(await registry.isPatient(patient1.address)).to.equal(false);

            await registry.addPatient(pat1Data.address, pat1Data.name, pat1Data.ipfsProfile);

            // 1. Verify registry data
            expect(await registry.isPatient(patient1.address)).to.equal(true);
            const patientProfile = await registry.patients(patient1.address);
            expect(patientProfile.name).to.equal(pat1Data.name);
            
            // 2. Verify SBT was minted (Token ID should be 1)
            expect(await registry.balanceOf(patient1.address)).to.equal(1);
            expect(await registry.ownerOf(1)).to.equal(patient1.address);
            expect(patientProfile.tokenId).to.equal(1);
        });

        it("Should emit a PatientAdded event with the new token ID", async function () {
            const { registry, pat1Data } = await loadFixture(deployRegistryFixture);

            await expect(
                registry.addPatient(pat1Data.address, pat1Data.name, pat1Data.ipfsProfile)
            )
                .to.emit(registry, "PatientAdded")
                .withArgs(pat1Data.address, pat1Data.name, 1); // Token ID starts at 1
        });
        
        // it("Should enforce the SBT rule: transfers are restricted", async function () {
        //     const { registry, patient1, patient2, pat1Data } = await loadFixture(deployRegistryFixture);
            
        //     await registry.addPatient(pat1Data.address, pat1Data.name, pat1Data.ipfsProfile);
        //     const patientProfile = await registry.patients(patient1.address);
        //     const tokenId = patientProfile.tokenId;
            
        //     // Attempt transfer from patient1 to patient2 (SBT rule should prevent this)
        //     await expect(
        //         registry.connect(patient1)['safeTransferFrom(address,address,uint256)'](
        //             patient1.address,
        //             patient2.address,
        //             tokenId
        //         )
        //     ).to.be.revertedWith("SBT: Transfers are restricted");
        // });
    });

    // --- Removal and Array Integrity (Crucial Test) ---
    describe("Patient Management (Remove and List Integrity)", function () {
        it("Should correctly remove a patient, burn the SBT, and maintain array integrity", async function () {
            const { registry, patient1, patient2, randomUser, pat1Data, pat2Data } = await loadFixture(deployRegistryFixture);
            
            const pat3Data = { address: randomUser.address, name: "Charlie Delta", ipfsProfile: "Qm_CD_hash" };

            // Setup: Add three patients: P1, P3, P2 (Token IDs 1, 2, 3)
            await registry.addPatient(pat1Data.address, pat1Data.name, pat1Data.ipfsProfile);
            await registry.addPatient(pat3Data.address, pat3Data.name, pat3Data.ipfsProfile);
            await registry.addPatient(pat2Data.address, pat2Data.name, pat2Data.ipfsProfile);

            // Initial list check: [P1, P3, P2]
            expect(await registry.getPatientList()).to.deep.equal([pat1Data.address, pat3Data.address, pat2Data.address]);

            // Action: Remove P3 (the middle element, Token ID 2)
            await registry.removePatient(pat3Data.address);

            // 1. Verification: P3 is removed from the system
            expect(await registry.isPatient(pat3Data.address)).to.equal(false);
            
            // 2. Verification: P3's SBT (ID 2) is burned
            await expect(registry.ownerOf(2)).to.be.reverted; 
            
            // 3. Verification: List integrity (Swap-and-pop check)
            const expectedList = [pat1Data.address, pat2Data.address];
            expect(await registry.getPatientList()).to.deep.equal(expectedList);
        });
        
        it("Should revert if trying to remove a non-existent patient", async function () {
            const { registry, patient1 } = await loadFixture(deployRegistryFixture);

            await expect(registry.removePatient(patient1.address)).to.be.revertedWith("Registry: Not found");
        });
    });
});