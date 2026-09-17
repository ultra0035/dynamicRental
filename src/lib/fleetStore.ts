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
function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
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

// Initial state getters
export function getFleetDrivers(): Driver[] {
  return loadFromStorage(STORAGE_KEYS.DRIVERS, INITIAL_DRIVERS);
}

export function saveFleetDrivers(drivers: Driver[]): void {
  saveToStorage(STORAGE_KEYS.DRIVERS, drivers);
}

export function getFleetVehicles(): Vehicle[] {
  return loadFromStorage(STORAGE_KEYS.VEHICLES, INITIAL_VEHICLES);
}

export function saveFleetVehicles(vehicles: Vehicle[]): void {
  saveToStorage(STORAGE_KEYS.VEHICLES, vehicles);
}

export function getFleetParts(): PartsInventoryItem[] {
  return loadFromStorage(STORAGE_KEYS.PARTS, INITIAL_PARTS);
}

export function saveFleetParts(parts: PartsInventoryItem[]): void {
  saveToStorage(STORAGE_KEYS.PARTS, parts);
}

export function getFleetServices(): RepairAndService[] {
  return loadFromStorage(STORAGE_KEYS.SERVICES, INITIAL_SERVICES);
}

export function saveFleetServices(services: RepairAndService[]): void {
  saveToStorage(STORAGE_KEYS.SERVICES, services);
}

export function getFleetFines(): TrafficFine[] {
  return loadFromStorage(STORAGE_KEYS.FINES, INITIAL_FINES);
}

export function saveFleetFines(fines: TrafficFine[]): void {
  saveToStorage(STORAGE_KEYS.FINES, fines);
}

export function getFleetTransactions(): YocoTransaction[] {
  return loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_YOCO_TRANSACTIONS);
}

export function saveFleetTransactions(txs: YocoTransaction[]): void {
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, txs);
}

export function getFleetAgreements(): RentalAgreement[] {
  return loadFromStorage(STORAGE_KEYS.AGREEMENTS, INITIAL_AGREEMENTS);
}

export function saveFleetAgreements(agreements: RentalAgreement[]): void {
  saveToStorage(STORAGE_KEYS.AGREEMENTS, agreements);
}

export function getFleetReferrals(): DriverReferral[] {
  return loadFromStorage(STORAGE_KEYS.REFERRALS, INITIAL_REFERRALS);
}

export function saveFleetReferrals(referrals: DriverReferral[]): void {
  saveToStorage(STORAGE_KEYS.REFERRALS, referrals);
}

export function getYocoSettings(): YocoSettings {
  return loadFromStorage(STORAGE_KEYS.YOCO_SETTINGS, DEFAULT_YOCO_SETTINGS);
}

export function saveYocoSettings(settings: YocoSettings): void {
  saveToStorage(STORAGE_KEYS.YOCO_SETTINGS, settings);
}

/**
 * Automate conversion of an applicant in stage 'contract_signed' into an Active Driver.
 * Assigns available vehicle if available or creates an assigned asset link.
 */
