const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InsurerRegistry", function () {
    /**
     * @dev Fixture to deploy the contract and establish test accounts/data.
     */
    async function deployRegistryFixture() {
        const [owner, insurer1, insurer2, randomUser] = await ethers.getSigners();

        const InsurerRegistry = await ethers.getContractFactory("InsurerRegistry");
        const registry = await InsurerRegistry.deploy();

        const ins1Data = {
            address: insurer1.address,
            name: "Blue Shield Corp",
            ipfsProfile: "Qm_BS_Profile_Hash_123",
        };
        const ins2Data = {
            address: insurer2.address,
            name: "HealthCare Global",
            ipfsProfile: "Qm_HCG_Profile_Hash_456",
        };

        return { registry, owner, insurer1, insurer2, randomUser, ins1Data, ins2Data };
    }

    // --- Deployment & Access Control ---
    describe("Deployment & Access Control", function () {
        it("Should set the deployer as the contract owner", async function () {
            const { registry, owner } = await loadFixture(deployRegistryFixture);
            expect(await registry.owner()).to.equal(owner.address);
        });

        it("Should revert if a non-owner tries to add an insurer", async function () {
            const { registry, randomUser, ins1Data } = await loadFixture(deployRegistryFixture);
            
            await expect(
                registry.connect(randomUser).addInsurer(
                    ins1Data.address,
                    ins1Data.name,
                    ins1Data.ipfsProfile
                )
            ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
        });
    });

    // --- Insurer Addition and Data Verification ---
    describe("Insurer Management (Add and IsInsurer)", function () {
        it("Should register an insurer and store data correctly", async function () {
            const { registry, insurer1, ins1Data } = await loadFixture(deployRegistryFixture);

            await registry.addInsurer(ins1Data.address, ins1Data.name, ins1Data.ipfsProfile);

            // Verify status and stored data
            expect(await registry.isInsurer(insurer1.address)).to.equal(true);
            const insurerProfile = await registry.insurers(insurer1.address);
            expect(insurerProfile.name).to.equal(ins1Data.name);
        });

        it("Should emit an InsurerAdded event", async function () {
            const { registry, ins1Data } = await loadFixture(deployRegistryFixture);

            await expect(
                registry.addInsurer(ins1Data.address, ins1Data.name, ins1Data.ipfsProfile)
            )
                .to.emit(registry, "InsurerAdded")
                .withArgs(ins1Data.address, ins1Data.name);
        });

        it("Should revert when trying to register an already registered insurer", async function () {
            const { registry, ins1Data } = await loadFixture(deployRegistryFixture);

            await registry.addInsurer(ins1Data.address, ins1Data.name, ins1Data.ipfsProfile);

            await expect(
                registry.addInsurer(ins1Data.address, ins1Data.name, ins1Data.ipfsProfile)
            ).to.be.revertedWith("Already registered");
        });
    });

    // --- Removal and Array Integrity (Crucial Test) ---
    describe("Insurer Management (Remove and List Integrity)", function () {
        it("Should correctly remove an insurer using the swap-and-pop method (middle element)", async function () {
            const { registry, insurer1, insurer2, randomUser, ins1Data, ins2Data } = await loadFixture(deployRegistryFixture);
            
            const ins3Data = { address: randomUser.address, name: "Alpha Claims", ipfsProfile: "Qm_AC_hash" };

            await registry.addInsurer(ins1Data.address, ins1Data.name, ins1Data.ipfsProfile);
            await registry.addInsurer(ins3Data.address, ins3Data.name, ins3Data.ipfsProfile);
            await registry.addInsurer(ins2Data.address, ins2Data.name, ins2Data.ipfsProfile);

            const initialList = [ins1Data.address, ins3Data.address, ins2Data.address];
            expect(await registry.getInsurerList()).to.deep.equal(initialList);

            await registry.removeInsurer(ins3Data.address);

            expect(await registry.isInsurer(ins3Data.address)).to.equal(false);
            
            const expectedList = [ins1Data.address, ins2Data.address];
            expect(await registry.getInsurerList()).to.deep.equal(expectedList);

            const ins2Profile = await registry.insurers(ins2Data.address);
            expect(ins2Profile.exists).to.equal(true); 
        });
        
        it("Should revert if trying to remove a non-existent insurer", async function () {
            const { registry, insurer1 } = await loadFixture(deployRegistryFixture);

            await expect(registry.removeInsurer(insurer1.address)).to.be.revertedWith("Not found");
        });
    });
});