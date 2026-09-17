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
