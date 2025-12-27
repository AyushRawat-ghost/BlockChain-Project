CREATE TABLE profiles (
    wallet_address TEXT PRIMARY KEY, 
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('doctor', 'patient', 'insurer', 'admin')),
    profile_img_cid TEXT,
    email TEXT UNIQUE,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE doctor_details (
    wallet_address TEXT PRIMARY KEY REFERENCES profiles(wallet_address) ON DELETE CASCADE,
    specialization TEXT NOT NULL,
    license_number TEXT UNIQUE,
    hospital_name TEXT,
    bio TEXT,
    consultation_fee NUMERIC DEFAULT 0
);

CREATE TABLE patient_details (
    wallet_address TEXT PRIMARY KEY REFERENCES profiles(wallet_address) ON DELETE CASCADE,
    date_of_birth DATE,
    blood_group TEXT,
    emergency_contact TEXT,
    allergies TEXT[] 
);

CREATE TABLE insurer_details (
    wallet_address TEXT PRIMARY KEY REFERENCES profiles(wallet_address) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    registration_id TEXT UNIQUE NOT NULL,
    contact_number TEXT,
    headquarters_address TEXT,
    supported_plans TEXT[], 
    is_active BOOLEAN DEFAULT true
);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid()::text = wallet_address);