export type BikeCategory = 'boxer' | 'bigboy' | 'electric' | 'hero';

export type BikeCondition = 'new' | 'used';

export interface BikePricingOption {
  available: boolean;
  deposit: number; // e.g. R650 or R1000
  weeklyPayment: number; // e.g. R650 or R750
  termMonths?: number;
  termMonthsOptions?: number[];
  totalDepositLabel?: string;
}

export interface Bike {
  id: string;
  name: string;
  subtitle: string;
  brand: string;
  category: BikeCategory;
  isAvailable: boolean;
  isComingSoon?: boolean;
  image: string;
  badge?: string;
  fuelType: string;
  engineCapacity: string;
  tankCapacity?: string;
  rangePerCharge?: string;
  deliveryBoxReady: boolean;
  pricing: {
    used: {
      available: boolean;
      deposit: number; // R650
      weeklyPayment: number; // R650
      termMonths: number; // 20 months
      totalDepositLabel?: string;
    };
    new: {
      available: boolean;
      deposit: number; // R1000
      weeklyPayment: number; // R750
      termMonthsOptions: number[]; // [15, 18]
      totalDepositLabel?: string;
    };
  };
  keyFeatures: string[];
  recommendedFor: string;
}

export type ApplicationStatus = 
  | 'pending_review'
  | 'docs_verified'
  | 'approved_for_collection'
  | 'contract_signed'
  | 'needs_more_info'
  | 'declined';

export type CitizenshipType = 'south_african' | 'non_south_african' | 'foreign_national';

export interface ApplicationDocuments {
  idDocumentFront?: string;
  idDocumentBack?: string;
  saIdFront?: string;
  saIdBack?: string;
  passport?: string;
  passportPhoto?: string;
  asylumDocument?: string;
  asylumOrWorkPermit?: string;
  workPermit?: string;
  workPermitOrVisa?: string;
  driversLicense?: string;
  driversLicenseFront?: string;
  driversLicenseBack?: string;
  trafficRegisterCertificate?: string; // TRN - Mandatory for foreign licenses
  proofOfResidence?: string;
  proofOfEarnings?: string;
  deliveryAppEarningsScreenshot?: string;
}

export interface DocumentCheckState {
  idVerified: boolean;
  licenseVerified: boolean;
  permitVerified?: boolean;
  workPermitVerified?: boolean;
  trnVerified?: boolean;
  trafficRegisterVerified?: boolean;
  proofVerified?: boolean;
  notes?: string;
}

export interface RiderApplication {
  id: string;
  refNumber: string; // e.g. DR-7492-JHB
  createdAt: string;
  updatedAt: string;
  status: ApplicationStatus;
  
  // Bike Selection
  bikeId: string;
  bikeName: string;
  bikeCondition: BikeCondition;
  termMonths: number;
  weeklyRate: number; // R650 or R750
  depositAmount: number; // R650 or R1000
  
  // Applicant Details
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  citizenship: CitizenshipType;
  idOrPassportNumber: string;
  nationalityCountry?: string;
  
  // Residence in JHB / SA
  address: string;
  suburb: string;
  city: string; // Default: Randburg / Johannesburg
  province?: string;
  postalCode?: string;

  // Alternative Contact / Next of Kin
  alternativeContactName?: string;
  alternativeContactPhone?: string;
  
  // Courier / Delivery Work
  primaryPlatform: string; // e.g. "Checkers Sixty60", "Uber Eats", "Mr D", "Bolt", "Takealot", "Private Courier"
  deliveryApps?: string[]; // list of active delivery apps
  deliveryExperience: string; // "< 6 months", "1-2 years", "3+ years", "Starting Fresh"
  approxWeeklyEarnings: number; // estimated R3500+
  referredBy?: string;
  creditScore?: string;
  
  // Uploaded Documents
  documents: ApplicationDocuments;
  
  // Verification Checks (Admin)
  verification: DocumentCheckState;
  
  // Contract / Signing
  signatureDataUrl?: string;
  depositAcknowledged: boolean;
  termsAgreed: boolean;
  
