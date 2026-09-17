import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RiderApplication, Bike } from '../types';
import { INITIAL_APPLICATIONS } from '../data/initialApplications';
import { BIKES } from '../data/bikes';

// Safely obtain env variables without crashing
const envObj = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env || {} : {};
const SUPABASE_URL = envObj.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = envObj.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('http') &&
  !SUPABASE_URL.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const LOCAL_APPS_KEY = 'dynamic_rental_applications_v1';
const LOCAL_BIKES_KEY = 'dynamic_rental_bikes_v1';

// SQL Setup Schema for Supabase
export const SUPABASE_SQL_SCHEMA = `-- Dynamic Rental Supabase PostgreSQL Full Fleet Schema
-- Run this in your Supabase SQL Editor to initialize all tables & policies

-- 1. Applicants / Onboarding Pipeline
CREATE TABLE IF NOT EXISTS public.applications (
  id TEXT PRIMARY KEY,
  ref_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending_review',
  bike_id TEXT NOT NULL,
  bike_name TEXT NOT NULL,
  bike_condition TEXT NOT NULL,
  term_months INT NOT NULL,
  weekly_rate NUMERIC NOT NULL,
  deposit_amount NUMERIC NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  citizenship TEXT NOT NULL,
  id_or_passport_number TEXT NOT NULL,
  nationality_country TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  province TEXT DEFAULT 'Gauteng',
  postal_code TEXT,
  alternative_contact_name TEXT,
  alternative_contact_phone TEXT,
  primary_platform TEXT,
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  delivery_experience TEXT,
  approx_weekly_earnings NUMERIC,
  referred_by TEXT,
  credit_score TEXT,
  documents JSONB DEFAULT '{}'::jsonb,
  verification JSONB DEFAULT '{"idVerified":false,"licenseVerified":false}'::jsonb,
  signature_data_url TEXT,
  deposit_acknowledged BOOLEAN DEFAULT true,
  terms_agreed BOOLEAN DEFAULT true,
  collection_date TEXT,
  assigned_bike_vin_or_plate TEXT,
  admin_notes TEXT,
  timeline JSONB DEFAULT '[]'::jsonb
);

-- 2. Motorbike Catalog / Stock Master
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
  fuel_type TEXT,
  engine_capacity TEXT,
  tank_capacity TEXT,
  range_per_charge TEXT,
  delivery_box_ready BOOLEAN DEFAULT true,
  pricing JSONB NOT NULL,
  key_features JSONB DEFAULT '[]'::jsonb,
  recommended_for TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Active Drivers & Risk Directory
CREATE TABLE IF NOT EXISTS public.drivers (
  id TEXT PRIMARY KEY,
  application_id TEXT REFERENCES public.applications(id) ON DELETE SET NULL,
  ref_number TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  id_or_passport_number TEXT NOT NULL,
  citizenship TEXT NOT NULL,
  nationality_country TEXT,
  address TEXT,
  suburb TEXT,
  city TEXT DEFAULT 'Randburg',
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'completed', 'in_arrears', 'defaulted'
  assigned_vehicle_id TEXT,
  assigned_bike_vin_or_plate TEXT,
  assigned_bike_name TEXT,
  weekly_rate NUMERIC NOT NULL DEFAULT 650,
  balance_due NUMERIC NOT NULL DEFAULT 0, -- positive = overdue, negative = credit
  deposit_paid NUMERIC NOT NULL DEFAULT 0,
  contract_start_date DATE DEFAULT CURRENT_DATE,
  contract_end_date DATE,
  term_months INT DEFAULT 18,
  primary_platform TEXT,
  delivery_apps JSONB DEFAULT '[]'::jsonb,
  risk_tier TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  risk_score INT DEFAULT 85, -- 0 to 100
  payment_score INT DEFAULT 95, -- percentage on-time
  incident_count INT DEFAULT 0,
  total_paid NUMERIC DEFAULT 0,
  yoco_customer_token TEXT,
  referred_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vehicles & Asset Register
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  vin TEXT UNIQUE NOT NULL,
  engine_number TEXT UNIQUE NOT NULL,
  registration_plate TEXT UNIQUE NOT NULL,
  bike_model_id TEXT REFERENCES public.bikes(id) ON DELETE RESTRICT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL DEFAULT 'new',
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'assigned', 'in_maintenance', 'impounded', 'retired'
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
  latitude NUMERIC,
  longitude NUMERIC,
  last_location_address TEXT,
  last_ping_time TIMESTAMPTZ,
  insurance_policy_number TEXT,
  license_disk_expiry_date DATE,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Parts & Consumables Inventory
CREATE TABLE IF NOT EXISTS public.parts_inventory (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'helmets', 'delivery_boxes', 'phone_mounts', 'brake_pads', 'chains_sprockets', 'tires_tubes', 'engine_oil'
  quantity_in_stock INT NOT NULL DEFAULT 0,
  min_threshold INT NOT NULL DEFAULT 5,
  cost_price_zar NUMERIC NOT NULL,
  selling_price_zar NUMERIC NOT NULL,
  compatible_models JSONB DEFAULT '[]'::jsonb,
  supplier_name TEXT,
  last_restocked_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Maintenance, Repairs & Service History
CREATE TABLE IF NOT EXISTS public.repairs_and_services (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  service_type TEXT NOT NULL, -- 'routine_5000km', 'major_overhaul', 'brake_replacement', 'tire_change', 'accident_repair'
  odometer_km INT NOT NULL,
  cost_zar NUMERIC NOT NULL,
  technician_name TEXT NOT NULL,
  garage_location TEXT DEFAULT 'Randburg Workshop - 304 Tungsten Rd',
  service_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'cancelled'
  parts_used JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  invoice_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Traffic Fines & AARTO Infringements
CREATE TABLE IF NOT EXISTS public.traffic_fines (
  id TEXT PRIMARY KEY,
  notice_number TEXT UNIQUE NOT NULL,
  infringement_date DATE NOT NULL,
  vehicle_plate TEXT NOT NULL,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT,
  location TEXT NOT NULL,
  municipality TEXT DEFAULT 'JMPD - City of Johannesburg',
  infringement_type TEXT NOT NULL,
  amount_zar NUMERIC NOT NULL,
  discounted_amount_zar NUMERIC,
  due_date DATE NOT NULL,
  aarto_status TEXT NOT NULL DEFAULT 'notice_issued', -- 'notice_issued', 'courtesy_letter', 'enforcement_order', 'paid', 'transferred_to_driver'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'allocated_to_driver', 'deducted_from_earnings', 'paid_by_company'
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Yoco Payment Transactions & Bank Reconciliation
CREATE TABLE IF NOT EXISTS public.yoco_transactions (
  id TEXT PRIMARY KEY,
  yoco_charge_id TEXT UNIQUE NOT NULL,
  yoco_payment_link_id TEXT,
  driver_id TEXT REFERENCES public.drivers(id) ON DELETE SET NULL,
  driver_name TEXT NOT NULL,
  amount_zar NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  payment_method TEXT NOT NULL, -- 'yoco_card_terminal', 'yoco_payment_link', 'yoco_recurring_token', 'instant_eft'
  allocation TEXT NOT NULL DEFAULT 'weekly_rental', -- 'weekly_rental', 'security_deposit', 'traffic_fine', 'repair_deductible'
  status TEXT NOT NULL DEFAULT 'successful', -- 'successful', 'pending', 'failed', 'refunded'
  yoco_fee_zar NUMERIC DEFAULT 0,
  net_amount_zar NUMERIC NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'reconciled', -- 'reconciled', 'unallocated', 'disputed'
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  yoco_metadata JSONB DEFAULT '{}'::jsonb
);

-- 9. Rental & Sales Agreements
CREATE TABLE IF NOT EXISTS public.rental_agreements (
  id TEXT PRIMARY KEY,
  agreement_number TEXT UNIQUE NOT NULL,
  driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
  vehicle_plate TEXT NOT NULL,
  agreement_type TEXT NOT NULL DEFAULT 'rent_to_own',
  term_months INT NOT NULL DEFAULT 18,
  weekly_rate_zar NUMERIC NOT NULL,
  deposit_amount_zar NUMERIC NOT NULL,
  deposit_paid BOOLEAN DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_end_date DATE NOT NULL,
  actual_end_date DATE,
  total_contract_value_zar NUMERIC NOT NULL,
  total_paid_zar NUMERIC DEFAULT 0,
  remaining_balance_zar NUMERIC NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  signature_data_url TEXT,
  contract_pdf_url TEXT,
  terms_version TEXT DEFAULT 'v2026.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Driver Referral Program
CREATE TABLE IF NOT EXISTS public.driver_referrals (
  id TEXT PRIMARY KEY,
  referrer_driver_id TEXT NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  referrer_driver_name TEXT NOT NULL,
  referred_applicant_name TEXT NOT NULL,
  referred_phone TEXT NOT NULL,
  referral_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending_onboarding', -- 'pending_onboarding', 'active_driving', 'bonus_eligible', 'paid_out'
  reward_amount_zar NUMERIC NOT NULL DEFAULT 350,
  paid_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Site Settings & Branding
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY,
  logo_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
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

-- Public / Authenticated Access Policies
CREATE POLICY "Allow read-write on applications" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on bikes" ON public.bikes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on drivers" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on parts_inventory" ON public.parts_inventory FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on repairs_and_services" ON public.repairs_and_services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on traffic_fines" ON public.traffic_fines FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on yoco_transactions" ON public.yoco_transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on rental_agreements" ON public.rental_agreements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on driver_referrals" ON public.driver_referrals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow read-write on site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_vehicle ON public.drivers(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(registration_plate);
CREATE INDEX IF NOT EXISTS idx_repairs_vehicle ON public.repairs_and_services(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_traffic_fines_driver ON public.traffic_fines(driver_id);
CREATE INDEX IF NOT EXISTS idx_yoco_tx_driver ON public.yoco_transactions(driver_id);
CREATE INDEX IF NOT EXISTS idx_rental_agreements_driver ON public.rental_agreements(driver_id);
`;

// Helper: Map application DB snake_case to frontend camelCase
function mapDbToApplication(row: any): RiderApplication {
  return {
    id: row.id,
    refNumber: row.ref_number || row.refNumber,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt,
    status: row.status,
    bikeId: row.bike_id || row.bikeId,
    bikeName: row.bike_name || row.bikeName,
    bikeCondition: row.bike_condition || row.bikeCondition,
    termMonths: Number(row.term_months || row.termMonths),
    weeklyRate: Number(row.weekly_rate || row.weeklyRate),
    depositAmount: Number(row.deposit_amount || row.depositAmount),
    fullName: row.full_name || row.fullName,
    phone: row.phone,
    whatsappNumber: row.whatsapp_number || row.whatsappNumber,
    email: row.email,
    citizenship: row.citizenship,
    idOrPassportNumber: row.id_or_passport_number || row.idOrPassportNumber,
    nationalityCountry: row.nationality_country || row.nationalityCountry,
    address: row.address,
    suburb: row.suburb,
    city: row.city || 'Randburg',
    primaryPlatform: row.primary_platform || row.primaryPlatform,
    deliveryExperience: row.delivery_experience || row.deliveryExperience,
    approxWeeklyEarnings: Number(row.approx_weekly_earnings || row.approxWeeklyEarnings || 3500),
    documents: row.documents || {},
    verification: row.verification || { idVerified: false, licenseVerified: false },
    signatureDataUrl: row.signature_data_url || row.signatureDataUrl,
    depositAcknowledged: Boolean(row.deposit_acknowledged ?? row.depositAcknowledged),
    termsAgreed: Boolean(row.terms_agreed ?? row.termsAgreed),
    assignedBikeVinOrPlate: row.assigned_bike_vin_or_plate || row.assignedBikeVinOrPlate,
    adminNotes: row.admin_notes || row.adminNotes,
    timeline: row.timeline || [],
  };
}

