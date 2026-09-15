import { 
  SiteCustomizationData, 
  fetchCustomizationFromDb, 
  saveCustomizationToDb 
} from './supabase';
import { STATIC_BRANDING } from '../config/branding';

// Customization store for dynamic logo, hero image, and branding
export type SiteCustomization = SiteCustomizationData;

export const DEFAULT_HERO_IMAGE = STATIC_BRANDING.heroImageUrl || '';

export const PRESET_HERO_IMAGES = [
  {
    id: 'custom-hero',
    title: 'Static Project Hero (/hero.jpg)',
    url: '/hero.jpg',
  },
  {
    id: 'boxer-hero',
    title: 'Bajaj Boxer 150 Fleet on Road',
    url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'fleet-hero',
    title: 'Modern Delivery Motorbike',
    url: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'urban-courier',
    title: 'Urban Courier in Motion',
    url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'showroom-bikes',
    title: 'Showroom Motorbikes',
    url: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 'city-rider',
    title: 'Johannesburg City Delivery Rider',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1600&q=85',
  }
];

const STORAGE_KEY_CUSTOMIZATION = 'dynamic_rental_customization_v2';

export function getStoredCustomization(): SiteCustomization {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CUSTOMIZATION);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        logoUrl: parsed.logoUrl !== undefined && parsed.logoUrl !== '' ? parsed.logoUrl : STATIC_BRANDING.logoUrl,
        heroImageUrl: parsed.heroImageUrl || STATIC_BRANDING.heroImageUrl,
        heroTitle: parsed.heroTitle || STATIC_BRANDING.companyName,
        heroSubtitle: parsed.heroSubtitle || STATIC_BRANDING.heroTagline,
      };
    }
  } catch {
    // ignore
  }

  return {
    logoUrl: STATIC_BRANDING.logoUrl,
    heroImageUrl: STATIC_BRANDING.heroImageUrl,
    heroTitle: STATIC_BRANDING.companyName,
    heroSubtitle: STATIC_BRANDING.heroTagline,
  };
}

export async function fetchCustomization(): Promise<SiteCustomization> {
  return await fetchCustomizationFromDb();
}

export function saveStoredCustomization(customization: Partial<SiteCustomization>): SiteCustomization {
  const current = getStoredCustomization();
  const updated: SiteCustomization = {
    ...current,
    ...customization,
  };
  try {
    localStorage.setItem(STORAGE_KEY_CUSTOMIZATION, JSON.stringify(updated));
  } catch {
    // ignore
  }

  // Also trigger async sync to Supabase cloud
  saveCustomizationToDb(customization).catch((err) => {
    console.warn('Async cloud customization save error:', err);
  });

  return updated;
}
