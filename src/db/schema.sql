-- ============================================================================
-- FLEETCO / DYNAMIC RENTAL - COMPREHENSIVE PRODUCTION DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- ============================================================================
-- 11 Tables: applications, bikes, drivers, vehicles, parts_inventory, 
-- repairs_and_services, traffic_fines, yoco_transactions, rental_agreements, 
-- driver_referrals, site_settings.
-- ============================================================================

-- Refer to /schema.sql for the complete standalone script.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY DEFAULT ('app-' || gen_random_uuid()),
  ref_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_review',
  bike_id TEXT NOT NULL,
  bike_name TEXT NOT NULL,
  bike_condition TEXT NOT NULL,
  term_months INT NOT NULL DEFAULT 18,
  weekly_rate NUMERIC(10,2) NOT NULL DEFAULT 750.00,
  deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  citizenship TEXT NOT NULL DEFAULT 'south_african',
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
  signature_data_url TEXT,
  deposit_acknowledged BOOLEAN DEFAULT true,
  terms_agreed BOOLEAN DEFAULT true,
  timeline JSONB DEFAULT '[]'::jsonb
);

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
  pricing JSONB NOT NULL,
  key_features JSONB DEFAULT '[]'::jsonb,
  recommended_for TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  condition TEXT NOT NULL DEFAULT 'new',
  status TEXT NOT NULL DEFAULT 'available',
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parts_inventory (
  id TEXT PRIMARY KEY DEFAULT ('part-' || gen_random_uuid()),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  min_threshold INT NOT NULL DEFAULT 5,
  cost_price_zar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  selling_price_zar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.repairs_and_services (
  id TEXT PRIMARY KEY DEFAULT ('srv-' || gen_random_uuid()),
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  service_type TEXT NOT NULL,
  odometer_km INT NOT NULL,
  cost_zar NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  technician_name TEXT NOT NULL DEFAULT 'Fleet Technician',
  garage_location TEXT DEFAULT 'Randburg Workshop - 304 Tungsten Rd',
  service_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  aarto_status TEXT NOT NULL DEFAULT 'notice_issued',
  payment_status TEXT NOT NULL DEFAULT 'allocated_to_driver',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.yoco_transactions (
  id TEXT PRIMARY KEY DEFAULT ('tx-' || gen_random_uuid()),
  yoco_charge_id TEXT UNIQUE NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT NOT NULL,
  amount_zar NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  payment_method TEXT NOT NULL,
  allocation TEXT NOT NULL DEFAULT 'weekly_rental',
  status TEXT NOT NULL DEFAULT 'successful',
  yoco_fee_zar NUMERIC(10,2) DEFAULT 0.00,
  net_amount_zar NUMERIC(10,2) NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  transaction_date TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id TEXT PRIMARY KEY DEFAULT ('agr-' || gen_random_uuid()),
  agreement_number TEXT UNIQUE NOT NULL,
  driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  vehicle_plate TEXT NOT NULL,
  agreement_type TEXT NOT NULL DEFAULT 'rent_to_own',
  term_months INT NOT NULL DEFAULT 18,
  weekly_rate_zar NUMERIC(10,2) NOT NULL DEFAULT 750.00,
  deposit_amount_zar NUMERIC(10,2) NOT NULL DEFAULT 1000.00,
  deposit_paid BOOLEAN DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date DATE NOT NULL,
  total_contract_value_zar NUMERIC(12,2) NOT NULL,
  total_paid_zar NUMERIC(12,2) DEFAULT 0.00,
  remaining_balance_zar NUMERIC(12,2) NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id TEXT PRIMARY KEY DEFAULT ('ref-' || gen_random_uuid()),
  referrer_driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  referrer_driver_name TEXT NOT NULL,
  referred_applicant_name TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referral_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending_onboarding',
  reward_amount_zar NUMERIC(10,2) NOT NULL DEFAULT 350.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  logo_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
