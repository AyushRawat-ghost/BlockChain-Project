const { ethers } = require("hardhat");

async function main() {
    console.log("Starting deployment...");
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying contracts with the account: ${deployer.address}`);

    // --- 1. Deploy Registries ---

    // Note: If you have a separate Counters.sol file, ensure it's linked/deployed if necessary.
    
    // DoctorRegistry (Assuming DoctorRegistry doesn't need constructor arguments)
    const DoctorRegistryFactory = await ethers.getContractFactory("DoctorRegistry");
    const doctors = await DoctorRegistryFactory.deploy();
    await doctors.waitForDeployment();
    const doctorsAddress = await doctors.getAddress();
    console.log(`DoctorRegistry deployed to: ${doctorsAddress}`);

    // PatientRegistry (Assuming PatientRegistry doesn't need constructor arguments besides Ownable/ERC721 setup)
    const PatientRegistryFactory = await ethers.getContractFactory("PatientRegistry");
    const patients = await PatientRegistryFactory.deploy();
    await patients.waitForDeployment();
    const patientsAddress = await patients.getAddress();
    console.log(`PatientRegistry deployed to: ${patientsAddress}`);
    
    // InsurerRegistry
    const InsurerRegistryFactory = await ethers.getContractFactory("InsurerRegistry");
    const insurers = await InsurerRegistryFactory.deploy();
    await insurers.waitForDeployment();
    const insurersAddress = await insurers.getAddress();
    console.log(`InsurerRegistry deployed to: ${insurersAddress}`);
    
    // --- 2. Deploy AccessRequest (Requires Registry Addresses) ---
    
    // AccessRequest(address _doctorRegistry, address _patientRegistry)
    const AccessRequestFactory = await ethers.getContractFactory("AccessRequest");
    const accessRequest = await AccessRequestFactory.deploy(
        doctorsAddress,
        patientsAddress
    );
    await accessRequest.waitForDeployment();
    const accessRequestAddress = await accessRequest.getAddress();
    console.log(`AccessRequest deployed to: ${accessRequestAddress}`);

    // --- 3. Deploy MedicalRecord (This is the FINAL contract, assuming it needs all others) ---
    /* const MedicalRecordFactory = await ethers.getContractFactory("MedicalRecord");
    const medicalRecord = await MedicalRecordFactory.deploy(
        doctorsAddress, 
        patientsAddress, 
        insurersAddress, 
        accessRequestAddress
    );
    await medicalRecord.waitForDeployment();
    console.log(`MedicalRecord deployed to: ${await medicalRecord.getAddress()}`);
    */

    // Save addresses to a file or environment variable for frontend use.
    console.log("\nDeployment complete.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });