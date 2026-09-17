// Complete PostgreSQL / Supabase Schema for FleetCO (11 Tables)
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- FLEETCO MOTORCYCLE FLEET MANAGEMENT PLATFORM
-- PRODUCTION DATABASE SCHEMA & SECURITY POLICIES (POSTGRESQL / SUPABASE)
-- Version: 2.1.0
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. APPLICATIONS TABLE (Onboarding Pipeline)
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    id_or_passport_number TEXT NOT NULL,
    citizenship TEXT NOT NULL DEFAULT 'sa_citizen',
    phone_number TEXT NOT NULL,
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
    id_number TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    assigned_vehicle_id TEXT,
    assigned_vehicle_reg TEXT,
    vehicle_model TEXT,
    weekly_rate_zar NUMERIC(10, 2) DEFAULT 0.00,
    deposit_paid NUMERIC(10, 2) DEFAULT 0.00,
    balance_due NUMERIC(10, 2) DEFAULT 0.00,
    total_paid NUMERIC(10, 2) DEFAULT 0.00,
    risk_score INTEGER DEFAULT 90,
    payment_score INTEGER DEFAULT 100,
    incident_count INTEGER DEFAULT 0,
    delivery_platform TEXT,
    risk_tier TEXT DEFAULT 'low_risk',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. VEHICLES TABLE (Asset Register & Telematics)
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    registration_plate TEXT UNIQUE NOT NULL,
    vin TEXT,
    engine_number TEXT,
    model TEXT NOT NULL,
    year INTEGER,
    assigned_driver_id TEXT,
    assigned_driver_name TEXT,
    status TEXT NOT NULL DEFAULT 'available_showroom',
    mileage_km INTEGER DEFAULT 0,
    last_service_mileage_km INTEGER DEFAULT 0,
    next_service_mileage_km INTEGER DEFAULT 5000,
    battery_health_percent INTEGER DEFAULT 100,
    gps_device_imei TEXT,
    ignition_status BOOLEAN DEFAULT FALSE,
    immobilizer_locked BOOLEAN DEFAULT FALSE,
    current_lat NUMERIC(10, 6) DEFAULT -26.0963,
    current_lng NUMERIC(10, 6) DEFAULT 27.9734,
    last_ping_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PARTS INVENTORY TABLE
CREATE TABLE IF NOT EXISTS parts_inventory (
    id TEXT PRIMARY KEY,
    part_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity_in_stock INTEGER DEFAULT 0,
    minimum_threshold INTEGER DEFAULT 5,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    retail_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    supplier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. REPAIRS AND SERVICES TABLE
CREATE TABLE IF NOT EXISTS repairs_and_services (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    vehicle_reg TEXT NOT NULL,
    driver_id TEXT,
    driver_name TEXT,
    service_type TEXT NOT NULL,
    mileage_at_service_km INTEGER NOT NULL,
    total_cost_zar NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    technician_name TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    service_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TRAFFIC FINES TABLE (AARTO Infringements)
CREATE TABLE IF NOT EXISTS traffic_fines (
    id TEXT PRIMARY KEY,
    notice_number TEXT UNIQUE NOT NULL,
    vehicle_id TEXT NOT NULL,
    vehicle_reg TEXT NOT NULL,
    driver_id TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    issuing_authority TEXT NOT NULL DEFAULT 'JMPD',
    fine_amount NUMERIC(10, 2) NOT NULL,
    discounted_amount NUMERIC(10, 2) NOT NULL,
    violation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued_to_driver',
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. RENTAL AGREEMENTS TABLE
CREATE TABLE IF NOT EXISTS rental_agreements (
    id TEXT PRIMARY KEY,
    driver_id TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    vehicle_reg TEXT NOT NULL,
    agreement_type TEXT NOT NULL DEFAULT 'rent_to_own',
    weekly_rate_zar NUMERIC(10, 2) NOT NULL,
    deposit_held_zar NUMERIC(10, 2) NOT NULL,
    contract_term_weeks INTEGER NOT NULL DEFAULT 52,
    weeks_elapsed INTEGER NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    contract_pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. DRIVER REFERRALS TABLE
CREATE TABLE IF NOT EXISTS driver_referrals (
    id TEXT PRIMARY KEY,
    referring_driver_id TEXT NOT NULL,
    referring_driver_name TEXT NOT NULL,
    referred_applicant_name TEXT NOT NULL,
    referred_applicant_phone TEXT NOT NULL,
    bonus_amount_zar NUMERIC(10, 2) NOT NULL DEFAULT 350.00,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. SITE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS & Security Enablement
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
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Bikes" ON bikes FOR SELECT USING (true);
CREATE POLICY "Public Read Settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Public Insert Applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated Full Access Applications" ON applications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Drivers" ON drivers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Vehicles" ON vehicles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Parts" ON parts_inventory FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Repairs" ON repairs_and_services FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Fines" ON traffic_fines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Transactions" ON yoco_transactions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Agreements" ON rental_agreements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Referrals" ON driver_referrals FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated Full Access Settings" ON site_settings FOR ALL USING (auth.role() = 'authenticated');
`;
