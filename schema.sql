-- ============================================================================
-- FLEETCO / DYNAMIC RENTAL - COMPREHENSIVE PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ============================================================================
-- This script provisions the complete 11-table relational database architecture
-- for Fleet Management, Rider Onboarding, Live GPS Telematics, Maintenance, 
-- AARTO Traffic Fines, Yoco Payments, and Rental & Sales Agreements.
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. APPLICANTS / ONBOARDING PIPELINE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY DEFAULT ('app-' || gen_random_uuid()),
  ref_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_review' 
    CHECK (status IN ('pending_review', 'docs_verified', 'approved_for_collection', 'contract_signed', 'needs_more_info', 'declined')),
  
  -- Bike Choice & Terms
  bike_id TEXT NOT NULL,
  bike_name TEXT NOT NULL,
  bike_condition TEXT NOT NULL CHECK (bike_condition IN ('new', 'used')),
  term_months INT NOT NULL DEFAULT 18,
  weekly_rate NUMERIC(10,2) NOT NULL DEFAULT 750.00,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  
  -- Applicant Identification & Contact
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  citizenship TEXT NOT NULL DEFAULT 'south_african' 
    CHECK (citizenship IN ('south_african', 'non_south_african', 'foreign_national')),
  id_or_passport_number TEXT NOT NULL,
  nationality_country TEXT,
  
  -- Residential Address
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  province TEXT DEFAULT 'Gauteng',
  postal_code TEXT,
  
  -- Alternative Contact / Next of Kin
  alternative_contact_name TEXT,
  alternative_contact_phone TEXT,
  
  -- Courier & Delivery Experience
  primary_platform TEXT DEFAULT 'Checkers Sixty60',
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  delivery_experience TEXT,
  approx_weekly_earnings NUMERIC(10,2) DEFAULT 3500.00,
  referred_by TEXT,
  credit_score TEXT,
  
  -- KYC Documents & Verification
  documents JSONB DEFAULT '{}'::jsonb,
  verification JSONB DEFAULT '{"idVerified":false,"licenseVerified":false,"permitVerified":false,"proofVerified":false}'::jsonb,
  
  -- Digital Signature & Contract Terms
  signature_data_url TEXT,
  deposit_acknowledged BOOLEAN DEFAULT true,
  terms_agreed BOOLEAN DEFAULT true,
  
  -- Collection & Admin
  collection_date TEXT,
  assigned_bike_vin_or_plate TEXT,
  admin_notes TEXT,
  timeline JSONB DEFAULT '[]'::jsonb
);

