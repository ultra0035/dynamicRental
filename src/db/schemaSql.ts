// Complete PostgreSQL / Supabase Schema for FleetCO (11 Tables)
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- FLEETCO MOTORCYCLE FLEET MANAGEMENT PLATFORM
-- PRODUCTION DATABASE SCHEMA & SECURITY POLICIES (POSTGRESQL / SUPABASE)
-- Version: 2.2.0 (Full Compatibility & Dynamic Schema Sync)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. APPLICATIONS TABLE (Onboarding Pipeline)
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    id_or_passport_number TEXT NOT NULL,
    citizenship TEXT NOT NULL DEFAULT 'sa_citizen',
    phone_number TEXT NOT NULL,
    phone TEXT,
    whatsapp_number TEXT,
    email TEXT,
    date_of_birth DATE,
    residential_address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    bike_id TEXT,
    deposit_amount_zar NUMERIC(10, 2) DEFAULT 0.00,
    delivery_platform TEXT,
    delivery_experience_months INTEGER DEFAULT 0,
    proof_of_address_url TEXT,
    id_document_url TEXT,
    drivers_license_url TEXT,
    asylum_passport_url TEXT,
    work_permit_url TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    rejection_reason TEXT,
    deposit_paid BOOLEAN DEFAULT FALSE,
    contract_signed BOOLEAN DEFAULT FALSE,
    stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. BIKES SHOWROOM TABLE
CREATE TABLE IF NOT EXISTS bikes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    weekly_rate NUMERIC(10, 2) NOT NULL,
    deposit NUMERIC(10, 2) NOT NULL,
    engine_capacity TEXT,
    fuel_consumption TEXT,
    fuel_capacity TEXT,
    payload_capacity TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    stock_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. DRIVERS TABLE (Approved Customers & Active Couriers)
