import { 
  Driver, 
  Vehicle, 
  PartsInventoryItem, 
  RepairAndService, 
  TrafficFine, 
  YocoTransaction, 
  RentalAgreement, 
  DriverReferral,
  RiderApplication,
  PaymentAllocation,
  YocoPaymentMethod
} from '../types';
import {
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_PARTS,
  INITIAL_SERVICES,
  INITIAL_FINES,
  INITIAL_YOCO_TRANSACTIONS,
  INITIAL_AGREEMENTS,
  INITIAL_REFERRALS,
} from '../data/fleetInitialData';
import {
  fetchDrivers as dbFetchDrivers,
  saveDriver as dbSaveDriver,
  deleteDriver as dbDeleteDriver,
  fetchVehicles as dbFetchVehicles,
  saveVehicle as dbSaveVehicle,
  fetchParts as dbFetchParts,
  savePart as dbSavePart,
  deletePart as dbDeletePart,
  fetchServices as dbFetchServices,
  saveService as dbSaveService,
  fetchFines as dbFetchFines,
  saveFine as dbSaveFine,
  fetchTransactions as dbFetchTransactions,
  saveTransaction as dbSaveTransaction,
  fetchAgreements as dbFetchAgreements,
  saveAgreement as dbSaveAgreement,
  fetchReferrals as dbFetchReferrals,
  saveReferral as dbSaveReferral,
  deleteReferral as dbDeleteReferral,
  syncAllPendingVehiclesToSupabase as dbSyncAllVehicles,
} from './supabase';

const STORAGE_KEYS = {
  DRIVERS: 'dyn_fleet_drivers_v1',
  VEHICLES: 'dyn_fleet_vehicles_v1',
  PARTS: 'dyn_fleet_parts_v1',
  SERVICES: 'dyn_fleet_services_v1',
  FINES: 'dyn_fleet_fines_v1',
  TRANSACTIONS: 'dyn_fleet_yoco_tx_v1',
  AGREEMENTS: 'dyn_fleet_agreements_v1',
  REFERRALS: 'dyn_fleet_referrals_v1',
  YOCO_SETTINGS: 'dyn_fleet_yoco_settings_v1',
};

export interface YocoSettings {
  mode: 'sandbox' | 'live';
  sandboxPublicKey: string;
  sandboxSecretKey: string;
  livePublicKey: string;
  liveSecretKey: string;
  webhookSecret: string;
  autoSendWhatsAppReceipt: boolean;
  merchantFeePercent: number; // 2.95% standard
}

export const DEFAULT_YOCO_SETTINGS: YocoSettings = {
  mode: 'sandbox',
  sandboxPublicKey: (import.meta as any).env?.VITE_YOCO_PUBLIC_KEY || 'pk_test_ed3c54a6gO18z5845030',
  sandboxSecretKey: 'sk_test_960e9341q44Qum6af110',
  livePublicKey: '',
  liveSecretKey: '',
  webhookSecret: 'whsec_test_secret_example',
  autoSendWhatsAppReceipt: true,
  merchantFeePercent: 2.95,
};