// Helper: Map frontend camelCase to DB snake_case
function mapApplicationToDb(app: RiderApplication) {
  return {
    id: app.id,
    ref_number: app.refNumber,
    created_at: app.createdAt,
    updated_at: app.updatedAt,
    status: app.status,
    bike_id: app.bikeId,
    bike_name: app.bikeName,
    bike_condition: app.bikeCondition,
    term_months: app.termMonths,
    weekly_rate: app.weeklyRate,
    deposit_amount: app.depositAmount,
    full_name: app.fullName,
    phone: app.phone,
    whatsapp_number: app.whatsappNumber,
    email: app.email,
    citizenship: app.citizenship,
    id_or_passport_number: app.idOrPassportNumber,
    nationality_country: app.nationalityCountry,
    address: app.address,
    suburb: app.suburb,
    city: app.city,
    primary_platform: app.primaryPlatform,
    delivery_experience: app.deliveryExperience,
    approx_weekly_earnings: app.approxWeeklyEarnings,
    documents: app.documents,
    verification: app.verification,
    signature_data_url: app.signatureDataUrl,
    deposit_acknowledged: app.depositAcknowledged,
    terms_agreed: app.termsAgreed,
    assigned_bike_vin_or_plate: app.assignedBikeVinOrPlate,
    admin_notes: app.adminNotes,
    timeline: app.timeline,
  };
}

