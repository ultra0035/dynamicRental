-- ==============================================================================
-- FLEETCO / DYNAMIC RENTAL - COMPREHENSIVE PRODUCTION DATABASE SCHEMA
-- PostgreSQL / Supabase Migration Script
-- Version: 2.2.0 (Resilient Fresh Setup & Migration)
-- ==============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. APPLICATIONS TABLE (Rider Onboarding Pipeline)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY DEFAULT ('app-' || gen_random_uuid()),
  ref_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_review',
  bike_id TEXT,
  bike_name TEXT,
  bike_condition TEXT,
  term_months INT DEFAULT 18,
  weekly_rate NUMERIC(10,2) DEFAULT 750.00,
  deposit_amount NUMERIC(10,2) DEFAULT 1000.00,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  citizenship TEXT DEFAULT 'south_african',
  id_or_passport_number TEXT NOT NULL,
  nationality_country TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  primary_platform TEXT DEFAULT 'Checkers Sixty60',
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  delivery_experience TEXT,
  approx_weekly_earnings NUMERIC(10,2) DEFAULT 3500.00,
  referred_by TEXT,
  documents JSONB DEFAULT '{}'::jsonb,
  verification JSONB DEFAULT '{"idVerified":false,"licenseVerified":false}'::jsonb,
  deposit_paid BOOLEAN DEFAULT false,
  contract_signed BOOLEAN DEFAULT false,
  credit_score INT,
  risk_level TEXT DEFAULT 'low',
  assigned_bike_id TEXT,
  assigned_vehicle_reg TEXT,
  rejection_reason TEXT,
  internal_notes TEXT
);

-- ==============================================================================
-- 2. BIKES CATALOG TABLE (Showroom Inventory)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.bikes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  brand TEXT NOT NULL,
  category TEXT NOT NULL,
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

-- ==============================================================================
-- 3. DRIVERS TABLE (Active Couriers & Customers)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY DEFAULT ('drv-' || gen_random_uuid()),
  application_id TEXT,
  ref_number TEXT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  id_or_passport_number TEXT NOT NULL,
  citizenship TEXT DEFAULT 'south_african',
  nationality_country TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  status TEXT NOT NULL DEFAULT 'active',
  assigned_vehicle_id TEXT,
  assigned_bike_vin_or_plate TEXT,
  assigned_bike_name TEXT,
  weekly_rate NUMERIC(10,2) NOT NULL DEFAULT 750.00,
  balance_due NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  deposit_paid NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  contract_start_date DATE DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  term_months INT DEFAULT 18,
  primary_platform TEXT DEFAULT 'Checkers Sixty60',
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  risk_tier TEXT DEFAULT 'low',
  risk_score INT DEFAULT 90,
  payment_score INT DEFAULT 100,
  incident_count INT DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0.00,
  yoco_customer_token TEXT,
  referred_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure assigned_vehicle_id exists if table was created in an older iteration
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS assigned_vehicle_id TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS assigned_bike_vin_or_plate TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS assigned_bike_name TEXT;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS risk_score INT DEFAULT 90;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS payment_score INT DEFAULT 100;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS incident_count INT DEFAULT 0;