export function convertApplicantToDriver(
  app: RiderApplication,
  vehicles: Vehicle[],
  existingDrivers: Driver[]
): {
  newDriver: Driver;
  updatedVehicles: Vehicle[];
  newAgreement: RentalAgreement;
} {
  const driverId = `drv-${Date.now().toString().slice(-6)}`;
  
  // Find matching available vehicle or create assignment
  let assignedVeh = vehicles.find((v) => v.status === 'available');
  let assignedVinOrPlate = app.assignedBikeVinOrPlate || (assignedVeh ? assignedVeh.registrationPlate : 'JH 55 RT GP (Assigned)');

  const newDriver: Driver = {
    id: driverId,
    applicationId: app.id,
    refNumber: `DRV-${app.refNumber.replace('DR-', '')}`,
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
    assignedVehicleId: assignedVeh?.id || undefined,
    assignedBikeVinOrPlate: assignedVinOrPlate,
    assignedBikeName: app.bikeName,
    weeklyRate: app.weeklyRate || 750,
    balanceDue: 0,
    depositPaid: app.depositAmount || 1000,
    contractStartDate: new Date().toISOString().split('T')[0],
    termMonths: app.termMonths || 18,
    primaryPlatform: app.primaryPlatform || 'Checkers Sixty60',
    deliveryApps: app.deliveryApps || [app.primaryPlatform],
    riskTier: 'low',
    riskScore: 90,
    paymentScore: 100,
    incidentCount: 0,
    totalPaid: app.depositAmount || 1000,
    referredBy: app.referredBy || 'Online Application',
    notes: `Converted from Application ${app.refNumber}. Document verification complete.`,
  };

  const updatedVehicles = vehicles.map((v) => {
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

  const weeksTotal = Math.round(((app.termMonths || 18) * 52) / 12);
  const totalVal = weeksTotal * (app.weeklyRate || 750);

  const newAgreement: RentalAgreement = {
    id: `agr-${Date.now()}`,
    agreementNumber: `AGR-2026-${Math.floor(100 + Math.random() * 900)}`,
    driverId,
    driverName: app.fullName,
    vehicleId: assignedVeh?.id || 'veh-auto',
    vehiclePlate: assignedVinOrPlate,
    agreementType: 'rent_to_own',
    termMonths: app.termMonths || 18,
    weeklyRateZar: app.weeklyRate || 750,
    depositAmountZar: app.depositAmount || 1000,
    depositPaid: true,
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: new Date(Date.now() + (app.termMonths || 18) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalContractValueZar: totalVal,
    totalPaidZar: app.depositAmount || 1000,
    remainingBalanceZar: totalVal,
    isCompleted: false,
    signatureDataUrl: app.signatureDataUrl,
    termsVersion: 'v2026.1-NATIS',
  };

  return { newDriver, updatedVehicles, newAgreement };
}

/**
 * Process a Yoco Payment Transaction (Sandbox or Live simulation)
 * Automatically updates Driver balance, creates transaction record, and recalculates scores.
 */
export function executeYocoPayment(
  params: {
    driver: Driver;
    amountZar: number;
    paymentMethod: YocoPaymentMethod;
    allocation: PaymentAllocation;
    cardLast4?: string;
    cardBrand?: string;
    yocoChargeId?: string;
    notes?: string;
  },
  settings: YocoSettings
): {
  transaction: YocoTransaction;
  updatedDriver: Driver;
} {
  const { driver, amountZar, paymentMethod, allocation, cardLast4, cardBrand, yocoChargeId, notes } = params;

  const feeRate = (settings.merchantFeePercent || 2.95) / 100;
  const yocoFee = Math.round(amountZar * feeRate * 100) / 100;
  const netAmount = Math.round((amountZar - yocoFee) * 100) / 100;

  const chargeId = yocoChargeId || `ch_yoco_${settings.mode}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  const transaction: YocoTransaction = {
    id: `tx-${Date.now()}`,
    yocoChargeId: chargeId,
    driverId: driver.id,
    driverName: driver.fullName,
    amountZar,
    currency: 'ZAR',
    paymentMethod,
    allocation,
    status: 'successful',
    yocoFeeZar: yocoFee,
    netAmountZar: netAmount,
    cardLast4: cardLast4 || '4242',
    cardBrand: cardBrand || 'Visa (Yoco Sandbox)',
    reconciliationStatus: 'reconciled',
    transactionDate: new Date().toISOString(),
    yocoMetadata: {
      mode: settings.mode,
      driverRef: driver.refNumber,
      vehiclePlate: driver.assignedBikeVinOrPlate,
      notes: notes || 'Automated Yoco settlement',
    },
  };

  // Rebalance driver ledger
  const newBalance = driver.balanceDue - amountZar;
  const newTotalPaid = (driver.totalPaid || 0) + amountZar;
  const newPaymentScore = Math.min(100, (driver.paymentScore || 90) + 1);

  const updatedDriver: Driver = {
    ...driver,
    balanceDue: newBalance,
    totalPaid: newTotalPaid,
    paymentScore: newPaymentScore,
    status: newBalance <= 0 ? 'active' : 'in_arrears',
    riskTier: newBalance <= 0 ? 'low' : newBalance > driver.weeklyRate * 2 ? 'high' : 'medium',
  };

  return { transaction, updatedDriver };
}