// -------------------------------------------------------------
// APPLICATIONS REPOSITORY API
// -------------------------------------------------------------

export async function fetchApplications(): Promise<RiderApplication[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbToApplication);
        try {
          localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(mapped));
        } catch (e) {
          // ignore
        }
        return mapped;
      }
      if (error) {
        console.warn('Supabase fetch applications error:', error);
      }
    } catch (err) {
      console.warn('Supabase fetch failed, fallback to local storage:', err);
    }
  }

  // Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_APPS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        // Filter out legacy mock data if any exists in local storage
        const cleaned = parsed.filter((a: any) => !a.id?.startsWith('app-00'));
        return cleaned;
      }
    }
  } catch (e) {
    // ignore
  }

  return [];
}

export async function saveApplication(app: RiderApplication): Promise<void> {
  // 1. Always update localStorage cache
  try {
    const cached = localStorage.getItem(LOCAL_APPS_KEY);
    let list: RiderApplication[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((a) => a.id === app.id);
    if (exists) {
      list = list.map((a) => (a.id === app.id ? app : a));
    } else {
      list = [app, ...list];
    }
    localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }

  // 2. Persist to Supabase if configured
  if (supabase) {
    try {
      const dbRecord = mapApplicationToDb(app);
      const { error } = await supabase
        .from('applications')
        .upsert(dbRecord, { onConflict: 'id' });
      if (error) {
        console.error('Supabase application upsert error:', error);
      }
    } catch (err) {
      console.warn('Supabase application sync error:', err);
    }
  }
}

export const saveApplicationToDb = saveApplication;

// -------------------------------------------------------------
// BIKES REPOSITORY API
// -------------------------------------------------------------

export async function fetchBikes(): Promise<Bike[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mapped = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          subtitle: b.subtitle,
          brand: b.brand,
          category: b.category,
          isAvailable: b.is_available ?? b.isAvailable,
          isComingSoon: b.is_coming_soon ?? b.isComingSoon,
          image: b.image,
          badge: b.badge,
          fuelType: b.fuel_type || b.fuelType,
          engineCapacity: b.engine_capacity || b.engineCapacity,
          tankCapacity: b.tank_capacity || b.tankCapacity,
          rangePerCharge: b.range_per_charge || b.rangePerCharge,
          deliveryBoxReady: b.delivery_box_ready ?? b.deliveryBoxReady,
          pricing: b.pricing,
          keyFeatures: b.key_features || b.keyFeatures || [],
          recommendedFor: b.recommended_for || b.recommendedFor || '',
        }));
        try {
          localStorage.setItem(LOCAL_BIKES_KEY, JSON.stringify(mapped));
        } catch (e) {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase bikes fetch error, fallback to local:', err);
    }
  }

  // Local storage fallback
  try {
    const cached = localStorage.getItem(LOCAL_BIKES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  return [];
}

export async function saveBike(bike: Bike): Promise<void> {
  // 1. Update localStorage
  try {
    const cached = localStorage.getItem(LOCAL_BIKES_KEY);
    let list: Bike[] = cached ? JSON.parse(cached) : BIKES;
    const exists = list.some((b) => b.id === bike.id);
    if (exists) {
      list = list.map((b) => (b.id === bike.id ? bike : b));
    } else {
      list = [bike, ...list];
    }
    localStorage.setItem(LOCAL_BIKES_KEY, JSON.stringify(list));
  } catch (e) {
    // ignore
  }

  // 2. Supabase Cloud sync
  if (supabase) {
    try {
      const dbRecord = {
        id: bike.id,
        name: bike.name,
        subtitle: bike.subtitle,
        brand: bike.brand,
        category: bike.category,
        is_available: bike.isAvailable,
        is_coming_soon: Boolean(bike.isComingSoon),
        image: bike.image,
        badge: bike.badge,
        fuel_type: bike.fuelType,
        engine_capacity: bike.engineCapacity,
        tank_capacity: bike.tankCapacity,
        range_per_charge: bike.rangePerCharge,
        delivery_box_ready: bike.deliveryBoxReady,
        pricing: bike.pricing,
        key_features: bike.keyFeatures,
        recommended_for: bike.recommendedFor,
      };
      await supabase.from('bikes').upsert(dbRecord, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase bike save error:', err);
    }
  }
}

export const saveBikeToDb = saveBike;

export async function deleteBike(bikeId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_BIKES_KEY);
    if (cached) {
      const list: Bike[] = JSON.parse(cached);
      const filtered = list.filter((b) => b.id !== bikeId);
      localStorage.setItem(LOCAL_BIKES_KEY, JSON.stringify(filtered));
    }
  } catch (e) {
    // ignore
  }

  if (supabase) {
    try {
      await supabase.from('bikes').delete().eq('id', bikeId);
    } catch (err) {
      console.warn('Supabase delete bike error:', err);
    }
  }
}

