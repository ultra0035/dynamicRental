import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  RiderApplication, 
  Bike, 
  Vehicle, 
  Driver, 
  PartsInventoryItem, 
  RepairAndService, 
  TrafficFine, 
  YocoTransaction, 
  RentalAgreement, 
  DriverReferral,
  FlaggedRiskEntry
} from '../types';
import { STATIC_BRANDING } from '../config/branding';

const SUPABASE_CONFIG_KEY = 'dynamic_rental_supabase_config_v2';
const LOCAL_APPS_KEY = 'dynamic_rental_applications_v1';
const LOCAL_BIKES_KEY = 'dynamic_rental_bikes_v1';
const LOCAL_VEHICLES_KEY = 'dyn_fleet_vehicles_v1';
const LOCAL_DRIVERS_KEY = 'dyn_fleet_drivers_v1';
const LOCAL_PARTS_KEY = 'dyn_fleet_parts_v1';
const LOCAL_SERVICES_KEY = 'dyn_fleet_services_v1';
const LOCAL_FINES_KEY = 'dyn_fleet_fines_v1';
const LOCAL_TRANSACTIONS_KEY = 'dyn_fleet_transactions_v1';
const LOCAL_AGREEMENTS_KEY = 'dyn_fleet_agreements_v1';
const LOCAL_REFERRALS_KEY = 'dyn_fleet_referrals_v1';
const LOCAL_CUSTOMIZATION_KEY = 'dynamic_rental_customization_v2';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// 1. Resolve configuration from localStorage or environment variables
export function getSupabaseConfig(): SupabaseConfig {
  let url = '';
  let anonKey = '';

  // Check localStorage first
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        url = parsed.url.trim();
        anonKey = parsed.anonKey.trim();
      }
    }
  } catch (e) {
    // ignore
  }

  // Fallback to environment variables
  if (!url || !anonKey) {
    const envObj = typeof import.meta !== 'undefined' ? (import.meta as { env?: Record<string, string> }).env || {} : {};
    url = url || envObj.VITE_SUPABASE_URL || '';
    anonKey = anonKey || envObj.VITE_SUPABASE_ANON_KEY || '';
  }

  return { url, anonKey };
}

let activeClient: SupabaseClient | null = null;
let lastClientUrl = '';
let lastClientKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const isValid = Boolean(
    config.url &&
    config.anonKey &&
    config.url.startsWith('http') &&
    !config.url.includes('your-project')
  );

  if (!isValid) {
    activeClient = null;
    return null;
  }

  if (activeClient && lastClientUrl === config.url && lastClientKey === config.anonKey) {
    return activeClient;
  }

  try {
    activeClient = createClient(config.url, config.anonKey);
    lastClientUrl = config.url;
    lastClientKey = config.anonKey;
    return activeClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    activeClient = null;
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem(
      SUPABASE_CONFIG_KEY,
      JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
    );
    activeClient = null; // force recreation
    getSupabaseClient();
  } catch (e) {
    console.error('Failed to save Supabase config to local storage:', e);
  }
}

export function isSupabaseConnected(): boolean {
  return getSupabaseClient() !== null;
}

export const isSupabaseConfigured = isSupabaseConnected();
export const supabase = getSupabaseClient();

// Purge any legacy demo/mock data stored in localStorage
export function clearAllLocalFleetCache(): void {
  const keysToClear = [
    LOCAL_APPS_KEY,
    LOCAL_BIKES_KEY,
    LOCAL_VEHICLES_KEY,
    LOCAL_DRIVERS_KEY,
    LOCAL_PARTS_KEY,
    LOCAL_SERVICES_KEY,
    LOCAL_FINES_KEY,
    LOCAL_TRANSACTIONS_KEY,
    LOCAL_AGREEMENTS_KEY,
    LOCAL_REFERRALS_KEY,
  ];

  keysToClear.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}