CREATE TABLE IF NOT EXISTS drivers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    id_number TEXT,
    id_or_passport_number TEXT,
    phone_number TEXT,
    phone TEXT,
    whatsapp_number TEXT,
    email TEXT,
    citizenship TEXT DEFAULT 'south_african',
    nationality_country TEXT,
    address TEXT,
    suburb TEXT,
    city TEXT DEFAULT 'Randburg',
    status TEXT NOT NULL DEFAULT 'active',
    assigned_vehicle_id TEXT,
    assigned_vehicle_reg TEXT,
    assigned_bike_vin_or_plate TEXT,
    assigned_bike_name TEXT,
    vehicle_model TEXT,
    weekly_rate_zar NUMERIC(10, 2) DEFAULT 0.00,
    weekly_rate NUMERIC(10, 2) DEFAULT 0.00,
    deposit_paid NUMERIC(10, 2) DEFAULT 0.00,
    balance_due NUMERIC(10, 2) DEFAULT 0.00,
    total_paid NUMERIC(10, 2) DEFAULT 0.00,
    contract_start_date DATE,
    contract_end_date DATE,
    term_months INTEGER DEFAULT 18,
    risk_score INTEGER DEFAULT 90,
    payment_score INTEGER DEFAULT 100,
    incident_count INTEGER DEFAULT 0,
    delivery_platform TEXT,
    primary_platform TEXT,
    delivery_apps JSONB DEFAULT '[]'::jsonb,
    risk_tier TEXT DEFAULT 'low',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    yoco_customer_token TEXT,
    referred_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VEHICLES TABLE (Asset Register & Telematics)
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    registration_plate TEXT UNIQUE NOT NULL,
    vin TEXT,
    engine_number TEXT,
    bike_model_id TEXT,
    make TEXT DEFAULT 'Bajaj',
    model TEXT NOT NULL DEFAULT 'Boxer 150 HD',
    year INTEGER DEFAULT 2026,
    category TEXT DEFAULT 'boxer',
    condition TEXT DEFAULT 'new',
    assigned_driver_id TEXT,
    assigned_driver_name TEXT,
    status TEXT NOT NULL DEFAULT 'available',
    odometer_km INTEGER DEFAULT 0,
    mileage_km INTEGER DEFAULT 0,
    next_service_km INTEGER DEFAULT 5000,
    next_service_mileage_km INTEGER DEFAULT 5000,
    last_service_mileage_km INTEGER DEFAULT 0,
    last_service_date DATE,
    tracker_device_id TEXT,
    gps_device_imei TEXT,
    tracker_provider TEXT DEFAULT 'Cartrack SA',
    battery_health_percent INTEGER DEFAULT 100,
    fuel_level_percent INTEGER DEFAULT 100,
    is_ignition_on BOOLEAN DEFAULT FALSE,
    ignition_status BOOLEAN DEFAULT FALSE,
    immobilizer_locked BOOLEAN DEFAULT FALSE,
    latitude NUMERIC(10, 6) DEFAULT -26.0963,
    longitude NUMERIC(10, 6) DEFAULT 27.9734,
    current_lat NUMERIC(10, 6) DEFAULT -26.0963,
    current_lng NUMERIC(10, 6) DEFAULT 27.9734,
    last_location_address TEXT DEFAULT '304 Tungsten Rd, Strijdom Park, Randburg',
    last_ping_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    insurance_policy_number TEXT,
    license_disk_expiry_date DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- In-place Migrations for existing vehicles tables
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS make TEXT DEFAULT 'Bajaj';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'boxer';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'new';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS bike_model_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS odometer_km INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS next_service_km INTEGER DEFAULT 5000;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tracker_device_id TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tracker_provider TEXT DEFAULT 'Cartrack SA';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_level_percent INTEGER DEFAULT 100;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_ignition_on BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 6) DEFAULT -26.0963;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS longitude NUMERIC(10, 6) DEFAULT 27.9734;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_location_address TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_ping_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS license_disk_expiry_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- In-place Migrations for existing drivers tables
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS id_or_passport_number TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS citizenship TEXT DEFAULT 'south_african';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS nationality_country TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS suburb TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Randburg';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS assigned_bike_vin_or_plate TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS assigned_bike_name TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS weekly_rate NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS term_months INTEGER DEFAULT 18;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS primary_platform TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS delivery_apps JSONB DEFAULT '[]'::jsonb;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS yoco_customer_token TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. PARTS INVENTORY TABLE
CREATE TABLE IF NOT EXISTS parts_inventory (
    id TEXT PRIMARY KEY,
    sku TEXT,
    part_number TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity_in_stock INTEGER DEFAULT 0,
    min_threshold INTEGER DEFAULT 5,
    minimum_threshold INTEGER DEFAULT 5,
    cost_price_zar NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selling_price_zar NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    compatible_models JSONB DEFAULT '[]'::jsonb,
    supplier_name TEXT,
    supplier TEXT,
    last_restocked_date DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REPAIRS AND SERVICES TABLE
CREATE TABLE IF NOT EXISTS repairs_and_services (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    vehicle_plate TEXT,
    vehicle_reg TEXT,
    driver_id TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    service_type TEXT NOT NULL,
    odometer_km INTEGER,
    mileage_at_service_km INTEGER,
    cost_zar NUMERIC(10, 2) DEFAULT 0.00,
    total_cost_zar NUMERIC(10, 2) DEFAULT 0.00,
    technician_name TEXT,
    garage_location TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    parts_used JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    invoice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TRAFFIC FINES TABLE (AARTO Infringements)
CREATE TABLE IF NOT EXISTS traffic_fines (
    id TEXT PRIMARY KEY,
    notice_number TEXT UNIQUE NOT NULL,
    vehicle_id TEXT NOT NULL,
    vehicle_plate TEXT,
    vehicle_reg TEXT,
    driver_id TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    issuing_authority TEXT NOT NULL DEFAULT 'JMPD',
    infringement_type TEXT,
    location TEXT,
    municipality TEXT,
    amount_zar NUMERIC(10, 2),
    fine_amount NUMERIC(10, 2),
    discounted_amount_zar NUMERIC(10, 2),
    discounted_amount NUMERIC(10, 2),
    violation_date TIMESTAMP WITH TIME ZONE,
    infringement_date TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued_to_driver',
    aarto_status TEXT DEFAULT 'notice_issued',
    payment_status TEXT DEFAULT 'allocated_to_driver',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. YOCO TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS yoco_transactions (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    amount_zar NUMERIC(10, 2) NOT NULL,
    fee_zar NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_zar NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    allocation TEXT NOT NULL DEFAULT 'weekly_rental',
    channel TEXT NOT NULL DEFAULT 'payment_link',
    yoco_charge_id TEXT,
    status TEXT NOT NULL DEFAULT 'successful',
    reconciliation_status TEXT DEFAULT 'reconciled_ledger',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    card_last4 TEXT,
    card_brand TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. RENTAL AGREEMENTS TABLE
CREATE TABLE IF NOT EXISTS rental_agreements (
    id TEXT PRIMARY KEY,
    agreement_number TEXT,
    driver_id TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    vehicle_plate TEXT,
    vehicle_reg TEXT,
    agreement_type TEXT NOT NULL DEFAULT 'rent_to_own',
    term_months INTEGER DEFAULT 18,
    weekly_rate_zar NUMERIC(10, 2) NOT NULL,
    deposit_amount_zar NUMERIC(10, 2) DEFAULT 0.00,
    deposit_held_zar NUMERIC(10, 2) DEFAULT 0.00,
    deposit_paid BOOLEAN DEFAULT TRUE,
    contract_term_weeks INTEGER DEFAULT 52,
    weeks_elapsed INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    expected_end_date DATE,
    actual_end_date DATE,
    total_contract_value_zar NUMERIC(10, 2) DEFAULT 0.00,
    total_paid_zar NUMERIC(10, 2) DEFAULT 0.00,
    remaining_balance_zar NUMERIC(10, 2) DEFAULT 0.00,
    is_completed BOOLEAN DEFAULT FALSE,
    signature_data_url TEXT,
    contract_pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    terms_version TEXT DEFAULT 'v2026.1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. DRIVER REFERRALS TABLE
CREATE TABLE IF NOT EXISTS driver_referrals (
    id TEXT PRIMARY KEY,
    referrer_driver_id TEXT,
    referring_driver_id TEXT,
    referrer_driver_name TEXT,
    referring_driver_name TEXT,
    referred_applicant_name TEXT NOT NULL,
    referred_phone TEXT,
    referred_applicant_phone TEXT,
    referral_date DATE DEFAULT CURRENT_DATE,
    reward_amount_zar NUMERIC(10, 2) NOT NULL DEFAULT 350.00,
    bonus_amount_zar NUMERIC(10, 2) DEFAULT 350.00,
    status TEXT NOT NULL DEFAULT 'pending_onboarding',
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. FLAGGED RISK REGISTRY (Internal Company Defaulter & Incident Log)
CREATE TABLE IF NOT EXISTS flagged_risk_registry (
    id TEXT PRIMARY KEY,
    driver_id TEXT,
    full_name TEXT NOT NULL,
    id_or_passport_number TEXT NOT NULL,
    phone TEXT,
    whatsapp_number TEXT,
    nationality_country TEXT DEFAULT 'South Africa',
    risk_tier TEXT NOT NULL DEFAULT 'high',
    flag_reason TEXT NOT NULL,
    reason_description TEXT NOT NULL,
    outstanding_balance_zar NUMERIC(10, 2) DEFAULT 0.00,
    police_case_number TEXT,
    reported_by_operator TEXT DEFAULT 'Randburg Workshop Hub',
    reported_date DATE DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'active',
    is_cross_operator_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    logo_url TEXT,
    hero_image_url TEXT,
    hero_title TEXT,
    hero_subtitle TEXT,
    key TEXT,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS & Security Enablement with Full Anon & Authenticated Access for Operations
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs_and_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE yoco_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE flagged_risk_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop legacy restrictive policies to prevent conflicts
DROP POLICY IF EXISTS "Public Read Bikes" ON bikes;
DROP POLICY IF EXISTS "Public Read Settings" ON site_settings;
DROP POLICY IF EXISTS "Public Insert Applications" ON applications;
DROP POLICY IF EXISTS "Authenticated Full Access Applications" ON applications;
DROP POLICY IF EXISTS "Authenticated Full Access Drivers" ON drivers;
DROP POLICY IF EXISTS "Authenticated Full Access Vehicles" ON vehicles;
DROP POLICY IF EXISTS "Authenticated Full Access Parts" ON parts_inventory;
DROP POLICY IF EXISTS "Authenticated Full Access Repairs" ON repairs_and_services;
DROP POLICY IF EXISTS "Authenticated Full Access Fines" ON traffic_fines;
DROP POLICY IF EXISTS "Authenticated Full Access Transactions" ON yoco_transactions;
DROP POLICY IF EXISTS "Authenticated Full Access Agreements" ON rental_agreements;
DROP POLICY IF EXISTS "Authenticated Full Access Referrals" ON driver_referrals;
DROP POLICY IF EXISTS "Authenticated Full Access Risk Registry" ON flagged_risk_registry;
DROP POLICY IF EXISTS "Authenticated Full Access Settings" ON site_settings;

-- Create Open Operational Policies (allowing staff portal anon key and authenticated users full access)
CREATE POLICY "Allow Full Fleet Access Applications" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Bikes" ON bikes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Drivers" ON drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Parts" ON parts_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Repairs" ON repairs_and_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Fines" ON traffic_fines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Transactions" ON yoco_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Agreements" ON rental_agreements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Referrals" ON driver_referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Risk Registry" ON flagged_risk_registry FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow Full Fleet Access Settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
`;