export const deleteBikeFromDb = deleteBike;

// -------------------------------------------------------------
// SITE SETTINGS & BRANDING REPOSITORY API
// -------------------------------------------------------------

import { STATIC_BRANDING } from '../config/branding';

const LOCAL_CUSTOMIZATION_KEY = 'dynamic_rental_customization_v2';
const DEFAULT_HERO_IMAGE = STATIC_BRANDING.heroImageUrl || '';

export interface SiteCustomizationData {
  logoUrl: string;
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
}

export async function fetchCustomizationFromDb(): Promise<SiteCustomizationData> {
  // 1. Check Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('id', 'global')
        .maybeSingle();

      if (!error && data) {
        const result: SiteCustomizationData = {
          logoUrl: data.logo_url !== undefined && data.logo_url !== '' ? data.logo_url : STATIC_BRANDING.logoUrl,
          heroImageUrl: data.hero_image_url || STATIC_BRANDING.heroImageUrl,
          heroTitle: data.hero_title || STATIC_BRANDING.companyName,
          heroSubtitle: data.hero_subtitle || STATIC_BRANDING.heroTagline,
        };
        try {
          localStorage.setItem(LOCAL_CUSTOMIZATION_KEY, JSON.stringify(result));
        } catch {
          // ignore
        }
        return result;
      }
    } catch (err) {
      console.warn('Supabase customization fetch error:', err);
    }
  }

  // 2. Fallback to localStorage
  try {
    const cached = localStorage.getItem(LOCAL_CUSTOMIZATION_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return {
        logoUrl: parsed.logoUrl !== undefined && parsed.logoUrl !== '' ? parsed.logoUrl : STATIC_BRANDING.logoUrl,
        heroImageUrl: parsed.heroImageUrl || STATIC_BRANDING.heroImageUrl,
        heroTitle: parsed.heroTitle || STATIC_BRANDING.companyName,
        heroSubtitle: parsed.heroSubtitle || STATIC_BRANDING.heroTagline,
      };
    }
  } catch (e) {
    // ignore
  }

  return {
    logoUrl: STATIC_BRANDING.logoUrl,
    heroImageUrl: STATIC_BRANDING.heroImageUrl,
    heroTitle: STATIC_BRANDING.companyName,
    heroSubtitle: STATIC_BRANDING.heroTagline,
  };
}

export async function saveCustomizationToDb(
  customization: Partial<SiteCustomizationData>
): Promise<SiteCustomizationData> {
  // 1. Update localStorage
  let current: SiteCustomizationData = {
    logoUrl: STATIC_BRANDING.logoUrl,
    heroImageUrl: STATIC_BRANDING.heroImageUrl,
    heroTitle: STATIC_BRANDING.companyName,
    heroSubtitle: STATIC_BRANDING.heroTagline,
  };

  try {
    const cached = localStorage.getItem(LOCAL_CUSTOMIZATION_KEY);
    if (cached) {
      current = { ...current, ...JSON.parse(cached) };
    }
  } catch {
    // ignore
  }

  const updated: SiteCustomizationData = {
    ...current,
    ...customization,
  };

  try {
    localStorage.setItem(LOCAL_CUSTOMIZATION_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // 2. Persist to Supabase if available
  if (supabase) {
    try {
      const dbRecord = {
        id: 'global',
        logo_url: updated.logoUrl,
        hero_image_url: updated.heroImageUrl,
        hero_title: updated.heroTitle,
        hero_subtitle: updated.heroSubtitle,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('site_settings').upsert(dbRecord, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase site_settings save error:', err);
    }
  }

  return updated;
}
