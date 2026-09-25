import React, { useState, useEffect } from 'react';
import { 
  Driver, 
  DriverReferral, 
  DriverRiskTier, 
  DriverStatus, 
  Vehicle, 
  RiderApplication, 
  RentalAgreement,
  FlaggedRiskEntry,
  FlaggedReasonCategory,
  RepairAndService,
  PartsInventoryItem
} from '../../types';
import { DriverDetailModal } from './DriverDetailModal';
import { DriverFinanceModal } from './DriverFinanceModal';
import { DriverNotesModal } from './DriverNotesModal';
import { 
  getFlaggedRiskEntries, 
  addFlaggedRiskEntry, 
  updateFlaggedRiskEntry, 
  deleteFlaggedRiskEntry
} from '../../lib/riskStore';
import { saveReferral, saveDriver, fetchDriverNotes } from '../../lib/supabase';
import { 
  Users, 
  ShieldAlert, 
  Gift, 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Bike, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Plus, 
  X, 
  ArrowUpRight, 
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle,
  Eye,
  RefreshCw,
  Trash2,
  Globe,
  Shield,
  ShieldCheck,
  Check,
  Edit2,
  Share2,
  Copy,
  FileWarning,
  ExternalLink,
  Lock,
  UserX,
  UserCheck,
  StickyNote,
  Send
} from 'lucide-react';

export type DriverSubTab = 'directory' | 'risk_registry' | 'referrals';

interface DriverManagementViewProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  referrals: DriverReferral[];
  applications?: RiderApplication[];
  agreements?: RentalAgreement[];
  services?: RepairAndService[];
  parts?: PartsInventoryItem[];
  onUpdateDriver: (driver: Driver) => void;
  onAddDriver: (driver: Driver) => void;
  onDeleteDriver?: (driverId: string) => void;
  onUpdateReferral: (referral: DriverReferral) => void;
  onAddReferral?: (referral: DriverReferral) => void;
  onDeleteReferral?: (referralId: string) => void;
  onOpenYocoPaymentForDriver: (driver: Driver) => void;
  onChangeBike?: (driverId: string, newVehicleId: string) => void;
  onRemoveBike?: (driverId: string) => void;
  activeSubTab?: DriverSubTab;
  onRiskEntriesChange?: (entries: FlaggedRiskEntry[]) => void;
}

