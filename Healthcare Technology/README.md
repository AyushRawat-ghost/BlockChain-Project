# 🏥 Blockchain-Based Patient Data Management System
A secure, decentralized platform for managing patient health records, consultations, prescriptions, billing, and lab results—combining on-chain auditability with off-chain efficiency.



---
## 🚀 Overview
This system empowers patients, doctors, admins, insurers, and emergency approvers to interact seamlessly:
- Patients control who sees their records.  
- Doctors upload encrypted PDF records and prescriptions.  
- Admins audit data with doctor/patient approval.  
- Insurers submit and evaluate claims.  
- Emergency teams override access via multi-sig voting.  
- Billing ledger and lab results modules ensure financial transparency and test integrity.
---

---
## ✨ Key Features

- **Role & Access Control**  
- **Wallet-Based Authentication & DID/SBT Identity**  
- **Encrypted PDF Storage on IPFS**  
- **Appointments & Telemedicine**  
- **On-Chain e-Prescriptions (NFTs)**  
- **Automated Insurance Claims & USDC Payouts**  
- **Emergency Override with Multi-Sig Voting**  
- **Admin Access Requests with Dual Approval**  
- **Immutable Audit Trail via Smart-Contract Events**  
- **Billing Ledger Module**  
- **Lab Results Integration Module**
---

---
## 📦 Modules Breakdown

| Module                                | Description                                                                                      |
|---------------------------------------|--------------------------------------------------------------------------------------------------|
| **1. User Roles & Access Control**    | Define Patient, Doctor, Admin, Insurer, Approver roles with Supabase RLS + on-chain consent.    |
| **2. Authentication & Identity**      | Wallet login, nonce signing, JWTs enriched by Soulbound tokens (ERC-721).                        |
| **3. Medical Record Storage**         | Client-side AES-256 encryption of PDFs → IPFS → CIDs + encrypted keys in Supabase.               |
| **4. Appointment Scheduling**         | Supabase tables + real-time subscriptions + on-chain event logging for audit timestamps.         |
| **5. Telemedicine & e-Prescription**  | `Telemedicine.sol` for consult events & prescription issuance, encrypted summaries on IPFS.      |
| **6. Insurance Claims & Billing**     | `Insurance.sol` handles claim NFTs, approvals, USDC payouts; off-chain proofs in Supabase.       |
| **7. Emergency Override**             | `EmergencyAccess.sol` multi-sig proposals, votes, and auto-grant of temporary access flags.      |
| **8. Admin Access Requests**          | `AccessRequest.sol` dual-approval workflow for admin visibility of patient PDFs.                 |
| **9. Audit Trail & Logging**          | Listener streams contract events into Supabase `access_logs` for tamper-evident reporting.       |
| **10. Billing Ledger**                | `BillingContract.sol` logs cost entries on-chain; off-chain `ledger_entries` + invoice PDFs.     |
| **11. Lab Results Integration**       | `LabResultContract.sol` logs result metadata on-chain; off-chain `lab_results` + IPFS JSON/CSV.  |


---
- **On-Chain**: Doctor registry, consent, consults, prescriptions, claims, billing, lab results, emergency votes.  
- **Off-Chain**: Supabase Postgres with RLS, metadata tables, encrypted blobs on IPFS, real-time subscriptions.
---

## 🛠 Tech Stack

- **Blockchain**: Solidity, Hardhat, OpenZeppelin  
- **Front End**: React (Next.js), Tailwind CSS, Ethers.js, Web3Modal  
- **Off-Chain DB**: Supabase (Postgres, RLS, Edge Functions)  
- **Storage**: IPFS (via Pinata or Infura)  
- **Identity**: MetaMask, WalletConnect, ERC-721 Soulbound Tokens  
- **Orchestration**: Node.js scripts or Supabase Functions for event listeners  
- **Visualization**: Mermaid for diagrams, The Graph (optional) for indexing

---

## 📁 Repository Structure

```
patient-data-system/
├── contracts/           # Solidity contracts
│   ├── DoctorRegistry.sol
│   ├── Telemedicine.sol
│   ├── Insurance.sol
│   ├── EmergencyAccess.sol
│   ├── AccessRequest.sol
│   ├── BillingContract.sol
│   └── LabResultContract.sol
├── infra/               # Supabase SQL migrations & RLS policies
│   ├── schema.sql
│   └── policies.sql
├── scripts/             # Deployment & event-listener scripts
├── frontend/                 # React + Tailwind front-end
├── docs/                # Detailed design & architecture docs
└── README.md            # Project overview & setup
```

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.


1. Backend Setup (Hardhat)

Initialize your Hardhat workspace and install dependencies:
# Ensure you’re on Node.js v18.x
nvm install 18.20.0
nvm use 18.20.0
# Initialize npm and install Hardhat toolbox + ethers v6
npm init -y
npm install --save-dev \
  @nomicfoundation/hardhat-toolbox \
  ethers@^6.14.0 \
  typescript ts-node \
  @typechain/hardhat @typechain/ethers-v6 \
  @types/chai @types/mocha \
  solidity-coverage hardhat-gas-reporter
# Scaffold basic Hardhat project
npx hardhat
# Openzepplian download
npm install @openzeppelin/contracts


2. Frontend Setup (React + Tailwind CSS)

Create and configure your React application:
cd frontend
# Scaffold React app
npx create-react-app .
# Install ethers.js for Web3 interactions
npm install ethers


3. Deployment

# Compile contracts
npx hardhat compile
# Run tests
npx hardhat test
# Deploy to a local network
npx hardhat node        # Start local node
npx hardhat run scripts/deploy.js --network localhost
# Start development server
npm start
# Build for production
npm run build

