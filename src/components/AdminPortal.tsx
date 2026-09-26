import React, { useState, useRef, useEffect } from 'react';
import { 
  RiderApplication, 
  ApplicationStatus, 
  CitizenshipType,
  Bike,
  Driver,
  Vehicle,
  PartsInventoryItem,
  RepairAndService,
  TrafficFine,
  YocoTransaction,
  RentalAgreement,
  DriverReferral,
  FlaggedRiskEntry
} from '../types';
import { COMPANY_DETAILS, BIKES } from '../data/bikes';
import { ContractModal } from './ContractModal';
import { WalkInApplicantModal } from './WalkInApplicantModal';
import { SupabaseConfigModal } from './SupabaseConfigModal';
import { ApplicantDetailModal } from './ApplicantDetailModal';
import { DriverManagementView } from './fleet/DriverManagementView';
import { VehicleManagementView } from './fleet/VehicleManagementView';
import { FleetFinancialsView } from './fleet/FleetFinancialsView';
import { DeliverAndAssignModal } from './fleet/DeliverAndAssignModal';
import { DriverFinanceModal } from './fleet/DriverFinanceModal';
import { DynamicRentalLogo } from './DynamicRentalLogo';
import { compressImageFile } from '../lib/imageUtils';
import { SUPABASE_SQL_SCHEMA } from '../db/schemaSql';
import { isSupabaseConnected } from '../lib/supabase';
import { getFlaggedRiskEntries, fetchAllRiskEntriesAsync } from '../lib/riskStore';
import {
  getFleetDrivers,
  saveFleetDrivers,
  getFleetVehicles,
  saveFleetVehicles,
  getFleetParts,
  saveFleetParts,
  getFleetServices,
  saveFleetServices,
  getFleetFines,
  saveFleetFines,
  getFleetTransactions,
  saveFleetTransactions,
  getFleetAgreements,
  saveFleetAgreements,
  getFleetReferrals,
  saveFleetReferrals,
  getYocoSettings,
  saveYocoSettings,
  convertApplicantToDriver,
  assignBikeToDriver,
  unassignBikeFromDriver,
  fetchAllFleetData,
  deduplicateDrivers,
  cascadeDeleteApplication,
  removeDriverAndFreeBike,
  deleteFleetPart,
  deleteFleetReferral,
  YocoSettings
} from '../lib/fleetStore';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  FileText, 
  Download, 
  Eye, 
  User, 
  MapPin, 
  Phone, 
  Bike as BikeIcon, 
  DollarSign, 
  Check, 
  Plus, 
  Trash2, 
  Edit, 
  ExternalLink, 
  ZoomIn, 
  X, 
  Sparkles, 
  Layers, 
  LayoutGrid, 
  ListFilter, 
  ArrowRight, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  HelpCircle, 
  RefreshCw, 
  Send, 
  SlidersHorizontal, 
  ChevronRight, 
  BarChart3, 
  Users, 
  LogOut, 
  Menu, 
  CheckCheck,
  Loader2,
  UserPlus,
  UserCheck,
  Lock,
  Radio,
  CreditCard,
  Wrench,
  Package,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Bell,
  Gift,
  ShieldAlert,
  Landmark,
  Database,
  Settings as SettingsIcon
} from 'lucide-react';

interface AdminPortalProps {
  applications: RiderApplication[];
  bikes: Bike[];
  onUpdateApplication: (updated: RiderApplication) => Promise<void> | void;
  onDeleteApplication?: (appId: string) => Promise<void> | void;
  onSaveBike: (bike: Bike) => Promise<void> | void;
  onDeleteBike: (bikeId: string) => Promise<void> | void;
  onAddNewWalkin?: (newApp?: RiderApplication) => Promise<void> | void;
  onCloseAdmin?: () => void;
  onSaveLogo?: (logoUrl: string) => void;
  onSaveHeroImage?: (heroUrl: string) => void;
  customLogoUrl?: string;
  customHeroUrl?: string;
}

export type AdminPage = 
  | 'dashboard' 
  | 'applicant' 
  | 'applicants'
  | 'approved_customers' 
  | 'driver_risk_registry' 
  | 'referrals'
  | 'vehicle_register' 
  | 'live_tracking' 
  | 'parts_inventory' 
  | 'repairs_services' 
  | 'traffic_fines'
  | 'rental_options' 
  | 'rental_agreements' 
  | 'sales_agreements' 
  | 'bank_reconciliation' 
  | 'paystack_collections'
  | 'financials_yoco'
  | 'bike_and_stock' 
  | 'drivers' 
  | 'vehicles' 
  | 'reports' 
  | 'settings';

// Pipeline stages configuration
const PIPELINE_STAGES: {
  id: ApplicationStatus;
  label: string;
  shortLabel: string;
  color: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  badgeClass: string;
  icon: React.ElementType;
  description: string;
}[] = [
  {
    id: 'pending_review',
    label: 'Pending Review',
    shortLabel: 'Pending',
    color: 'blue',
    borderClass: 'border-blue-300',
    bgClass: 'bg-blue-50/50',
    textClass: 'text-blue-700',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    description: 'New submissions awaiting document verification & vetting',
  },
  {
    id: 'needs_more_info',
    label: 'Needs Info / Missing TRN',
    shortLabel: 'Needs TRN',
    color: 'amber',
    borderClass: 'border-amber-300',
    bgClass: 'bg-amber-50/50',
    textClass: 'text-amber-800',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    icon: AlertTriangle,
    description: 'Foreign national missing TRN Certificate or unclear ID docs',
  },
  {
    id: 'approved_for_collection',
    label: 'Approved for Collection',
    shortLabel: 'Approved',
    color: 'emerald',
    borderClass: 'border-emerald-300',
    bgClass: 'bg-emerald-50/50',
    textClass: 'text-emerald-800',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    icon: CheckCircle2,
    description: 'Ready for showroom visit, deposit payment & contract signing',
  },
  {
    id: 'contract_signed',
    label: 'Contract Signed & Delivered',
    shortLabel: 'Delivered',
    color: 'indigo',
    borderClass: 'border-indigo-300',
    bgClass: 'bg-indigo-50/50',
    textClass: 'text-indigo-800',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    icon: ShieldCheck,
    description: 'Deposit paid, contract signed, keys handed over to rider',
  },
  {
    id: 'declined',
    label: 'Declined',
    shortLabel: 'Declined',
    color: 'rose',
    borderClass: 'border-rose-300',
    bgClass: 'bg-rose-50/50',
    textClass: 'text-rose-800',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    icon: XCircle,
    description: 'Application did not meet underwriting criteria',
  },
];

