import { FlaggedRiskEntry } from '../types';

const RISK_STORAGE_KEY = 'dyn_fleet_risk_registry_v1';
const CROSS_OPERATOR_ENABLED_KEY = 'dyn_fleet_cross_operator_sharing_v1';

// Clean initial state - all risk and defaulter entries are managed live via Admin Portal or Supabase
export const INITIAL_RISK_REGISTRY: FlaggedRiskEntry[] = [];

export function getFlaggedRiskEntries(): FlaggedRiskEntry[] {
  try {
    const raw = localStorage.getItem(RISK_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any stale mock demo entries
      return parsed.filter(
        (entry: any) =>
          entry &&
          !entry.id?.startsWith('risk-flag-00') &&
          entry.fullName !== 'Blessing Moyo' &&
          entry.fullName !== 'Tshepo Khumalo' &&
          entry.fullName !== 'Farai Chidzero' &&
          entry.fullName !== 'Simbarashe Dube'
      );
    }
    return [];
  } catch (e) {
    console.warn('Error reading risk registry from storage:', e);
    return [];
  }
}

export function saveFlaggedRiskEntries(entries: FlaggedRiskEntry[]): void {
  try {
    localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.warn('Error writing risk registry to storage:', e);
  }
}

export function addFlaggedRiskEntry(entry: FlaggedRiskEntry): FlaggedRiskEntry[] {
  const current = getFlaggedRiskEntries();
  // Check if already exists with same ID
  const filtered = current.filter((e) => e.id !== entry.id);
  const updated = [entry, ...filtered];
  saveFlaggedRiskEntries(updated);
  return updated;
}

export function updateFlaggedRiskEntry(entry: FlaggedRiskEntry): FlaggedRiskEntry[] {
  const current = getFlaggedRiskEntries();
  const updated = current.map((e) => (e.id === entry.id ? entry : e));
  saveFlaggedRiskEntries(updated);
  return updated;
}

export function deleteFlaggedRiskEntry(entryId: string): FlaggedRiskEntry[] {
  const current = getFlaggedRiskEntries();
  const updated = current.filter((e) => e.id !== entryId);
  saveFlaggedRiskEntries(updated);
  return updated;
}

export function getCrossOperatorSharingStatus(): boolean {
  try {
    const raw = localStorage.getItem(CROSS_OPERATOR_ENABLED_KEY);
    if (raw === null) return true; // Default to true for maximum safety
    return JSON.parse(raw);
  } catch {
    return true;
  }
}

export function setCrossOperatorSharingStatus(enabled: boolean): void {
  try {
    localStorage.setItem(CROSS_OPERATOR_ENABLED_KEY, JSON.stringify(enabled));
  } catch (e) {
    console.warn('Error setting cross operator status:', e);
  }
}

/**
 * Intelligent cross-referencing matcher
 * Checks an applicant's ID number, passport, phone number, and full name against the Risk Registry.
 */
export function checkRiskRegistryMatch(
  applicant: {
    idOrPassportNumber?: string;
    phone?: string;
    whatsappNumber?: string;
    fullName?: string;
  },
  customRegistry?: FlaggedRiskEntry[]
): FlaggedRiskEntry | null {
  if (!applicant) return null;

  const registry = customRegistry || getFlaggedRiskEntries();
  const cleanId = (applicant.idOrPassportNumber || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanPhone = (applicant.phone || '').replace(/[^0-9]/g, '');
  const cleanWhatsapp = (applicant.whatsappNumber || '').replace(/[^0-9]/g, '');
  const cleanName = (applicant.fullName || '').trim().toLowerCase();

  for (const entry of registry) {
    // 1. Strict ID / Passport / TRN Match (High Confidence)
    const entryCleanId = (entry.idOrPassportNumber || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanId && entryCleanId && (cleanId === entryCleanId || cleanId.includes(entryCleanId) || entryCleanId.includes(cleanId))) {
      return entry;
    }

    // 2. Exact Phone / WhatsApp Match (High Confidence)
    const entryCleanPhone = (entry.phone || '').replace(/[^0-9]/g, '');
    const entryCleanWhatsapp = (entry.whatsappNumber || '').replace(/[^0-9]/g, '');

    if (cleanPhone && cleanPhone.length >= 9) {
      if (entryCleanPhone && (entryCleanPhone.endsWith(cleanPhone.slice(-9)) || cleanPhone.endsWith(entryCleanPhone.slice(-9)))) {
        return entry;
      }
      if (entryCleanWhatsapp && (entryCleanWhatsapp.endsWith(cleanPhone.slice(-9)) || cleanPhone.endsWith(entryCleanWhatsapp.slice(-9)))) {
        return entry;
      }
    }

    if (cleanWhatsapp && cleanWhatsapp.length >= 9) {
      if (entryCleanPhone && (entryCleanPhone.endsWith(cleanWhatsapp.slice(-9)) || cleanWhatsapp.endsWith(entryCleanPhone.slice(-9)))) {
        return entry;
      }
      if (entryCleanWhatsapp && (entryCleanWhatsapp.endsWith(cleanWhatsapp.slice(-9)) || cleanWhatsapp.endsWith(entryCleanWhatsapp.slice(-9)))) {
        return entry;
      }
    }

    // 3. Exact Full Name Match (if name has 2+ words and is sufficiently unique)
    if (cleanName && cleanName.length > 5 && entry.fullName) {
      const entryName = entry.fullName.trim().toLowerCase();
      if (cleanName === entryName) {
        return entry;
      }
    }
  }

  return null;
}