// Safe storage accessors
export function deduplicateDrivers(drivers: Driver[]): Driver[] {
  const seenIds = new Set<string>();
  const seenPassports = new Set<string>();
  const seenPhones = new Set<string>();
  const result: Driver[] = [];

  for (const drv of drivers) {
    if (!drv) continue;
    const passportKey = drv.idOrPassportNumber ? drv.idOrPassportNumber.trim().toLowerCase() : '';
    const phoneKey = drv.phone ? drv.phone.replace(/[^0-9]/g, '') : '';
    const idKey = drv.id ? drv.id.trim() : '';

    if (idKey && seenIds.has(idKey)) continue;
    if (passportKey && seenPassports.has(passportKey)) continue;
    if (phoneKey && seenPhones.has(phoneKey)) continue;

    if (idKey) seenIds.add(idKey);
    if (passportKey) seenPassports.add(passportKey);
    if (phoneKey) seenPhones.add(phoneKey);
    result.push(drv);
  }
  return result;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Filter out any stale mock demo keys from previous test runs
      return parsed.filter((item: any) => 
        !item?.id?.startsWith('veh-00') && 
        !item?.id?.startsWith('drv-00') && 
        !item?.id?.startsWith('app-00')
      ) as unknown as T;
    }
    return parsed;
  } catch (e) {
    console.warn(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Error writing ${key} to storage:`, e);
  }
}

// Initial state getters (synchronous local cache with fallback to empty array)
export function getFleetDrivers(): Driver[] {
  const raw = loadFromStorage(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
  return deduplicateDrivers(raw);
}

export function saveFleetDrivers(drivers: Driver[]): void {
  const deduped = deduplicateDrivers(drivers);
  saveToStorage(STORAGE_KEYS.DRIVERS, deduped);
  deduped.forEach((drv) => {
    dbSaveDriver(drv)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Driver Warning]', res.error);
        else console.log('[Supabase Sync Driver Success]', drv.fullName);
      })
      .catch((err) => console.warn('Failed to background save driver to Supabase:', err));
  });
}

export async function saveSingleDriverAsync(driver: Driver): Promise<{ success: boolean; error?: string }> {
  return await dbSaveDriver(driver);
}

export function getFleetVehicles(): Vehicle[] {
  return loadFromStorage(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
}

export function saveFleetVehicles(vehicles: Vehicle[]): void {
  saveToStorage(STORAGE_KEYS.VEHICLES, vehicles);
  vehicles.forEach((veh) => {
    dbSaveVehicle(veh)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Vehicle Warning]', res.error);
        else console.log('[Supabase Sync Vehicle Success]', veh.registrationPlate);
      })
      .catch((err) => console.warn('Failed to background save vehicle to Supabase:', err));
  });
}

export async function saveSingleVehicleAsync(vehicle: Vehicle): Promise<{ success: boolean; error?: string }> {
  return await dbSaveVehicle(vehicle);
}

export async function syncAllVehiclesToDatabase(): Promise<{ total: number; synced: number; errors: string[] }> {
  return await dbSyncAllVehicles();
}

export function getFleetParts(): PartsInventoryItem[] {
  return loadFromStorage(STORAGE_KEYS.PARTS, INITIAL_PARTS);
}

export function saveFleetParts(parts: PartsInventoryItem[]): void {
  saveToStorage(STORAGE_KEYS.PARTS, parts);
  parts.forEach((p) => {
    dbSavePart(p)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Part Warning]', res.error);
        else console.log('[Supabase Sync Part Success]', p.name);
      })
      .catch((err) => console.warn('Failed to background save part to Supabase:', err));
  });
}

export async function saveSinglePartAsync(part: PartsInventoryItem): Promise<{ success: boolean; error?: string }> {
  return await dbSavePart(part);
}

export function deleteFleetPart(partId: string): void {
  const parts = getFleetParts().filter((p) => p.id !== partId);
  saveToStorage(STORAGE_KEYS.PARTS, parts);
  dbDeletePart(partId).catch(() => {});
}

export function getFleetServices(): RepairAndService[] {
  return loadFromStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
}

export function saveFleetServices(services: RepairAndService[]): void {
  saveToStorage(STORAGE_KEYS.SERVICES, services);
  services.forEach((s) => {
    dbSaveService(s)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Service Warning]', res.error);
        else console.log('[Supabase Sync Service Success]', s.vehiclePlate);
      })
      .catch((err) => console.warn('Failed to background save service to Supabase:', err));
  });
}

export async function saveSingleServiceAsync(service: RepairAndService): Promise<{ success: boolean; error?: string }> {
  return await dbSaveService(service);
}

export function getFleetFines(): TrafficFine[] {
  return loadFromStorage(STORAGE_KEYS.FINES, INITIAL_FINES);
}

export function saveFleetFines(fines: TrafficFine[]): void {
  saveToStorage(STORAGE_KEYS.FINES, fines);
  fines.forEach((f) => {
    dbSaveFine(f)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Fine Warning]', res.error);
        else console.log('[Supabase Sync Fine Success]', f.noticeNumber);
      })
      .catch((err) => console.warn('Failed to background save fine to Supabase:', err));
  });
}

export async function saveSingleFineAsync(fine: TrafficFine): Promise<{ success: boolean; error?: string }> {
  return await dbSaveFine(fine);
}

export function getFleetTransactions(): YocoTransaction[] {
  return loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_YOCO_TRANSACTIONS);
}

export function saveFleetTransactions(txs: YocoTransaction[]): void {
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, txs);
  txs.forEach((tx) => {
    dbSaveTransaction(tx)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Transaction Warning]', res.error);
        else console.log('[Supabase Sync Transaction Success]', tx.id);
      })
      .catch((err) => console.warn('Failed to background save transaction to Supabase:', err));
  });
}

export async function saveSingleTransactionAsync(tx: YocoTransaction): Promise<{ success: boolean; error?: string }> {
  return await dbSaveTransaction(tx);
}

export function getFleetAgreements(): RentalAgreement[] {
  return loadFromStorage(STORAGE_KEYS.AGREEMENTS, INITIAL_AGREEMENTS);
}

export function saveFleetAgreements(agreements: RentalAgreement[]): void {
  saveToStorage(STORAGE_KEYS.AGREEMENTS, agreements);
  agreements.forEach((ag) => {
    dbSaveAgreement(ag)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Agreement Warning]', res.error);
        else console.log('[Supabase Sync Agreement Success]', ag.agreementNumber);
      })
      .catch((err) => console.warn('Failed to background save agreement to Supabase:', err));
  });
}

export async function saveSingleAgreementAsync(agreement: RentalAgreement): Promise<{ success: boolean; error?: string }> {
  return await dbSaveAgreement(agreement);
}

export function getFleetReferrals(): DriverReferral[] {
  return loadFromStorage(STORAGE_KEYS.REFERRALS, INITIAL_REFERRALS);
}

export function saveFleetReferrals(referrals: DriverReferral[]): void {
  saveToStorage(STORAGE_KEYS.REFERRALS, referrals);
  referrals.forEach((r) => {
    dbSaveReferral(r)
      .then((res) => {
        if (!res.success) console.warn('[Supabase Sync Referral Warning]', res.error);
        else console.log('[Supabase Sync Referral Success]', r.referredApplicantName);
      })
      .catch((err) => console.warn('Failed to background save referral to Supabase:', err));
  });
}

export async function saveSingleReferralAsync(ref: DriverReferral): Promise<{ success: boolean; error?: string }> {
  return await dbSaveReferral(ref);
}

export function deleteFleetReferral(referralId: string): void {
  const refs = getFleetReferrals().filter((r) => r.id !== referralId);
  saveToStorage(STORAGE_KEYS.REFERRALS, refs);
  dbDeleteReferral(referralId).catch(() => {});
}

export function getYocoSettings(): YocoSettings {
  return loadFromStorage(STORAGE_KEYS.YOCO_SETTINGS, DEFAULT_YOCO_SETTINGS);
}

export function saveYocoSettings(settings: YocoSettings): void {
  saveToStorage(STORAGE_KEYS.YOCO_SETTINGS, settings);
}

// Master Asynchronous Fetcher from Database
export async function fetchAllFleetData(): Promise<{
  drivers: Driver[];
  vehicles: Vehicle[];
  parts: PartsInventoryItem[];
  services: RepairAndService[];
  fines: TrafficFine[];
  transactions: YocoTransaction[];
  agreements: RentalAgreement[];
  referrals: DriverReferral[];
}> {
  try {
    const [
      drivers,
      vehicles,
      parts,
      services,
      fines,
      transactions,
      agreements,
      referrals,
    ] = await Promise.all([
      dbFetchDrivers(),
      dbFetchVehicles(),
      dbFetchParts(),
      dbFetchServices(),
      dbFetchFines(),
      dbFetchTransactions(),
      dbFetchAgreements(),
      dbFetchReferrals(),
    ]);

    return {
      drivers: drivers || [],
      vehicles: vehicles || [],
      parts: parts || [],
      services: services || [],
      fines: fines || [],
      transactions: transactions || [],
      agreements: agreements || [],
      referrals: referrals || [],
    };
  } catch (err) {
    console.warn('Error fetching all fleet data from database:', err);
    return {
      drivers: getFleetDrivers(),
      vehicles: getFleetVehicles(),
      parts: getFleetParts(),
      services: getFleetServices(),
      fines: getFleetFines(),
      transactions: getFleetTransactions(),
      agreements: getFleetAgreements(),
      referrals: getFleetReferrals(),
    };
  }
}

/**
 * Automate conversion of an applicant in stage 'contract_signed' into an Active Driver.
 * Assigns available vehicle if available or creates an assigned asset link.
 */
export function convertApplicantToDriver(
  app: RiderApplication,
  vehicles: Vehicle[],
  existingDrivers: Driver[],
  options?: {
    assignedVehicleId?: string;
    customVinOrPlate?: string;
    customBikeName?: string;
    customWeeklyRate?: number;
    customDepositPaid?: number;
    customTermMonths?: number;
  }
): {
  newDriver: Driver;
  updatedVehicles: Vehicle[];
  newAgreement: RentalAgreement;
} {
  const normPassport = app.idOrPassportNumber ? app.idOrPassportNumber.trim().toLowerCase() : '';
  const normPhone = app.phone ? app.phone.replace(/[^0-9]/g, '') : '';
  const normRef = `DRV-${app.refNumber.replace('DR-', '')}`;

  // Check if driver already exists matching this applicant
  const existingDriver = existingDrivers.find(
    (d) =>
      (d.applicationId && d.applicationId === app.id) ||
      (d.idOrPassportNumber && d.idOrPassportNumber.trim().toLowerCase() === normPassport) ||
      (d.phone && d.phone.replace(/[^0-9]/g, '') === normPhone) ||
      (d.refNumber && d.refNumber === normRef)
  );

  const driverId = existingDriver?.id || `drv-${Date.now().toString().slice(-6)}`;
  
  // Find matching available vehicle or create assignment
  let assignedVeh: Vehicle | undefined;
  if (options?.assignedVehicleId) {
    assignedVeh = vehicles.find((v) => v.id === options.assignedVehicleId);
  } else if (app.assignedBikeVinOrPlate) {
    assignedVeh = vehicles.find(
      (v) => v.registrationPlate === app.assignedBikeVinOrPlate || v.vin === app.assignedBikeVinOrPlate
    );
  }
  
  if (!assignedVeh) {
    assignedVeh = vehicles.find((v) => v.status === 'available');
  }

  const assignedVinOrPlate = options?.customVinOrPlate || app.assignedBikeVinOrPlate || (assignedVeh ? assignedVeh.registrationPlate : undefined);
  const assignedBikeName = options?.customBikeName || (assignedVeh ? `${assignedVeh.make} ${assignedVeh.model} (${assignedVeh.registrationPlate})` : app.bikeName);

  const weeklyRate = options?.customWeeklyRate || app.weeklyRate || existingDriver?.weeklyRate || 750;
  const depositPaid = options?.customDepositPaid || app.depositAmount || existingDriver?.depositPaid || 1000;
  const termMonths = options?.customTermMonths || app.termMonths || existingDriver?.termMonths || 18;

  const newDriver: Driver = {
    ...existingDriver,
    id: driverId,
    applicationId: app.id,
    refNumber: existingDriver?.refNumber || normRef,
    fullName: app.fullName,
    phone: app.phone,
    whatsappNumber: app.whatsappNumber,
    email: app.email,
    idOrPassportNumber: app.idOrPassportNumber,
    citizenship: app.citizenship,
    nationalityCountry: app.nationalityCountry,
    address: app.address,
    suburb: app.suburb,
    city: app.city || 'Randburg',
    status: 'active',
    assignedVehicleId: assignedVeh?.id || existingDriver?.assignedVehicleId || undefined,
    assignedBikeVinOrPlate: assignedVinOrPlate || existingDriver?.assignedBikeVinOrPlate,
    assignedBikeName: assignedBikeName || existingDriver?.assignedBikeName,
    weeklyRate,
    balanceDue: existingDriver?.balanceDue ?? 0,
    depositPaid,
    contractStartDate: existingDriver?.contractStartDate || new Date().toISOString().split('T')[0],
    termMonths,
    primaryPlatform: app.primaryPlatform || existingDriver?.primaryPlatform || 'Checkers Sixty60',
    deliveryApps: app.deliveryApps || existingDriver?.deliveryApps || [app.primaryPlatform],
    riskTier: existingDriver?.riskTier || 'low',
    riskScore: existingDriver?.riskScore || 90,
    paymentScore: existingDriver?.paymentScore || 100,
    incidentCount: existingDriver?.incidentCount || 0,
    totalPaid: (existingDriver?.totalPaid && existingDriver.totalPaid > depositPaid) ? existingDriver.totalPaid : depositPaid,
    referredBy: app.referredBy || existingDriver?.referredBy || 'Online Application',
    notes: existingDriver?.notes || `Converted from Application ${app.refNumber}. Document verification complete.`,
    documents: app.documents || existingDriver?.documents,
    verification: app.verification || existingDriver?.verification,
    signatureDataUrl: app.signatureDataUrl || existingDriver?.signatureDataUrl,
    collectionPhotoUrl: app.collectionPhotoUrl || existingDriver?.collectionPhotoUrl,
    handoverPhotos: app.handoverPhotos || existingDriver?.handoverPhotos,
    handoverOdometerKm: app.handoverOdometerKm || existingDriver?.handoverOdometerKm,
  };

  const updatedVehicles = vehicles.map((v) => {
    // If vehicle was previously assigned to this driver and is not the new vehicle, set back to available
    if (v.assignedDriverId === driverId && (!assignedVeh || v.id !== assignedVeh.id)) {
      return {
        ...v,
        status: 'available' as const,
        assignedDriverId: undefined,
        assignedDriverName: undefined,
      };
    }
    // Set the new vehicle to assigned
    if (assignedVeh && v.id === assignedVeh.id) {
      return {
        ...v,
        status: 'assigned' as const,
        assignedDriverId: driverId,
        assignedDriverName: app.fullName,
      };
    }
    return v;
  });

  const weeksTotal = Math.round((termMonths * 52) / 12);
  const totalVal = weeksTotal * weeklyRate;

  const newAgreement: RentalAgreement = {
    id: `agr-${Date.now()}`,
    agreementNumber: `AGR-2026-${Math.floor(100 + Math.random() * 900)}`,
    driverId,
    driverName: app.fullName,
    vehicleId: assignedVeh?.id || 'veh-assigned',
    vehiclePlate: assignedVinOrPlate || 'Assigned',
    agreementType: 'rent_to_own',
    termMonths,
    weeklyRateZar: weeklyRate,
    depositAmountZar: depositPaid,
    depositPaid: true,
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: new Date(Date.now() + termMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalContractValueZar: totalVal,
    totalPaidZar: depositPaid,
    remainingBalanceZar: totalVal,
    isCompleted: false,
    signatureDataUrl: app.signatureDataUrl,
    termsVersion: 'v2026.1-NATIS',
  };

  // Sync to database in background
  dbSaveDriver(newDriver).catch(() => {});
  if (assignedVeh) {
    const updatedVeh = updatedVehicles.find((v) => v.id === assignedVeh!.id);
    if (updatedVeh) {
      dbSaveVehicle(updatedVeh).catch(() => {});
    }
  }
  dbSaveAgreement(newAgreement).catch(() => {});

  return { newDriver, updatedVehicles, newAgreement };
}

/**
 * Assign a specific motorbike to a driver
 */
export function assignBikeToDriver(
  driverId: string,
  vehicleId: string,
  drivers: Driver[],
  vehicles: Vehicle[]
): {
  updatedDrivers: Driver[];
  updatedVehicles: Vehicle[];
} {
  const driver = drivers.find((d) => d.id === driverId);
  const vehicle = vehicles.find((v) => v.id === vehicleId);

  if (!driver || !vehicle) {
    return { updatedDrivers: drivers, updatedVehicles: vehicles };
  }

  // 1. Release previous vehicle driver had (if any)
  const previousVehicleId = driver.assignedVehicleId;

  // 2. Update vehicles list
  const updatedVehicles = vehicles.map((v) => {
    if (v.id === vehicleId) {
      return {
        ...v,
        status: 'assigned' as const,
        assignedDriverId: driver.id,
        assignedDriverName: driver.fullName,
      };
    }
    if (previousVehicleId && v.id === previousVehicleId && v.id !== vehicleId) {
      return {
        ...v,
        status: 'available' as const,
        assignedDriverId: undefined,
        assignedDriverName: undefined,
      };
    }
    return v;
  });

  // 3. Update drivers list
  const updatedDriver: Driver = {
    ...driver,
    assignedVehicleId: vehicle.id,
    assignedBikeVinOrPlate: vehicle.registrationPlate || vehicle.vin,
    assignedBikeName: `${vehicle.make} ${vehicle.model} (${vehicle.registrationPlate || vehicle.vin})`,
  };

  const updatedDrivers = drivers.map((d) => (d.id === driver.id ? updatedDriver : d));

  // Save to persistence
  saveFleetDrivers(updatedDrivers);
  saveFleetVehicles(updatedVehicles);

  // Sync with DB
  dbSaveDriver(updatedDriver).catch(() => {});
  const assignedVehObj = updatedVehicles.find((v) => v.id === vehicleId);
  if (assignedVehObj) dbSaveVehicle(assignedVehObj).catch(() => {});
  if (previousVehicleId) {
    const prevVehObj = updatedVehicles.find((v) => v.id === previousVehicleId);
    if (prevVehObj) dbSaveVehicle(prevVehObj).catch(() => {});
  }

  return { updatedDrivers, updatedVehicles };
}

/**
 * Remove / Unassign motorbike from driver
 */
export function unassignBikeFromDriver(
  driverId: string,
  drivers: Driver[],
  vehicles: Vehicle[]
): {
  updatedDrivers: Driver[];
  updatedVehicles: Vehicle[];
} {
  const driver = drivers.find((d) => d.id === driverId);
  if (!driver) {
    return { updatedDrivers: drivers, updatedVehicles: vehicles };
  }

  const assignedVehId = driver.assignedVehicleId;
  const assignedPlate = driver.assignedBikeVinOrPlate;

  // 1. Mark vehicle as available
  const updatedVehicles = vehicles.map((v) => {
    if (
      (assignedVehId && v.id === assignedVehId) ||
      (assignedPlate && (v.registrationPlate === assignedPlate || v.vin === assignedPlate))
    ) {
      return {
        ...v,
        status: 'available' as const,
        assignedDriverId: undefined,
        assignedDriverName: undefined,
      };
    }
    return v;
  });

  // 2. Clear driver vehicle assignment
  const updatedDriver: Driver = {
    ...driver,
    assignedVehicleId: undefined,
    assignedBikeVinOrPlate: undefined,
    assignedBikeName: undefined,
  };

  const updatedDrivers = drivers.map((d) => (d.id === driver.id ? updatedDriver : d));

  // Save to persistence
  saveFleetDrivers(updatedDrivers);
  saveFleetVehicles(updatedVehicles);

  // Sync with DB
  dbSaveDriver(updatedDriver).catch(() => {});
  if (assignedVehId) {
    const unassignedVeh = updatedVehicles.find((v) => v.id === assignedVehId);
    if (unassignedVeh) dbSaveVehicle(unassignedVeh).catch(() => {});
  }

  return { updatedDrivers, updatedVehicles };
}

/**
 * Process a Yoco Payment Transaction (Sandbox or Live simulation)
 * Automatically updates Driver balance, creates transaction record, and recalculates scores.
 */
export function executeYocoPayment(
  params: {
    driver: Driver;
    amountZar: number;
    allocation: PaymentAllocation;
    method?: YocoPaymentMethod;
    paymentMethod?: YocoPaymentMethod;
    cardLast4?: string;
    cardBrand?: string;
    notes?: string;
    yocoSettings?: YocoSettings;
  },
  settingsOrDrivers?: YocoSettings | Driver[],
  existingTransactions?: YocoTransaction[]
): {
  success: boolean;
  transaction: YocoTransaction;
  updatedDriver: Driver;
  updatedDriversList: Driver[];
  updatedTransactionsList: YocoTransaction[];
} {
  const settings: YocoSettings = 
    params.yocoSettings || 
    (settingsOrDrivers && !Array.isArray(settingsOrDrivers) ? settingsOrDrivers : getYocoSettings());

  const currentDrivers: Driver[] = 
    Array.isArray(settingsOrDrivers) ? settingsOrDrivers : getFleetDrivers();

  const currentTransactions: YocoTransaction[] = 
    existingTransactions || getFleetTransactions();

  const { driver, amountZar, allocation, cardLast4, cardBrand } = params;
  const method: YocoPaymentMethod = params.paymentMethod || params.method || 'yoco_card_terminal';

  const feeRate = (settings.merchantFeePercent || 2.95) / 100;
  const yocoFeeZar = Math.round(amountZar * feeRate * 100) / 100;
  const netAmountZar = Math.round((amountZar - yocoFeeZar) * 100) / 100;

  const txId = `tx-${Date.now()}`;
  const yocoChargeId = `ch_yoco_${settings.mode === 'live' ? 'live' : 'test'}_${Math.random().toString(36).substring(2, 10)}`;

  const newTx: YocoTransaction = {
    id: txId,
    yocoChargeId,
    driverId: driver.id,
    driverName: driver.fullName,
    amountZar,
    currency: 'ZAR',
    paymentMethod: method,
    allocation,
    status: 'successful',
    yocoFeeZar,
    netAmountZar,
    cardLast4: cardLast4 || '4242',
    cardBrand: cardBrand || 'Visa',
    reconciliationStatus: 'reconciled',
    transactionDate: new Date().toISOString(),
    yocoMetadata: {
      gateway: 'Yoco Payments South Africa',
      env: settings.mode,
      receivedAt: new Date().toISOString(),
      driverRef: driver.refNumber,
    },
  };

  // Recalculate driver balance
  let newBalance = driver.balanceDue;
  if (allocation === 'weekly_rental') {
    newBalance = Math.max(0, driver.balanceDue - amountZar);
  }

  const newTotalPaid = driver.totalPaid + amountZar;
  const newPaymentScore = Math.min(100, (driver.paymentScore || 80) + 3);

  const updatedDriver: Driver = {
    ...driver,
    balanceDue: newBalance,
    totalPaid: newTotalPaid,
    paymentScore: newPaymentScore,
    status: newBalance <= 0 ? 'active' : driver.status,
  };

  const updatedDriversList = currentDrivers.map((d) => (d.id === driver.id ? updatedDriver : d));
  const updatedTransactionsList = [newTx, ...currentTransactions];

  // Save to persistence
  saveFleetDrivers(updatedDriversList);
  saveFleetTransactions(updatedTransactionsList);
  dbSaveTransaction(newTx).catch(() => {});
  dbSaveDriver(updatedDriver).catch(() => {});

  return {
    success: true,
    transaction: newTx,
    updatedDriver,
    updatedDriversList,
    updatedTransactionsList,
  };
}

/**
 * Completely remove / delete a driver from fleet, freeing their assigned motorcycle
 * and cleaning up rental agreements.
 */
export function removeDriverAndFreeBike(
  driverId: string,
  drivers: Driver[],
  vehicles: Vehicle[],
  agreements: RentalAgreement[] = []
): {
  updatedDrivers: Driver[];
  updatedVehicles: Vehicle[];
  updatedAgreements: RentalAgreement[];
  freedVehicle?: Vehicle;
} {
  const targetDriver = drivers.find((d) => d.id === driverId);
  const assignedVehId = targetDriver?.assignedVehicleId;
  const assignedPlate = targetDriver?.assignedBikeVinOrPlate;
  let freedVehicle: Vehicle | undefined;

  // 1. Mark vehicle as available
  const updatedVehicles = vehicles.map((v) => {
    const isMatched =
      (assignedVehId && v.id === assignedVehId) ||
      (assignedPlate && (v.registrationPlate === assignedPlate || v.vin === assignedPlate)) ||
      (v.assignedDriverId === driverId);

    if (isMatched) {
      const freed: Vehicle = {
        ...v,
        status: 'available' as const,
        assignedDriverId: undefined,
        assignedDriverName: undefined,
      };
      freedVehicle = freed;
      dbSaveVehicle(freed).catch(() => {});
      return freed;
    }
    return v;
  });

  // 2. Filter out driver
  const updatedDrivers = drivers.filter((d) => d.id !== driverId);

  // 3. Remove or terminate rental agreements
  const updatedAgreements = agreements.filter(
    (ag) => ag.driverId !== driverId && (!targetDriver || ag.driverName !== targetDriver.fullName)
  );

  // Save to persistence
  saveFleetDrivers(updatedDrivers);
  saveFleetVehicles(updatedVehicles);
  saveFleetAgreements(updatedAgreements);

  // Sync delete with DB
  dbDeleteDriver(driverId).catch(() => {});

  return { updatedDrivers, updatedVehicles, updatedAgreements, freedVehicle };
}

/**
 * Cascading delete of an application and its associated driver record if one was created upon delivery.
 */
export function cascadeDeleteApplication(
  applicationId: string,
  applications: RiderApplication[],
  drivers: Driver[],
  vehicles: Vehicle[],
  agreements: RentalAgreement[] = []
): {
  updatedApplications: RiderApplication[];
  updatedDrivers: Driver[];
  updatedVehicles: Vehicle[];
  updatedAgreements: RentalAgreement[];
  deletedDriver?: Driver;
  freedVehicle?: Vehicle;
} {
  const targetApp = applications.find((a) => a.id === applicationId);
  const updatedApplications = applications.filter((a) => a.id !== applicationId);

  // Find any associated driver
  const matchedDriver = drivers.find((d) => {
    if (d.applicationId === applicationId || d.id === applicationId) return true;
    if (targetApp) {
      if (targetApp.refNumber && d.refNumber === targetApp.refNumber) return true;
      if (
        targetApp.idOrPassportNumber &&
        d.idOrPassportNumber &&
        targetApp.idOrPassportNumber.trim().toLowerCase() === d.idOrPassportNumber.trim().toLowerCase()
      ) {
        return true;
      }
      if (
        targetApp.phone &&
        d.phone &&
        targetApp.phone.replace(/[^0-9]/g, '') === d.phone.replace(/[^0-9]/g, '')
      ) {
        return true;
      }
    }
    return false;
  });

  let updatedDrivers = drivers;
  let updatedVehicles = vehicles;
  let updatedAgreements = agreements;
  let freedVehicle: Vehicle | undefined;

  if (matchedDriver) {
    const res = removeDriverAndFreeBike(matchedDriver.id, drivers, vehicles, agreements);
    updatedDrivers = res.updatedDrivers;
    updatedVehicles = res.updatedVehicles;
    updatedAgreements = res.updatedAgreements;
    freedVehicle = res.freedVehicle;
  }

  return {
    updatedApplications,
    updatedDrivers,
    updatedVehicles,
    updatedAgreements,
    deletedDriver: matchedDriver,
    freedVehicle,
  };
}