export const AdminPortal: React.FC<AdminPortalProps> = ({
  applications,
  bikes,
  onUpdateApplication,
  onDeleteApplication,
  onSaveBike,
  onDeleteBike,
  onAddNewWalkin,
  onSaveLogo,
  onSaveHeroImage,
  customLogoUrl,
  customHeroUrl,
  onCloseAdmin,
}) => {
  // Sidebar active page state: 'dashboard' | 'applicant' | 'bike_and_stock'
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Dedicated Finance Tracking Modal
  const [selectedFinanceDriver, setSelectedFinanceDriver] = useState<Driver | null>(null);

  // Quick Record Payment Modal
  const [isQuickRecordPaymentOpen, setIsQuickRecordPaymentOpen] = useState<boolean>(false);
  const [quickPayDriverId, setQuickPayDriverId] = useState<string>('');
  const [quickPayAmount, setQuickPayAmount] = useState<number>(650);
  const [quickPayMethod, setQuickPayMethod] = useState<'manual_eft' | 'cash' | 'card_present' | 'yoco_app' | 'debit_order'>('manual_eft');
  const [quickPayAllocation, setQuickPayAllocation] = useState<'weekly_installment' | 'deposit' | 'fine' | 'repair' | 'tracker' | 'unallocated'>('weekly_installment');
  const [quickPayNotes, setQuickPayNotes] = useState<string>('');
  const [quickPayProofFile, setQuickPayProofFile] = useState<string | null>(null);
  const [quickPayProofFileName, setQuickPayProofFileName] = useState<string>('');
  const [isQuickPayUploading, setIsQuickPayUploading] = useState<boolean>(false);
  const quickPayFileRef = useRef<HTMLInputElement>(null);

  // Walk-in modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState<boolean>(false);

  // Applicant Inspector Modal State
  const [inspectingAppId, setInspectingAppId] = useState<string | null>(null);

  // Applications Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [citizenshipFilter, setCitizenshipFilter] = useState<string>('all');
  
  // Document Viewer Lightbox
  const [activeDocImage, setActiveDocImage] = useState<{ title: string; url: string } | null>(null);
  
  // Contract Modal
  const [contractApp, setContractApp] = useState<RiderApplication | null>(null);

  // Application Delete Confirmation Modal
  const [confirmDeleteApp, setConfirmDeleteApp] = useState<RiderApplication | null>(null);

  // Bike Editor / Creation Modal
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [isNewBikeModal, setIsNewBikeModal] = useState<boolean>(false);
  const [bikeImageMode, setBikeImageMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isUploadingBikeImg, setIsUploadingBikeImg] = useState<boolean>(false);
  const bikeFileInputRef = useRef<HTMLInputElement>(null);

  // Active Inspecting Application
  const inspectingApp = applications.find((a) => a.id === inspectingAppId) || null;

  // -------------------------------------------------------------
  // FLEET STATE & YOCO INTEGRATION (Section II, III, IV)
  // -------------------------------------------------------------
  const [driversState, setDriversState] = useState<Driver[]>(() => getFleetDrivers());
  const [vehiclesState, setVehiclesState] = useState<Vehicle[]>(() => getFleetVehicles());
  const [partsState, setPartsState] = useState<PartsInventoryItem[]>(() => getFleetParts());
  const [servicesState, setServicesState] = useState<RepairAndService[]>(() => getFleetServices());
  const [finesState, setFinesState] = useState<TrafficFine[]>(() => getFleetFines());
  const [transactionsState, setTransactionsState] = useState<YocoTransaction[]>(() => getFleetTransactions());
  const [agreementsState, setAgreementsState] = useState<RentalAgreement[]>(() => getFleetAgreements());
  const [referralsState, setReferralsState] = useState<DriverReferral[]>(() => getFleetReferrals());
  const [riskEntriesState, setRiskEntriesState] = useState<FlaggedRiskEntry[]>(() => getFlaggedRiskEntries());
  const [yocoSettingsState, setYocoSettingsState] = useState<YocoSettings>(() => getYocoSettings());
  const [selectedDriverForYocoPayment, setSelectedDriverForYocoPayment] = useState<Driver | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isLoadingFleetFromDb, setIsLoadingFleetFromDb] = useState<boolean>(false);
  const [assigningDeliveryApp, setAssigningDeliveryApp] = useState<RiderApplication | null>(null);

  // Live Database Fetcher
  const reloadAllFleetFromDb = async () => {
    setIsLoadingFleetFromDb(true);
    try {
      const data = await fetchAllFleetData();
      if (data) {
        setDriversState(data.drivers);
        setVehiclesState(data.vehicles);
        setPartsState(data.parts);
        setServicesState(data.services);
        setFinesState(data.fines);
        setTransactionsState(data.transactions);
        setAgreementsState(data.agreements);
        setReferralsState(data.referrals);
      }
      const riskData = await fetchAllRiskEntriesAsync();
      if (riskData) {
        setRiskEntriesState(riskData);
      }
    } catch (e) {
      console.warn('Failed loading fleet data from DB:', e);
    } finally {
      setIsLoadingFleetFromDb(false);
    }
  };

  useEffect(() => {
    reloadAllFleetFromDb();
  }, []);

  // Sidebar Group Toggle State
  const [isDriverGroupOpen, setIsDriverGroupOpen] = useState<boolean>(true);
  const [isVehicleGroupOpen, setIsVehicleGroupOpen] = useState<boolean>(true);
  const [isFleetGroupOpen, setIsFleetGroupOpen] = useState<boolean>(true);
  const [isAdminGroupOpen, setIsAdminGroupOpen] = useState<boolean>(true);
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');

  // Top Bar & Dashboard State
  const [adminUserName, setAdminUserName] = useState<string>('AARON');
  const [dashboardTab, setDashboardTab] = useState<'all' | 'overdue' | 'applications' | 'payments'>('all');
  const [isSetupBannerVisible, setIsSetupBannerVisible] = useState<boolean>(true);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);

  // Filtering
  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      app.fullName.toLowerCase().includes(q) ||
      app.refNumber.toLowerCase().includes(q) ||
      app.phone.includes(q) ||
      app.bikeName.toLowerCase().includes(q) ||
      app.idOrPassportNumber.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesCitizenship = citizenshipFilter === 'all' || app.citizenship === citizenshipFilter;

    return matchesSearch && matchesStatus && matchesCitizenship;
  });

  // Analytics Metrics
  const totalApps = applications.length;
  const pendingCount = applications.filter((a) => a.status === 'pending_review').length;
  const approvedCount = applications.filter((a) => a.status === 'approved_for_collection').length;
  const missingDocsCount = applications.filter((a) => a.status === 'needs_more_info').length;
  const signedCount = applications.filter((a) => a.status === 'contract_signed').length;
  const declinedCount = applications.filter((a) => a.status === 'declined').length;
  const weeklyRevenueEst = applications
    .filter((a) => a.status === 'approved_for_collection' || a.status === 'contract_signed')
    .reduce((sum, a) => sum + (a.weeklyRate || 0), 0);

  // Verification Checklist Toggle
  const handleChecklistToggle = (
    targetApp: RiderApplication,
    key: 'idVerified' | 'licenseVerified' | 'workPermitVerified' | 'trafficRegisterVerified'
  ) => {
    if (!targetApp) return;
    const newVerification = {
      ...targetApp.verification,
      [key]: !targetApp.verification[key],
    };
    const updated: RiderApplication = {
      ...targetApp,
      updatedAt: new Date().toISOString(),
      verification: newVerification,
    };
    onUpdateApplication(updated);
  };

  // Move Driver Status Handler (Works from Board, List, or Inspector)
  const handleMoveStatus = (targetApp: RiderApplication, newStatus: ApplicationStatus) => {
    // STRICT PIPELINE RULE: Once an applicant is on Delivered / Contract Signed, lock position permanently
    if (targetApp.status === 'contract_signed') {
      return;
    }

    // If moving to Delivered / Contract Signed, open the bike assignment & delivery handover modal
    if (newStatus === 'contract_signed') {
      setAssigningDeliveryApp(targetApp);
      return;
    }

    let title = 'Status Updated';
    let desc = `Application stage changed to ${newStatus.replace(/_/g, ' ')}.`;

    if (newStatus === 'approved_for_collection') {
      title = 'Approved for Showroom Handover';
      desc = `Ready for contract signing and motorbike collection at ${COMPANY_DETAILS.address}.`;
    } else if (newStatus === 'needs_more_info') {
      title = 'Action Required: Missing Documentation / TRN';
      desc = 'Rider notified to submit missing Traffic Register certificate (TRN) or ID docs.';
    } else if (newStatus === 'declined') {
      title = 'Application Declined';
      desc = 'Did not meet current underwriting or insurance criteria.';
    } else if (newStatus === 'pending_review') {
      title = 'Moved back to Pending Review';
      desc = 'Re-opened for background underwriting check.';
    }

    const updated: RiderApplication = {
      ...targetApp,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          timestamp: new Date().toISOString(),
          status: newStatus,
          title,
          description: desc,
        },
        ...(targetApp.timeline || []),
      ],
    };

    onUpdateApplication(updated);
  };

  // Confirm Handover & Assign Motorbike (Executed from DeliverAndAssignModal)
  const handleConfirmDeliveryAndAssignment = ({
    application,
    selectedVehicleId,
    customVinOrPlate,
    customBikeName,
    weeklyRate,
    depositPaid,
    termMonths,
    startOdoKm,
    handoverDate,
    adminNotes,
    collectionPhotoUrl,
    handoverPhotos,
    newVehicleToCreate,
  }: {
    application: RiderApplication;
    selectedVehicleId?: string;
    customVinOrPlate?: string;
    customBikeName?: string;
    weeklyRate: number;
    depositPaid: number;
    termMonths: number;
    startOdoKm: number;
    handoverDate: string;
    adminNotes?: string;
    collectionPhotoUrl?: string;
    handoverPhotos?: string[];
    newVehicleToCreate?: Vehicle;
  }) => {
    const title = 'Contract Signed & Bike Delivered';
    const desc = `Motorbike ${customVinOrPlate || selectedVehicleId || ''} handed over at Randburg showroom on ${handoverDate}. Deposit R${depositPaid} settled.`;

    const updatedApp: RiderApplication = {
      ...application,
      status: 'contract_signed',
      assignedBikeVinOrPlate: customVinOrPlate,
      weeklyRate,
      depositAmount: depositPaid,
      termMonths,
      adminNotes,
      collectionPhotoUrl,
      handoverPhotos,
      handoverOdometerKm: startOdoKm,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          timestamp: new Date().toISOString(),
          status: 'contract_signed',
          title,
          description: desc,
        },
        ...(application.timeline || []),
      ],
    };

    onUpdateApplication(updatedApp);

    try {
      // If a new vehicle was registered on the fly, add to pool first
      let currentVehicles = vehiclesState;
      if (newVehicleToCreate) {
        currentVehicles = [newVehicleToCreate, ...vehiclesState.filter((v) => v.id !== newVehicleToCreate.id)];
        setVehiclesState(currentVehicles);
        saveFleetVehicles(currentVehicles);
      }

      const { newDriver, updatedVehicles, newAgreement } = convertApplicantToDriver(
        updatedApp,
        currentVehicles,
        driversState,
        {
          assignedVehicleId: selectedVehicleId,
          customVinOrPlate,
          customBikeName,
          customWeeklyRate: weeklyRate,
          customDepositPaid: depositPaid,
          customTermMonths: termMonths,
        }
      );

      setDriversState((prev) => {
        const next = deduplicateDrivers([
          newDriver,
          ...prev.filter(
            (d) =>
              d.id !== newDriver.id &&
              d.idOrPassportNumber !== newDriver.idOrPassportNumber &&
              d.phone !== newDriver.phone
          ),
        ]);
        saveFleetDrivers(next);
        return next;
      });

      setVehiclesState(updatedVehicles);
      saveFleetVehicles(updatedVehicles);

      setAgreementsState((prev) => {
        const next = [
          newAgreement,
          ...prev.filter(
            (a) =>
              a.id !== newAgreement.id &&
              a.driverId !== newDriver.id &&
              a.driverName !== newDriver.fullName
          ),
        ];
        saveFleetAgreements(next);
        return next;
      });
    } catch (err) {
      console.error('Handover and bike assignment error:', err);
    }

    setAssigningDeliveryApp(null);
  };

  // Change Assigned Motorbike for Driver
  const handleChangeDriverBike = (driverId: string, newVehicleId: string) => {
    const { updatedDrivers, updatedVehicles } = assignBikeToDriver(
      driverId,
      newVehicleId,
      driversState,
      vehiclesState
    );
    setDriversState(updatedDrivers);
    setVehiclesState(updatedVehicles);
  };

  // Remove / Unassign Motorbike from Driver
  const handleRemoveDriverBike = (driverId: string) => {
    const { updatedDrivers, updatedVehicles } = unassignBikeFromDriver(
      driverId,
      driversState,
      vehiclesState
    );
    setDriversState(updatedDrivers);
    setVehiclesState(updatedVehicles);
  };

  // Cascading Application Deletion (removes applicant + linked driver in Approved Customers + frees bike back to inventory)
  const handleDeleteApplicationWithCascade = async (appId: string) => {
    const res = cascadeDeleteApplication(
      appId,
      applications,
      driversState,
      vehiclesState,
      agreementsState
    );

    setDriversState(res.updatedDrivers);
    setVehiclesState(res.updatedVehicles);
    setAgreementsState(res.updatedAgreements);

    if (inspectingAppId === appId) {
      setInspectingAppId(null);
    }

    if (onDeleteApplication) {
      await onDeleteApplication(appId);
    }
  };

  // Direct Driver Deletion (removes driver + frees up assigned bike)
  const handleDeleteDriver = (driverId: string) => {
    const res = removeDriverAndFreeBike(
      driverId,
      driversState,
      vehiclesState,
      agreementsState
    );
    setDriversState(res.updatedDrivers);
    setVehiclesState(res.updatedVehicles);
    setAgreementsState(res.updatedAgreements);
  };

  // Fleet State Handlers
  const handleUpdateDriver = (updated: Driver) => {
    setDriversState((prev) => {
      const next = prev.map((d) => (d.id === updated.id ? updated : d));
      saveFleetDrivers(next);
      return next;
    });
  };

  const handleAddDriver = (newDriver: Driver) => {
    setDriversState((prev) => {
      const next = [newDriver, ...prev];
      saveFleetDrivers(next);
      return next;
    });
  };

  const handleUpdateVehicle = (updated: Vehicle) => {
    setVehiclesState((prev) => {
      const next = prev.map((v) => (v.id === updated.id ? updated : v));
      saveFleetVehicles(next);
      return next;
    });
  };

  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehiclesState((prev) => {
      const next = [newVehicle, ...prev];
      saveFleetVehicles(next);
      return next;
    });
  };

  const handleAddTransaction = (newTx: YocoTransaction) => {
    setTransactionsState((prev) => {
      const next = [newTx, ...prev];
      saveFleetTransactions(next);
      return next;
    });
  };

  const handleUpdateYocoSettings = (newSettings: YocoSettings) => {
    setYocoSettingsState(newSettings);
    saveYocoSettings(newSettings);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Ref Number',
      'Created At',
      'Status',
      'Applicant Name',
      'Citizenship',
      'ID/Passport',
      'Phone',
      'Platform',
      'Bike Model',
      'Condition',
      'Weekly Rate',
      'Deposit Amount',
      'Assigned Plate/VIN',
    ];

    const rows = applications.map((a) => [
      a.refNumber,
      new Date(a.createdAt).toLocaleDateString('en-ZA'),
      a.status,
      `"${a.fullName}"`,
      a.citizenship,
      `"${a.idOrPassportNumber}"`,
      `"${a.phone}"`,
      `"${a.primaryPlatform}"`,
      `"${a.bikeName}"`,
      a.bikeCondition,
      a.weeklyRate,
      a.depositAmount,
      `"${a.assignedBikeVinOrPlate || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dynamic_rental_applications_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1-Click WhatsApp Trigger for Approval & Collection
  const sendApprovalWhatsApp = (app: RiderApplication) => {
    const text = `Good day ${app.fullName}! 🎉

Great news from *Dynamic Rental Randburg*! Your rent-to-own motorbike application for the *${app.bikeName}* (Ref: *${app.refNumber}*) has been *APPROVED FOR COLLECTION*!

📍 *Collection Location:*
${COMPANY_DETAILS.address}
⏰ *Operating Hours:* Mon-Fri 08:00-17:00, Sat 08:30-13:00

💰 *Deposit Payable at Signing:* R${app.depositAmount} (Non-refundable)
🏍️ *Weekly Installment:* R${app.weeklyRate}/week

*What to bring on collection day:*
1. R${app.depositAmount} Deposit (Cash or Instant EFT)
2. Original Smart ID / Passport & TRN
3. Original Motorcycle Driver's License

Please reply with the estimated time you will arrive at our showroom today!`;

    window.open(`https://wa.me/${app.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 1-Click WhatsApp Trigger for Missing TRN
  const sendMissingTRNWhatsApp = (app: RiderApplication) => {
    const text = `Good day ${app.fullName},

This is *Dynamic Rental Randburg* regarding your Rent-to-Own motorbike application (*${app.refNumber}*).

⚠️ *Attention Required: Traffic Register Number (TRN)*
Because you hold a foreign driver's license, our insurance compliance policy strictly requires an official *Traffic Register Number (TRN) Certificate* issued by the traffic department.

Please take a clear photo of your TRN certificate and reply directly on this WhatsApp chat so we can immediately approve your bike for collection today!`;

    window.open(`https://wa.me/${app.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Handle Bike Image Upload from Device
  const handleDeviceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBike) return;

    setIsUploadingBikeImg(true);
    try {
      const dataUrl = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 800,
        quality: 0.85,
        mimeType: 'image/jpeg',
      });
      setEditingBike({
        ...editingBike,
        image: dataUrl,
      });
    } catch (err: any) {
      console.error('Bike image upload error:', err);
      alert(err?.message || 'Could not process bike photo. Please try a different image.');
    } finally {
      setIsUploadingBikeImg(false);
      if (bikeFileInputRef.current) bikeFileInputRef.current.value = '';
    }
  };

  // Handle walk-in submission from modal
  const handleWalkInSubmit = async (newApp: RiderApplication) => {
    if (onAddNewWalkin) {
      await onAddNewWalkin(newApp);
    } else {
      await onUpdateApplication(newApp);
    }
    setInspectingAppId(newApp.id);
    setActivePage('applicant');
    setIsWalkinModalOpen(false);
  };

  // Bike Management Save Handler
  const handleSaveBikeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBike) return;
    onSaveBike(editingBike);
    setEditingBike(null);
    setIsNewBikeModal(false);
  };

  const startAddNewBike = () => {
    const newB: Bike = {
      id: `bike-${Date.now()}`,
      name: 'New Motorbike Model',
      subtitle: 'Commercial Delivery Bike',
      brand: 'Boxer',
      category: 'boxer',
      isAvailable: true,
      isComingSoon: false,
      image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      badge: 'In Stock',
      fuelType: 'Petrol (Fuel Saver)',
      engineCapacity: '150cc 4-Stroke',
      tankCapacity: '11 Liters',
      deliveryBoxReady: true,
      pricing: {
        new: {
          available: true,
          weeklyPayment: 750,
          deposit: 1000,
          termMonthsOptions: [15, 18],
          totalDepositLabel: 'R1,000 deposit payable on contract signing',
        },
        used: {
          available: true,
          weeklyPayment: 650,
          deposit: 650,
          termMonths: 20,
          totalDepositLabel: 'R650 deposit payable on contract signing',
        },
      },
      keyFeatures: [
        'Commercial delivery box rack mounted',
        'USB mobile phone charging port',
        'Heavy-duty dual rear shock absorbers',
      ],
      recommendedFor: 'Checkers Sixty60, Uber Eats, Takealot, Mr D couriers',
    };
    setEditingBike(newB);
    setIsNewBikeModal(true);
    setBikeImageMode('upload');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row antialiased" id="dealership-admin-app">
      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION */}
      {/* ------------------------------------------------------------- */}
      {/* ------------------------------------------------------------- */}
      {/* SIDEBAR NAVIGATION (Dynamic Rental) */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-full md:w-64 lg:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800 shadow-xl z-20">
        {/* Sidebar Header / Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex flex-col gap-1 min-w-0">
            <DynamicRentalLogo customLogoUrl={customLogoUrl} size="sm" />
            <div className="flex items-center gap-1.5 pl-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold tracking-wide uppercase">
                Randburg Hub Staff Portal
              </span>
            </div>
          </div>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Global Search Input */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/30">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search anything..."
              value={sidebarSearchQuery}
              onChange={(e) => setSidebarSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
        </div>

        {/* Page-by-Page Navigation Menu */}
        <div className={`p-3 flex-1 flex flex-col gap-3 overflow-y-auto ${isMobileSidebarOpen ? 'block' : 'hidden md:flex'}`}>
          {/* Top Primary: Dashboard */}
          <button
            type="button"
            onClick={() => {
              setActivePage('dashboard');
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between ${
              activePage === 'dashboard'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:bg-slate-800/90 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4" />
              <span>Dashboard</span>
            </div>
          </button>

          {/* GROUP 1: DRIVER MANAGEMENT */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setIsDriverGroupOpen(!isDriverGroupOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Driver Management</span>
              {isDriverGroupOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {isDriverGroupOpen && (
              <div className="space-y-0.5 pt-0.5">
                {/* Applicants */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('applicants');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'applicants' || activePage === 'applicant'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Applicants</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'applicants' || activePage === 'applicant' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-cyan-400'
                  }`}>
                    {totalApps}
                  </span>
                </button>

                {/* Approved Customers */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('approved_customers');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'approved_customers'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Approved Customers</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'approved_customers' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-emerald-400'
                  }`}>
                    {driversState.filter((d) => d.status === 'active').length}
                  </span>
                </button>

                {/* Driver Risk Registry */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('driver_risk_registry');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'driver_risk_registry'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Driver Risk Registry</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'driver_risk_registry' 
                      ? 'bg-slate-950 text-cyan-300' 
                      : riskEntriesState.length > 0
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {riskEntriesState.length}
                  </span>
                </button>

                {/* Referrals */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('referrals');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'referrals'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Gift className="w-3.5 h-3.5 text-purple-400" />
                    <span>Referrals</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'referrals' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-purple-400'
                  }`}>
                    {referralsState.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* GROUP 2: VEHICLE MANAGEMENT */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setIsVehicleGroupOpen(!isVehicleGroupOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Vehicle Management</span>
              {isVehicleGroupOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {isVehicleGroupOpen && (
              <div className="space-y-0.5 pt-0.5">
                {/* Vehicle Register */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('vehicle_register');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'vehicle_register' || activePage === 'vehicles'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BikeIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Vehicle Register</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'vehicle_register' || activePage === 'vehicles' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {vehiclesState.length}
                  </span>
                </button>

                {/* Live Tracking */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('live_tracking');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'live_tracking'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                    <span>Live Tracking</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </button>

                {/* Parts Inventory */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('parts_inventory');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'parts_inventory'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>Parts Inventory</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'parts_inventory' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-amber-400'
                  }`}>
                    {partsState.length}
                  </span>
                </button>

                {/* Repairs and Services */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('repairs_services');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'repairs_services'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Wrench className="w-3.5 h-3.5 text-blue-400" />
                    <span>Repairs and Services</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'repairs_services' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-blue-400'
                  }`}>
                    {servicesState.length}
                  </span>
                </button>

                {/* Traffic Fines */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('traffic_fines');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'traffic_fines'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Traffic Fines</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'traffic_fines' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-rose-400'
                  }`}>
                    {finesState.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* GROUP 3: FLEET MANAGEMENT */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setIsFleetGroupOpen(!isFleetGroupOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Fleet Management</span>
              {isFleetGroupOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {isFleetGroupOpen && (
              <div className="space-y-0.5 pt-0.5">
                {/* Rental Agreements */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('rental_agreements');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'rental_agreements'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Rental Agreements</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'rental_agreements' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-indigo-400'
                  }`}>
                    {agreementsState.length}
                  </span>
                </button>

                {/* Paystack & Yoco Collections */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('paystack_collections');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'paystack_collections' || activePage === 'financials_yoco'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Paystack Collections</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'paystack_collections' || activePage === 'financials_yoco' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-amber-400'
                  }`}>
                    {transactionsState.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* GROUP 4: ADMIN */}
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => setIsAdminGroupOpen(!isAdminGroupOpen)}
              className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-black text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
            >
              <span>Admin</span>
              {isAdminGroupOpen ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {isAdminGroupOpen && (
              <div className="space-y-0.5 pt-0.5">
                {/* Reports */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('reports');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'reports'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reports</span>
                  </div>
                </button>

                {/* Bikes Showroom Catalog */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePage('bike_and_stock');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between ${
                    activePage === 'bike_and_stock'
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BikeIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bikes & Stock</span>
                  </div>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activePage === 'bike_and_stock' ? 'bg-slate-950 text-cyan-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {bikes.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="my-auto" />

          {/* Exit Staff Mode Button */}
          {onCloseAdmin && (
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onCloseAdmin}
                className="w-full px-3 py-2 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-700/60 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Staff Mode</span>
              </button>
            </div>
          )}
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-950/40 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-200">Randburg Showroom</div>
            <div className="text-[10px] text-slate-400">304 Tungsten Rd, Strijdom Park</div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected to Fleet Hub" />
        </div>
      </aside>

      {/* ------------------------------------------------------------- */}
      {/* MAIN ADMIN CONTENT AREA */}
      {/* ------------------------------------------------------------- */}
      <main className="flex-1 overflow-y-auto bg-slate-50 flex flex-col min-h-screen">
        
        {/* TOP BAR: Welcome, AARON + Actions + User Avatar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                Welcome, {adminUserName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Supabase Database Connection Status Button */}
            <button
              type="button"
              onClick={() => setIsSupabaseModalOpen(true)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs border ${
                isSupabaseConnected()
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
              }`}
              title="Configure live Supabase database connection and sync data"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isSupabaseConnected() ? 'DB: Connected' : 'Connect DB'}</span>
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </button>

            {/* Refresh DB Data Button */}
            <button
              type="button"
              onClick={reloadAllFleetFromDb}
              disabled={isLoadingFleetFromDb}
              className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors text-xs font-black disabled:opacity-50"
              title="Sync & refresh all data from Supabase database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoadingFleetFromDb ? 'animate-spin text-cyan-600' : ''}`} />
            </button>

            {/* Feedback Button */}
            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
              <span>Feedback</span>
            </button>

            {/* Help Button */}
            <button
              type="button"
              onClick={() => alert("Dynamic Rental Operations Help: Quick shortcuts: Press Applicants to vet new couriers, Live Tracking to monitor telemetry, or Paystack Collections to process card & debit payments.")}
              className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors text-xs font-black"
              title="Help & Support"
            >
              ?
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors relative"
                title="System Notifications"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-30 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900">Notifications</span>
                    <span className="text-[10px] text-cyan-600 font-bold">2 New</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="font-bold text-blue-900">New Applicant Waiting</div>
                      <div className="text-[11px] text-blue-700">Tinashe Moyo submitted TRN Certificate for review.</div>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="font-bold text-amber-900">Weekly Rent Due Today</div>
                      <div className="text-[11px] text-amber-700">3 couriers have rent-to-own installments due today.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-cyan-400 font-black text-xs flex items-center justify-center border border-cyan-400 shadow-sm">
                AM
              </div>
            </div>
          </div>
        </header>

        {/* INNER CONTENT SCROLLER */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 flex flex-col gap-6">

        {/* PAGE: DASHBOARD OVERVIEW */}
        {activePage === 'dashboard' && (() => {
          // Dynamic Setup Step Calculation
          const setupSteps = [
            { id: 'profile', label: 'Set up Dealership Profile & Pricing', done: true, route: 'dealership_profile' as AdminPage },
            { id: 'bikes', label: 'Add Motorbikes to Inventory', done: bikes.length > 0, route: 'bike_and_stock' as AdminPage },
            { id: 'fleet', label: 'Register Commercial Fleet Vehicles', done: vehiclesState.length > 0, route: 'vehicle_register' as AdminPage },
            { id: 'apps', label: 'Accept Applications & Customer Onboarding', done: applications.length > 0 || driversState.length > 0, route: 'applicants' as AdminPage },
            { id: 'db', label: 'Connect Supabase Cloud Database', done: isSupabaseConnected(), route: 'settings' as AdminPage },
            { id: 'contracts', label: 'Issue Rental Agreements & Contracts', done: agreementsState.length > 0, route: 'agreements_contracts' as AdminPage },
          ];
          const completedStepsCount = setupSteps.filter((s) => s.done).length;
          const setupProgressPct = Math.round((completedStepsCount / setupSteps.length) * 100);
          const nextIncompleteStep = setupSteps.find((s) => !s.done);

          // Priority metrics
          const overdueDrivers = driversState.filter((d) => (d.balanceDue || 0) > 0);
          const pendingAppsList = applications.filter((a) => a.status === 'pending_review' || a.status === 'needs_more_info');
          const maintenanceVehiclesList = vehiclesState.filter((v) => v.status === 'in_maintenance' || v.status === 'repair_needed');
          const pendingReferralsList = referralsState.filter((r) => r.payoutStatus === 'pending_payout');

          // Financial metrics
          const totalRevenueCollected = transactionsState.reduce((sum, tx) => sum + (tx.amountZar || 0), 0);
          const totalDepositsBanked = transactionsState
            .filter((tx) => tx.allocation === 'deposit')
            .reduce((sum, tx) => sum + (tx.amountZar || 0), 0);
          const activeAssignedCount = vehiclesState.filter((v) => v.status === 'assigned_active').length || driversState.filter((d) => d.status === 'active').length;
          const monthlyTarget = 250000;
          const targetPct = Math.min(100, Math.round((totalRevenueCollected / monthlyTarget) * 100));

          return (
            <div className="flex flex-col gap-6" id="admin-dashboard-page">
              {/* Sub-Header: Date and Customise */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">Operations Dashboard</h1>
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · Fleet & Financial Overview
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => reloadAllFleetFromDb()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
                    title="Refresh data from database"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingFleetFromDb ? 'animate-spin' : ''}`} />
                    <span>Sync</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomizeModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                    <span>Customise</span>
                  </button>
                </div>
              </div>

              {/* Finish Setting Up FleetCO Progress Banner */}
              {isSetupBannerVisible && (
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-xs font-black">
                          ✓
                        </div>
                        <h2 className="text-sm font-black tracking-tight text-white uppercase">
                          SETUP PROGRESS · FLEET OPERATIONS
                        </h2>
                      </div>
                      <p className="text-xs text-slate-300">
                        {completedStepsCount} of {setupSteps.length} core setup steps complete · {nextIncompleteStep ? `Next: ${nextIncompleteStep.label}` : 'All Core Setup Done!'}
                      </p>
                      {/* Progress bar */}
                      <div className="w-full max-w-md bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                        <div
                          className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${setupProgressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsSetupBannerVisible(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (nextIncompleteStep) {
                            setActivePage(nextIncompleteStep.route);
                          } else {
                            setActivePage('approved_customers');
                          }
                        }}
                        className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-md flex items-center gap-1.5"
                      >
                        <span>{nextIncompleteStep ? 'Resume Setup' : 'View Operations'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TODAY'S PRIORITIES (5 Vibrant Clickable Cards) */}
              <div>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                  TODAY'S PRIORITIES
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                  {/* 1. Red Card: Overdue Payments */}
                  <div className="bg-white rounded-2xl border-2 border-rose-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="text-2xl font-black text-rose-600">
                        {overdueDrivers.length}
                      </div>
                      <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                        OVERDUE PAYMENTS
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {overdueDrivers.length > 0 
                          ? `R${overdueDrivers.reduce((sum, d) => sum + d.balanceDue, 0).toFixed(0)} total balance` 
                          : 'All accounts up to date'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (overdueDrivers.length > 0) {
                          setSelectedFinanceDriver(overdueDrivers[0]);
                        } else {
                          setActivePage('approved_customers');
                        }
                      }}
                      className="mt-4 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors w-full sm:w-fit border border-rose-200 flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{overdueDrivers.length > 0 ? 'Track & Collect' : 'View Ledger'}</span>
                    </button>
                  </div>

                  {/* 2. Mint Green Card: New Applicants */}
                  <div className="bg-white rounded-2xl border-2 border-emerald-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="text-2xl font-black text-emerald-600">
                        {pendingAppsList.length || pendingCount}
                      </div>
                      <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                        NEW APPLICANTS
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {pendingAppsList.length > 0 ? 'Awaiting vetting / docs' : 'No new queue items'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('all');
                        setActivePage('applicants');
                      }}
                      className="mt-4 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors w-full sm:w-fit border border-emerald-200 flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Review Queue</span>
                    </button>
                  </div>

                  {/* 3. Yellow/Gold Card: Vehicles in Maintenance */}
                  <div className="bg-white rounded-2xl border-2 border-amber-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="text-2xl font-black text-amber-600">
                        {maintenanceVehiclesList.length}
                      </div>
                      <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                        VEHICLES IN MAINTENANCE
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {maintenanceVehiclesList.length > 0 ? 'Workshop jobs open' : 'Fleet fully operational'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePage('repairs_services')}
                      className="mt-4 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors w-full sm:w-fit border border-amber-200 flex items-center justify-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Check Workshop</span>
                    </button>
                  </div>

                  {/* 4. Sky Blue Card: Missing Documents */}
                  <div className="bg-white rounded-2xl border-2 border-cyan-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="text-2xl font-black text-cyan-600">
                        {missingDocsCount}
                      </div>
                      <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                        MISSING DOCUMENTS
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {missingDocsCount > 0 ? 'TRN / Work permits pending' : 'All applicant files complete'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('needs_more_info');
                        setActivePage('applicants');
                      }}
                      className="mt-4 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-bold transition-colors w-full sm:w-fit border border-cyan-200 flex items-center justify-center gap-1.5"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Follow Up</span>
                    </button>
                  </div>

                  {/* 5. Dark / Charcoal Card: Referrals Owed */}
                  <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="text-2xl font-black text-slate-800">
                        {pendingReferralsList.length}
                      </div>
                      <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                        REFERRALS OWED
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {pendingReferralsList.length > 0 
                          ? `R${pendingReferralsList.reduce((sum, r) => sum + r.rewardAmountZar, 0).toFixed(0)} payout pending` 
                          : 'No pending driver rewards'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePage('referrals')}
                      className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors w-full sm:w-fit border border-slate-300 flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5 text-purple-600" />
                      <span>Manage Referrals</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-2">Quick Actions:</span>

                  <button
                    type="button"
                    onClick={() => setIsWalkinModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <UserPlus className="w-4 h-4 text-cyan-600" />
                    <span>+ Add Customer / Walk-In</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActivePage('bike_and_stock');
                      startAddNewBike();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <BikeIcon className="w-4 h-4 text-emerald-600" />
                    <span>Add Vehicle Model</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (driversState.length > 0) {
                        setQuickPayDriverId(driversState[0].id);
                        setQuickPayAmount(driversState[0].weeklyRate || 650);
                      }
                      setIsQuickRecordPaymentOpen(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Record Payment (POP / EFT)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (applications.length > 0) {
                        setContractApp(applications[0]);
                      } else {
                        alert('Register an applicant first to generate agreements.');
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Create New Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActivePage('live_tracking')}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs"
                  >
                    <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span>Live Fleet GPS</span>
                  </button>
                </div>
              </div>

              {/* Split Dashboard: NEEDS ATTENTION & REVENUE TREND */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Card: NEEDS ATTENTION */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                        NEEDS ATTENTION
                      </h3>
                      <p className="text-[11px] text-slate-500">Action items requiring administrative action</p>
                    </div>
                    
                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
                      {(['all', 'overdue', 'applications', 'payments'] as const).map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setDashboardTab(tab)}
                          className={`px-2.5 py-1 rounded-lg capitalize font-bold transition-all ${
                            dashboardTab === tab
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Attention Items List */}
                  <div className="space-y-3 mt-1 flex-1">
                    {/* OVERDUE TAB OR ALL */}
                    {(dashboardTab === 'all' || dashboardTab === 'overdue') && overdueDrivers.map((d) => (
                      <div
                        key={`overdue-${d.id}`}
                        className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between hover:bg-rose-100/70 transition-colors gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 truncate">{d.fullName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 shrink-0">
                              Overdue R{d.balanceDue.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            Bike: <strong className="text-slate-700">{d.assignedVehiclePlate || 'Unassigned'}</strong> · Phone: {d.phone}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedFinanceDriver(d)}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-2xs shrink-0 flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Track Finance</span>
                        </button>
                      </div>
                    ))}

                    {/* APPLICATIONS TAB OR ALL */}
                    {(dashboardTab === 'all' || dashboardTab === 'applications') && pendingAppsList.map((a) => (
                      <div
                        key={`app-${a.id}`}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-900 truncate">{a.fullName}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                              a.status === 'needs_more_info' ? 'bg-amber-100 text-amber-900' : 'bg-cyan-100 text-cyan-900'
                            }`}>
                              {a.status === 'needs_more_info' ? 'Missing Docs / TRN' : 'Pending Review'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            Ref: <strong className="font-mono text-slate-700">{a.refNumber}</strong> · Bike: {a.bikeName}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setInspectingAppId(a.id);
                          }}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Inspect</span>
                        </button>
                      </div>
                    ))}

                    {/* PAYMENTS TAB */}
                    {dashboardTab === 'payments' && (
                      <div className="space-y-2">
                        {transactionsState.slice(0, 5).map((tx) => (
                          <div
                            key={tx.id}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{tx.driverName}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                                  {tx.allocation.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {new Date(tx.timestamp).toLocaleDateString('en-ZA')} · {tx.paymentMethod.replace('_', ' ')} · Ref: {tx.yocoPaymentId}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-black text-emerald-600">+R{tx.amountZar.toFixed(2)}</div>
                              {tx.proofOfPaymentUrl && (
                                <button
                                  type="button"
                                  onClick={() => setActiveDocImage({ title: `POP - ${tx.driverName}`, url: tx.proofOfPaymentUrl! })}
                                  className="text-[10px] text-cyan-600 hover:underline font-bold flex items-center gap-0.5 justify-end"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View POP</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EMPTY STATE */}
                    {((dashboardTab === 'all' && overdueDrivers.length === 0 && pendingAppsList.length === 0) ||
                      (dashboardTab === 'overdue' && overdueDrivers.length === 0) ||
                      (dashboardTab === 'applications' && pendingAppsList.length === 0) ||
                      (dashboardTab === 'payments' && transactionsState.length === 0)) && (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        <h4 className="text-xs font-black text-slate-800 uppercase">All Caught Up!</h4>
                        <p className="text-xs text-slate-500 max-w-sm">
                          {dashboardTab === 'overdue'
                            ? 'No drivers currently have overdue balances. All accounts are settled!'
                            : dashboardTab === 'applications'
                            ? 'No applications are pending review. The pipeline is up to date!'
                            : dashboardTab === 'payments'
                            ? 'No transaction records found in this cycle.'
                            : 'No pending priority items requiring attention right now.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card: REVENUE TREND */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                          REVENUE & SETTLEMENTS
                        </h3>
                        <p className="text-[11px] text-slate-500">Real-time collections & target progress</p>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Live Sync</span>
                      </span>
                    </div>

                    {/* Summary Metric Chips */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Collected</span>
                        <span className="text-base font-black text-slate-900">
                          R{totalRevenueCollected.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Deposits Banked</span>
                        <span className="text-base font-black text-cyan-700">
                          R{totalDepositsBanked.toLocaleString()}
                        </span>
                      </div>

                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Deployed</span>
                        <span className="text-base font-black text-emerald-700">
                          {activeAssignedCount} Bikes
                        </span>
                      </div>
                    </div>

                    {/* SVG Line Graph / Bar visualization */}
                    <div className="mt-5 h-36 w-full flex items-end">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120">
                        <defs>
                          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 10 100 Q 80 80, 140 60 T 260 40 T 390 15 L 390 120 L 10 120 Z"
                          fill="url(#revenueGrad)"
                        />
                        <path
                          d="M 10 100 Q 80 80, 140 60 T 260 40 T 390 15"
                          fill="none"
                          stroke="#0891b2"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <circle cx="390" cy="15" r="4" fill="#0891b2" className="animate-ping" />
                        <circle cx="390" cy="15" r="4" fill="#0891b2" />
                      </svg>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Monthly Target: <strong className="text-slate-900 font-mono">R{monthlyTarget.toLocaleString()}</strong></span>
                      <span className="font-black text-cyan-700">{targetPct}% Achieved</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${targetPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PAGE 2: APPLICANTS PIPELINE & MANAGEMENT */}
        {(activePage === 'applicant' || activePage === 'applicants') && (
          <div className="flex flex-col gap-5" id="admin-applicants-page">
            {/* Top Bar with Search & View Toggle */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search driver name, ref code (DR-), phone, ID/Passport..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Pipeline Stages</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="needs_more_info">Needs Info / Missing TRN</option>
                  <option value="approved_for_collection">Approved for Collection</option>
                  <option value="contract_signed">Contract Signed / Delivered</option>
                  <option value="declined">Declined</option>
                </select>

                {/* Citizenship Filter */}
                <select
                  value={citizenshipFilter}
                  onChange={(e) => setCitizenshipFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Citizenships</option>
                  <option value="south_african">🇿🇦 South African</option>
                  <option value="foreign_national">🌍 Foreign National (TRN)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsWalkinModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Walk-in</span>
                </button>
              </div>
            </div>

            {/* KANBAN STAGE PIPELINE BOARD */}
            <div className="flex gap-4 items-start overflow-x-auto pb-4 pt-1 w-full min-w-0">
                {PIPELINE_STAGES.map((stage) => {
                  const stageApps = filteredApps.filter((a) => a.status === stage.id);
                  const StageIcon = stage.icon;

                  return (
                    <div
                      key={stage.id}
                      className={`rounded-2xl border ${stage.borderClass} ${stage.bgClass} flex flex-col p-3.5 gap-3 min-w-[280px] w-[280px] sm:w-[290px] flex-shrink-0 shadow-xs`}
                    >
                      {/* Column Header */}
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <div className="flex items-center gap-1.5">
                          <StageIcon className={`w-4 h-4 ${stage.textClass}`} />
                          <span className="text-xs font-black text-slate-900 tracking-tight">
                            {stage.shortLabel}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stage.badgeClass}`}>
                          {stageApps.length}
                        </span>
                      </div>

                      {/* Column Driver Cards */}
                      <div className="flex flex-col gap-2.5 min-h-[350px]">
                        {stageApps.length === 0 ? (
                          <div className="h-32 flex flex-col items-center justify-center text-center p-3 border-2 border-dashed border-slate-300/70 rounded-xl text-slate-400 text-[11px]">
                            <span>No applications in this stage</span>
                          </div>
                        ) : (
                          stageApps.map((app) => (
                            <div
                              key={app.id}
                              className="bg-white rounded-xl border border-slate-200/90 p-3 shadow-xs hover:shadow-md transition-all flex flex-col gap-2 relative group"
                            >
                              {/* Card Top: Driver Name & Ref */}
                              <div className="flex items-start justify-between gap-1">
                                <div>
                                  <h4 className="text-xs font-black text-slate-900 leading-snug">
                                    {app.fullName}
                                  </h4>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                      {app.refNumber}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {app.primaryPlatform}
                                    </span>
                                  </div>
                                </div>

                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(app.createdAt).toLocaleDateString('en-ZA', { month: 'numeric', day: 'numeric' })}
                                </span>
                              </div>

                              {/* Bike Requested */}
                              <div className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded-lg border border-slate-100 flex items-center justify-between">
                                <span className="font-semibold truncate max-w-[130px]">{app.bikeName}</span>
                                <span className="font-mono font-bold text-blue-600">R{app.weeklyRate}/wk</span>
                              </div>

                              {/* Citizenship Badge */}
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-500">
                                  {app.citizenship === 'south_african' ? '🇿🇦 SA ID' : `🌍 Foreign (${app.nationalityCountry || 'TRN'})`}
                                </span>
                                <span className="text-amber-800 font-bold font-mono">
                                  Dep: R{app.depositAmount}
                                </span>
                              </div>

                              {/* Action Buttons: 1-Click Stage Transitions or Locked Delivered State */}
                              {stage.id === 'contract_signed' || app.status === 'contract_signed' ? (
                                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-[10px] font-black">
                                    <Lock className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span className="truncate">Delivered & Active • Locked</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setActivePage('drivers')}
                                    className="w-full py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[10px] font-black transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                  >
                                    <UserCheck className="w-3 h-3 text-cyan-400" />
                                    <span>View in Approved Customers →</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Move Stage:
                                  </label>
                                
                                  <div className="grid grid-cols-2 gap-1">
                                    {stage.id !== 'approved_for_collection' && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveStatus(app, 'approved_for_collection')}
                                        className="px-1.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition-colors flex items-center justify-center gap-0.5"
                                        title="Approve for Showroom Handover"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                        <span>Approve</span>
                                      </button>
                                    )}

                                    {stage.id !== 'needs_more_info' && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveStatus(app, 'needs_more_info')}
                                        className="px-1.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-slate-950 border border-amber-200 transition-colors flex items-center justify-center gap-0.5"
                                        title="Request Missing TRN or Info"
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        <span>Needs TRN</span>
                                      </button>
                                    )}

                                    {(stage.id as string) !== 'contract_signed' && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveStatus(app, 'contract_signed')}
                                        className="px-1.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-800 hover:bg-indigo-600 hover:text-white border border-indigo-200 transition-colors flex items-center justify-center gap-0.5"
                                        title="Mark Contract Signed & Handed Over"
                                      >
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                        <span>Delivered</span>
                                      </button>
                                    )}

                                    {stage.id !== 'declined' && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveStatus(app, 'declined')}
                                        className="px-1.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-800 hover:bg-rose-600 hover:text-white border border-rose-200 transition-colors flex items-center justify-center gap-0.5"
                                        title="Decline application"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                        <span>Decline</span>
                                      </button>
                                    )}

                                    {stage.id !== 'pending_review' && (
                                      <button
                                        type="button"
                                        onClick={() => handleMoveStatus(app, 'pending_review')}
                                        className="px-1.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center justify-center gap-0.5 col-span-2"
                                        title="Move back to Pending Review"
                                      >
                                        <RefreshCw className="w-2.5 h-2.5" />
                                        <span>Reset to Pending</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                                {/* Quick WhatsApp & Inspector Open */}
                                <div className="flex items-center justify-between pt-1">
                                  {stage.id === 'approved_for_collection' ? (
                                    <button
                                      type="button"
                                      onClick={() => sendApprovalWhatsApp(app)}
                                      className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>WhatsApp Pickup</span>
                                    </button>
                                  ) : stage.id === 'needs_more_info' ? (
                                    <button
                                      type="button"
                                      onClick={() => sendMissingTRNWhatsApp(app)}
                                      className="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>Ask TRN</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => window.open(`https://wa.me/${app.whatsappNumber.replace(/[^0-9]/g, '')}`, '_blank')}
                                      className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1"
                                    >
                                      <MessageSquare className="w-3 h-3" />
                                      <span>Chat</span>
                                    </button>
                                  )}

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectingAppId(app.id);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black flex items-center gap-1 border border-blue-200 transition-colors shadow-2xs"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Inspect</span>
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* PAGE 3: BIKES & STOCK FLEET */}
        {activePage === 'bike_and_stock' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col gap-6" id="admin-bikes-page">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Dealership Bike Fleet & Stock Catalog
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Add, edit pricing, upload bike photos directly from your device, and configure weekly terms.
                </p>
              </div>

              <button
                type="button"
                onClick={startAddNewBike}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Motorbike Model</span>
              </button>
            </div>

            {/* Bike Cards Grid */}
            {bikes.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Motorbike Models in Database</h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Your bike catalog is clean and empty. Click the button below to add your first motorbike model and configure its weekly rental pricing.
                </p>
                <button
                  type="button"
                  onClick={startAddNewBike}
                  className="mt-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Motorbike Model</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bikes.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="relative h-48 bg-slate-950 overflow-hidden">
                      <img
                        src={b.image}
                        alt={b.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white text-blue-700 border border-blue-100 shadow-xs">
                          {b.brand}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          b.isAvailable ? 'bg-emerald-500 text-white' : 'bg-slate-500 text-white'
                        }`}>
                          {b.isAvailable ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black text-slate-900">{b.name}</h3>
                        <p className="text-xs text-slate-500">{b.subtitle}</p>

                        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-slate-500 block">Brand New:</span>
                            <strong className="text-blue-600 font-mono">
                              R{b.pricing.new.weeklyPayment}/wk · R{b.pricing.new.deposit} dep
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Pre-Owned:</span>
                            <strong className="text-cyan-700 font-mono">
                              R{b.pricing.used.weeklyPayment}/wk · R{b.pricing.used.deposit} dep
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBike(b);
                            setIsNewBikeModal(false);
                            setBikeImageMode('upload');
                          }}
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Bike / Pricing</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteBike(b.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete bike"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAGE 4: DRIVER MANAGEMENT (Directory, Approved Customers, Risk Registry, Referrals) */}
        {(activePage === 'drivers' || activePage === 'approved_customers' || activePage === 'driver_risk_registry' || activePage === 'referrals') && (
          <DriverManagementView
            drivers={driversState}
            agreements={agreementsState}
            referrals={referralsState}
            vehicles={vehiclesState}
            applications={applications}
            services={servicesState}
            parts={partsState}
            activeSubTab={
              activePage === 'driver_risk_registry' 
                ? 'risk_registry' 
                : activePage === 'referrals' 
                ? 'referrals' 
                : 'directory'
            }
            onUpdateDriver={handleUpdateDriver}
            onAddDriver={handleAddDriver}
            onDeleteDriver={handleDeleteDriver}
            onChangeBike={handleChangeDriverBike}
            onRemoveBike={handleRemoveDriverBike}
            onAddReferral={(newRef) => {
              setReferralsState((prev) => {
                const next = [newRef, ...prev.filter((r) => r.id !== newRef.id)];
                saveFleetReferrals(next);
                return next;
              });
            }}
            onUpdateReferral={(updatedRef) => {
              setReferralsState((prev) => {
                const exists = prev.some((r) => r.id === updatedRef.id);
                const next = exists
                  ? prev.map((r) => (r.id === updatedRef.id ? updatedRef : r))
                  : [updatedRef, ...prev];
                saveFleetReferrals(next);
                return next;
              });
            }}
            onDeleteReferral={(refId) => {
              setReferralsState((prev) => {
                const next = prev.filter((r) => r.id !== refId);
                saveFleetReferrals(next);
                deleteFleetReferral(refId);
                return next;
              });
            }}
            onOpenYocoPaymentForDriver={(driver) => {
              setSelectedDriverForYocoPayment(driver);
              setActivePage('paystack_collections');
            }}
            onRiskEntriesChange={(updated) => {
              setRiskEntriesState(updated);
            }}
          />
        )}

        {/* PAGE 5: VEHICLE MANAGEMENT (Register, Live Tracking, Parts, Repairs, Traffic Fines) */}
        {(activePage === 'vehicles' || activePage === 'vehicle_register' || activePage === 'live_tracking' || activePage === 'parts_inventory' || activePage === 'repairs_services' || activePage === 'traffic_fines') && (
          <VehicleManagementView
            vehicles={vehiclesState}
            parts={partsState}
            services={servicesState}
            fines={finesState}
            drivers={driversState}
            activeSubTab={
              activePage === 'live_tracking'
                ? 'live_telematics'
                : activePage === 'parts_inventory'
                ? 'parts_inventory'
                : activePage === 'repairs_services'
                ? 'repairs_service'
                : activePage === 'traffic_fines'
                ? 'traffic_fines'
                : 'register'
            }
            onUpdateVehicle={handleUpdateVehicle}
            onAddVehicle={handleAddVehicle}
            onUpdateDriver={handleUpdateDriver}
            onUpdatePart={(updatedPart) => {
              const next = partsState.map((p) => (p.id === updatedPart.id ? updatedPart : p));
              setPartsState(next);
              saveFleetParts(next);
            }}
            onAddPart={(newPart) => {
              const next = [newPart, ...partsState];
              setPartsState(next);
              saveFleetParts(next);
            }}
            onDeletePart={(partId) => {
              const next = partsState.filter((p) => p.id !== partId);
              setPartsState(next);
              saveFleetParts(next);
              deleteFleetPart(partId);
            }}
            onAddService={(newSrv) => {
              setServicesState((prev) => {
                const next = [newSrv, ...prev];
                saveFleetServices(next);
                return next;
              });
            }}
            onUpdateFine={(updatedFine) => {
              setFinesState((prev) => {
                const next = prev.map((f) => (f.id === updatedFine.id ? updatedFine : f));
                saveFleetFines(next);
                return next;
              });
            }}
            onAddFine={(newFine) => {
              setFinesState((prev) => {
                const next = [newFine, ...prev];
                saveFleetFines(next);
                return next;
              });
            }}
          />
        )}

        {/* PAGE 6: FLEET MANAGEMENT (Rental Options, Rental Agreements, Sales Agreements, Bank Reconciliation, Paystack/Yoco) */}
        {(activePage === 'financials_yoco' || activePage === 'paystack_collections' || activePage === 'rental_options' || activePage === 'rental_agreements' || activePage === 'sales_agreements' || activePage === 'bank_reconciliation') && (
          <FleetFinancialsView
            drivers={driversState}
            agreements={agreementsState}
            transactions={transactionsState}
            vehicles={vehiclesState}
            yocoSettings={yocoSettingsState}
            activeSubTab={
              activePage === 'rental_options'
                ? 'rental_options'
                : activePage === 'rental_agreements'
                ? 'agreements'
                : activePage === 'sales_agreements'
                ? 'sales_agreements'
                : activePage === 'bank_reconciliation'
                ? 'bank_reconciliation'
                : 'yoco_hub'
            }
            onUpdateDriver={handleUpdateDriver}
            onAddTransaction={handleAddTransaction}
            onUpdateYocoSettings={handleUpdateYocoSettings}
            initialSelectedDriverForPayment={selectedDriverForYocoPayment}
          />
        )}

        {/* PAGE 7: REPORTS & FLEET INTELLIGENCE */}
        {activePage === 'reports' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col gap-6" id="admin-reports-page">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Fleet Analytics & Executive Reports</h2>
                <p className="text-xs text-slate-500 mt-1">Real-time operational metrics, maintenance expenses, revenue recovery, risk distribution, and referral performance.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Applications (.CSV)</span>
                </button>
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-cyan-50/70 border border-cyan-200">
                <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider block">Total Collections Logged</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  R{transactionsState.reduce((sum, tx) => sum + (tx.amountZar || 0), 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-cyan-700 font-semibold mt-1 block">
                  {transactionsState.length} verified payment transactions
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Active Fleet Deployment</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {vehiclesState.length > 0 ? Math.round((vehiclesState.filter(v => v.status === 'assigned' || Boolean(v.assignedDriverId)).length / vehiclesState.length) * 100) : 0}%
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                  {vehiclesState.filter(v => v.status === 'assigned' || Boolean(v.assignedDriverId)).length} of {vehiclesState.length} motorbikes deployed
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Outstanding Arrears</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  R{driversState.reduce((sum, d) => sum + (d.balanceDue > 0 ? d.balanceDue : 0), 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  {driversState.filter(d => (d.balanceDue || 0) > 0).length} drivers with overdue balance
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/70 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Total Security Deposits</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  R{driversState.reduce((sum, d) => sum + (d.depositPaid || 0), 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-purple-700 font-semibold mt-1 block">
                  R{transactionsState.filter(tx => tx.allocation === 'deposit').reduce((sum, tx) => sum + (tx.amountZar || 0), 0).toLocaleString()} recorded via payment hub
                </span>
              </div>
            </div>

            {/* Detailed System Metrics Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Vehicle Fleet Status */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Vehicle Fleet Status</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="font-bold text-emerald-700">🟢 Active on Road</span>
                      <span className="font-black text-slate-900">{vehiclesState.filter(v => v.status === 'assigned' || Boolean(v.assignedDriverId)).length} Bikes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="font-bold text-blue-700">🔵 Available in Hub</span>
                      <span className="font-black text-slate-900">{vehiclesState.filter(v => v.status === 'in_stock' || (!v.assignedDriverId && v.status !== 'in_maintenance' && v.status !== 'impounded' && v.status !== 'decommissioned')).length} Bikes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="font-bold text-amber-700">🟡 In Workshop / Maintenance</span>
                      <span className="font-black text-slate-900">{vehiclesState.filter(v => v.status === 'in_maintenance').length} Bikes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="font-bold text-rose-700">🔴 Decommissioned / Impounded</span>
                      <span className="font-black text-slate-900">{vehiclesState.filter(v => v.status === 'decommissioned' || v.status === 'impounded').length} Bikes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Maintenance & Workshop Expenses */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Maintenance & Workshop Costs</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-bold">Total Repair Orders</span>
                      <span className="font-black text-slate-900">{servicesState.length} logged</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-bold">Cumulative Service Spend</span>
                      <span className="font-black text-rose-600">R{servicesState.reduce((sum, s) => sum + (s.costZar || 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-bold">Parts Inventory Asset Value</span>
                      <span className="font-black text-slate-900">R{partsState.reduce((sum, p) => sum + ((p.costPriceZar || 0) * (p.quantityInStock || 0)), 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-bold">Traffic Fines Incurred</span>
                      <span className="font-black text-amber-600">R{finesState.reduce((sum, f) => sum + (f.amountZar || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Risk & Referral System */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">Drivers & Referrals Program</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="font-bold text-emerald-700">Active Drivers Registered</span>
                      <span className="font-black text-slate-900">{driversState.length} Drivers</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="font-bold text-rose-700">Flagged Risk / Suspended</span>
                      <span className="font-black text-slate-900">{driversState.filter(d => d.riskTier === 'critical' || d.riskTier === 'high' || d.status === 'suspended').length} Drivers</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-bold">Total Referrals Logged</span>
                      <span className="font-black text-slate-900">{referralsState.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-2.5 bg-white rounded-xl border border-slate-100">
                      <span className="text-slate-700 font-bold">Referral Payouts Earned</span>
                      <span className="font-black text-cyan-700">R{referralsState.reduce((sum, r) => sum + (r.rewardAmountZar || 0), 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT / ADD BIKE WITH DEVICE IMAGE UPLOAD */}
      {/* ------------------------------------------------------------- */}
      {editingBike && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveBikeSubmit} className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-slate-900">
                {isNewBikeModal ? 'Add New Motorbike to Fleet' : `Edit ${editingBike.name}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBike(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Bike Model Name *</label>
                <input
                  type="text"
                  value={editingBike.name}
                  onChange={(e) => setEditingBike({ ...editingBike, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Brand *</label>
                <input
                  type="text"
                  value={editingBike.brand}
                  onChange={(e) => setEditingBike({ ...editingBike, brand: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Weekly Rate (Brand New) R/wk</label>
                <input
                  type="number"
                  value={editingBike.pricing.new.weeklyPayment}
                  onChange={(e) =>
                    setEditingBike({
                      ...editingBike,
                      pricing: {
                        ...editingBike.pricing,
                        new: { ...editingBike.pricing.new, weeklyPayment: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contract Deposit (Brand New) R</label>
                <input
                  type="number"
                  value={editingBike.pricing.new.deposit}
                  onChange={(e) =>
                    setEditingBike({
                      ...editingBike,
                      pricing: {
                        ...editingBike.pricing,
                        new: { ...editingBike.pricing.new, deposit: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Weekly Rate (Pre-Owned) R/wk</label>
                <input
                  type="number"
                  value={editingBike.pricing.used.weeklyPayment}
                  onChange={(e) =>
                    setEditingBike({
                      ...editingBike,
                      pricing: {
                        ...editingBike.pricing,
                        used: { ...editingBike.pricing.used, weeklyPayment: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Contract Deposit (Pre-Owned) R</label>
                <input
                  type="number"
                  value={editingBike.pricing.used.deposit}
                  onChange={(e) =>
                    setEditingBike({
                      ...editingBike,
                      pricing: {
                        ...editingBike.pricing,
                        used: { ...editingBike.pricing.used, deposit: Number(e.target.value) },
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none font-mono"
                />
              </div>

              {/* Enhanced Bike Image Selector with Device Upload */}
              <div className="sm:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block">
                    Motorbike Photo (Upload from Device / URL)
                  </label>
                  <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBikeImageMode('upload')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        bikeImageMode === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      From Device
                    </button>
                    <button
                      type="button"
                      onClick={() => setBikeImageMode('url')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        bikeImageMode === 'url' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {/* Device File Upload Area */}
                {bikeImageMode === 'upload' && (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                      ref={bikeFileInputRef}
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleDeviceImageUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploadingBikeImg}
                      onClick={() => bikeFileInputRef.current?.click()}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 disabled:opacity-50 text-blue-700 border-2 border-dashed border-blue-300 font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      {isUploadingBikeImg ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                          <span>Optimizing Photo...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Choose Photo from Device</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WEBP up to 5MB.
                    </span>
                  </div>
                )}

                {/* Web URL Mode */}
                {bikeImageMode === 'url' && (
                  <input
                    type="text"
                    value={editingBike.image}
                    onChange={(e) => setEditingBike({ ...editingBike, image: e.target.value })}
                    placeholder="https://example.com/bike-photo.jpg"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none bg-white font-mono text-xs"
                  />
                )}

                {/* Image Live Preview */}
                {editingBike.image && (
                  <div className="relative h-32 rounded-xl overflow-hidden border border-slate-300 bg-slate-950 flex items-center justify-center">
                    <img
                      src={editingBike.image}
                      alt="Bike Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                      Live Preview
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingBike.isAvailable}
                    onChange={(e) => setEditingBike({ ...editingBike, isAvailable: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span className="font-bold text-slate-800">In Stock & Available for Application</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setEditingBike(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
              >
                Save Bike Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DOCUMENT LIGHTBOX MODAL */}
      {activeDocImage && (
        <div
          onClick={() => setActiveDocImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-300 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">{activeDocImage.title}</h3>
              <button
                type="button"
                onClick={() => setActiveDocImage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 flex items-center justify-center bg-slate-950 overflow-auto">
              <img src={activeDocImage.url} alt={activeDocImage.title} className="max-h-[75vh] max-w-full object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* CONTRACT MODAL */}
      {contractApp && (
        <ContractModal
          application={contractApp}
          onClose={() => setContractApp(null)}
        />
      )}

      {/* WALK-IN APPLICANT MODAL */}
      <WalkInApplicantModal
        isOpen={isWalkinModalOpen}
        onClose={() => setIsWalkinModalOpen(false)}
        bikes={bikes}
        onSubmit={handleWalkInSubmit}
      />

      {/* DELIVERED PIPELINE & MOTORBIKE ASSIGNMENT MODAL */}
      <DeliverAndAssignModal
        isOpen={!!assigningDeliveryApp}
        application={assigningDeliveryApp}
        vehicles={vehiclesState}
        onClose={() => setAssigningDeliveryApp(null)}
        onConfirmAssignment={handleConfirmDeliveryAndAssignment}
      />

      {/* SUPABASE DATABASE CONFIG MODAL */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onDataRefreshed={reloadAllFleetFromDb}
      />

      {/* CONFIRM DELETE APPLICANT MODAL (WITH CASCADING DRIVER & BIKE CLEANUP) */}
      {confirmDeleteApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-900">
                  Delete Applicant Record
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ref: <strong className="font-mono text-slate-800">{confirmDeleteApp.refNumber}</strong> • {confirmDeleteApp.fullName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmDeleteApp(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {confirmDeleteApp.status === 'contract_signed' ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col gap-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cascading Deletion & Inventory Return</span>
                </div>
                <p className="leading-relaxed">
                  This applicant is currently marked as <strong>Delivered</strong>. Deleting this application will:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-amber-900">
                  <li>Permanently remove their active profile from <strong>Approved Customers</strong></li>
                  <li>Automatically free up any assigned motorbike (Vin/Plate: <span className="font-mono font-bold">{confirmDeleteApp.assignedBikeVinOrPlate || 'Assigned Bike'}</span>) and return it to <strong>Available</strong> stock</li>
                  <li>Cancel active lease agreements associated with this record</li>
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete the application for <strong>{confirmDeleteApp.fullName}</strong>? This action will remove all submitted documents, KYC vetting checks, and cannot be undone.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmDeleteApp(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const appId = confirmDeleteApp.id;
                  setConfirmDeleteApp(null);
                  await handleDeleteApplicationWithCascade(appId);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Application</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEDICATED DRIVER FINANCE MODAL */}
      {selectedFinanceDriver && (
        <DriverFinanceModal
          driver={selectedFinanceDriver}
          transactions={transactionsState}
          onClose={() => setSelectedFinanceDriver(null)}
          onUpdateDriver={handleUpdateDriver}
          onAddTransaction={handleAddTransaction}
        />
      )}

      {/* QUICK RECORD PAYMENT MODAL */}
      {isQuickRecordPaymentOpen && (
        <div
          onClick={() => setIsQuickRecordPaymentOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 my-auto"
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Record Payment</h3>
                  <p className="text-xs text-slate-500">Capture Manual EFT, Cash, or Card Payment with POP</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickRecordPaymentOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetDriver = driversState.find((d) => d.id === quickPayDriverId) || driversState[0];
                if (!targetDriver) {
                  alert('Please select a driver to allocate the payment.');
                  return;
                }
                const amt = Number(quickPayAmount) || 0;
                if (amt <= 0) {
                  alert('Please enter a valid payment amount.');
                  return;
                }

                const newTx: YocoTransaction = {
                  id: `tx-${Date.now()}`,
                  yocoChargeId: `MANUAL-${Date.now().toString().slice(-6)}`,
                  driverId: targetDriver.id,
                  driverName: targetDriver.fullName,
                  amountZar: amt,
                  currency: 'ZAR',
                  status: 'successful',
                  paymentMethod: (quickPayMethod as any) || 'manual_eft',
                  allocation: (quickPayAllocation as any) || 'weekly_rental',
                  yocoFeeZar: 0,
                  netAmountZar: amt,
                  reconciliationStatus: 'reconciled',
                  transactionDate: new Date().toISOString(),
                  notes: quickPayNotes || 'Manually captured via Dashboard Quick Actions',
                  proofOfPaymentUrl: quickPayProofFile || undefined,
                  recordedBy: 'Admin Portal',
                };

                handleAddTransaction(newTx);

                // Update driver balance / deposit
                const currentBal = targetDriver.balanceDue || 0;
                let newBal = currentBal;
                let newDeposit = targetDriver.depositPaid || 0;

                if (quickPayAllocation === 'weekly_rental' || (quickPayAllocation as string) === 'weekly_installment') {
                  newBal = Math.max(0, currentBal - amt);
                } else if (quickPayAllocation === 'security_deposit' || (quickPayAllocation as string) === 'deposit') {
                  newDeposit += amt;
                }

                const updatedDriver: Driver = {
                  ...targetDriver,
                  balanceDue: newBal,
                  depositPaid: newDeposit,
                  totalPaid: (targetDriver.totalPaid || 0) + amt,
                  status: newBal <= 0 ? 'active' : targetDriver.status,
                };

                handleUpdateDriver(updatedDriver);

                // Reset & Close
                setQuickPayNotes('');
                setQuickPayProofFile(null);
                setQuickPayProofFileName('');
                setIsQuickRecordPaymentOpen(false);
              }}
              className="space-y-4 text-xs"
            >
              {/* Select Driver */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Approved Customer / Driver</label>
                <select
                  value={quickPayDriverId}
                  onChange={(e) => {
                    setQuickPayDriverId(e.target.value);
                    const d = driversState.find((drv) => drv.id === e.target.value);
                    if (d && d.weeklyRate) {
                      setQuickPayAmount(d.weeklyRate);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold outline-none focus:border-amber-500"
                  required
                >
                  <option value="">-- Select Customer --</option>
                  {driversState.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} (Bike: {d.assignedVehiclePlate || 'None'}) - Due: R{d.balanceDue || 0}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount (ZAR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={quickPayAmount}
                      onChange={(e) => setQuickPayAmount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white font-mono font-bold text-slate-900 outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                  <select
                    value={quickPayMethod}
                    onChange={(e: any) => setQuickPayMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-amber-500"
                  >
                    <option value="manual_eft">Instant EFT</option>
                    <option value="cash">Cash Received</option>
                    <option value="card_present">Card POS (Physical)</option>
                    <option value="yoco_app">Yoco Gateway</option>
                    <option value="debit_order">Debit Order</option>
                  </select>
                </div>
              </div>

              {/* Allocation */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Allocation</label>
                <select
                  value={quickPayAllocation}
                  onChange={(e: any) => setQuickPayAllocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 outline-none focus:border-amber-500"
                >
                  <option value="weekly_installment">Weekly Rent-to-Own Installment (Tue-Thu)</option>
                  <option value="deposit">Deposit Payment</option>
                  <option value="repair">Workshop / Repair Cost</option>
                  <option value="fine">Traffic Fine Settlement</option>
                  <option value="tracker">Tracker / Security Fee</option>
                  <option value="unallocated">Unallocated / Advance Credit</option>
                </select>
              </div>

              {/* Proof of Payment Upload */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Upload Proof of Payment (POP)</label>
                <input
                  ref={quickPayFileRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setIsQuickPayUploading(true);
                    try {
                      const base64 = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
                      setQuickPayProofFile(base64);
                      setQuickPayProofFileName(file.name);
                    } catch (err: any) {
                      console.error('POP upload error:', err);
                      alert('Could not process document file.');
                    } finally {
                      setIsQuickPayUploading(false);
                      if (quickPayFileRef.current) quickPayFileRef.current.value = '';
                    }
                  }}
                />

                {quickPayProofFile ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{quickPayProofFileName || 'Proof of Payment Attached'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuickPayProofFile(null);
                        setQuickPayProofFileName('');
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isQuickPayUploading}
                    onClick={() => quickPayFileRef.current?.click()}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/40 text-slate-600 hover:text-amber-900 transition-colors flex items-center justify-center gap-2 font-bold"
                  >
                    {isQuickPayUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    ) : (
                      <Upload className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{isQuickPayUploading ? 'Processing File...' : 'Attach POP Slip / Bank Receipt (Optional)'}</span>
                  </button>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes / Internal Reference</label>
                <input
                  type="text"
                  value={quickPayNotes}
                  onChange={(e) => setQuickPayNotes(e.target.value)}
                  placeholder="e.g. Capitec EFT ref #82910 - Week 4 payment"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickRecordPaymentOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Log & Reconcile Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLICANT DETAIL INSPECTOR MODAL */}
      <ApplicantDetailModal
        application={inspectingApp}
        isOpen={!!inspectingApp}
        onClose={() => setInspectingAppId(null)}
        onMoveStatus={handleMoveStatus}
        onToggleChecklist={handleChecklistToggle}
        onUpdateApplication={onUpdateApplication}
        onOpenContract={(app) => setContractApp(app)}
        onDeleteApp={(app) => setConfirmDeleteApp(app)}
        onPreviewDoc={(doc) => setActiveDocImage(doc)}
        onSendApprovalWhatsApp={sendApprovalWhatsApp}
        onSendMissingTRNWhatsApp={sendMissingTRNWhatsApp}
      />
    </div>
  );
};