-- ============================================================================
-- 2. MOTORBIKE CATALOG & MODEL REGISTER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.bikes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('boxer', 'bigboy', 'electric', 'hero')),
  is_available BOOLEAN DEFAULT true,
  is_coming_soon BOOLEAN DEFAULT false,
  image TEXT,
  badge TEXT,
  fuel_type TEXT DEFAULT 'Petrol 4-Stroke',
  engine_capacity TEXT DEFAULT '150cc',
  tank_capacity TEXT,
  range_per_charge TEXT,
  delivery_box_ready BOOLEAN DEFAULT true,
  pricing JSONB NOT NULL,
  key_features JSONB DEFAULT '[]'::jsonb,
  recommended_for TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. ACTIVE DRIVERS & RISK DIRECTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY DEFAULT ('drv-' || gen_random_uuid()),
  application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
  ref_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  id_or_passport_number TEXT NOT NULL,
  citizenship TEXT NOT NULL DEFAULT 'south_african',
  nationality_country TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'suspended', 'completed', 'in_arrears', 'defaulted')),
  assigned_vehicle_id TEXT,
  assigned_bike_vin_or_plate TEXT,
  assigned_bike_name TEXT,
  weekly_rate NUMERIC(10,2) NOT NULL DEFAULT 750.00,
  balance_due NUMERIC(10,2) NOT NULL DEFAULT 0.00, -- Positive = Arrears, Negative = Advance Credit
  deposit_paid NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  contract_start_date DATE DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  term_months INT DEFAULT 18,
  primary_platform TEXT DEFAULT 'Checkers Sixty60',
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  risk_tier TEXT DEFAULT 'low' CHECK (risk_tier IN ('low', 'medium', 'high', 'critical')),
  risk_score INT DEFAULT 90 CHECK (risk_score BETWEEN 0 AND 100),
  payment_score INT DEFAULT 100 CHECK (payment_score BETWEEN 0 AND 100),
  incident_count INT DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0.00,
  yoco_customer_token TEXT,
  referred_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. VEHICLES & TELEMATICS ASSET REGISTER
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY DEFAULT ('veh-' || gen_random_uuid()),
  vin TEXT UNIQUE NOT NULL,
  engine_number TEXT UNIQUE NOT NULL,
  registration_plate TEXT UNIQUE NOT NULL,
  bike_model_id TEXT,
  make TEXT NOT NULL DEFAULT 'Bajaj',
  model TEXT NOT NULL DEFAULT 'Boxer 150 HD',
  year INT NOT NULL DEFAULT 2025,
  category TEXT NOT NULL DEFAULT 'boxer',
  condition TEXT NOT NULL DEFAULT 'new' CHECK (condition IN ('new', 'used')),
  status TEXT NOT NULL DEFAULT 'available' 
    CHECK (status IN ('available', 'assigned', 'in_maintenance', 'impounded', 'retired')),
  assigned_driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  assigned_driver_name TEXT,
  odometer_km INT NOT NULL DEFAULT 0,
  next_service_km INT NOT NULL DEFAULT 5000,
  last_service_date DATE,
  tracker_device_id TEXT,
  tracker_provider TEXT DEFAULT 'Cartrack SA',
  battery_health_percent INT DEFAULT 100,
  fuel_level_percent INT DEFAULT 100,
  is_ignition_on BOOLEAN DEFAULT false,
  latitude NUMERIC(10,6) DEFAULT -26.0934,
  longitude NUMERIC(10,6) DEFAULT 27.9942,
  last_location_address TEXT DEFAULT '304 Tungsten Rd, Randburg',
  last_ping_time TIMESTAMPTZ DEFAULT NOW(),
  insurance_policy_number TEXT,
  license_disk_expiry_date DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. SPARE PARTS & CONSUMABLES INVENTORY
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.parts_inventory (
  id TEXT PRIMARY KEY DEFAULT ('part-' || gen_random_uuid()),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'helmets', 'delivery_boxes', 'phone_mounts', 'brake_pads', 
    'chains_sprockets', 'tires_tubes', 'engine_oil', 'batteries', 'cables_levers', 'general'
  )),
  quantity_in_stock INT NOT NULL DEFAULT 0,
  min_threshold INT NOT NULL DEFAULT 5,
  cost_price_zar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price_zar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  compatible_models JSONB DEFAULT '[]'::jsonb,
  supplier_name TEXT,
  last_restocked_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. MAINTENANCE, WORK ORDERS & 5,000 KM SCHEDULED SERVICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.repairs_and_services (
  id TEXT PRIMARY KEY DEFAULT ('srv-' || gen_random_uuid()),
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'routine_5000km', 'major_overhaul', 'brake_replacement', 
    'tire_change', 'accident_repair', 'electrical_tracker', 'cosmetic_box'
  )),
  odometer_km INT NOT NULL,
  cost_zar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  technician_name TEXT NOT NULL DEFAULT 'Fleet Technician',
  garage_location TEXT DEFAULT 'Randburg Workshop - 304 Tungsten Rd',
  service_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed' 
    CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  parts_used JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. TRAFFIC FINES & AARTO INFRINGEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.traffic_fines (
  id TEXT PRIMARY KEY DEFAULT ('fine-' || gen_random_uuid()),
  notice_number TEXT UNIQUE NOT NULL,
  infringement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  location TEXT NOT NULL,
  municipality TEXT DEFAULT 'JMPD - City of Johannesburg',
  infringement_type TEXT NOT NULL,
  amount_zar NUMERIC(10,2) NOT NULL,
  discounted_amount_zar NUMERIC(10,2),
  due_date DATE NOT NULL,
  aarto_status TEXT NOT NULL DEFAULT 'notice_issued' 
    CHECK (aarto_status IN ('notice_issued', 'courtesy_letter', 'enforcement_order', 'paid', 'transferred_to_driver', 'contested')),
  payment_status TEXT NOT NULL DEFAULT 'allocated_to_driver' 
    CHECK (payment_status IN ('unpaid', 'allocated_to_driver', 'deducted_from_earnings', 'paid_by_company')),
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. YOCO TRANSACTIONS & SETTLEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.yoco_transactions (
  id TEXT PRIMARY KEY DEFAULT ('tx-' || gen_random_uuid()),
  yoco_charge_id TEXT UNIQUE NOT NULL,
  yoco_payment_link_id TEXT,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT NOT NULL,
  amount_zar NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'yoco_card_terminal', 'yoco_payment_link', 'yoco_recurring_token', 'instant_eft'
  )),
  allocation TEXT NOT NULL DEFAULT 'weekly_rental' CHECK (allocation IN (
    'weekly_rental', 'security_deposit', 'traffic_fine', 'repair_deductible', 'other'
  )),
  status TEXT NOT NULL DEFAULT 'successful' 
    CHECK (status IN ('successful', 'pending', 'failed', 'refunded')),
  yoco_fee_zar NUMERIC(10,2) DEFAULT 0.00,
  net_amount_zar NUMERIC(10,2) NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'reconciled' 
    CHECK (reconciliation_status IN ('reconciled', 'unallocated', 'disputed')),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  yoco_metadata JSONB DEFAULT '{}'::jsonb
);