  // Admin Notes & Collection schedule
  collectionDate?: string;
  collectionPhotoUrl?: string;
  handoverPhotos?: string[];
  handoverOdometerKm?: number;
  assignedBikeVinOrPlate?: string;
  adminNotes?: string;
  
  timeline: Array<{
    timestamp: string;
    status: ApplicationStatus;
    title: string;
    description: string;
  }>;
}

export type ActiveTab = 'home' | 'about' | 'contact' | 'apply' | 'status' | 'admin' | 'fleet' | 'location';

// ---------------------------------------------------------------------------
// FLEET MANAGEMENT EXTENDED DATA MODELS
// ---------------------------------------------------------------------------

export type DriverStatus = 'active' | 'suspended' | 'completed' | 'in_arrears' | 'defaulted';
export type DriverRiskTier = 'low' | 'medium' | 'high' | 'critical';

export interface Driver {
  id: string;
  applicationId?: string;
  refNumber: string; // e.g. DRV-7492-JHB
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email?: string;
  idOrPassportNumber: string;
  citizenship: CitizenshipType;
  nationalityCountry?: string;
  address: string;
  suburb: string;
  city: string;
  status: DriverStatus;
  assignedVehicleId?: string;
  assignedBikeVinOrPlate?: string;
  assignedBikeName?: string;
  weeklyRate: number; // e.g. R650 or R750
  balanceDue: number; // Positive = Overdue Arrears, Negative = Prepaid Credit
  depositPaid: number;
  contractStartDate: string;
  contractEndDate?: string;
  termMonths: number;
  primaryPlatform: string;
  deliveryApps?: string[];
  riskTier: DriverRiskTier;
  riskScore: number; // 0 - 100 (Higher is safer)
  paymentScore: number; // On-time payment rate %
  incidentCount: number;
  totalPaid: number;
  yocoCustomerToken?: string;
  referredBy?: string;
  notes?: string;
  documents?: ApplicationDocuments;
  verification?: DocumentCheckState;
  signatureDataUrl?: string;
  collectionPhotoUrl?: string;
  handoverPhotos?: string[];
  handoverOdometerKm?: number;
}

export type VehicleStatus = 'available' | 'assigned' | 'in_maintenance' | 'impounded' | 'retired';

export interface Vehicle {
  id: string;
  vin: string;
  engineNumber: string;
  registrationPlate: string;
  bikeModelId: string;
  make: string;
  model: string;
  year: number;
  category: BikeCategory;
  condition: BikeCondition;
  status: VehicleStatus;
  assignedDriverId?: string;
  assignedDriverName?: string;
  odometerKm: number;
  nextServiceKm: number;
  lastServiceDate?: string;
  trackerDeviceId?: string;
  trackerProvider?: string; // e.g. 'Cartrack', 'Netstar', 'Tracker SA', 'DynamicGPS'
  batteryHealthPercent?: number;
  fuelLevelPercent?: number;
  isIgnitionOn?: boolean;
  latitude?: number;
  longitude?: number;
  lastLocationAddress?: string;
  lastPingTime?: string;
  insurancePolicyNumber?: string;
  licenseDiskExpiryDate?: string;
  imageUrl?: string;
}

export interface PartsInventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'helmets' | 'delivery_boxes' | 'phone_mounts' | 'brake_pads' | 'chains_sprockets' | 'tires_tubes' | 'engine_oil' | 'batteries' | 'cables_levers' | 'general';
  quantityInStock: number;
  minThreshold: number;
  costPriceZar: number;
  sellingPriceZar: number;
  compatibleModels: string[];
  supplierName?: string;
  lastRestockedDate?: string;
  imageUrl?: string;
}

export type ServiceType = 
  | 'routine_5000km' 
  | 'major_overhaul' 
  | 'brake_replacement' 
  | 'tire_change' 
  | 'accident_repair' 
  | 'electrical_tracker' 
  | 'cosmetic_box';

export interface RepairAndService {
  id: string;
  vehicleId: string;
  vehiclePlate: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  serviceType: ServiceType;
  odometerKm: number;
  costZar: number;
  technicianName: string;
  garageLocation: string;
  serviceDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  partsUsed?: string[];
  notes?: string;
  invoiceUrl?: string;
}

