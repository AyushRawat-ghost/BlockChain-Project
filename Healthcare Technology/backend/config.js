require('dotenv').config();

const config = {
  rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  contracts: {
    PatientRegistry: {
      address: process.env.PATIENT_REGISTRY_ADDR,
      abi: require('../blockchain/artifacts/contracts/Registration/PatientRegistry.sol/PatientRegistry.json').abi
    },
    DoctorRegistry: {
      address: process.env.DOCTOR_REGISTRY_ADDR,
      abi: require('../blockchain/artifacts/contracts/Registration/DoctorRegistry.sol/DoctorRegistry.json').abi
    },
    Insurance: {
      address: process.env.INSURANCE_ADDR,
      abi: require('../blockchain/artifacts/contracts/Finance/Insurance.sol/Insurance.json').abi
    }
  }
};

module.exports = config;