export const DriverManagementView: React.FC<DriverManagementViewProps> = ({
  drivers,
  vehicles,
  referrals,
  applications = [],
  agreements = [],
  services = [],
  parts = [],
  onUpdateDriver,
  onAddDriver,
  onDeleteDriver,
  onUpdateReferral,
  onAddReferral,
  onDeleteReferral,
  onOpenYocoPaymentForDriver,
  onChangeBike,
  onRemoveBike,
  activeSubTab,
  onRiskEntriesChange,
}) => {
  const [subTab, setSubTab] = useState<DriverSubTab>(activeSubTab || 'directory');

  React.useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Internal Company Risk Registry State
  const [flaggedEntries, setFlaggedEntries] = useState<FlaggedRiskEntry[]>(() => getFlaggedRiskEntries());
  const [riskStatusFilter, setRiskStatusFilter] = useState<'all' | 'blacklisted' | 'critical_high' | 'active_alerts' | 'resolved'>('all');
  const [riskSearchQuery, setRiskSearchQuery] = useState<string>('');

  // Sync risk entries with parent callback
  const updateRiskEntriesList = (newList: FlaggedRiskEntry[]) => {
    setFlaggedEntries(newList);
    if (onRiskEntriesChange) {
      onRiskEntriesChange(newList);
    }
  };

  // Modals for Risk Management
  const [isAddFlagModalOpen, setIsAddFlagModalOpen] = useState<boolean>(false);
  const [selectedFlagDossier, setSelectedFlagDossier] = useState<FlaggedRiskEntry | null>(null);
  const [editingFlagEntry, setEditingFlagEntry] = useState<FlaggedRiskEntry | null>(null);
  const [selectedActiveDriverToFlag, setSelectedActiveDriverToFlag] = useState<string>('');

  // New Flag Form
  const [newFlagForm, setNewFlagForm] = useState<Partial<FlaggedRiskEntry>>({
    fullName: '',
    idOrPassportNumber: '',
    phone: '',
    whatsappNumber: '',
    nationalityCountry: 'South Africa',
    riskTier: 'critical',
    flagReason: 'severe_payment_default',
    reasonDescription: '',
    outstandingBalanceZar: 0,
    reportedByOperator: 'Dynamic Rental (Randburg Hub)',
    isCrossOperatorShared: false,
    status: 'active_flag',
    policeCaseNumber: '',
    lastKnownAddress: '',
  });

  // Referrals Modal State
  const [isAddReferralOpen, setIsAddReferralOpen] = useState<boolean>(false);
  const [dbNotification, setDbNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [newReferralForm, setNewReferralForm] = useState<Partial<DriverReferral>>({
    referrerDriverId: '',
    referrerDriverName: '',
    referredApplicantName: '',
    referredPhone: '',
    rewardAmountZar: 350,
    status: 'pending_onboarding',
  });

  // Selected Driver for Details Modal (Docs & Bike)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'documents' | 'vehicle' | 'handover_photos' | 'profile' | 'financials'>('documents');

  // Selected Driver for Dedicated Track Finance & Agreements Modal
  const [selectedFinanceDriver, setSelectedFinanceDriver] = useState<Driver | null>(null);

  // Admin Driver Notes Modal State
  const [notesDriver, setNotesDriver] = useState<Driver | null>(null);
  const [notesCountMap, setNotesCountMap] = useState<Record<string, number>>({});

  // Load all driver notes counts on mount or when drivers change
  useEffect(() => {
    let isMounted = true;
    const loadCounts = async () => {
      try {
        const allNotes = await fetchDriverNotes();
        if (isMounted && allNotes) {
          const counts: Record<string, number> = {};
          allNotes.forEach((n) => {
            if (n.driverId) {
              counts[n.driverId] = (counts[n.driverId] || 0) + 1;
            }
          });
          setNotesCountMap(counts);
        }
      } catch (e) {
        // ignore
      }
    };
    loadCounts();
    return () => { isMounted = false; };
  }, [drivers]);

  // Add Incident Modal
  const [incidentDriver, setIncidentDriver] = useState<Driver | null>(null);
  const [incidentDescription, setIncidentDescription] = useState<string>('');
  const [incidentPenaltyScore, setIncidentPenaltyScore] = useState<number>(10);

  // Add Driver Modal
  const [isAddDriverOpen, setIsAddDriverOpen] = useState<boolean>(false);
  const [newDriverForm, setNewDriverForm] = useState<Partial<Driver>>({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    idOrPassportNumber: '',
    citizenship: 'south_african',
    address: '',
    suburb: 'Randburg',
    city: 'Randburg',
    weeklyRate: 750,
    depositPaid: 1000,
    termMonths: 18,
    primaryPlatform: 'Checkers Sixty60',
    riskTier: 'low',
    riskScore: 90,
    paymentScore: 100,
    status: 'active',
  });

  // Filtered Flagged Entries for Internal Company Risk Registry
  const filteredRiskEntries = flaggedEntries.filter((entry) => {
    const q = riskSearchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      entry.fullName.toLowerCase().includes(q) ||
      entry.idOrPassportNumber.toLowerCase().includes(q) ||
      entry.phone.includes(q) ||
      (entry.policeCaseNumber && entry.policeCaseNumber.toLowerCase().includes(q)) ||
      entry.reasonDescription.toLowerCase().includes(q) ||
      entry.flagReason.toLowerCase().includes(q);

    if (!matchQuery) return false;

    if (riskStatusFilter === 'blacklisted') {
      return entry.riskTier === 'critical' || entry.status === 'blacklisted';
    }
    if (riskStatusFilter === 'critical_high') {
      return entry.riskTier === 'critical' || entry.riskTier === 'high';
    }
    if (riskStatusFilter === 'active_alerts') {
      return entry.status !== 'resolved';
    }
    if (riskStatusFilter === 'resolved') {
      return entry.status === 'resolved';
    }

    return true;
  });

  // Handlers for Risk Registry
  const handleOpenAddFlagModal = (prefillDriver?: Driver) => {
    if (prefillDriver) {
      setSelectedActiveDriverToFlag(prefillDriver.id);
      setNewFlagForm({
        fullName: prefillDriver.fullName,
        idOrPassportNumber: prefillDriver.idOrPassportNumber,
        phone: prefillDriver.phone,
        whatsappNumber: prefillDriver.whatsappNumber || prefillDriver.phone,
        nationalityCountry: prefillDriver.citizenship === 'south_african' ? 'South Africa' : 'Foreign National',
        riskTier: prefillDriver.riskTier === 'critical' ? 'critical' : 'high',
        flagReason: prefillDriver.balanceDue > 0 ? 'severe_payment_default' : 'tracker_tampering',
        reasonDescription: prefillDriver.notes || `Driver balance due R${prefillDriver.balanceDue}. Low behavioral safety score (${prefillDriver.riskScore}/100).`,
        outstandingBalanceZar: prefillDriver.balanceDue || 0,
        reportedByOperator: 'Dynamic Rental (Randburg Hub)',
        isCrossOperatorShared: false,
        status: 'active_flag',
        driverId: prefillDriver.id,
        lastKnownAddress: prefillDriver.address || `${prefillDriver.suburb}, ${prefillDriver.city}`,
      });
    } else {
      setSelectedActiveDriverToFlag('');
      setNewFlagForm({
        fullName: '',
        idOrPassportNumber: '',
        phone: '',
        whatsappNumber: '',
        nationalityCountry: 'South Africa',
        riskTier: 'critical',
        flagReason: 'severe_payment_default',
        reasonDescription: '',
        outstandingBalanceZar: 0,
        reportedByOperator: 'Dynamic Rental (Randburg Hub)',
        isCrossOperatorShared: false,
        status: 'active_flag',
        policeCaseNumber: '',
        lastKnownAddress: '',
      });
    }
    setIsAddFlagModalOpen(true);
  };

  const handleSelectActiveDriverChange = (driverId: string) => {
    setSelectedActiveDriverToFlag(driverId);
    if (!driverId) return;
    const found = drivers.find((d) => d.id === driverId);
    if (found) {
      setNewFlagForm((prev) => ({
        ...prev,
        fullName: found.fullName,
        idOrPassportNumber: found.idOrPassportNumber,
        phone: found.phone,
        whatsappNumber: found.whatsappNumber || found.phone,
        nationalityCountry: found.citizenship === 'south_african' ? 'South Africa' : 'Foreign National',
        outstandingBalanceZar: found.balanceDue || 0,
        driverId: found.id,
        lastKnownAddress: found.address || `${found.suburb}, ${found.city}`,
      }));
    }
  };

  const handleSaveFlagEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlagForm.fullName || !newFlagForm.idOrPassportNumber) return;

    if (editingFlagEntry) {
      const updated: FlaggedRiskEntry = {
        ...editingFlagEntry,
        fullName: newFlagForm.fullName || editingFlagEntry.fullName,
        idOrPassportNumber: newFlagForm.idOrPassportNumber || editingFlagEntry.idOrPassportNumber,
        phone: newFlagForm.phone || editingFlagEntry.phone,
        whatsappNumber: newFlagForm.whatsappNumber || editingFlagEntry.whatsappNumber,
        nationalityCountry: newFlagForm.nationalityCountry || editingFlagEntry.nationalityCountry,
        riskTier: newFlagForm.riskTier || editingFlagEntry.riskTier,
        flagReason: newFlagForm.flagReason || editingFlagEntry.flagReason,
        reasonDescription: newFlagForm.reasonDescription || editingFlagEntry.reasonDescription,
        outstandingBalanceZar: Number(newFlagForm.outstandingBalanceZar) || 0,
        reportedByOperator: newFlagForm.reportedByOperator || editingFlagEntry.reportedByOperator,
        isCrossOperatorShared: false,
        status: newFlagForm.status || editingFlagEntry.status,
        policeCaseNumber: newFlagForm.policeCaseNumber || editingFlagEntry.policeCaseNumber,
        lastKnownAddress: newFlagForm.lastKnownAddress || editingFlagEntry.lastKnownAddress,
      };
      const list = updateFlaggedRiskEntry(updated);
      updateRiskEntriesList(list);
      setEditingFlagEntry(null);
    } else {
      const newEntry: FlaggedRiskEntry = {
        id: `risk-flag-${Date.now()}`,
        fullName: newFlagForm.fullName || '',
        idOrPassportNumber: newFlagForm.idOrPassportNumber || '',
        phone: newFlagForm.phone || '',
        whatsappNumber: newFlagForm.whatsappNumber || newFlagForm.phone || '',
        nationalityCountry: newFlagForm.nationalityCountry || 'South Africa',
        riskTier: newFlagForm.riskTier || 'critical',
        flagReason: newFlagForm.flagReason || 'severe_payment_default',
        reasonDescription: newFlagForm.reasonDescription || 'Flagged manually by fleet controller.',
        outstandingBalanceZar: Number(newFlagForm.outstandingBalanceZar) || 0,
        reportedByOperator: newFlagForm.reportedByOperator || 'Dynamic Rental (Randburg Hub)',
        isCrossOperatorShared: false,
        reportedDate: new Date().toISOString().split('T')[0],
        status: newFlagForm.status || (newFlagForm.riskTier === 'critical' ? 'blacklisted' : 'active_flag'),
        policeCaseNumber: newFlagForm.policeCaseNumber,
        driverId: selectedActiveDriverToFlag || undefined,
        lastKnownAddress: newFlagForm.lastKnownAddress,
      };
      const list = addFlaggedRiskEntry(newEntry);
      updateRiskEntriesList(list);

      // If this flag was linked to an active driver, sync their tier & penalty in the fleet
      if (selectedActiveDriverToFlag) {
        const found = drivers.find((d) => d.id === selectedActiveDriverToFlag);
        if (found) {
          const newScore = newEntry.riskTier === 'critical' ? 15 : newEntry.riskTier === 'high' ? 35 : 55;
          onUpdateDriver({
            ...found,
            riskTier: newEntry.riskTier,
            riskScore: newScore,
            status: newEntry.riskTier === 'critical' ? 'suspended' : found.status,
            notes: `${found.notes || ''}\n[FLAGGED ON RISK REGISTRY]: ${newEntry.reasonDescription}`,
          });
        }
      }
    }

    setIsAddFlagModalOpen(false);
  };

  const handleResolveFlag = (entry: FlaggedRiskEntry) => {
    const updated: FlaggedRiskEntry = {
      ...entry,
      status: entry.status === 'resolved' ? 'active_flag' : 'resolved',
    };
    const list = updateFlaggedRiskEntry(updated);
    updateRiskEntriesList(list);
  };

  const handleDeleteFlag = (entryId: string) => {
    if (window.confirm('Remove this record from the Driver Risk Registry?')) {
      const list = deleteFlaggedRiskEntry(entryId);
      updateRiskEntriesList(list);
      if (selectedFlagDossier?.id === entryId) {
        setSelectedFlagDossier(null);
      }
    }
  };

  const handleCreateReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const referrerName = newReferralForm.referrerDriverName?.trim() || 
      drivers.find((d) => d.id === newReferralForm.referrerDriverId)?.fullName || 
      'Active Fleet Courier';

    if (!referrerName || !newReferralForm.referredApplicantName) {
      alert('Please provide both the Referrer Driver and the Referred Applicant Name.');
      return;
    }

    const newRef: DriverReferral = {
      id: `ref-${Date.now()}`,
      referrerDriverId: newReferralForm.referrerDriverId || `ref-driver-${Date.now()}`,
      referrerDriverName: referrerName,
      referredApplicantName: newReferralForm.referredApplicantName.trim(),
      referredPhone: newReferralForm.referredPhone?.trim() || '',
      referralDate: new Date().toISOString().split('T')[0],
      status: (newReferralForm.status as any) || 'pending_onboarding',
      rewardAmountZar: Number(newReferralForm.rewardAmountZar) || 350,
    };

    if (onAddReferral) {
      onAddReferral(newRef);
    } else {
      onUpdateReferral(newRef);
    }

    // Direct persistence to Supabase backend
    try {
      const dbRes = await saveReferral(newRef);
      if (dbRes.success) {
        setDbNotification({
          type: 'success',
          message: `✓ Referral for applicant "${newRef.referredApplicantName}" (Referrer: ${newRef.referrerDriverName}) was successfully saved and synced to Supabase referrals table!`,
        });
      } else {
        setDbNotification({
          type: 'error',
          message: `Referral logged in app, but Supabase reported: ${dbRes.error || 'Sync warning'}`,
        });
      }
    } catch (err: any) {
      console.warn('Direct referral Supabase save err:', err);
      setDbNotification({
        type: 'error',
        message: `Sync error: ${err?.message || 'Database error'}`,
      });
    }

    setIsAddReferralOpen(false);
    setNewReferralForm({
      referrerDriverId: '',
      referrerDriverName: '',
      referredApplicantName: '',
      referredPhone: '',
      rewardAmountZar: 350,
      status: 'pending_onboarding',
    });
  };

  // Filtered Drivers
  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      d.fullName.toLowerCase().includes(q) ||
      d.refNumber.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.assignedBikeVinOrPlate && d.assignedBikeVinOrPlate.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchRisk = riskFilter === 'all' || d.riskTier === riskFilter;

    return matchQuery && matchStatus && matchRisk;
  });

  // Metrics
  const activeCount = drivers.filter((d) => d.status === 'active').length;
  const inArrearsCount = drivers.filter((d) => d.status === 'in_arrears' || d.balanceDue > 0).length;
  const highRiskCount = drivers.filter((d) => d.riskTier === 'high' || d.riskTier === 'critical').length;
  const totalArrearsZar = drivers.reduce((sum, d) => sum + (d.balanceDue > 0 ? d.balanceDue : 0), 0);

  // WhatsApp Handler
  const sendDriverWhatsApp = (driver: Driver, messageType: 'statement' | 'arrears' | 'general') => {
    let text = `Hi ${driver.fullName},\nThis is Dynamic Rental Randburg.\n`;
    if (messageType === 'arrears') {
      text += `\n⚠️ *Payment Reminder:* Your account currently has an overdue balance of *R${driver.balanceDue.toFixed(2)}* for bike *${driver.assignedBikeVinOrPlate || ''}*.\n\nPlease settle via Yoco today to avoid automated tracker immobilization.\nShowroom Hub: 304 Tungsten Rd, Randburg.`;
    } else if (messageType === 'statement') {
      text += `\n📄 *Account Summary:*\n• Assigned Bike: ${driver.assignedBikeName || driver.assignedBikeVinOrPlate}\n• Weekly Rate: R${driver.weeklyRate}/week\n• Current Balance: ${driver.balanceDue <= 0 ? 'R0.00 (Up to date)' : `R${driver.balanceDue.toFixed(2)} (Due)`}\n• Total Paid to Date: R${(driver.totalPaid || 0).toLocaleString()}\n\nThank you for riding safely with Dynamic Rental!`;
    }
    window.open(`https://wa.me/${driver.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Submit Incident Handler
  const handleLogIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDriver) return;

    const newScore = Math.max(10, incidentDriver.riskScore - incidentPenaltyScore);
    const newTier: DriverRiskTier = newScore < 40 ? 'critical' : newScore < 60 ? 'high' : newScore < 80 ? 'medium' : 'low';

    const updated: Driver = {
      ...incidentDriver,
      riskScore: newScore,
      riskTier: newTier,
      incidentCount: (incidentDriver.incidentCount || 0) + 1,
      notes: `${incidentDriver.notes || ''}\n[Incident Logged ${new Date().toLocaleDateString('en-ZA')}]: ${incidentDescription} (-${incidentPenaltyScore} pts)`,
    };

    onUpdateDriver(updated);
    setIncidentDriver(null);
    setIncidentDescription('');
  };

  // Submit New Driver Handler
  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverForm.fullName || !newDriverForm.phone) return;

    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      refNumber: `DRV-${Math.floor(1000 + Math.random() * 9000)}-JHB`,
      fullName: newDriverForm.fullName || '',
      phone: newDriverForm.phone || '',
      whatsappNumber: newDriverForm.whatsappNumber || newDriverForm.phone || '',
      email: newDriverForm.email,
      idOrPassportNumber: newDriverForm.idOrPassportNumber || 'N/A',
      citizenship: newDriverForm.citizenship || 'south_african',
      address: newDriverForm.address || 'Randburg Hub Area',
      suburb: newDriverForm.suburb || 'Randburg',
      city: newDriverForm.city || 'Randburg',
      status: 'active',
      assignedBikeVinOrPlate: newDriverForm.assignedBikeVinOrPlate || 'JH 55 XP GP',
      assignedBikeName: newDriverForm.assignedBikeName || 'Bajaj Boxer 150 HD',
      weeklyRate: Number(newDriverForm.weeklyRate) || 750,
      balanceDue: 0,
      depositPaid: Number(newDriverForm.depositPaid) || 1000,
      contractStartDate: new Date().toISOString().split('T')[0],
      termMonths: Number(newDriverForm.termMonths) || 18,
      primaryPlatform: newDriverForm.primaryPlatform || 'Checkers Sixty60',
      riskTier: 'low',
      riskScore: 90,
      paymentScore: 100,
      incidentCount: 0,
      totalPaid: Number(newDriverForm.depositPaid) || 1000,
    };

    onAddDriver(newDriver);
    setIsAddDriverOpen(false);
  };

  // Dynamic Header based on active subtab
  const getHeaderInfo = () => {
    switch (subTab) {
      case 'risk_registry':
        return {
          tag: 'Driver Risk',
          title: 'Driver Risk Registry & Behavioral Scoring',
          desc: 'Automated risk profiling, telematics safety telemetry, on-time payment scoring, and incident records.',
        };
      case 'referrals':
        return {
          tag: 'Referral Rewards',
          title: 'Driver Referral Program',
          desc: 'Track rider referrals, onboarding milestones, and R350 cash bonus disbursements.',
        };
      default:
        return {
          tag: 'Driver Operations',
          title: 'Approved Customers & Active Drivers Directory',
          desc: 'Active motorcycle couriers, assigned fleet assets, weekly balance ledgers, and KYC profiles.',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
                {headerInfo.tag}
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {headerInfo.title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {headerInfo.desc}
            </p>
          </div>
        </div>

        {/* Quick KPI Row - Context Aware based on subTab */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          {subTab === 'risk_registry' ? (
            <>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Risk Records</span>
                <span className="text-lg font-black text-slate-900">{flaggedEntries.length} Profiles</span>
              </div>
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/80">
                <span className="text-[10px] font-bold uppercase text-rose-600 block">Blacklisted (Do Not Rent)</span>
                <span className="text-lg font-black text-rose-800">
                  {flaggedEntries.filter((e) => e.riskTier === 'critical' || e.status === 'blacklisted').length}
                </span>
              </div>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                <span className="text-[10px] font-bold uppercase text-amber-600 block">Recorded Arrears Debt</span>
                <span className="text-lg font-black text-amber-800">
                  R{flaggedEntries.reduce((sum, e) => sum + (e.outstandingBalanceZar || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Resolved / Cleared</span>
                <span className="text-lg font-black text-emerald-800">
                  {flaggedEntries.filter((e) => e.status === 'resolved').length}
                </span>
              </div>
            </>
          ) : subTab === 'referrals' ? (
            <>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Referrals</span>
                <span className="text-lg font-black text-slate-900">{referrals.length}</span>
              </div>
              <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200/80">
                <span className="text-[10px] font-bold uppercase text-purple-600 block">Onboarded Couriers</span>
                <span className="text-lg font-black text-purple-800">
                  {referrals.filter((r) => r.status === 'completed_onboarding' || r.status === 'reward_paid').length}
                </span>
              </div>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                <span className="text-[10px] font-bold uppercase text-amber-600 block">Pending Onboarding</span>
                <span className="text-lg font-black text-amber-800">
                  {referrals.filter((r) => r.status === 'pending_onboarding').length}
                </span>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Total Bonuses Paid</span>
                <span className="text-lg font-black text-emerald-800">
                  R{referrals.filter((r) => r.status === 'reward_paid').reduce((sum, r) => sum + (Number(r.rewardAmountZar) || 350), 0).toLocaleString()}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Couriers</span>
                <span className="text-lg font-black text-slate-900">{activeCount}</span>
              </div>
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
                <span className="text-[10px] font-bold uppercase text-amber-600 block">In Arrears / Due</span>
                <span className="text-lg font-black text-amber-800">{inArrearsCount}</span>
              </div>
              <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/80">
                <span className="text-[10px] font-bold uppercase text-rose-600 block">Total Overdue (ZAR)</span>
                <span className="text-lg font-black text-rose-800">R{totalArrearsZar.toLocaleString()}</span>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
                <span className="text-[10px] font-bold uppercase text-emerald-600 block">Avg On-Time Score</span>
                <span className="text-lg font-black text-emerald-800">
                  {drivers.length > 0 ? Math.round(drivers.reduce((acc, d) => acc + (d.paymentScore || 90), 0) / drivers.length) : 100}%
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Database Sync Feedback Toast Banner */}
      {dbNotification && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-md ${
            dbNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {dbNotification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{dbNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setDbNotification(null)}
            className="p-1 hover:bg-black/5 rounded text-slate-500 hover:text-slate-700 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: DRIVERS DIRECTORY */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search driver name, ref code, plate, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active (On Road)</option>
                <option value="in_arrears">In Arrears</option>
                <option value="suspended">Suspended</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddDriverOpen(true)}
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
          </div>

          {/* Drivers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Driver Profile</th>
                    <th className="py-3 px-4">Assigned Motorbike</th>
                    <th className="py-3 px-4">Weekly Rate & Ledger</th>
                    <th className="py-3 px-4">Risk & Safety</th>
                    <th className="py-3 px-4">Platform & Term</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-sm">
                            {driver.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{driver.fullName}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-semibold text-cyan-700">{driver.refNumber}</span>
                              <span>•</span>
                              <span>{driver.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Bike */}
                      <td className="py-3.5 px-4">
                        {driver.assignedBikeVinOrPlate ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-cyan-300">
                                {driver.assignedBikeVinOrPlate}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium block truncate max-w-[160px]">
                              {driver.assignedBikeName || 'Bajaj Boxer 150'}
                            </span>
                            <div className="flex items-center gap-1 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setSelectedDriver(driver)}
                                className="text-indigo-600 hover:text-indigo-800 font-bold underline"
                              >
                                Switch / Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                              ⚠️ No Bike Assigned
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedDriver(driver)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black shadow-2xs flex items-center gap-1 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Assign Bike</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Weekly Rate & Ledger Balance */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900">R{driver.weeklyRate}/week</span>
                          <div>
                            {driver.balanceDue > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                Overdue: R{driver.balanceDue.toFixed(2)}
                              </span>
                            ) : driver.balanceDue < 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Credit: R{Math.abs(driver.balanceDue).toFixed(2)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Paid Up to Date
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Risk & Safety */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              driver.riskTier === 'low'
                                ? 'bg-emerald-100 text-emerald-800'
                                : driver.riskTier === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {driver.riskTier} Risk
                            </span>
                            <span className="text-[11px] font-bold text-slate-600">{driver.riskScore}/100</span>
                          </div>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                driver.riskScore >= 80 ? 'bg-emerald-500' : driver.riskScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${driver.riskScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Platform & Term */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 text-[11px]">
                          <span className="font-bold text-slate-800 block">{driver.primaryPlatform}</span>
                          <span className="text-slate-500 block">
                            Term: {driver.termMonths} Mo (Since {driver.contractStartDate || '2026'})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Centralized Documents & Bike Modal Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setModalInitialTab('documents');
                              setSelectedDriver(driver);
                            }}
                            title="Open Driver Documents & Motorbike Hub"
                            className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors font-bold flex items-center gap-1 text-[11px] px-2.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Docs & Bike</span>
                          </button>

                          {/* Track Finance Dedicated Button (Opens ONLY Financials & Agreement Modal) */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFinanceDriver(driver);
                            }}
                            title="Track Weekly Finance, Rent-to-Own Agreement, GitHub Payment Calendar & Proof of Payment"
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors font-bold flex items-center gap-1.5 text-[11px] px-2.5 cursor-pointer shadow-2xs"
                          >
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Track Finance</span>
                          </button>

                          {/* Driver Notes Button with Live Badge */}
                          <button
                            type="button"
                            onClick={() => {
                              setNotesDriver(driver);
                            }}
                            title="Open Driver Notes, Remarks & Action Items"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 transition-colors font-bold flex items-center gap-1.5 text-[11px] px-2.5 cursor-pointer shadow-2xs relative"
                          >
                            <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                            <span>Notes</span>
                            {(notesCountMap[driver.id] || 0) > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">
                                {notesCountMap[driver.id]}
                              </span>
                            )}
                          </button>

                          {/* Log Incident */}
                          <button
                            type="button"
                            onClick={() => setIncidentDriver(driver)}
                            title="Log Incident / Penalty"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active drivers matching filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 2: DRIVER RISK REGISTRY */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'risk_registry' && (
        <div className="space-y-5">
          {/* Header Bar */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-black tracking-tight text-white">
                    Company Driver Risk Registry & Blacklist
                  </h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                  Internal company record system to log defaulters, absconded motorbikes, GPS tampering, fake permits, and high-risk couriers.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddFlagModal()}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Risk Record</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Risk Records</span>
                <span className="text-base font-black text-white">{flaggedEntries.length} Profiles</span>
              </div>
              <div className="bg-rose-950/40 p-2.5 rounded-xl border border-rose-900/40">
                <span className="text-[10px] uppercase font-bold text-rose-400 block">Blacklisted (Do Not Rent)</span>
                <span className="text-base font-black text-rose-300">
                  {flaggedEntries.filter((e) => e.riskTier === 'critical' || e.status === 'blacklisted').length}
                </span>
              </div>
              <div className="bg-amber-950/40 p-2.5 rounded-xl border border-amber-900/40">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">Recorded Arrears Debt</span>
                <span className="text-base font-black text-amber-300">
                  R{flaggedEntries.reduce((sum, e) => sum + (e.outstandingBalanceZar || 0), 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-900/40">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Resolved / Cleared</span>
                <span className="text-base font-black text-emerald-300">
                  {flaggedEntries.filter((e) => e.status === 'resolved').length}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search driver name, ID / Passport number, SAPS case #, reason..."
                value={riskSearchQuery}
                onChange={(e) => setRiskSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={riskStatusFilter}
                onChange={(e) => setRiskStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="all">All Records ({flaggedEntries.length})</option>
                <option value="active_alerts">Active Alerts Only</option>
                <option value="blacklisted">🚫 Blacklisted (Critical)</option>
                <option value="critical_high">⚠️ Critical & High Risk</option>
                <option value="resolved">✅ Resolved / Cleared</option>
              </select>
            </div>
          </div>

          {/* Risk Records Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRiskEntries.map((entry) => {
              const isBlacklisted = entry.riskTier === 'critical' || entry.status === 'blacklisted';

              return (
                <div
                  key={entry.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all ${
                    isBlacklisted ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-slate-900">{entry.fullName}</span>
                          {entry.nationalityCountry && (
                            <span className="text-[10px] text-slate-500 font-semibold">
                              ({entry.nationalityCountry})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            ID/Passport: {entry.idOrPassportNumber}
                          </span>
                          {entry.phone && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-600">{entry.phone}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            isBlacklisted
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : entry.riskTier === 'high'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                          }`}
                        >
                          {isBlacklisted ? '🚫 Blacklisted' : `${entry.riskTier} Risk`}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          entry.status === 'resolved' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {entry.status === 'resolved' ? '✅ Resolved / Cleared' : '🚨 Active Alert'}
                        </span>
                      </div>
                    </div>

                    {/* Outstanding Balance */}
                    {entry.outstandingBalanceZar > 0 && (
                      <div className="flex items-center justify-between bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">
                        <span className="text-xs font-bold text-rose-800">Outstanding Arrears / Debt:</span>
                        <span className="text-sm font-black text-rose-700 font-mono">
                          R{entry.outstandingBalanceZar.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Violation Category & Description */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          {entry.flagReason.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">Date Logged: {entry.reportedDate}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-xs">
                        {entry.reasonDescription}
                      </p>

                      {entry.policeCaseNumber && (
                        <div className="pt-1.5 flex items-center gap-1.5 text-xs text-rose-800 font-bold font-mono">
                          <Shield className="w-3.5 h-3.5 text-rose-600" />
                          <span>SAPS Case Number: {entry.policeCaseNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedFlagDossier(entry)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleResolveFlag(entry)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          entry.status === 'resolved'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {entry.status === 'resolved' ? 'Re-open' : 'Mark Resolved'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingFlagEntry(entry);
                          setNewFlagForm({ ...entry });
                          setIsAddFlagModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        title="Edit Risk Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFlag(entry.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Risk Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredRiskEntries.length === 0 && (
              <div className="col-span-2 bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500 space-y-3">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900">No Risk Records Found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No risk or defaulter records match your search filter. Use the button below to add a new record.
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenAddFlagModal()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold"
                >
                  + Add Risk Record
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 3: DRIVER REFERRALS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'referrals' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Driver Referral Rewards Program (R350 per Active Courier)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Existing riders earn a R350 credit towards their weekly rent when their referred peer passes underwriting and completes 30 active days.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-black text-center">
                Total Bonus Pool: R{referrals.reduce((sum, r) => sum + r.rewardAmountZar, 0)}
              </div>
              <button
                type="button"
                onClick={() => setIsAddReferralOpen(true)}
                className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Referral</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {referrals.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900 mb-1">No Driver Referrals Logged Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Log peer referrals from existing couriers to track 30-day onboarding milestones and manage R350 bonus payouts.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddReferralOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Record First Referral</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Referrer (Active Driver)</th>
                      <th className="py-3 px-4">Referred Applicant</th>
                      <th className="py-3 px-4">Referral Date</th>
                      <th className="py-3 px-4">Reward Amount</th>
                      <th className="py-3 px-4">Qualification Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {referrals.map((ref) => (
                      <tr key={ref.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{ref.referrerDriverName}</td>
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-900 block">{ref.referredApplicantName}</span>
                            <span className="text-[11px] text-slate-500">{ref.referredPhone}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{ref.referralDate}</td>
                        <td className="py-3.5 px-4 font-black text-emerald-700">R{ref.rewardAmountZar}</td>
                        <td className="py-3.5 px-4">
                          <select
                            value={ref.status}
                            onChange={async (e) => {
                              const updated: DriverReferral = {
                                ...ref,
                                status: e.target.value as any,
                                paidDate: e.target.value === 'paid_out' ? (ref.paidDate || new Date().toISOString().split('T')[0]) : ref.paidDate
                              };
                              onUpdateReferral(updated);
                              try {
                                const dbRes = await saveReferral(updated);
                                if (dbRes.success) {
                                  setDbNotification({
                                    type: 'success',
                                    message: `✓ Status updated for ${ref.referredApplicantName} -> ${e.target.value}`,
                                  });
                                }
                              } catch (err) {
                                console.warn('Referral update err:', err);
                              }
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border cursor-pointer ${
                              ref.status === 'paid_out'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : ref.status === 'active_driving'
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-800 border-amber-300'
                            }`}
                          >
                            <option value="pending_onboarding">Pending Onboarding</option>
                            <option value="active_driving">Active Driving (30d)</option>
                            <option value="bonus_eligible">Bonus Eligible</option>
                            <option value="paid_out">Paid Out (R{ref.rewardAmountZar})</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {ref.status !== 'paid_out' ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const updated: DriverReferral = {
                                    ...ref,
                                    status: 'paid_out',
                                    paidDate: new Date().toISOString().split('T')[0],
                                  };
                                  onUpdateReferral(updated);
                                  try {
                                    const dbRes = await saveReferral(updated);
                                    if (dbRes.success) {
                                      setDbNotification({
                                        type: 'success',
                                        message: `✓ R${ref.rewardAmountZar} bonus marked paid for ${ref.referrerDriverName} (Referral: ${ref.referredApplicantName})`,
                                      });
                                    }
                                  } catch (err) {
                                    console.warn('Referral mark paid err:', err);
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs"
                              >
                                Mark Paid
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Paid {ref.paidDate}
                              </span>
                            )}
                            {onDeleteReferral && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Remove referral for ${ref.referredApplicantName}?`)) {
                                    onDeleteReferral(ref.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Delete Referral"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / FLAG DRIVER TO RISK REGISTRY */}
      {/* ------------------------------------------------------------- */}
      {isAddFlagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-base">
                  {editingFlagEntry ? 'Edit Risk Registry Entry' : 'Flag Driver / Add to Risk Registry'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddFlagModalOpen(false);
                  setEditingFlagEntry(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFlagEntry} className="mt-4 space-y-3.5">
              {!editingFlagEntry && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select from Current Fleet Drivers (Optional)
                  </label>
                  <select
                    value={selectedActiveDriverToFlag}
                    onChange={(e) => handleSelectActiveDriverChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"
                  >
                    <option value="">-- Or enter external / walk-in person below --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.refNumber}) - Plate: {d.assignedBikeVinOrPlate || 'No Bike'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blessing Moyo"
                    value={newFlagForm.fullName}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    SA ID / Passport / TRN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BN8829104 or 950412..."
                    value={newFlagForm.idOrPassportNumber}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, idOrPassportNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="082 123 4567"
                    value={newFlagForm.phone}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, phone: e.target.value, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nationality / Origin</label>
                  <input
                    type="text"
                    placeholder="e.g. South Africa, Zimbabwe, Mozambique"
                    value={newFlagForm.nationalityCountry}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, nationalityCountry: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Risk Severity Tier</label>
                  <select
                    value={newFlagForm.riskTier}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, riskTier: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="critical">🚫 Critical (Blacklist / Do Not Rent)</option>
                    <option value="high">⚠️ High Risk (Double Deposit Required)</option>
                    <option value="medium">⚡ Medium Risk (Monitored)</option>
                    <option value="low">ℹ️ Low Risk (Minor Record)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Violation Category</label>
                  <select
                    value={newFlagForm.flagReason}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, flagReason: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="absconded_with_vehicle">Absconded with Motorbike / Stolen</option>
                    <option value="tracker_tampering">GPS Tracker Tampering / Wire Cut</option>
                    <option value="severe_payment_default">Severe Payment Default / Arrears</option>
                    <option value="vehicle_severely_damaged">Vehicle Severely Damaged / Abandoned</option>
                    <option value="fraudulent_kyc_permit">Fraudulent KYC / Fake Permit / Fake TRN</option>
                    <option value="traffic_fine_evasion">AARTO Traffic Fine Evasion / Impoundment</option>
                    <option value="reckless_dangerous_driving">Reckless & High Speed Infringements</option>
                    <option value="violent_threatening_behavior">Violent / Threatening Behavior</option>
                    <option value="subletting_unauthorized_rider">Unauthorized Subletting</option>
                    <option value="other_violation">Other Serious Fleet Policy Violation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Outstanding Balance (ZAR)</label>
                  <input
                    type="number"
                    value={newFlagForm.outstandingBalanceZar}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, outstandingBalanceZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">SAPS Police Case # (If Any)</label>
                  <input
                    type="text"
                    placeholder="e.g. CAS-142/06/2026 (Sandton SAPS)"
                    value={newFlagForm.policeCaseNumber || ''}
                    onChange={(e) => setNewFlagForm({ ...newFlagForm, policeCaseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Reporting Operator / Branch</label>
                <input
                  type="text"
                  value={newFlagForm.reportedByOperator}
                  onChange={(e) => setNewFlagForm({ ...newFlagForm, reportedByOperator: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Incident Evidence & Violation Details *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe what occurred, bike registration plate involved, dates, tracker logs, or why this rider was flagged..."
                  value={newFlagForm.reasonDescription}
                  onChange={(e) => setNewFlagForm({ ...newFlagForm, reasonDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Broadcast to Gauteng Fleet Mesh
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Share alert with Sandton, Midrand, and Joburg courier operators
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={newFlagForm.isCrossOperatorShared}
                  onChange={(e) => setNewFlagForm({ ...newFlagForm, isCrossOperatorShared: e.target.checked })}
                  className="w-4 h-4 text-cyan-600 rounded"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddFlagModalOpen(false);
                    setEditingFlagEntry(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  {editingFlagEntry ? 'Update Risk Entry' : 'Save & Flag Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VIEW FULL RISK DOSSIER */}
      {/* ------------------------------------------------------------- */}
      {selectedFlagDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="font-black text-slate-900 text-base">Driver Risk Dossier</h3>
                  <span className="text-[11px] font-mono text-slate-500">ID: {selectedFlagDossier.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFlagDossier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-black">{selectedFlagDossier.fullName}</h4>
                  <p className="text-xs text-slate-400">
                    {selectedFlagDossier.nationalityCountry} • ID: <strong className="text-cyan-300 font-mono">{selectedFlagDossier.idOrPassportNumber}</strong>
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {selectedFlagDossier.riskTier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Phone / WhatsApp</span>
                  <span className="font-mono font-bold text-white">{selectedFlagDossier.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Outstanding Arrears</span>
                  <span className="font-mono font-bold text-rose-400">
                    R{selectedFlagDossier.outstandingBalanceZar.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Violation Report */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-900 uppercase text-[11px]">
                  Violation: {selectedFlagDossier.flagReason.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-500">Flagged: {selectedFlagDossier.reportedDate}</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                {selectedFlagDossier.reasonDescription}
              </p>

              {selectedFlagDossier.policeCaseNumber && (
                <div className="p-2.5 bg-rose-100/60 rounded-xl text-rose-900 font-bold border border-rose-200 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span>SAPS Police Case: {selectedFlagDossier.policeCaseNumber}</span>
                </div>
              )}
            </div>

            {/* Reporting Operator & Mesh Status */}
            <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-600 block text-[11px]">Reporting Operator:</span>
                <strong className="text-cyan-900 font-bold">{selectedFlagDossier.reportedByOperator}</strong>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-cyan-100 text-cyan-800">
                {selectedFlagDossier.isCrossOperatorShared ? '🌐 Shared in Mesh' : '🏢 Local Only'}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  window.open(`https://wa.me/${selectedFlagDossier.phone.replace(/[^0-9]/g, '')}`, '_blank');
                }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Contact via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFlagDossier(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD DRIVER REFERRAL */}
      {/* ------------------------------------------------------------- */}
      {isAddReferralOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Record Driver Referral</h3>
              <button
                type="button"
                onClick={() => setIsAddReferralOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReferralSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Referrer (Active Driver / Staff Member) *</label>
                {drivers.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={newReferralForm.referrerDriverId}
                      onChange={(e) => {
                        const drv = drivers.find(d => d.id === e.target.value);
                        setNewReferralForm({ 
                          ...newReferralForm, 
                          referrerDriverId: e.target.value,
                          referrerDriverName: drv ? drv.fullName : ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      <option value="">-- Select Active Fleet Courier --</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.refNumber})
                        </option>
                      ))}
                    </select>
                    <div className="text-[11px] text-slate-400 text-center font-medium">-- or enter referrer name manually below --</div>
                    <input
                      type="text"
                      placeholder="e.g. Sipho Ndlovu or Staff Member Name"
                      value={newReferralForm.referrerDriverName || ''}
                      onChange={(e) => setNewReferralForm({ ...newReferralForm, referrerDriverName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sipho Ndlovu (Active Courier)"
                    value={newReferralForm.referrerDriverName || ''}
                    onChange={(e) => setNewReferralForm({ ...newReferralForm, referrerDriverName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Referred Applicant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tendai Chikore"
                  value={newReferralForm.referredApplicantName}
                  onChange={(e) => setNewReferralForm({ ...newReferralForm, referredApplicantName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Referred Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="071 992 4810"
                  value={newReferralForm.referredPhone}
                  onChange={(e) => setNewReferralForm({ ...newReferralForm, referredPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Bonus Reward (ZAR)</label>
                  <input
                    type="number"
                    value={newReferralForm.rewardAmountZar}
                    onChange={(e) => setNewReferralForm({ ...newReferralForm, rewardAmountZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Status</label>
                  <select
                    value={newReferralForm.status}
                    onChange={(e) => setNewReferralForm({ ...newReferralForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="pending_onboarding">Pending Onboarding</option>
                    <option value="active_driving">Active Driving (30 Days)</option>
                    <option value="bonus_eligible">Bonus Eligible</option>
                    <option value="paid_out">Paid Out</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddReferralOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Save Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: LOG DRIVER INCIDENT */}
      {/* ------------------------------------------------------------- */}
      {incidentDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-sm">Log Driver Incident</h3>
              </div>
              <button
                type="button"
                onClick={() => setIncidentDriver(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogIncident} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Driver</label>
                <input
                  type="text"
                  disabled
                  value={`${incidentDriver.fullName} (${incidentDriver.refNumber})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Incident Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Minor collision on Sandton delivery run. Front reflector broken. Bike repaired at workshop."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Safety Score Penalty Points (Deduct)
                </label>
                <select
                  value={incidentPenaltyScore}
                  onChange={(e) => setIncidentPenaltyScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value={5}>-5 Points (Minor Over-speed Warning)</option>
                  <option value={10}>-10 Points (Late Payment / Minor Scrape)</option>
                  <option value={20}>-20 Points (Traffic Infringement / Red Light)</option>
                  <option value={35}>-35 Points (Accident / Negligent Riding)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIncidentDriver(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Save Incident Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD DRIVER DIRECTLY */}
      {/* ------------------------------------------------------------- */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Add New Active Courier</h3>
              <button
                type="button"
                onClick={() => setIsAddDriverOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sipho Ndlovu"
                    value={newDriverForm.fullName}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="083 456 7890"
                    value={newDriverForm.phone}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ID / Passport Number</label>
                  <input
                    type="text"
                    required
                    placeholder="920415..."
                    value={newDriverForm.idOrPassportNumber}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, idOrPassportNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Primary Platform</label>
                  <select
                    value={newDriverForm.primaryPlatform}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, primaryPlatform: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="Checkers Sixty60">Checkers Sixty60</option>
                    <option value="Uber Eats">Uber Eats</option>
                    <option value="Takealot">Takealot</option>
                    <option value="Mr D">Mr D Food</option>
                    <option value="Bolt Food">Bolt Food</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Weekly Rate (ZAR)</label>
                  <input
                    type="number"
                    value={newDriverForm.weeklyRate}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, weeklyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Deposit (ZAR)</label>
                  <input
                    type="number"
                    value={newDriverForm.depositPaid}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, depositPaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Term (Months)</label>
                  <input
                    type="number"
                    value={newDriverForm.termMonths}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, termMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-md"
                >
                  Create Driver Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALL-IN-ONE DRIVER HUB & DOCUMENTS MODAL */}
      <DriverDetailModal
        isOpen={!!selectedDriver}
        driver={selectedDriver}
        vehicles={vehicles}
        initialTab={modalInitialTab}
        application={applications.find(
          (a) => a.id === selectedDriver?.applicationId || a.fullName === selectedDriver?.fullName || a.idOrPassportNumber === selectedDriver?.idOrPassportNumber
        )}
        agreements={agreements}
        onClose={() => setSelectedDriver(null)}
        onUpdateDriver={(updated) => {
          onUpdateDriver(updated);
          setSelectedDriver(updated);
        }}
        onChangeBike={(driverId, newVehicleId) => {
          if (onChangeBike) {
            onChangeBike(driverId, newVehicleId);
          }
          // Also update local selected driver state if vehicle changed
          const veh = vehicles.find((v) => v.id === newVehicleId);
          if (veh && selectedDriver) {
            setSelectedDriver({
              ...selectedDriver,
              assignedVehicleId: veh.id,
              assignedBikeVinOrPlate: veh.registrationPlate || veh.vin,
              assignedBikeName: `${veh.make} ${veh.model} (${veh.registrationPlate || veh.vin})`,
            });
          }
        }}
        onRemoveBike={(driverId) => {
          if (onRemoveBike) {
            onRemoveBike(driverId);
          }
          if (selectedDriver) {
            setSelectedDriver({
              ...selectedDriver,
              assignedVehicleId: undefined,
              assignedBikeVinOrPlate: undefined,
              assignedBikeName: undefined,
            });
          }
        }}
        onOpenYocoPayment={(drv) => {
          setSelectedDriver(null);
          onOpenYocoPaymentForDriver(drv);
        }}
        onDeleteDriver={onDeleteDriver ? (driverId) => {
          onDeleteDriver(driverId);
          setSelectedDriver(null);
        } : undefined}
      />

      {/* DEDICATED TRACK FINANCE & AGREEMENT MODAL (Clean, no documents or handover tabs) */}
      <DriverFinanceModal
        isOpen={!!selectedFinanceDriver}
        driver={selectedFinanceDriver}
        agreements={agreements}
        vehicles={vehicles}
        services={services}
        parts={parts}
        onClose={() => setSelectedFinanceDriver(null)}
        onUpdateDriver={(updated) => {
          onUpdateDriver(updated);
          setSelectedFinanceDriver(updated);
        }}
        onOpenYocoPayment={(drv) => {
          setSelectedFinanceDriver(null);
          onOpenYocoPaymentForDriver(drv);
        }}
      />

      {/* ========================================================= */}
      {/* FULL-FEATURED DEDICATED DRIVER NOTES MODAL (driver_notes table) */}
      {/* ========================================================= */}
      <DriverNotesModal
        isOpen={!!notesDriver}
        driver={notesDriver}
        onClose={() => setNotesDriver(null)}
        onUpdateDriver={(updated) => {
          onUpdateDriver(updated);
          setNotesDriver(updated);
        }}
        onNotesCountUpdate={(driverId, count) => {
          setNotesCountMap((prev) => ({ ...prev, [driverId]: count }));
        }}
      />
    </div>
  );
};