export interface TrafficFine {
  id: string;
  noticeNumber: string;
  infringementDate: string;
  vehiclePlate: string;
  driverId?: string;
  driverName?: string;
  location: string;
  municipality: string; // e.g. 'JMPD - Johannesburg', 'EMPD - Ekurhuleni', 'TMPD - Tshwane'
  infringementType: string;
  amountZar: number;
  discountedAmountZar?: number;
  dueDate: string;
  aartoStatus: 'notice_issued' | 'courtesy_letter' | 'enforcement_order' | 'paid' | 'transferred_to_driver' | 'contested';
  paymentStatus: 'unpaid' | 'allocated_to_driver' | 'deducted_from_earnings' | 'paid_by_company';
  documentUrl?: string;
}

export type YocoPaymentMethod = 'yoco_card_terminal' | 'yoco_payment_link' | 'yoco_recurring_token' | 'instant_eft';
export type PaymentAllocation = 'weekly_rental' | 'security_deposit' | 'traffic_fine' | 'repair_deductible' | 'other';

export interface YocoTransaction {
  id: string;
  yocoChargeId: string; // e.g. 'ch_yoco_live_9a8b7c'
  yocoPaymentLinkId?: string;
  driverId: string;
  driverName: string;
  amountZar: number;
  currency: 'ZAR';
  paymentMethod: YocoPaymentMethod;
  allocation: PaymentAllocation;
  status: 'successful' | 'pending' | 'failed' | 'refunded';
  yocoFeeZar: number;
  netAmountZar: number;
  cardLast4?: string;
  cardBrand?: string;
  reconciliationStatus: 'reconciled' | 'unallocated' | 'disputed';
  transactionDate: string;
  yocoMetadata?: Record<string, any>;
}

export interface RentalAgreement {
  id: string;
  agreementNumber: string; // e.g. AGR-2026-081
  driverId: string;
  driverName: string;
  vehicleId: string;
  vehiclePlate: string;
  agreementType: 'rent_to_own' | 'pure_commercial_rental';
  termMonths: number;
  weeklyRateZar: number;
  depositAmountZar: number;
  depositPaid: boolean;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  totalContractValueZar: number;
  totalPaidZar: number;
  remainingBalanceZar: number;
  isCompleted: boolean;
  signatureDataUrl?: string;
  contractPdfUrl?: string;
  termsVersion: string;
}

export interface DriverReferral {
  id: string;
  referrerDriverId: string;
  referrerDriverName: string;
  referredApplicantName: string;
  referredPhone: string;
  referralDate: string;
  status: 'pending_onboarding' | 'active_driving' | 'bonus_eligible' | 'paid_out';
  rewardAmountZar: number;
  paidDate?: string;
}

export type FlaggedReasonCategory =
  | 'absconded_with_vehicle'
  | 'tracker_tampering'
  | 'severe_payment_default'
  | 'vehicle_severely_damaged'
  | 'fraudulent_kyc_permit'
  | 'traffic_fine_evasion'
  | 'reckless_dangerous_driving'
  | 'violent_threatening_behavior'
  | 'subletting_unauthorized_rider'
  | 'other_violation';

export interface FlaggedRiskEntry {
  id: string;
  fullName: string;
  idOrPassportNumber: string; // Key cross-reference identifier for applications
  phone: string;
  whatsappNumber?: string;
  nationalityCountry?: string;
  riskTier: DriverRiskTier; // 'critical' (Blacklisted / Banned), 'high', 'medium', 'low'
  flagReason: FlaggedReasonCategory;
  reasonDescription: string;
  outstandingBalanceZar: number;
  reportedByOperator: string; // e.g. "Dynamic Rental (Randburg Hub)", "Sandton Express Fleet", "Midrand Courier Alliance"
  isCrossOperatorShared: boolean; // Flagged for sharing across Gauteng Fleet Network
  reportedDate: string;
  status: 'active_flag' | 'resolved' | 'under_review' | 'blacklisted';
  policeCaseNumber?: string;
  driverId?: string; // If linked to an existing active/past customer
  lastKnownAddress?: string;
  notes?: string;
}