-- ==============================================================================
-- 4. VEHICLES TABLE (Asset Register & Telematics)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY DEFAULT ('veh-' || gen_random_uuid()),
  registration_plate TEXT UNIQUE NOT NULL,
  vin TEXT UNIQUE NOT NULL,
  engine_number TEXT,
  bike_id TEXT,
  model_name TEXT NOT NULL,
  year INT NOT NULL DEFAULT 2025,
  color TEXT DEFAULT 'Fleet White',
  status TEXT NOT NULL DEFAULT 'available_showroom',
  current_driver_id TEXT,
  current_driver_name TEXT,
  current_mileage_km INT NOT NULL DEFAULT 0,
  last_service_mileage_km INT NOT NULL DEFAULT 0,
  next_service_mileage_km INT NOT NULL DEFAULT 5000,
  telematics_imei TEXT,
  telematics_battery_health INT DEFAULT 98,
  last_known_location TEXT DEFAULT 'Randburg Fleet Hub',
  last_telematics_ping TIMESTAMPTZ DEFAULT NOW(),
  is_immobilized BOOLEAN DEFAULT false,
  ignition_state BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 5. PARTS INVENTORY TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parts_inventory (
  id TEXT PRIMARY KEY DEFAULT ('prt-' || gen_random_uuid()),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  compatible_models JSONB DEFAULT '[]'::jsonb,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  min_reorder_level INT NOT NULL DEFAULT 5,
  unit_cost_zar NUMERIC(10,2) NOT NULL,
  retail_price_zar NUMERIC(10,2) NOT NULL,
  supplier_name TEXT,
  location_bin TEXT DEFAULT 'Shelf A-1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 6. REPAIRS AND SERVICES TABLE (5,000 km Maintenance)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.repairs_and_services (
  id TEXT PRIMARY KEY DEFAULT ('srv-' || gen_random_uuid()),
  vehicle_id TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  service_type TEXT NOT NULL,
  description TEXT NOT NULL,
  mileage_at_service_km INT NOT NULL,
  parts_used JSONB DEFAULT '[]'::jsonb,
  total_parts_cost_zar NUMERIC(10,2) DEFAULT 0.00,
  labor_cost_zar NUMERIC(10,2) DEFAULT 0.00,
  total_cost_zar NUMERIC(10,2) NOT NULL,
  technician_name TEXT NOT NULL,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_service_due_km INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 7. TRAFFIC FINES TABLE (AARTO Infringements)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.traffic_fines (
  id TEXT PRIMARY KEY DEFAULT ('fine-' || gen_random_uuid()),
  notice_number TEXT UNIQUE NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  violation_type TEXT NOT NULL,
  location TEXT NOT NULL,
  issuing_authority TEXT NOT NULL DEFAULT 'JMPD',
  violation_date TIMESTAMPTZ NOT NULL,
  due_date DATE NOT NULL,
  discounted_amount_zar NUMERIC(10,2) NOT NULL,
  full_amount_zar NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'allocated_to_driver',
  proof_of_payment_url TEXT,
  redirect_letter_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 8. YOCO TRANSACTIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.yoco_transactions (
  id TEXT PRIMARY KEY DEFAULT ('tx-' || gen_random_uuid()),
  yoco_charge_id TEXT,
  driver_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  amount_zar NUMERIC(10,2) NOT NULL,
  fee_zar NUMERIC(10,2) DEFAULT 0.00,
  net_zar NUMERIC(10,2) DEFAULT 0.00,
  allocation TEXT NOT NULL DEFAULT 'weekly_rental',
  channel TEXT NOT NULL DEFAULT 'yoco_link',
  payment_method TEXT DEFAULT 'visa_mastercard',
  status TEXT NOT NULL DEFAULT 'successful',
  notes TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 9. RENTAL AGREEMENTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id TEXT PRIMARY KEY DEFAULT ('agr-' || gen_random_uuid()),
  agreement_number TEXT UNIQUE NOT NULL,
  driver_id TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  agreement_type TEXT NOT NULL DEFAULT 'rent_to_own',
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

-- ==============================================================================
-- 10. DRIVER REFERRAL PROGRAM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id TEXT PRIMARY KEY DEFAULT ('ref-' || gen_random_uuid()),
  referrer_driver_id TEXT NOT NULL,
  referrer_driver_name TEXT NOT NULL,
  referred_applicant_name TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referral_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending_onboarding',
  reward_amount_zar NUMERIC(10,2) NOT NULL DEFAULT 350.00,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 11. SITE CUSTOMIZATION & BRANDING SETTINGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  logo_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
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

-- Drop existing policies if already defined to prevent collision
DROP POLICY IF EXISTS "Allow full access to applications" ON public.applications;
DROP POLICY IF EXISTS "Allow full access to bikes" ON public.bikes;
DROP POLICY IF EXISTS "Allow full access to drivers" ON public.drivers;
DROP POLICY IF EXISTS "Allow full access to vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Allow full access to parts_inventory" ON public.parts_inventory;
DROP POLICY IF EXISTS "Allow full access to repairs_and_services" ON public.repairs_and_services;
DROP POLICY IF EXISTS "Allow full access to traffic_fines" ON public.traffic_fines;
DROP POLICY IF EXISTS "Allow full access to yoco_transactions" ON public.yoco_transactions;
DROP POLICY IF EXISTS "Allow full access to rental_agreements" ON public.rental_agreements;
DROP POLICY IF EXISTS "Allow full access to driver_referrals" ON public.driver_referrals;
DROP POLICY IF EXISTS "Allow full access to site_settings" ON public.site_settings;

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

-- ==============================================================================
-- QUERY OPTIMIZATION INDEXES
-- ==============================================================================
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
