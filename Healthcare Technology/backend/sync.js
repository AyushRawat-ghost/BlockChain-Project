const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const config = require('./config');

const supabase = createClient(config.supabaseUrl, config.supabaseKey);
const provider = new ethers.JsonRpcProvider(config.rpcUrl);

async function syncEvents() {
  console.log('--- STARTING NEURAL SYNC SERVICE ---');

  // Validate addresses
  const requiredContracts = ['PatientRegistry', 'DoctorRegistry', 'Insurance'];
  for (const name of requiredContracts) {
    if (!config.contracts[name].address || config.contracts[name].address === '0x...') {
      console.error(`[CRITICAL] Missing contract address for ${name}. Please update backend/.env`);
      return; // Stop execution
    }
  }
  
  // 1. Patient Registry Sync
  const patientContract = new ethers.Contract(
    config.contracts.PatientRegistry.address,
    config.contracts.PatientRegistry.abi,
    provider
  );

  patientContract.on('PatientAdded', async (patient, name, tokenId, event) => {
    console.log(`[SYNC] New Patient Registered: ${name} (${patient})`);
    
    const { error } = await supabase
      .from('patients')
      .insert([
        { 
          wallet_address: patient, 
          name: name, 
          token_id: tokenId.toString(),
          registered_at: new Date().toISOString()
        }
      ]);

    if (error) console.error('[ERROR] Supabase sync failed:', error);
  });

  // 2. Doctor Registry Sync
  const doctorContract = new ethers.Contract(
    config.contracts.DoctorRegistry.address,
    config.contracts.DoctorRegistry.abi,
    provider
  );

  doctorContract.on('DoctorAdded', async (doctor, name, specialization, event) => {
    console.log(`[SYNC] New Doctor Registered: Dr. ${name} (${specialization})`);
    
    const { error } = await supabase
      .from('doctors')
      .insert([
        { 
          wallet_address: doctor, 
          name: name, 
          specialization: specialization,
          registered_at: new Date().toISOString()
        }
      ]);

    if (error) console.error('[ERROR] Supabase sync failed:', error);
  });

  // 3. Insurance Claim Sync
  const insuranceContract = new ethers.Contract(
    config.contracts.Insurance.address,
    config.contracts.Insurance.abi,
    provider
  );

  insuranceContract.on('ClaimSubmitted', async (id, patient, insurer, amount, cid, event) => {
    console.log(`[SYNC] New Insurance Claim: ID ${id} for ${amount} ETH`);
    
    const { error } = await supabase
      .from('insurance_claims')
      .insert([
        { 
          claim_id: id.toString(), 
          patient_address: patient, 
          insurer_address: insurer,
          amount_requested: ethers.formatEther(amount),
          ipfs_cid: cid,
          status: 'Pending',
          created_at: new Date().toISOString()
        }
      ]);

    if (error) console.error('[ERROR] Supabase sync failed:', error);
  });

  console.log('Listening for blockchain events...');
}

syncEvents().catch((err) => {
  console.error('[CRITICAL] Sync service crashed:', err);
  process.exit(1);
});
