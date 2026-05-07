const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployBillingSetupFixture() {
    const [owner, provider, patient, stranger] = await ethers.getSigners();

    const MockRegistryFactory = await ethers.getContractFactory("MockRegistry");
    const mockRegistry = await MockRegistryFactory.deploy();
    await mockRegistry.mockRegister(provider.address);
    await mockRegistry.mockRegister(patient.address);

    const BillingFactory = await ethers.getContractFactory("BillingContract");
    const billing = await BillingFactory.deploy(mockRegistry.target);

    return { billing, mockRegistry, owner, provider, patient, stranger };
}

describe("Billing System", function () {
    describe("Generating Invoices", function () {
        it("Should allow registered provider to generate an invoice", async function () {
            const { billing, provider, patient } = await loadFixture(deployBillingSetupFixture);
            
            const cid = "QmInvoice";
            const amount = ethers.parseEther("0.5");

            await expect(billing.connect(provider).generateInvoice(patient.address, amount, cid))
                .to.emit(billing, "InvoiceGenerated")
                .withArgs(1, provider.address, patient.address, amount, cid);
        });
    });

    describe("Paying Invoices", function () {
        it("Should allow patient to pay invoice with ETH", async function () {
            const { billing, provider, patient } = await loadFixture(deployBillingSetupFixture);
            
            const amount = ethers.parseEther("0.5");
            await billing.connect(provider).generateInvoice(patient.address, amount, "QmInvoice");

            const initialProviderBalance = await ethers.provider.getBalance(provider.address);

            const tx = await billing.connect(patient).payInvoice(1, { value: amount });
            await tx.wait();

            const finalProviderBalance = await ethers.provider.getBalance(provider.address);
            expect(finalProviderBalance - initialProviderBalance).to.equal(amount);

            const invoice = await billing.invoices(1);
            expect(invoice.isPaid).to.be.true;
        });

        it("Should revert if payment amount is incorrect", async function () {
            const { billing, provider, patient } = await loadFixture(deployBillingSetupFixture);
            
            const amount = ethers.parseEther("0.5");
            await billing.connect(provider).generateInvoice(patient.address, amount, "QmInvoice");

            const wrongAmount = ethers.parseEther("0.4");
            await expect(billing.connect(patient).payInvoice(1, { value: wrongAmount }))
                .to.be.revertedWith("Incorrect payment amount");
        });
    });
});
