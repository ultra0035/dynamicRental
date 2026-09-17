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
export const SUPABASE_SQL_SCHEMA = `-- Dynamic Rental Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor to initialize tables

CREATE TABLE IF NOT EXISTS applications (
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
  primary_platform TEXT,
  delivery_experience TEXT,
  approx_weekly_earnings NUMERIC,
  documents JSONB DEFAULT '{}'::jsonb,
  verification JSONB DEFAULT '{}'::jsonb,
  signature_data_url TEXT,
  deposit_acknowledged BOOLEAN DEFAULT true,
  terms_agreed BOOLEAN DEFAULT true,
  assigned_bike_vin_or_plate TEXT,
  admin_notes TEXT,
  timeline JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS bikes (
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

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  logo_url TEXT,
  hero_image_url TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public access policies for demo / prototype
CREATE POLICY "Allow public read-write on applications" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on bikes" ON bikes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write on site_settings" ON site_settings FOR ALL USING (true) WITH CHECK (true);
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

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
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
      }
    } catch (err) {
      console.warn('Supabase bikes fetch error, fallback to local:', err);
    }
  }

  // Local storage fallback
  try {
    const cached = localStorage.getItem(LOCAL_BIKES_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    // ignore
  }

  return BIKES;
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