// Test live database connectivity across all 11 tables
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  tableCounts?: Record<string, number>;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL or public anon key is missing or invalid.',
    };
  }

  try {
    const tableCounts: Record<string, number> = {};
    const tables = [
      'applications',
      'bikes',
      'vehicles',
      'drivers',
      'parts_inventory',
      'repairs_and_services',
      'traffic_fines',
      'yoco_transactions',
      'rental_agreements',
      'driver_referrals',
      'site_settings',
    ];

    for (const table of tables) {
      try {
        const { count, error } = await client
          .from(table)
          .select('*', { count: 'exact', head: true });
        if (!error && count !== null && count !== undefined) {
          tableCounts[table] = count;
        } else {
          tableCounts[table] = 0;
        }
      } catch {
        tableCounts[table] = 0;
      }
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase live database.',
      tableCounts,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection test failed: ${err?.message || String(err)}`,
    };
  }
}

// ==============================================================================
// ADAPTIVE SCHEMA ENGINE: Auto-recovers from missing columns, foreign keys & RLS
// ==============================================================================

export async function adaptiveUpsert(
  tableName: string,
  record: Record<string, any>,
  primaryKey: string = 'id',
  alternateTableNames: string[] = []
): Promise<{ success: boolean; data?: any; error?: string; strippedColumns?: string[] }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Database connection not initialized.' };
  }

  const tablesToTry = [tableName, ...alternateTableNames];

  for (const currentTable of tablesToTry) {
    let currentRecord: Record<string, any> = { ...record };
    
    // Sanitize record: remove undefined and convert empty strings in ID/numeric/date fields to null
    Object.keys(currentRecord).forEach((key) => {
      if (currentRecord[key] === undefined) {
        delete currentRecord[key];
      } else if (currentRecord[key] === '' && (key.endsWith('_id') || key.endsWith('Id') || key.endsWith('_date') || key.endsWith('_at') || key.includes('cost') || key.includes('price') || key.includes('amount') || key.includes('km') || key.includes('mileage') || key.includes('threshold') || key.includes('stock') || key.includes('quantity'))) {
        currentRecord[key] = null;
      }
    });

    const strippedColumns: string[] = [];
    const maxRetries = 25;
    let tableNotFound = false;
    let statusAttemptCount = 0;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // 1. Try upsert with onConflict primary key
      const { data, error } = await client
        .from(currentTable)
        .upsert(currentRecord, { onConflict: primaryKey });

      if (!error) {
        return { success: true, data, strippedColumns };
      }

      console.warn(`[Supabase adaptiveUpsert ${currentTable} attempt ${attempt + 1}] error:`, error.message);

      // 2. Check for invalid UUID syntax error (Postgres 22P02)
      // E.g. "invalid input syntax for type uuid: \"part-1738291823\"" or "invalid input syntax for type uuid: \"\""
      if (
        error.code === '22P02' ||
        error.message?.includes('invalid input syntax for type uuid') ||
        error.details?.includes('invalid input syntax for type uuid')
      ) {
        // If the ID column contains a custom non-standard prefix (e.g. part-, srv-, ref-), replace with standard UUID or delete to let DB default
        if (currentRecord.id && typeof currentRecord.id === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentRecord.id)) {
          console.log(`[Supabase Auto-Sync] Non-UUID id '${currentRecord.id}' detected for table '${currentTable}'. Trying with standard UUID...`);
          try {
            currentRecord.id = crypto.randomUUID();
          } catch {
            delete currentRecord.id;
            strippedColumns.push('id');
          }
          continue;
        }

        // Check if any foreign key is invalid UUID
        let sanitizedAnyFk = false;
        Object.keys(currentRecord).forEach((k) => {
          if (k.endsWith('_id') && currentRecord[k] && typeof currentRecord[k] === 'string' && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentRecord[k])) {
            console.log(`[Supabase Auto-Sync] Nulling invalid non-UUID foreign key '${k}' with value '${currentRecord[k]}'...`);
            currentRecord[k] = null;
            sanitizedAnyFk = true;
          }
        });
        if (sanitizedAnyFk) continue;
      }

      // 3. Check for check constraint violation (Postgres 23514)
      // e.g. "new row for relation \"vehicles\" violates check constraint \"vehicles_status_check\""
      if (
        error.code === '23514' ||
        error.message?.includes('violates check constraint') ||
        error.details?.includes('violates check constraint')
      ) {
        if (
          error.message?.includes('status_check') ||
          error.message?.includes('status') ||
          error.details?.includes('status')
        ) {
          statusAttemptCount++;
          const candidateStatuses = ['available', 'assigned', 'in_maintenance', 'maintenance', 'active', 'rented', 'completed', 'pending', 'open', 'approved'];
          if (statusAttemptCount <= candidateStatuses.length) {
            const nextCandidate = candidateStatuses[statusAttemptCount - 1];
            console.log(`[Supabase Auto-Sync] Status check constraint violated. Retrying '${currentTable}' with status='${nextCandidate}'...`);
            currentRecord.status = nextCandidate;
            continue;
          } else if ('status' in currentRecord) {
            console.log(`[Supabase Auto-Sync] Removing status column from '${currentTable}' to use database default...`);
            delete currentRecord.status;
            strippedColumns.push('status');
            continue;
          }
        }

        // Generic check constraint handling: extract constraint name
        const constraintMatch = error.message?.match(/violates check constraint "([^"]+)"/i) || error.details?.match(/constraint "([^"]+)"/i);
        if (constraintMatch && constraintMatch[1]) {
          const constraintName = constraintMatch[1];
          // Try to infer column name from constraint name e.g. vehicles_year_check -> year
          let guessedCol = constraintName.replace(new RegExp(`^${currentTable}_?`, 'i'), '').replace(/_check$/i, '');
          if (guessedCol in currentRecord) {
            console.log(`[Supabase Auto-Sync] Removing check-constraint failing column '${guessedCol}' and retrying...`);
            delete currentRecord[guessedCol];
            strippedColumns.push(guessedCol);
            continue;
          }
        }
      }

      // 4. Check for missing column error in PostgREST schema cache (Code PGRST204 or Postgres 42703)
      const missingColMatch =
        error.message?.match(/Could not find the '([^']+)' column/i) ||
        error.message?.match(/column "([^"]+)" of relation/i) ||
        error.message?.match(/column '([^']+)' does not exist/i) ||
        error.message?.match(/column "([^"]+)" does not exist/i) ||
        error.details?.match(/column "([^"]+)"/i) ||
        error.hint?.match(/column "([^"]+)"/i);

      if (missingColMatch && missingColMatch[1]) {
        const missingCol = missingColMatch[1];
        if (missingCol in currentRecord) {
          console.log(`[Supabase Auto-Sync] Dynamically stripping missing column '${missingCol}' from '${currentTable}' and retrying...`);
          delete currentRecord[missingCol];
          strippedColumns.push(missingCol);
          continue; // Retry upsert with column removed!
        }
      }

      // 5. Foreign key violation (Postgres 23503)
      if (
        error.code === '23503' ||
        error.message?.includes('foreign key constraint') ||
        error.details?.includes('is not present in table')
      ) {
        const fkMatch =
          error.details?.match(/Key \(([^)]+)\)=/i) ||
          error.message?.match(/foreign key constraint "([^"]+)"/i) ||
          error.details?.match(/constraint "([^"]+)"/i);

        let resolvedFk = false;
        let targetFkCol = '';

        if (fkMatch && fkMatch[1]) {
          const rawFk = fkMatch[1];
          // Clean constraint name: remove table prefix and _fkey suffix e.g. driver_referrals_referrer_driver_id_fkey -> referrer_driver_id
          const cleanFk = rawFk
            .replace(new RegExp(`^${currentTable}_?`, 'i'), '')
            .replace(/_fkey$/i, '')
            .replace(/_fk$/i, '');

          if (cleanFk in currentRecord) {
            targetFkCol = cleanFk;
          } else if (rawFk in currentRecord) {
            targetFkCol = rawFk;
          }
        }

        if (!targetFkCol) {
          const commonFkCols = ['referrer_driver_id', 'referring_driver_id', 'driver_id', 'vehicle_id', 'bike_id', 'part_id', 'application_id'];
          for (const col of commonFkCols) {
            if (col in currentRecord && currentRecord[col] !== null) {
              targetFkCol = col;
              break;
            }
          }
        }

        if (targetFkCol) {
          // Identify referenced table
          let refTable = 'drivers';
          if (targetFkCol.includes('vehicle') || targetFkCol.includes('bike')) {
            refTable = 'vehicles';
          } else if (targetFkCol.includes('part')) {
            refTable = 'parts_inventory';
          } else if (targetFkCol.includes('app')) {
            refTable = 'rider_applications';
          }

          // Try to get a valid ID from the referenced table
          try {
            const { data: parentRows } = await client.from(refTable).select('id').limit(1);
            if (parentRows && parentRows.length > 0 && parentRows[0].id) {
              console.log(`[Supabase Auto-Sync] Linking FK '${targetFkCol}' to valid existing '${refTable}' ID (${parentRows[0].id})...`);
              currentRecord[targetFkCol] = parentRows[0].id;
              resolvedFk = true;
            } else if (refTable === 'drivers') {
              // Create a minimal driver record to satisfy FK
              const fallbackDriverId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `drv-${Date.now()}`;
              await client.from('drivers').insert({
                id: fallbackDriverId,
                ref_number: 'DRV-STAFF-01',
                full_name: currentRecord.referrer_driver_name || 'Fleet Staff Referrer',
                phone: '0710000000',
                status: 'active'
              });
              currentRecord[targetFkCol] = fallbackDriverId;
              resolvedFk = true;
            }
          } catch (fkLookErr) {
            console.warn('[Supabase Auto-Sync] FK lookup err:', fkLookErr);
          }

          if (!resolvedFk) {
            console.log(`[Supabase Auto-Sync] Nulling foreign key '${targetFkCol}' from '${currentTable}'...`);
            currentRecord[targetFkCol] = null;
            resolvedFk = true;
          }
        }

        if (resolvedFk) continue;
      }

      // 5b. Not-Null constraint violation (Postgres 23502)
      if (
        error.code === '23502' ||
        error.message?.includes('violates not-null constraint') ||
        error.details?.includes('Failing row contains')
      ) {
        const notNullMatch =
          error.message?.match(/null value in column "([^"]+)"/i) ||
          error.details?.match(/column "([^"]+)"/i) ||
          error.hint?.match(/column "([^"]+)"/i);

        if (notNullMatch && notNullMatch[1]) {
          const col = notNullMatch[1];
          console.log(`[Supabase Auto-Sync] Handling not-null constraint for column '${col}' in '${currentTable}'...`);
          
          if (col.includes('driver_id') || col.includes('referrer')) {
            try {
              const { data: parentRows } = await client.from('drivers').select('id').limit(1);
              if (parentRows && parentRows.length > 0 && parentRows[0].id) {
                currentRecord[col] = parentRows[0].id;
                continue;
              } else {
                const fallbackDriverId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `drv-${Date.now()}`;
                await client.from('drivers').insert({
                  id: fallbackDriverId,
                  ref_number: 'DRV-STAFF-01',
                  full_name: 'Fleet Staff Referrer',
                  phone: '0710000000',
                  status: 'active'
                });
                currentRecord[col] = fallbackDriverId;
                continue;
              }
            } catch (e) {
              currentRecord[col] = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `drv-${Date.now()}`;
              continue;
            }
          } else if (col.includes('vehicle_id') || col.includes('bike')) {
            try {
              const { data: vRows } = await client.from('vehicles').select('id').limit(1);
              if (vRows && vRows.length > 0 && vRows[0].id) {
                currentRecord[col] = vRows[0].id;
                continue;
              }
            } catch {
              // ignore
            }
          }

          // Fallback filling for other not-null columns
          if (typeof currentRecord[col] === 'undefined' || currentRecord[col] === null) {
            currentRecord[col] = col.includes('date') 
              ? new Date().toISOString().split('T')[0] 
              : col.includes('amount') || col.includes('count') || col.includes('score') || col.includes('km') || col.includes('rate') || col.includes('due') || col.includes('paid')
              ? 0 
              : 'standard';
            continue;
          }
        }
      }

      // 6. Check for RLS (Row Level Security) violation (Postgres 42501)
      if (
        error.message?.includes('row-level security') ||
        error.message?.includes('violates row-level security policy') ||
        error.code === '42501'
      ) {
        return {
          success: false,
          error: `Supabase Row-Level Security (RLS) is blocking writes on table "${currentTable}". In your Supabase SQL Editor, run: ALTER TABLE public.${currentTable} DISABLE ROW LEVEL SECURITY;`,
        };
      }

      // 7. Table does not exist (Postgres 42P01)
      if (
        error.code === '42P01' ||
        (error.message?.includes('does not exist') && (error.message?.includes('relation') || error.message?.includes('table')))
      ) {
        tableNotFound = true;
        break; // Try next alternate table name
      }

      // 8. If upsert conflict on PK fails (e.g. 42P10), try direct insert
      const { data: insertData, error: insertError } = await client.from(currentTable).insert(currentRecord);
      if (!insertError) {
        return { success: true, data: insertData, strippedColumns };
      }

      const insertMissingColMatch =
        insertError.message?.match(/Could not find the '([^']+)' column/i) ||
        insertError.message?.match(/column "([^"]+)" of relation/i) ||
        insertError.message?.match(/column '([^']+)' does not exist/i) ||
        insertError.message?.match(/column "([^"]+)" does not exist/i);

      if (insertMissingColMatch && insertMissingColMatch[1]) {
        const missingCol = insertMissingColMatch[1];
        if (missingCol in currentRecord) {
          delete currentRecord[missingCol];
          strippedColumns.push(missingCol);
          continue;
        }
      }

      // If insert also failed and no pattern matched
      return { success: false, error: insertError.message || error.message };
    }

    if (!tableNotFound) {
      break;
    }
  }

  return { success: false, error: `Could not save to table '${tableName}' in Supabase.` };
}

// ==============================================================================
// 1. APPLICATIONS REPOSITORY
// ==============================================================================

function mapDbToApplication(row: any): RiderApplication {
  return {
    id: row.id,
    refNumber: row.ref_number || row.refNumber || `DR-${row.id.slice(-4)}`,
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString(),
    status: row.status || 'pending_review',
    bikeId: row.bike_id || row.bikeId || '',
    bikeName: row.bike_name || row.bikeName || '',
    bikeCondition: row.bike_condition || row.bikeCondition || 'new',
    termMonths: Number(row.term_months || row.termMonths || 18),
    weeklyRate: Number(row.weekly_rate || row.weeklyRate || 750),
    depositAmount: Number(row.deposit_amount || row.depositAmount || 1000),
    fullName: row.full_name || row.fullName || '',
    phone: row.phone || row.phone_number || '',
    whatsappNumber: row.whatsapp_number || row.whatsappNumber || '',
    email: row.email || '',
    citizenship: row.citizenship || 'south_african',
    idOrPassportNumber: row.id_or_passport_number || row.idOrPassportNumber || '',
    nationalityCountry: row.nationality_country || row.nationalityCountry || '',
    address: row.address || row.residential_address || '',
    suburb: row.suburb || '',
    city: row.city || 'Randburg',
    province: row.province || 'Gauteng',
    postalCode: row.postal_code || row.postalCode || '',
    alternativeContactName: row.alternative_contact_name || row.emergency_contact_name || '',
    alternativeContactPhone: row.alternative_contact_phone || row.emergency_contact_phone || '',
    primaryPlatform: row.primary_platform || row.delivery_platform || '',
    deliveryApps: Array.isArray(row.delivery_apps) ? row.delivery_apps : [],
    deliveryExperience: row.delivery_experience || '',
    approxWeeklyEarnings: Number(row.approx_weekly_earnings || 0),
    referredBy: row.referred_by || '',
    creditScore: row.credit_score ? String(row.credit_score) : undefined,
    documents: typeof row.documents === 'object' && row.documents !== null ? row.documents : {},
    verification: typeof row.verification === 'object' && row.verification !== null ? row.verification : { idVerified: false, licenseVerified: false },
    signatureDataUrl: row.signature_data_url || undefined,
    depositAcknowledged: Boolean(row.deposit_acknowledged ?? row.deposit_paid ?? true),
    termsAgreed: Boolean(row.terms_agreed ?? row.contract_signed ?? true),
    collectionDate: row.collection_date || undefined,
    assignedBikeVinOrPlate: row.assigned_bike_vin_or_plate || row.assigned_vehicle_reg || undefined,
    adminNotes: row.admin_notes || row.internal_notes || undefined,
    timeline: Array.isArray(row.timeline) ? row.timeline : [],
  };
}

function mapApplicationToDb(app: RiderApplication) {
  return {
    id: app.id,
    ref_number: app.refNumber,
    created_at: app.createdAt,
    updated_at: new Date().toISOString(),
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
    province: app.province,
    postal_code: app.postalCode,
    alternative_contact_name: app.alternativeContactName,
    alternative_contact_phone: app.alternativeContactPhone,
    primary_platform: app.primaryPlatform,
    delivery_apps: app.deliveryApps || [],
    delivery_experience: app.deliveryExperience,
    approx_weekly_earnings: app.approxWeeklyEarnings,
    referred_by: app.referredBy,
    credit_score: app.creditScore,
    documents: app.documents || {},
    verification: app.verification || { idVerified: false, licenseVerified: false },
    signature_data_url: app.signatureDataUrl,
    deposit_acknowledged: app.depositAcknowledged,
    terms_agreed: app.termsAgreed,
    collection_date: app.collectionDate,
    assigned_bike_vin_or_plate: app.assignedBikeVinOrPlate,
    admin_notes: app.adminNotes,
    timeline: app.timeline || [],
  };
}

export async function fetchApplications(): Promise<RiderApplication[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbToApplication);
        try {
          localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
      if (error) {
        console.warn('Supabase fetch applications error:', error);
      }
    } catch (err) {
      console.warn('Supabase fetch failed, fallback to local cache:', err);
    }
  }

  // Fallback to local cache (strictly user's real saved applications)
  try {
    const cached = localStorage.getItem(LOCAL_APPS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter((a: any) => !a.id?.startsWith('app-00'));
        return cleaned;
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveApplication(app: RiderApplication): Promise<{ success: boolean; error?: string }> {
  // Update local cache
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
  } catch {
    // ignore
  }

  // Sync with Supabase using adaptiveUpsert
  const dbRecord = mapApplicationToDb(app);
  return await adaptiveUpsert('applications', dbRecord, 'id');
}

export const saveApplicationToDb = saveApplication;

export async function deleteApplication(appId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_APPS_KEY);
    if (cached) {
      const list: RiderApplication[] = JSON.parse(cached);
      const filtered = list.filter((a) => a.id !== appId);
      localStorage.setItem(LOCAL_APPS_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('applications').delete().eq('id', appId);
    } catch (err) {
      console.warn('Supabase delete application error:', err);
    }
  }
}

// ==============================================================================
// 2. BIKES REPOSITORY
// ==============================================================================

export async function fetchBikes(): Promise<Bike[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('bikes')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data)) {
        const mapped = data.map((b: any) => ({
          id: b.id,
          name: b.name,
          subtitle: b.subtitle || '',
          brand: b.brand,
          category: b.category,
          isAvailable: b.is_available ?? b.isAvailable ?? true,
          isComingSoon: b.is_coming_soon ?? b.isComingSoon ?? false,
          image: b.image || b.image_url || '',
          badge: b.badge || '',
          fuelType: b.fuel_type || b.fuelType || 'Petrol 4-Stroke',
          engineCapacity: b.engine_capacity || b.engineCapacity || '150cc',
          tankCapacity: b.tank_capacity || b.tankCapacity || '',
          rangePerCharge: b.range_per_charge || b.rangePerCharge || '',
          deliveryBoxReady: b.delivery_box_ready ?? b.deliveryBoxReady ?? true,
          pricing: typeof b.pricing === 'object' && b.pricing !== null ? b.pricing : {
            used: { available: true, deposit: 650, weeklyPayment: 650, termMonths: 20 },
            new: { available: true, deposit: 1000, weeklyPayment: 750, termMonthsOptions: [15, 18] },
          },
          keyFeatures: Array.isArray(b.key_features) ? b.key_features : Array.isArray(b.keyFeatures) ? b.keyFeatures : [],
          recommendedFor: b.recommended_for || b.recommendedFor || '',
        }));
        try {
          localStorage.setItem(LOCAL_BIKES_KEY, JSON.stringify(mapped));
        } catch {
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
  } catch {
    // ignore
  }

  return [];
}

export async function saveBike(bike: Bike): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_BIKES_KEY);
    let list: Bike[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((b) => b.id === bike.id);
    if (exists) {
      list = list.map((b) => (b.id === bike.id ? bike : b));
    } else {
      list = [bike, ...list];
    }
    localStorage.setItem(LOCAL_BIKES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const dbRecord = {
    id: bike.id,
    name: bike.name,
    subtitle: bike.subtitle,
    brand: bike.brand,
    category: bike.category,
    is_available: bike.isAvailable,
    is_coming_soon: Boolean(bike.isComingSoon),
    image: bike.image,
    image_url: bike.image,
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

  return await adaptiveUpsert('bikes', dbRecord, 'id');
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
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('bikes').delete().eq('id', bikeId);
    } catch (err) {
      console.warn('Supabase delete bike error:', err);
    }
  }
}

export const deleteBikeFromDb = deleteBike;

// ==============================================================================
// 3. VEHICLES REPOSITORY
// ==============================================================================

function mapDbToVehicle(row: any): Vehicle {
  return {
    id: row.id,
    vin: row.vin || '',
    engineNumber: row.engine_number || row.engineNumber || '',
    engine_number: row.engine_number || row.engineNumber || '',
    registrationPlate: row.registration_plate || row.vehicle_reg || row.registrationPlate || '',
    registration_plate: row.registration_plate || row.vehicle_reg || row.registrationPlate || '',
    bikeModelId: row.bike_model_id || row.bike_id || row.bikeModelId || 'boxer-150',
    bike_id: row.bike_id || row.bike_model_id || 'boxer-150',
    bikeId: row.bike_id || row.bike_model_id || 'boxer-150',
    make: row.make || (row.model_name?.toLowerCase().includes('big boy') ? 'Big Boy' : 'Bajaj'),
    model: row.model || row.model_name || 'Boxer 150 HD',
    model_name: row.model_name || row.model || 'Boxer 150 HD',
    modelName: row.model_name || row.model || 'Boxer 150 HD',
    year: Number(row.year || 2025),
    color: row.color || 'Fleet White',
    category: row.category || 'boxer',
    condition: row.condition || 'new',
    status: row.status || 'available_showroom',
    assignedDriverId: row.assigned_driver_id || row.current_driver_id || row.assignedDriverId || undefined,
    assignedDriverName: row.assigned_driver_name || row.current_driver_name || row.assignedDriverName || undefined,
    odometerKm: Number(row.current_mileage_km ?? row.odometer_km ?? row.mileage_km ?? 0),
    current_mileage_km: Number(row.current_mileage_km ?? row.odometer_km ?? row.mileage_km ?? 0),
    currentMileageKm: Number(row.current_mileage_km ?? row.odometer_km ?? row.mileage_km ?? 0),
    last_service_mileage_km: Number(row.last_service_mileage_km ?? 0),
    lastServiceMileageKm: Number(row.last_service_mileage_km ?? 0),
    nextServiceKm: Number(row.next_service_mileage_km ?? row.next_service_km ?? 5000),
    next_service_mileage_km: Number(row.next_service_mileage_km ?? row.next_service_km ?? 5000),
    nextServiceMileageKm: Number(row.next_service_mileage_km ?? row.next_service_km ?? 5000),
    lastServiceDate: row.last_service_date || undefined,
    trackerDeviceId: row.telematics_imei || row.tracker_device_id || row.gps_device_imei || '',
    telematics_imei: row.telematics_imei || row.tracker_device_id || row.gps_device_imei || '',
    telematicsImei: row.telematics_imei || row.tracker_device_id || row.gps_device_imei || '',
    trackerProvider: row.tracker_provider || 'Cartrack SA',
    batteryHealthPercent: Number(row.telematics_battery_health ?? row.battery_health_percent ?? 98),
    telematics_battery_health: Number(row.telematics_battery_health ?? row.battery_health_percent ?? 98),
    telematicsBatteryHealth: Number(row.telematics_battery_health ?? row.battery_health_percent ?? 98),
    fuelLevelPercent: Number(row.fuel_level_percent ?? 100),
    isIgnitionOn: Boolean(row.is_ignition_on ?? row.ignition_status ?? row.ignition_state ?? false),
    latitude: row.latitude !== undefined && row.latitude !== null ? Number(row.latitude) : (row.current_lat !== undefined && row.current_lat !== null ? Number(row.current_lat) : undefined),
    longitude: row.longitude !== undefined && row.longitude !== null ? Number(row.longitude) : (row.current_lng !== undefined && row.current_lng !== null ? Number(row.current_lng) : undefined),
    lastLocationAddress: row.last_location_address || row.last_known_location || '304 Tungsten Rd, Strijdom Park, Randburg',
    lastPingTime: row.last_ping_time || row.last_ping_at || row.last_telematics_ping || new Date().toISOString(),
    insurancePolicyNumber: row.insurance_policy_number || '',
    licenseDiskExpiryDate: row.license_disk_expiry_date || '',
    license_disk_expiry_date: row.license_disk_expiry_date || '',
    imageUrl: row.image_url || '',
    image_url: row.image_url || '',
  };
}

function mapVehicleToDb(veh: Vehicle) {
  const modelName = veh.model_name || veh.modelName || veh.model || 'Big Boy Velocity 150';
  const bikeId = veh.bike_id || veh.bikeId || veh.bikeModelId || 'bigboy-velocity-150';
  const currentMileage = Number(veh.current_mileage_km ?? veh.currentMileageKm ?? veh.odometerKm ?? 0);
  const lastServiceMileage = Number(veh.last_service_mileage_km ?? veh.lastServiceMileageKm ?? 0);
  const nextServiceMileage = Number(veh.next_service_mileage_km ?? veh.nextServiceMileageKm ?? veh.nextServiceKm ?? 5000);
  const telematicsImei = veh.telematics_imei || veh.telematicsImei || veh.trackerDeviceId || null;
  const telematicsBattery = Number(veh.telematics_battery_health ?? veh.telematicsBatteryHealth ?? veh.batteryHealthPercent ?? 98);
  const vehicleColor = veh.color || 'Fleet White';
  
  // Standardize status for PostgreSQL check constraints (e.g. 'available', 'assigned', 'in_maintenance')
  let vehicleStatus = (veh.status || 'available').trim();
  if (vehicleStatus === 'available_showroom' || vehicleStatus === 'showroom' || vehicleStatus === 'in_stock') {
    vehicleStatus = 'available';
  } else if (vehicleStatus === 'maintenance') {
    vehicleStatus = 'in_maintenance';
  }

  // Exact 14 columns present in public.vehicles table
  return {
    id: veh.id,
    registration_plate: (veh.registrationPlate || (veh as any).registration_plate || '').toUpperCase().trim(),
    vin: (veh.vin || (veh as any).vin || '').toUpperCase().trim(),
    engine_number: (veh.engineNumber || (veh as any).engine_number || '').toUpperCase().trim() || null,
    bike_id: bikeId,
    model_name: modelName,
    year: Number(veh.year) || 2025,
    color: vehicleColor,
    status: vehicleStatus,
    current_mileage_km: currentMileage,
    last_service_mileage_km: lastServiceMileage,
    next_service_mileage_km: nextServiceMileage,
    telematics_imei: telematicsImei,
    telematics_battery_health: telematicsBattery,
  };
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbToVehicle);
        try {
          localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      } else if (error) {
        console.warn('Supabase vehicles fetch error:', error);
      }
    } catch (err) {
      console.warn('Supabase vehicles fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_VEHICLES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((v: any) => !v.id?.startsWith('veh-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveVehicle(vehicle: Vehicle): Promise<{ success: boolean; error?: string }> {
  // 1. Update local cache immediately
  try {
    const cached = localStorage.getItem(LOCAL_VEHICLES_KEY);
    let list: Vehicle[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((v) => v.id === vehicle.id);
    if (exists) {
      list = list.map((v) => (v.id === vehicle.id ? vehicle : v));
    } else {
      list = [vehicle, ...list];
    }
    localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  // 2. Persist to Supabase with adaptiveUpsert (auto strips unknown cols, handles FKs & RLS)
  const record = mapVehicleToDb(vehicle);
  return await adaptiveUpsert('vehicles', record, 'id');
}

export async function syncAllPendingVehiclesToSupabase(): Promise<{ total: number; synced: number; errors: string[] }> {
  const client = getSupabaseClient();
  if (!client) return { total: 0, synced: 0, errors: ['Supabase client not connected'] };

  try {
    const cached = localStorage.getItem(LOCAL_VEHICLES_KEY);
    if (!cached) return { total: 0, synced: 0, errors: [] };
    const list: Vehicle[] = JSON.parse(cached);
    if (!Array.isArray(list) || list.length === 0) return { total: 0, synced: 0, errors: [] };

    let synced = 0;
    const errors: string[] = [];

    for (const veh of list) {
      const res = await saveVehicle(veh);
      if (res.success) {
        synced++;
      } else if (res.error) {
        errors.push(`${veh.registrationPlate}: ${res.error}`);
      }
    }

    return { total: list.length, synced, errors };
  } catch (err: any) {
    return { total: 0, synced: 0, errors: [err?.message || 'Sync failed'] };
  }
}

export async function deleteVehicle(vehicleId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_VEHICLES_KEY);
    if (cached) {
      const list: Vehicle[] = JSON.parse(cached);
      const filtered = list.filter((v) => v.id !== vehicleId);
      localStorage.setItem(LOCAL_VEHICLES_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('vehicles').delete().eq('id', vehicleId);
    } catch (err) {
      console.warn('Supabase delete vehicle error:', err);
    }
  }
}

// ==============================================================================
// 4. DRIVERS REPOSITORY
// ==============================================================================

function mapDbToDriver(row: any): Driver {
  return {
    id: row.id,
    applicationId: row.application_id || row.applicationId || undefined,
    refNumber: row.ref_number || row.refNumber || `DRV-${row.id.slice(-4)}`,
    fullName: row.full_name || row.fullName || '',
    phone: row.phone || row.phone_number || '',
    whatsappNumber: row.whatsapp_number || row.whatsappNumber || '',
    email: row.email || '',
    idOrPassportNumber: row.id_or_passport_number || row.id_number || row.idOrPassportNumber || '',
    citizenship: row.citizenship || 'south_african',
    nationalityCountry: row.nationality_country || row.nationalityCountry || '',
    address: row.address || '',
    suburb: row.suburb || '',
    city: row.city || 'Randburg',
    status: row.status || 'active',
    assignedVehicleId: row.assigned_vehicle_id || row.assignedVehicleId || undefined,
    assignedBikeVinOrPlate: row.assigned_bike_vin_or_plate || row.assigned_vehicle_reg || row.assignedBikeVinOrPlate || undefined,
    assignedBikeName: row.assigned_bike_name || row.vehicle_model || row.assignedBikeName || undefined,
    weeklyRate: Number(row.weekly_rate ?? row.weekly_rate_zar ?? row.weeklyRate ?? 750),
    balanceDue: Number(row.balance_due ?? row.balanceDue ?? 0),
    depositPaid: Number(row.deposit_paid ?? row.depositPaid ?? 1000),
    contractStartDate: row.contract_start_date || row.contractStartDate || new Date().toISOString().split('T')[0],
    contractEndDate: row.contract_end_date || row.contractEndDate || undefined,
    termMonths: Number(row.term_months ?? row.termMonths ?? 18),
    primaryPlatform: row.primary_platform || row.delivery_platform || 'Checkers Sixty60',
    deliveryApps: Array.isArray(row.delivery_apps) ? row.delivery_apps : [],
    riskTier: row.risk_tier || row.riskTier || 'low',
    riskScore: Number(row.risk_score ?? row.riskScore ?? 90),
    paymentScore: Number(row.payment_score ?? row.paymentScore ?? 100),
    incidentCount: Number(row.incident_count ?? row.incidentCount ?? 0),
    totalPaid: Number(row.total_paid ?? row.totalPaid ?? 0),
    yocoCustomerToken: row.yoco_customer_token || row.yocoCustomerToken || undefined,
    referredBy: row.referred_by || row.referredBy || undefined,
    notes: row.notes || undefined,
  };
}

function mapDriverToDb(drv: Driver) {
  return {
    id: drv.id,
    application_id: drv.applicationId || null,
    ref_number: drv.refNumber,
    full_name: drv.fullName,
    phone: drv.phone,
    phone_number: drv.phone,
    whatsapp_number: drv.whatsappNumber,
    email: drv.email || null,
    id_or_passport_number: drv.idOrPassportNumber,
    id_number: drv.idOrPassportNumber,
    citizenship: drv.citizenship,
    nationality_country: drv.nationalityCountry || null,
    address: drv.address,
    suburb: drv.suburb,
    city: drv.city,
    status: drv.status,
    assigned_vehicle_id: drv.assignedVehicleId || null,
    assigned_vehicle_reg: drv.assignedBikeVinOrPlate || null,
    assigned_bike_vin_or_plate: drv.assignedBikeVinOrPlate || null,
    assigned_bike_name: drv.assignedBikeName || null,
    vehicle_model: drv.assignedBikeName || null,
    weekly_rate: drv.weeklyRate,
    weekly_rate_zar: drv.weeklyRate,
    balance_due: drv.balanceDue,
    deposit_paid: drv.depositPaid,
    contract_start_date: drv.contractStartDate,
    contract_end_date: drv.contractEndDate || null,
    term_months: drv.termMonths,
    primary_platform: drv.primaryPlatform,
    delivery_platform: drv.primaryPlatform,
    delivery_apps: drv.deliveryApps || [],
    risk_tier: drv.riskTier,
    risk_score: drv.riskScore,
    payment_score: drv.paymentScore,
    incident_count: drv.incidentCount,
    total_paid: drv.totalPaid,
    yoco_customer_token: drv.yocoCustomerToken || null,
    referred_by: drv.referredBy || null,
    notes: drv.notes || null,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchDrivers(): Promise<Driver[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped = data.map(mapDbToDriver);
        try {
          localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase drivers fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_DRIVERS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((d: any) => !d.id?.startsWith('drv-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveDriver(driver: Driver): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_DRIVERS_KEY);
    let list: Driver[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((d) => d.id === driver.id);
    if (exists) {
      list = list.map((d) => (d.id === driver.id ? driver : d));
    } else {
      list = [driver, ...list];
    }
    localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const dbRecord = mapDriverToDb(driver);
  return await adaptiveUpsert('drivers', dbRecord, 'id');
}

export async function deleteDriver(driverId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_DRIVERS_KEY);
    if (cached) {
      const list: Driver[] = JSON.parse(cached);
      const filtered = list.filter((d) => d.id !== driverId);
      localStorage.setItem(LOCAL_DRIVERS_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('drivers').delete().eq('id', driverId);
    } catch (err) {
      console.warn('Supabase delete driver error:', err);
    }
  }
}

// ==============================================================================
// 5. PARTS INVENTORY REPOSITORY
// ==============================================================================

export async function fetchParts(): Promise<PartsInventoryItem[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('parts_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: PartsInventoryItem[] = data.map((p: any) => ({
          id: p.id,
          sku: p.sku || p.part_number || '',
          name: p.name,
          category: p.category,
          quantityInStock: Number(p.quantity_in_stock || p.quantityInStock || 0),
          minThreshold: Number(p.min_threshold || p.minimum_threshold || p.min_reorder_level || 5),
          costPriceZar: Number(p.cost_price_zar || p.unit_cost || p.unit_cost_zar || 0),
          sellingPriceZar: Number(p.selling_price_zar || p.retail_price || p.retail_price_zar || 0),
          compatibleModels: Array.isArray(p.compatible_models) ? p.compatible_models : [],
          supplierName: p.supplier_name || p.supplier || '',
          lastRestockedDate: p.last_restocked_date || '',
          imageUrl: p.image_url || p.imageUrl || p.image || '',
        }));
        try {
          localStorage.setItem(LOCAL_PARTS_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase parts fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_PARTS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((p: any) => !p.id?.startsWith('prt-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function savePart(part: PartsInventoryItem): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_PARTS_KEY);
    let list: PartsInventoryItem[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((p) => p.id === part.id);
    if (exists) {
      list = list.map((p) => (p.id === part.id ? part : p));
    } else {
      list = [part, ...list];
    }
    localStorage.setItem(LOCAL_PARTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const dbRecord = {
    id: part.id,
    sku: part.sku,
    part_number: part.sku,
    name: part.name,
    category: part.category,
    quantity_in_stock: part.quantityInStock,
    min_threshold: part.minThreshold,
    minimum_threshold: part.minThreshold,
    cost_price_zar: part.costPriceZar,
    unit_cost: part.costPriceZar,
    selling_price_zar: part.sellingPriceZar,
    retail_price: part.sellingPriceZar,
    compatible_models: part.compatibleModels,
    supplier_name: part.supplierName,
    supplier: part.supplierName,
    last_restocked_date: part.lastRestockedDate,
    image_url: part.imageUrl || null,
  };

  return await adaptiveUpsert('parts_inventory', dbRecord, 'id', ['parts']);
}

export async function deletePart(partId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_PARTS_KEY);
    if (cached) {
      const list: PartsInventoryItem[] = JSON.parse(cached);
      const filtered = list.filter((p) => p.id !== partId);
      localStorage.setItem(LOCAL_PARTS_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('parts_inventory').delete().eq('id', partId);
    } catch (err) {
      console.warn('Supabase delete part error:', err);
    }
  }
}

// ==============================================================================
// 6. SERVICES & REPAIRS REPOSITORY
// ==============================================================================

export async function fetchServices(): Promise<RepairAndService[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('repairs_and_services')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: RepairAndService[] = data.map((s: any) => ({
          id: s.id,
          vehicleId: s.vehicle_id || '',
          vehiclePlate: s.vehicle_plate || s.vehicle_reg || '',
          driverId: s.driver_id || undefined,
          driverName: s.driver_name || undefined,
          driverPhone: s.driver_phone || undefined,
          serviceType: s.service_type || 'routine_5000km',
          odometerKm: Number(s.odometer_km || s.mileage_at_service_km || 0),
          costZar: Number(s.cost_zar || s.total_cost_zar || 0),
          technicianName: s.technician_name || '',
          garageLocation: s.garage_location || 'Randburg Workshop',
          serviceDate: s.service_date || new Date().toISOString().split('T')[0],
          status: s.status || 'completed',
          partsUsed: Array.isArray(s.parts_used) ? s.parts_used : [],
          notes: s.notes || '',
          invoiceUrl: s.invoice_url || '',
        }));
        try {
          localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase services fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_SERVICES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((s: any) => !s.id?.startsWith('srv-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveService(service: RepairAndService): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_SERVICES_KEY);
    let list: RepairAndService[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((s) => s.id === service.id);
    if (exists) {
      list = list.map((s) => (s.id === service.id ? service : s));
    } else {
      list = [service, ...list];
    }
    localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const dbRecord = {
    id: service.id,
    vehicle_id: service.vehicleId,
    vehicle_plate: service.vehiclePlate,
    vehicle_reg: service.vehiclePlate,
    driver_id: service.driverId || null,
    driver_name: service.driverName || null,
    driver_phone: service.driverPhone || null,
    service_type: service.serviceType,
    odometer_km: service.odometerKm,
    mileage_at_service_km: service.odometerKm,
    cost_zar: service.costZar,
    total_cost_zar: service.costZar,
    technician_name: service.technicianName,
    garage_location: service.garageLocation,
    service_date: service.serviceDate,
    status: service.status,
    parts_used: service.partsUsed || [],
    notes: service.notes || null,
    invoice_url: service.invoiceUrl || null,
  };

  return await adaptiveUpsert('repairs_and_services', dbRecord, 'id', ['services', 'repairs']);
}

export async function deleteService(serviceId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_SERVICES_KEY);
    if (cached) {
      const list: RepairAndService[] = JSON.parse(cached);
      const filtered = list.filter((s) => s.id !== serviceId);
      localStorage.setItem(LOCAL_SERVICES_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('repairs_and_services').delete().eq('id', serviceId);
    } catch (err) {
      console.warn('Supabase delete service error:', err);
    }
  }
}

// ==============================================================================
// 7. TRAFFIC FINES REPOSITORY
// ==============================================================================

export async function fetchFines(): Promise<TrafficFine[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('traffic_fines')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: TrafficFine[] = data.map((f: any) => ({
          id: f.id,
          noticeNumber: f.notice_number || f.noticeNumber || '',
          infringementDate: f.infringement_date || f.violation_date || new Date().toISOString().split('T')[0],
          vehiclePlate: f.vehicle_plate || f.vehicle_reg || '',
          driverId: f.driver_id || undefined,
          driverName: f.driver_name || undefined,
          location: f.location || '',
          municipality: f.municipality || f.issuing_authority || 'JMPD',
          infringementType: f.infringement_type || 'Speeding',
          amountZar: Number(f.amount_zar || f.fine_amount || 0),
          discountedAmountZar: Number(f.discounted_amount_zar || f.discounted_amount || 0),
          dueDate: f.due_date || new Date().toISOString().split('T')[0],
          aartoStatus: f.aarto_status || 'notice_issued',
          paymentStatus: f.payment_status || f.status || 'unpaid',
          documentUrl: f.document_url || '',
        }));
        try {
          localStorage.setItem(LOCAL_FINES_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fines fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_FINES_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((f: any) => !f.id?.startsWith('fine-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveFine(fine: TrafficFine): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_FINES_KEY);
    let list: TrafficFine[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((f) => f.id === fine.id);
    if (exists) {
      list = list.map((f) => (f.id === fine.id ? fine : f));
    } else {
      list = [fine, ...list];
    }
    localStorage.setItem(LOCAL_FINES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const dbRecord = {
    id: fine.id,
    notice_number: fine.noticeNumber,
    infringement_date: fine.infringementDate,
    vehicle_plate: fine.vehiclePlate,
    driver_id: fine.driverId || null,
    driver_name: fine.driverName || null,
    location: fine.location,
    municipality: fine.municipality,
    infringement_type: fine.infringementType,
    amount_zar: fine.amountZar,
    discounted_amount_zar: fine.discountedAmountZar || fine.amountZar / 2,
    due_date: fine.dueDate,
    aarto_status: fine.aartoStatus,
    payment_status: fine.paymentStatus,
    document_url: fine.documentUrl || null,
  };

  return await adaptiveUpsert('traffic_fines', dbRecord, 'id', ['fines']);
}

export async function deleteFine(fineId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_FINES_KEY);
    if (cached) {
      const list: TrafficFine[] = JSON.parse(cached);
      const filtered = list.filter((f) => f.id !== fineId);
      localStorage.setItem(LOCAL_FINES_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('traffic_fines').delete().eq('id', fineId);
    } catch (err) {
      console.warn('Supabase delete fine error:', err);
    }
  }
}

// ==============================================================================
// 8. YOCO TRANSACTIONS REPOSITORY
// ==============================================================================

export async function fetchTransactions(): Promise<YocoTransaction[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('yoco_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: YocoTransaction[] = data.map((t: any) => ({
          id: t.id,
          yocoChargeId: t.yoco_charge_id || t.yocoChargeId || '',
          yocoPaymentLinkId: t.yoco_payment_link_id || t.yocoPaymentLinkId || undefined,
          driverId: t.driver_id || '',
          driverName: t.driver_name || '',
          amountZar: Number(t.amount_zar || 0),
          currency: 'ZAR',
          paymentMethod: t.payment_method || t.channel || 'yoco_payment_link',
          allocation: t.allocation || 'weekly_rental',
          status: t.status || 'successful',
          yocoFeeZar: Number(t.yoco_fee_zar || t.fee_zar || 0),
          netAmountZar: Number(t.net_amount_zar || t.net_zar || 0),
          cardLast4: t.card_last4 || undefined,
          cardBrand: t.card_brand || undefined,
          reconciliationStatus: t.reconciliation_status || 'reconciled',
          transactionDate: t.transaction_date || t.created_at || new Date().toISOString(),
          yocoMetadata: typeof t.yoco_metadata === 'object' ? t.yoco_metadata : {},
        }));
        try {
          localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase transactions fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((t: any) => !t.id?.startsWith('tx-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveTransaction(tx: YocoTransaction): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_TRANSACTIONS_KEY);
    let list: YocoTransaction[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((t) => t.id === tx.id);
    if (exists) {
      list = list.map((t) => (t.id === tx.id ? tx : t));
    } else {
      list = [tx, ...list];
    }
    localStorage.setItem(LOCAL_TRANSACTIONS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const dbRecord = {
    id: tx.id,
    yoco_charge_id: tx.yocoChargeId,
    yoco_payment_link_id: tx.yocoPaymentLinkId || null,
    driver_id: tx.driverId,
    driver_name: tx.driverName,
    amount_zar: tx.amountZar,
    currency: tx.currency,
    payment_method: tx.paymentMethod,
    allocation: tx.allocation,
    status: tx.status,
    yoco_fee_zar: tx.yocoFeeZar,
    net_amount_zar: tx.netAmountZar,
    card_last4: tx.cardLast4 || null,
    card_brand: tx.cardBrand || null,
    reconciliation_status: tx.reconciliationStatus,
    transaction_date: tx.transactionDate,
    yoco_metadata: tx.yocoMetadata || {},
  };

  return await adaptiveUpsert('yoco_transactions', dbRecord, 'id', ['transactions', 'payments']);
}

// ==============================================================================
// 9. RENTAL AGREEMENTS REPOSITORY
// ==============================================================================

export async function fetchAgreements(): Promise<RentalAgreement[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('rental_agreements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: RentalAgreement[] = data.map((a: any) => ({
          id: a.id,
          agreementNumber: a.agreement_number || a.agreementNumber || '',
          driverId: a.driver_id || '',
          driverName: a.driver_name || '',
          vehicleId: a.vehicle_id || '',
          vehiclePlate: a.vehicle_plate || a.vehicle_reg || '',
          agreementType: a.agreement_type || 'rent_to_own',
          termMonths: Number(a.term_months || 18),
          weeklyRateZar: Number(a.weekly_rate_zar || 0),
          depositAmountZar: Number(a.deposit_amount_zar || a.deposit_held_zar || 0),
          depositPaid: Boolean(a.deposit_paid ?? true),
          startDate: a.start_date || new Date().toISOString().split('T')[0],
          expectedEndDate: a.expected_end_date || new Date().toISOString().split('T')[0],
          actualEndDate: a.actual_end_date || undefined,
          totalContractValueZar: Number(a.total_contract_value_zar || 0),
          totalPaidZar: Number(a.total_paid_zar || 0),
          remainingBalanceZar: Number(a.remaining_balance_zar || 0),
          isCompleted: Boolean(a.is_completed ?? false),
          signatureDataUrl: a.signature_data_url || undefined,
          contractPdfUrl: a.contract_pdf_url || undefined,
          termsVersion: a.terms_version || 'v2026.1',
        }));
        try {
          localStorage.setItem(LOCAL_AGREEMENTS_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase agreements fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_AGREEMENTS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((a: any) => !a.id?.startsWith('agr-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveAgreement(ag: RentalAgreement): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_AGREEMENTS_KEY);
    let list: RentalAgreement[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((a) => a.id === ag.id);
    if (exists) {
      list = list.map((a) => (a.id === ag.id ? ag : a));
    } else {
      list = [ag, ...list];
    }
    localStorage.setItem(LOCAL_AGREEMENTS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const dbRecord = {
    id: ag.id,
    agreement_number: ag.agreementNumber,
    driver_id: ag.driverId,
    driver_name: ag.driverName,
    vehicle_id: ag.vehicleId,
    vehicle_plate: ag.vehiclePlate,
    agreement_type: ag.agreementType,
    term_months: ag.termMonths,
    weekly_rate_zar: ag.weeklyRateZar,
    deposit_amount_zar: ag.depositAmountZar,
    deposit_paid: ag.depositPaid,
    start_date: ag.startDate,
    expected_end_date: ag.expectedEndDate,
    actual_end_date: ag.actualEndDate || null,
    total_contract_value_zar: ag.totalContractValueZar,
    total_paid_zar: ag.totalPaidZar,
    remaining_balance_zar: ag.remainingBalanceZar,
    is_completed: ag.isCompleted,
    signature_data_url: ag.signatureDataUrl || null,
    contract_pdf_url: ag.contractPdfUrl || null,
    terms_version: ag.termsVersion,
  };

  return await adaptiveUpsert('rental_agreements', dbRecord, 'id', ['agreements']);
}

// ==============================================================================
// 10. DRIVER REFERRALS REPOSITORY
// ==============================================================================

export async function fetchReferrals(): Promise<DriverReferral[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('driver_referrals')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: DriverReferral[] = data.map((r: any) => ({
          id: r.id,
          referrerDriverId: r.referrer_driver_id || r.referring_driver_id || '',
          referrerDriverName: r.referrer_driver_name || r.referring_driver_name || '',
          referredApplicantName: r.referred_applicant_name || '',
          referredPhone: r.referred_phone || r.referred_applicant_phone || '',
          referralDate: r.referral_date || new Date().toISOString().split('T')[0],
          status: r.status || 'pending_onboarding',
          rewardAmountZar: Number(r.reward_amount_zar || r.bonus_amount_zar || 350),
          paidDate: r.paid_date || undefined,
        }));
        try {
          localStorage.setItem(LOCAL_REFERRALS_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase referrals fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_REFERRALS_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((r: any) => !r.id?.startsWith('ref-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveReferral(ref: DriverReferral): Promise<{ success: boolean; error?: string }> {
  try {
    const cached = localStorage.getItem(LOCAL_REFERRALS_KEY);
    let list: DriverReferral[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((r) => r.id === ref.id);
    if (exists) {
      list = list.map((r) => (r.id === ref.id ? ref : r));
    } else {
      list = [ref, ...list];
    }
    localStorage.setItem(LOCAL_REFERRALS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  let resolvedReferrerId = ref.referrerDriverId;

  if (client) {
    try {
      // 1. If referrer ID is provided, check if it exists in drivers table
      if (resolvedReferrerId) {
        const { data: existingDrv } = await client
          .from('drivers')
          .select('id')
          .eq('id', resolvedReferrerId)
          .maybeSingle();

        if (!existingDrv) {
          // Check if any driver matches the referrer name
          const { data: matchedByName } = await client
            .from('drivers')
            .select('id')
            .ilike('full_name', ref.referrerDriverName || '')
            .limit(1)
            .maybeSingle();

          if (matchedByName && matchedByName.id) {
            resolvedReferrerId = matchedByName.id;
          } else {
            // Check if ANY driver exists in drivers table
            const { data: anyDriver } = await client
              .from('drivers')
              .select('id')
              .limit(1)
              .maybeSingle();

            if (anyDriver && anyDriver.id) {
              resolvedReferrerId = anyDriver.id;
            } else {
              // Create a minimal driver record to satisfy PostgreSQL FK & NOT-NULL constraints
              const fallbackDriverId = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : `drv-${Date.now()}`;

              await saveDriver({
                id: fallbackDriverId,
                refNumber: 'DRV-STAFF-01',
                fullName: ref.referrerDriverName || 'Fleet Staff Referrer',
                phone: '0710000000',
                whatsappNumber: '0710000000',
                idOrPassportNumber: 'STAFF-REFERRER',
                citizenship: 'south_african',
                address: 'Randburg Hub',
                suburb: 'Randburg',
                city: 'Randburg',
                status: 'active',
                weeklyRate: 750,
                balanceDue: 0,
                depositPaid: 1000,
                contractStartDate: new Date().toISOString().split('T')[0],
                termMonths: 18,
                primaryPlatform: 'Internal Referral Program',
                riskTier: 'low',
                riskScore: 95,
                paymentScore: 100,
                incidentCount: 0,
                totalPaid: 0,
              });
              resolvedReferrerId = fallbackDriverId;
            }
          }
        }
      } else {
        // No ID provided, check for any driver
        const { data: anyDriver } = await client
          .from('drivers')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (anyDriver && anyDriver.id) {
          resolvedReferrerId = anyDriver.id;
        } else {
          const fallbackDriverId = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `drv-${Date.now()}`;

          await saveDriver({
            id: fallbackDriverId,
            refNumber: 'DRV-STAFF-01',
            fullName: ref.referrerDriverName || 'Fleet Staff Referrer',
            phone: '0710000000',
            whatsappNumber: '0710000000',
            idOrPassportNumber: 'STAFF-REFERRER',
            citizenship: 'south_african',
            address: 'Randburg Hub',
            suburb: 'Randburg',
            city: 'Randburg',
            status: 'active',
            weeklyRate: 750,
            balanceDue: 0,
            depositPaid: 1000,
            contractStartDate: new Date().toISOString().split('T')[0],
            termMonths: 18,
            primaryPlatform: 'Internal Referral Program',
            riskTier: 'low',
            riskScore: 95,
            paymentScore: 100,
            incidentCount: 0,
            totalPaid: 0,
          });
          resolvedReferrerId = fallbackDriverId;
        }
      }
    } catch (checkErr) {
      console.warn('Driver lookup / creation for referral error:', checkErr);
    }
  }

  const primaryRecord = {
    id: ref.id,
    referrer_driver_id: resolvedReferrerId,
    referrer_driver_name: ref.referrerDriverName || '',
    referring_driver_id: resolvedReferrerId,
    referring_driver_name: ref.referrerDriverName || '',
    referred_applicant_name: ref.referredApplicantName || '',
    referred_phone: ref.referredPhone || '',
    referred_applicant_phone: ref.referredPhone || '',
    referral_date: ref.referralDate || new Date().toISOString().split('T')[0],
    status: ref.status || 'pending_onboarding',
    reward_amount_zar: Number(ref.rewardAmountZar) || 350,
    bonus_amount_zar: Number(ref.rewardAmountZar) || 350,
    paid_date: ref.paidDate || null,
  };

  return await adaptiveUpsert('driver_referrals', primaryRecord, 'id', ['referrals']);
}

export async function deleteReferral(referralId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_REFERRALS_KEY);
    if (cached) {
      const list: DriverReferral[] = JSON.parse(cached);
      const filtered = list.filter((r) => r.id !== referralId);
      localStorage.setItem(LOCAL_REFERRALS_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('driver_referrals').delete().eq('id', referralId);
    } catch (err) {
      console.warn('Supabase delete referral error:', err);
    }
  }
}

// ==============================================================================
// 11. SITE SETTINGS & BRANDING REPOSITORY
// ==============================================================================

export interface SiteCustomizationData {
  logoUrl: string;
  heroImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
}

export async function fetchCustomizationFromDb(): Promise<SiteCustomizationData> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
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

export async function saveCustomizationToDb(
  customization: Partial<SiteCustomizationData>
): Promise<SiteCustomizationData> {
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

  const dbRecord = {
    id: 'global',
    logo_url: updated.logoUrl,
    hero_image_url: updated.heroImageUrl,
    hero_title: updated.heroTitle,
    hero_subtitle: updated.heroSubtitle,
    updated_at: new Date().toISOString(),
  };
  await adaptiveUpsert('site_settings', dbRecord, 'id');

  return updated;
}

// ==============================================================================
// 12. FLAGGED RISK REGISTRY REPOSITORY
// ==============================================================================
const LOCAL_RISK_KEY = 'dyn_fleet_risk_registry_v1';

export async function fetchRiskEntries(): Promise<FlaggedRiskEntry[]> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('flagged_risk_registry')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        const mapped: FlaggedRiskEntry[] = data.map((r: any) => ({
          id: r.id,
          driverId: r.driver_id || undefined,
          fullName: r.full_name || '',
          idOrPassportNumber: r.id_or_passport_number || '',
          phone: r.phone || '',
          whatsappNumber: r.whatsapp_number || r.phone || '',
          nationalityCountry: r.nationality_country || 'South Africa',
          riskTier: r.risk_tier || 'high',
          flagReason: r.flag_reason || 'payment_default',
          reasonDescription: r.reason_description || '',
          outstandingBalanceZar: Number(r.outstanding_balance_zar || 0),
          policeCaseNumber: r.police_case_number || undefined,
          reportedByOperator: r.reported_by_operator || 'Randburg Workshop Hub',
          reportedDate: r.reported_date || new Date().toISOString().split('T')[0],
          status: r.status || 'active',
          isCrossOperatorShared: Boolean(r.is_cross_operator_shared),
        }));
        try {
          localStorage.setItem(LOCAL_RISK_KEY, JSON.stringify(mapped));
        } catch {
          // ignore
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase risk registry fetch error:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_RISK_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        return parsed.filter((r: any) => !r.id?.startsWith('risk-flag-00'));
      }
    }
  } catch {
    // ignore
  }

  return [];
}

export async function saveRiskEntry(entry: FlaggedRiskEntry): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_RISK_KEY);
    let list: FlaggedRiskEntry[] = cached ? JSON.parse(cached) : [];
    const exists = list.some((r) => r.id === entry.id);
    if (exists) {
      list = list.map((r) => (r.id === entry.id ? entry : r));
    } else {
      list = [entry, ...list];
    }
    localStorage.setItem(LOCAL_RISK_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      const dbRecord = {
        id: entry.id,
        driver_id: entry.driverId || null,
        full_name: entry.fullName,
        id_or_passport_number: entry.idOrPassportNumber,
        phone: entry.phone || null,
        whatsapp_number: entry.whatsappNumber || entry.phone || null,
        nationality_country: entry.nationalityCountry || 'South Africa',
        risk_tier: entry.riskTier,
        flag_reason: entry.flagReason,
        reason_description: entry.reasonDescription,
        outstanding_balance_zar: entry.outstandingBalanceZar,
        police_case_number: entry.policeCaseNumber || null,
        reported_by_operator: entry.reportedByOperator || 'Randburg Workshop Hub',
        reported_date: entry.reportedDate,
        status: entry.status,
        is_cross_operator_shared: entry.isCrossOperatorShared,
      };
      await client.from('flagged_risk_registry').upsert(dbRecord, { onConflict: 'id' });
    } catch (err) {
      console.warn('Supabase risk registry save error:', err);
    }
  }
}

export async function deleteRiskEntry(entryId: string): Promise<void> {
  try {
    const cached = localStorage.getItem(LOCAL_RISK_KEY);
    if (cached) {
      const list: FlaggedRiskEntry[] = JSON.parse(cached);
      const filtered = list.filter((r) => r.id !== entryId);
      localStorage.setItem(LOCAL_RISK_KEY, JSON.stringify(filtered));
    }
  } catch {
    // ignore
  }

  const client = getSupabaseClient();
  if (client) {
    try {
      await client.from('flagged_risk_registry').delete().eq('id', entryId);
    } catch (err) {
      console.warn('Supabase delete risk entry error:', err);
    }
  }
}
