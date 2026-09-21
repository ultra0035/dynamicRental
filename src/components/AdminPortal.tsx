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
import { DriverManagementView } from './fleet/DriverManagementView';
import { VehicleManagementView } from './fleet/VehicleManagementView';
import { FleetFinancialsView } from './fleet/FleetFinancialsView';
import { DeliverAndAssignModal } from './fleet/DeliverAndAssignModal';
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
  onCloseAdmin,
}) => {
  // Sidebar active page state: 'dashboard' | 'applicant' | 'bike_and_stock'
  const [activePage, setActivePage] = useState<AdminPage>('applicant');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Walk-in modal state
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState<boolean>(false);

  // Application Pipeline View Mode: 'board' (Kanban) or 'list' (Master-Detail)
  const [pipelineViewMode, setPipelineViewMode] = useState<'board' | 'list'>('board');

  // Applications Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [citizenshipFilter, setCitizenshipFilter] = useState<string>('all');
  const [selectedAppId, setSelectedAppId] = useState<string>(applications[0]?.id || '');
  
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

  // Selected Application
  const activeApp = applications.find((a) => a.id === selectedAppId) || applications[0] || null;

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
    key: 'idVerified' | 'licenseVerified' | 'workPermitVerified' | 'trafficRegisterVerified'
  ) => {
    if (!activeApp) return;
    const newVerification = {
      ...activeApp.verification,
      [key]: !activeApp.verification[key],
    };
    const updated: RiderApplication = {
      ...activeApp,
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

    if (selectedAppId === appId) {
      const remaining = applications.filter((a) => a.id !== appId);
      setSelectedAppId(remaining[0]?.id || '');
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
    setSelectedAppId(newApp.id);
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
      {/* SIDEBAR NAVIGATION (FleetCO / Dynamic Rental) */}
      {/* ------------------------------------------------------------- */}
      <aside className="w-full md:w-64 lg:w-72 bg-slate-900 text-white flex-shrink-0 flex flex-col border-r border-slate-800 shadow-xl z-20">
        {/* Sidebar Header / Brand */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <ShieldCheck className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                FleetCO <span className="text-[10px] font-normal text-cyan-400">· Dynamic Rental</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
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
              onClick={() => alert("FleetCO Help: Quick shortcuts: Press Applicants to vet new couriers, Live Tracking to monitor telemetry, or Paystack/Yoco Collections to process instant debit/card collections.")}
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

        {/* PAGE: DASHBOARD OVERVIEW (Matching Screenshot) */}
        {activePage === 'dashboard' && (
          <div className="flex flex-col gap-6" id="admin-dashboard-page">
            {/* Sub-Header: Date and Customise */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold">
                <span>{new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5 w-fit"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Customise</span>
              </button>
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
                        FINISH SETTING UP FLEETCO
                      </h2>
                    </div>
                    <p className="text-xs text-slate-300">
                      5 of 6 core steps done · ~1 minutes remaining
                    </p>
                    {/* Progress bar (83%) */}
                    <div className="w-full max-w-md bg-slate-800 rounded-full h-2 overflow-hidden mt-2">
                      <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: '83%' }} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsSetupBannerVisible(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      Remind Me Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePage('settings')}
                      className="px-5 py-2 rounded-xl text-xs font-black bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-md"
                    >
                      Resume
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TODAY'S PRIORITIES (5 Vibrant Cards from Screenshot) */}
            <div>
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                TODAY'S PRIORITIES
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {/* 1. Red Card: Overdue Payments */}
                <div className="bg-white rounded-2xl border-2 border-rose-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-2xl font-black text-rose-600">
                      {driversState.filter((d) => d.balanceDue > 0).length}
                    </div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                      OVERDUE PAYMENTS
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('paystack_collections')}
                    className="mt-4 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors w-fit border border-rose-200"
                  >
                    Collect Now
                  </button>
                </div>

                {/* 2. Mint Green Card: New Applicants */}
                <div className="bg-white rounded-2xl border-2 border-emerald-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-2xl font-black text-emerald-600">
                      {pendingCount}
                    </div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                      NEW APPLICANTS
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('applicants')}
                    className="mt-4 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-colors w-fit border border-emerald-200"
                  >
                    Review
                  </button>
                </div>

                {/* 3. Yellow/Gold Card: Vehicles in Maintenance */}
                <div className="bg-white rounded-2xl border-2 border-amber-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-2xl font-black text-amber-600">
                      {vehiclesState.filter((v) => v.status === 'in_maintenance' || v.status === 'repair_needed').length}
                    </div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                      VEHICLES IN MAINTENANCE
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('repairs_services')}
                    className="mt-4 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition-colors w-fit border border-amber-200"
                  >
                    Check Status
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
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('applicants')}
                    className="mt-4 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 rounded-xl text-xs font-bold transition-colors w-fit border border-cyan-200"
                  >
                    Follow Up
                  </button>
                </div>

                {/* 5. Dark / Charcoal Card: Referrals Owed */}
                <div className="bg-white rounded-2xl border-2 border-slate-400/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                  <div>
                    <div className="text-2xl font-black text-slate-800">
                      {referralsState.filter((r) => r.payoutStatus === 'pending_payout').length}
                    </div>
                    <div className="text-xs font-black text-slate-900 uppercase mt-0.5 tracking-tight">
                      REFERRALS OWED
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('referrals')}
                    className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors w-fit border border-slate-300"
                  >
                    Pay Out
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
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-cyan-600" />
                  <span>+ Add Customer</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActivePage('bike_and_stock');
                    startAddNewBike();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <BikeIcon className="w-4 h-4 text-emerald-600" />
                  <span>Add Vehicle</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePage('paystack_collections')}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>Record Payment</span>
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
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Create New Document</span>
                </button>
              </div>
            </div>

            {/* Split Dashboard: NEEDS ATTENTION & REVENUE TREND */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Card: NEEDS ATTENTION */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    NEEDS ATTENTION
                  </h3>
                  
                  {/* Filter Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
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
                <div className="space-y-3 mt-1">
                  {/* Overdue items */}
                  {driversState
                    .filter((d) => d.balanceDue > 0)
                    .slice(0, 3)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between hover:bg-rose-100/70 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{d.fullName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                              Overdue R{d.balanceDue.toFixed(2)}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Bike: {d.assignedVehiclePlate || 'None'} · Contact: {d.phone}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDriverForYocoPayment(d);
                            setActivePage('paystack_collections');
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-2xs"
                        >
                          Collect
                        </button>
                      </div>
                    ))}

                  {/* Pending applications */}
                  {applications
                    .filter((a) => a.status === 'pending_review' || a.status === 'needs_more_info')
                    .slice(0, 3)
                    .map((a) => (
                      <div
                        key={a.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">{a.fullName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800">
                              {a.status === 'needs_more_info' ? 'Missing TRN/Docs' : 'Pending Review'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Ref: {a.refNumber} · Chosen: {a.bikeName}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppId(a.id);
                            setActivePage('applicants');
                          }}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                        >
                          Inspect
                        </button>
                      </div>
                    ))}
                </div>
              </div>

              {/* Right Card: REVENUE TREND */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      REVENUE TREND
                    </h3>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      +18.4% this month
                    </span>
                  </div>

                  {/* Summary Metric Chips */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Collected This Month</span>
                      <span className="text-base font-black text-slate-900">
                        R{transactionsState.reduce((sum, tx) => sum + (tx.amountZar || 0), 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Deposits Banked</span>
                      <span className="text-base font-black text-cyan-700">
                        R{transactionsState.filter((tx) => tx.allocation === 'deposit').reduce((sum, tx) => sum + (tx.amountZar || 0), 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Active Deployed</span>
                      <span className="text-base font-black text-emerald-700">
                        {vehiclesState.filter((v) => v.status === 'assigned_active').length} Bikes
                      </span>
                    </div>
                  </div>

                  {/* SVG Line Graph */}
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

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>Target: R250,000 / month</span>
                  <span className="font-bold text-slate-800">74% Target Achieved</span>
                </div>
              </div>
            </div>
          </div>
        )}

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
                {/* Pipeline View Mode Switcher */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPipelineViewMode('board')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      pipelineViewMode === 'board'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Kanban Board View - Move drivers across stages"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Pipeline Board</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPipelineViewMode('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      pipelineViewMode === 'list'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Master Detail Inspector View"
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>List & Inspector</span>
                  </button>
                </div>

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

            {/* VIEW MODE 1: KANBAN STAGE PIPELINE BOARD */}
            {pipelineViewMode === 'board' && (
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
                                    onClick={() => {
                                      setSelectedAppId(app.id);
                                      setPipelineViewMode('list');
                                    }}
                                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                                  >
                                    <span>Inspect</span>
                                    <ChevronRight className="w-3 h-3" />
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
            )}

            {/* VIEW MODE 2: MASTER DETAIL INSPECTOR */}
            {pipelineViewMode === 'list' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Applications List */}
                <div className="lg:col-span-5 flex flex-col gap-3 max-h-[800px] overflow-y-auto pr-1">
                  {filteredApps.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
                      No applications match your filter criteria.
                    </div>
                  ) : (
                    filteredApps.map((app) => {
                      const isSelected = selectedAppId === app.id;
                      const stageConfig = PIPELINE_STAGES.find((s) => s.id === app.status) || PIPELINE_STAGES[0];

                      return (
                        <div
                          key={app.id}
                          onClick={() => setSelectedAppId(app.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2.5 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/70 shadow-md ring-1 ring-blue-400'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-black text-slate-900">{app.fullName}</span>
                                <span className="text-[10px] font-mono text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-200 font-bold">
                                  {app.refNumber}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {app.primaryPlatform} · {app.suburb}
                              </div>
                            </div>

                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${stageConfig.badgeClass}`}>
                              {stageConfig.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/80">
                            <div className="text-slate-600 font-medium">
                              {app.bikeName} ({app.bikeCondition.toUpperCase()})
                            </div>
                            <div className="font-mono font-bold text-blue-600">
                              R{app.weeklyRate}/wk · R{app.depositAmount} dep
                            </div>
                          </div>

                          {/* Fast Quick-Move Status Row */}
                          <div className="flex items-center justify-between gap-1 pt-1">
                            <span className="text-[10px] text-slate-400">
                              {app.citizenship === 'south_african' ? '🇿🇦 SA Citizen' : `🌍 Foreign (${app.nationalityCountry || 'TRN'})`}
                            </span>

                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={app.status}
                                onChange={(e) => handleMoveStatus(app, e.target.value as ApplicationStatus)}
                                className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg px-2 py-1 border border-slate-300 focus:outline-none focus:border-blue-500"
                              >
                                <option value="pending_review">⏳ Pending</option>
                                <option value="needs_more_info">⚠️ Needs TRN</option>
                                <option value="approved_for_collection">✅ Approved</option>
                                <option value="contract_signed">🤝 Delivered</option>
                                <option value="declined">❌ Declined</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Right Column: Application Inspector */}
                {activeApp ? (
                  <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-md flex flex-col gap-6">
                    {/* Inspector Header */}
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-black text-slate-900">{activeApp.fullName}</h2>
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {activeApp.refNumber}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                          <span>Applied: {new Date(activeApp.createdAt).toLocaleString('en-ZA')}</span>
                          <span>•</span>
                          <span>Phone: <strong className="text-slate-800 font-mono">{activeApp.phone}</strong></span>
                        </div>
                      </div>

                      {/* 1-Click WhatsApp Dispatch Triggers */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => sendApprovalWhatsApp(activeApp)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors"
                          title="Send WhatsApp pickup notice"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp Approval</span>
                        </button>

                        {activeApp.citizenship === 'foreign_national' && (
                          <button
                            type="button"
                            onClick={() => sendMissingTRNWhatsApp(activeApp)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center gap-1.5 shadow-xs transition-colors"
                            title="Request mandatory TRN"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Request TRN</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setContractApp(activeApp)}
                          className="p-1.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="View & Print Contract"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setConfirmDeleteApp(activeApp)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                          title="Delete Applicant Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Stage Progression Stepper */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                          Pipeline Stage Tracker:
                        </label>
                        {activeApp.status === 'contract_signed' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2.5 py-0.5 rounded-full">
                            <Lock className="w-3 h-3 text-indigo-600" />
                            Locked in Delivered Stage
                          </span>
                        )}
                      </div>

                      {activeApp.status === 'contract_signed' ? (
                        <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                            <div>
                              <p className="text-xs font-bold text-indigo-950">
                                Handover Complete • Lease Active
                              </p>
                              <p className="text-[11px] text-indigo-700">
                                Driver record is active in the Approved Customers directory. Stage transitions are locked to prevent duplicates.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAppId(null);
                              setActivePage('drivers');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors whitespace-nowrap shadow-xs flex items-center gap-1.5"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Approved Customers →</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {PIPELINE_STAGES.map((st) => {
                            const isCurrent = activeApp.status === st.id;
                            const StageIcon = st.icon;

                            return (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleMoveStatus(activeApp, st.id)}
                                className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center text-center gap-1 border ${
                                  isCurrent
                                    ? `${st.bgClass} ${st.textClass} border-${st.color}-400 ring-2 ring-${st.color}-400 shadow-sm`
                                    : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                                }`}
                              >
                                <StageIcon className="w-4 h-4" />
                                <span className="text-[11px] leading-tight">{st.shortLabel}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Lease Details Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-500 block">Bike Model:</span>
                        <strong className="text-slate-900 text-sm block">{activeApp.bikeName}</strong>
                        <span className="text-[10px] text-blue-600 font-bold uppercase">{activeApp.bikeCondition}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Weekly Rent:</span>
                        <strong className="text-blue-600 text-base font-mono block">R{activeApp.weeklyRate}/wk</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Deposit:</span>
                        <strong className="text-amber-800 text-base font-mono block">R{activeApp.depositAmount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Term Duration:</span>
                        <strong className="text-slate-900 text-sm block">{activeApp.termMonths} Months</strong>
                      </div>
                    </div>

                    {/* Document Verification & Lightbox Section */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Submitted Documents (Click image to zoom)
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {(activeApp.documents.idDocumentFront || activeApp.documents.saIdFront) && (
                          <div
                            onClick={() => setActiveDocImage({ title: 'SA ID (Front)', url: (activeApp.documents.idDocumentFront || activeApp.documents.saIdFront)! })}
                            className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                          >
                            <img src={activeApp.documents.idDocumentFront || activeApp.documents.saIdFront} alt="ID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ZoomIn className="w-4 h-4" /> Zoom
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] font-bold p-1 truncate text-center">
                              SA ID Front
                            </div>
                          </div>
                        )}

                        {activeApp.documents.passport && (
                          <div
                            onClick={() => setActiveDocImage({ title: 'Passport Bio Page', url: activeApp.documents.passport! })}
                            className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                          >
                            <img src={activeApp.documents.passport} alt="Passport" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ZoomIn className="w-4 h-4" /> Zoom
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] font-bold p-1 truncate text-center">
                              Passport Bio
                            </div>
                          </div>
                        )}

                        {(activeApp.documents.asylumDocument || activeApp.documents.workPermit) && (
                          <div
                            onClick={() => setActiveDocImage({ title: 'Asylum / Work Permit', url: (activeApp.documents.asylumDocument || activeApp.documents.workPermit)! })}
                            className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                          >
                            <img src={activeApp.documents.asylumDocument || activeApp.documents.workPermit} alt="Asylum / Work Permit" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ZoomIn className="w-4 h-4" /> Zoom
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] font-bold p-1 truncate text-center">
                              Asylum / Permit
                            </div>
                          </div>
                        )}

                        {(activeApp.documents.driversLicense || activeApp.documents.driversLicenseFront) && (
                          <div
                            onClick={() => setActiveDocImage({ title: "Driver's License", url: (activeApp.documents.driversLicense || activeApp.documents.driversLicenseFront)! })}
                            className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                          >
                            <img src={activeApp.documents.driversLicense || activeApp.documents.driversLicenseFront} alt="Driver License" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ZoomIn className="w-4 h-4" /> Zoom
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] font-bold p-1 truncate text-center">
                              Driver License
                            </div>
                          </div>
                        )}

                        {activeApp.documents.trafficRegisterCertificate && (
                          <div
                            onClick={() => setActiveDocImage({ title: 'Traffic Register (TRN)', url: activeApp.documents.trafficRegisterCertificate! })}
                            className="group relative h-28 rounded-xl border-2 border-amber-400 overflow-hidden bg-amber-50 cursor-pointer shadow-xs"
                          >
                            <img src={activeApp.documents.trafficRegisterCertificate} alt="TRN" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ZoomIn className="w-4 h-4" /> Zoom
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-amber-600 text-white text-[10px] font-bold p-1 truncate text-center">
                              TRN Certificate
                            </div>
                          </div>
                        )}

                        {activeApp.documents.proofOfResidence && (
                          <div
                            onClick={() => setActiveDocImage({ title: 'Proof of Residence', url: activeApp.documents.proofOfResidence! })}
                            className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                          >
                            <img src={activeApp.documents.proofOfResidence} alt="Proof of Residence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                              <ZoomIn className="w-4 h-4" /> Zoom
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] font-bold p-1 truncate text-center">
                              Proof Residence
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Underwriting Verification Checklist */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Staff Underwriting Checklist:
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={activeApp.verification.idVerified}
                            onChange={() => handleChecklistToggle('idVerified')}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="font-semibold text-slate-800">1. ID / Passport Verified</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={activeApp.verification.licenseVerified}
                            onChange={() => handleChecklistToggle('licenseVerified')}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="font-semibold text-slate-800">2. Motorcycle License (Code A/A1)</span>
                        </label>

                        {activeApp.citizenship === 'foreign_national' && (
                          <>
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={activeApp.verification.workPermitVerified}
                                onChange={() => handleChecklistToggle('workPermitVerified')}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              <span className="font-semibold text-slate-800">3. Valid Work Permit / Asylum</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-amber-50 border border-amber-300 hover:bg-amber-100/60">
                              <input
                                type="checkbox"
                                checked={activeApp.verification.trafficRegisterVerified}
                                onChange={() => handleChecklistToggle('trafficRegisterVerified')}
                                className="w-4 h-4 text-amber-600 rounded"
                              />
                              <span className="font-bold text-amber-900">4. Traffic Register Certificate (TRN)</span>
                            </label>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Application Timeline Audit Log */}
                    {activeApp.timeline && activeApp.timeline.length > 0 && (
                      <div className="border-t border-slate-200 pt-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                          Status History & Audit Trail:
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto text-xs">
                          {activeApp.timeline.map((entry, idx) => (
                            <div key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                              <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-bold text-slate-800">{entry.title}</div>
                                <div className="text-[11px] text-slate-500">{entry.description}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                  {new Date(entry.timestamp).toLocaleString('en-ZA')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="lg:col-span-7 bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center gap-3 min-h-[350px]">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="font-bold text-slate-800 text-sm">
                      {applications.length === 0 ? 'No Applications in Database' : 'No Applicant Selected'}
                    </div>
                    <p className="text-xs text-slate-500 max-w-sm">
                      {applications.length === 0
                        ? 'There are currently 0 applications in the database. When riders apply online or visit your showroom, their records will display here.'
                        : 'Select an applicant from the list on the left to inspect documents, manage stage, and trigger WhatsApp notices.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsWalkinModalOpen(true)}
                      className="mt-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Register Walk-in Applicant</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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
    </div>
  );
};