-- ============================================================================
-- 9. RENTAL & SALES AGREEMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id TEXT PRIMARY KEY DEFAULT ('agr-' || gen_random_uuid()),
  agreement_number TEXT UNIQUE NOT NULL,
  driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  vehicle_plate TEXT NOT NULL,
  agreement_type TEXT NOT NULL DEFAULT 'rent_to_own' 
    CHECK (agreement_type IN ('rent_to_own', 'pure_commercial_rental')),
  term_months INT NOT NULL DEFAULT 18,
  weekly_rate_zar NUMERIC(10,2) NOT NULL DEFAULT 750.00,
  deposit_amount_zar NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  deposit_paid BOOLEAN DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date DATE NOT NULL,
  actual_end_date DATE,
  total_contract_value_zar NUMERIC(12,2) NOT NULL,
  total_paid_zar NUMERIC(12,2) DEFAULT 0.00,
  remaining_balance_zar NUMERIC(12,2) NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  signature_data_url TEXT,
  contract_pdf_url TEXT,
  terms_version TEXT DEFAULT 'v2026.1-NATIS',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. DRIVER REFERRAL PROGRAM
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id TEXT PRIMARY KEY DEFAULT ('ref-' || gen_random_uuid()),
  referrer_driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  referrer_driver_name TEXT NOT NULL,
  referred_applicant_name TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referral_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending_onboarding' 
    CHECK (status IN ('pending_onboarding', 'active_driving', 'bonus_eligible', 'paid_out')),
  reward_amount_zar NUMERIC(10,2) NOT NULL DEFAULT 350.00,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. SITE CUSTOMIZATION & BRANDING SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  logo_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repairs_and_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_fines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yoco_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Allow Read/Write Policies for Authenticated & Anon Portal Operations
CREATE POLICY "Allow full access to applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to bikes" ON public.bikes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to parts_inventory" ON public.parts_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to repairs_and_services" ON public.repairs_and_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to traffic_fines" ON public.traffic_fines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to yoco_transactions" ON public.yoco_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to rental_agreements" ON public.rental_agreements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to driver_referrals" ON public.driver_referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- QUERY OPTIMIZATION INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_applications_ref_number ON public.applications(ref_number);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_vehicle ON public.drivers(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration_plate ON public.vehicles(registration_plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_repairs_vehicle_id ON public.repairs_and_services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_driver_id ON public.traffic_fines(driver_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_vehicle_plate ON public.traffic_fines(vehicle_plate);
CREATE INDEX IF NOT EXISTS idx_yoco_tx_driver_id ON public.yoco_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_driver_id ON public.rental_agreements(driver_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_vehicle_id ON public.rental_agreements(vehicle_id);
