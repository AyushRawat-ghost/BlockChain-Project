-- Supabase Schema for Cyberpunk Healthcare platform

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  token_id TEXT UNIQUE, -- Soulbound Token ID
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE
);

-- 3. Insurance Claims Table
CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  claim_id TEXT UNIQUE NOT NULL,
  patient_address TEXT NOT NULL,
  insurer_address TEXT NOT NULL,
  amount_requested NUMERIC NOT NULL,
  ipfs_cid TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Access Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_address TEXT NOT NULL,
  accessor_address TEXT NOT NULL,
  access_type TEXT NOT NULL, -- 'View', 'Update', 'Emergency'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tx_hash TEXT
);

-- Enable Row Level Security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for initial setup)
CREATE POLICY "Public read access for patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Public read access for doctors" ON doctors FOR SELECT USING (true);
