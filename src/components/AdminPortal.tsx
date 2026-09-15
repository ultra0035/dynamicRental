import React, { useState, useRef } from 'react';
import { 
  RiderApplication, 
  ApplicationStatus, 
  CitizenshipType,
  Bike
} from '../types';
import { COMPANY_DETAILS, BIKES } from '../data/bikes';
import { ContractModal } from './ContractModal';
import { isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from '../lib/supabase';
import { PRESET_HERO_IMAGES } from '../lib/customizationStore';
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
  Database,
  Copy,
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
  ChevronRight
} from 'lucide-react';

interface AdminPortalProps {
  applications: RiderApplication[];
  bikes: Bike[];
  onUpdateApplication: (updated: RiderApplication) => Promise<void> | void;
  onSaveBike: (bike: Bike) => Promise<void> | void;
  onDeleteBike: (bikeId: string) => Promise<void> | void;
  onAddNewWalkin?: () => void;
  onCloseAdmin?: () => void;
  onOpenLogoModal?: () => void;
  onOpenHeroModal?: () => void;
  customLogoUrl?: string;
  customHeroUrl?: string;
}

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
  onSaveBike,
  onDeleteBike,
  onAddNewWalkin,
  onCloseAdmin,
  onOpenLogoModal,
  onOpenHeroModal,
  customLogoUrl,
  customHeroUrl,
}) => {
  // Admin Tabs: 'applications' | 'inventory' | 'branding' | 'database'
  const [adminTab, setAdminTab] = useState<'applications' | 'inventory' | 'branding' | 'database'>('applications');

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

  // Bike Editor / Creation Modal
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [isNewBikeModal, setIsNewBikeModal] = useState<boolean>(false);
  const [bikeImageMode, setBikeImageMode] = useState<'upload' | 'url' | 'presets'>('upload');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  const bikeFileInputRef = useRef<HTMLInputElement>(null);

  // Selected Application
  const activeApp = applications.find((a) => a.id === selectedAppId) || applications[0];

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
    let title = 'Status Updated';
    let desc = `Application stage changed to ${newStatus.replace(/_/g, ' ')}.`;

    if (newStatus === 'approved_for_collection') {
      title = 'Approved for Showroom Handover';
      desc = `Ready for contract signing and motorbike collection at ${COMPANY_DETAILS.address}.`;
    } else if (newStatus === 'needs_more_info') {
      title = 'Action Required: Missing Documentation / TRN';
      desc = 'Rider notified to submit missing Traffic Register certificate (TRN) or ID docs.';
    } else if (newStatus === 'contract_signed') {
      title = 'Contract Signed & Bike Delivered';
      desc = 'Deposit received, contract executed, keys handed over to rider.';
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

  // 1-Click WhatsApp Trigger for Delivery Handover Confirmation
  const sendDeliveryConfirmationWhatsApp = (app: RiderApplication) => {
    const text = `Congratulations ${app.fullName}! 🏍️💨

Your *${app.bikeName}* is now officially handed over and active with *Dynamic Rental*!

🔑 *Account Ref:* ${app.refNumber}
🗓️ *Weekly Payment:* R${app.weeklyRate}/week (due every Monday)
📍 *Service & Maintenance Hub:* ${COMPANY_DETAILS.address}

Safe riding out there on your delivery routes! If you need support, WhatsApp us directly on ${COMPANY_DETAILS.phoneDisplay}.`;

    window.open(`https://wa.me/${app.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Handle Bike Image Upload from Device
  const handleDeviceImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBike) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditingBike({
          ...editingBike,
          image: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
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

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6" id="admin-dealership-portal">
      {/* Top Admin Header Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Dealership Staff Management Portal
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
              Randburg Showroom
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            304 Tungsten Rd, Strijdom Park · Underwrite applications, track driver stages, verify documents, and manage fleet.
          </p>
        </div>

        {/* Action Tabs & Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setAdminTab('applications')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                adminTab === 'applications'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Applications ({totalApps})</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('inventory')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                adminTab === 'inventory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BikeIcon className="w-3.5 h-3.5" />
              <span>Bikes & Stock ({bikes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('branding')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                adminTab === 'branding'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Branding & Assets</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminTab('database')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                adminTab === 'database'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Supabase Cloud</span>
            </button>
          </div>

          {onCloseAdmin && (
            <button
              type="button"
              onClick={onCloseAdmin}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              Exit Staff Mode
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: APPLICATIONS & DRIVER STAGE PIPELINE */}
      {adminTab === 'applications' && (
        <>
          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Submissions</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalApps}</div>
              <span className="text-[11px] text-slate-400">All drivers on record</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-xs font-semibold text-blue-700">1. Pending Review</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{pendingCount}</div>
              <span className="text-[11px] text-blue-600">Awaiting vetting</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-xs font-semibold text-amber-700">2. Missing TRN</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{missingDocsCount}</div>
              <span className="text-[11px] text-amber-600">Requires certificate</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700">3. Ready for Pickup</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</div>
              <span className="text-[11px] text-emerald-600">Ready at Randburg</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-xs font-semibold text-indigo-700">4. Handed Over</span>
              <div className="text-2xl font-black text-indigo-700 mt-1">{signedCount}</div>
              <span className="text-[11px] text-indigo-600">Delivered & active</span>
            </div>
          </div>

          {/* Search, Filters, View Mode Toggle, and Actions */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by driver name, ref code (DR-), phone, ID/Passport..."
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

              {onAddNewWalkin && (
                <button
                  type="button"
                  onClick={onAddNewWalkin}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Walk-in</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW MODE 1: KANBAN STAGE PIPELINE BOARD */}
          {pipelineViewMode === 'board' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
              {PIPELINE_STAGES.map((stage) => {
                const stageApps = filteredApps.filter((a) => a.status === stage.id);
                const StageIcon = stage.icon;

                return (
                  <div
                    key={stage.id}
                    className={`rounded-2xl border ${stage.borderClass} ${stage.bgClass} flex flex-col p-3 gap-3 min-w-[240px] shadow-xs`}
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

                            {/* Action Buttons: 1-Click Stage Transitions */}
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

                                {stage.id !== 'contract_signed' && (
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
                    </div>
                  </div>

                  {/* Visual Stage Progression Stepper */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
                      Pipeline Stage Tracker:
                    </label>

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

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {activeApp.documents.idDocumentFront && (
                        <div
                          onClick={() => setActiveDocImage({ title: 'SA ID (Front)', url: activeApp.documents.idDocumentFront! })}
                          className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                        >
                          <img src={activeApp.documents.idDocumentFront} alt="ID Front" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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

                      {activeApp.documents.workPermit && (
                        <div
                          onClick={() => setActiveDocImage({ title: 'Work Permit / Asylum', url: activeApp.documents.workPermit! })}
                          className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                        >
                          <img src={activeApp.documents.workPermit} alt="Work Permit" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <ZoomIn className="w-4 h-4" /> Zoom
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-white text-[10px] font-bold p-1 truncate text-center">
                            Work Permit
                          </div>
                        </div>
                      )}

                      {activeApp.documents.driversLicense && (
                        <div
                          onClick={() => setActiveDocImage({ title: "Driver's License", url: activeApp.documents.driversLicense! })}
                          className="group relative h-28 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer shadow-xs"
                        >
                          <img src={activeApp.documents.driversLicense} alt="Driver License" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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
              ) : null}
            </div>
          )}
        </>
      )}

      {/* TAB 2: BIKE INVENTORY & STOCK MANAGEMENT */}
      {adminTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col gap-6" id="bike-inventory-tab">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-900">
                Dealership Bike Fleet & Stock Catalog
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Add, edit pricing, upload bike photos from your device, and configure weekly terms.
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
        </div>
      )}

      {/* TAB 3: BRANDING & ASSETS (Admin Only - Public Visitors Cannot Change) */}
      {adminTab === 'branding' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col gap-6" id="branding-assets-tab">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>STATIC BRAND ASSETS</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Brand Logo & Hero Banner Management
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Static brand assets are managed strictly inside the Staff Portal. Public visitors will never see edit buttons.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Logo Customizer Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  1. Dealership Website Logo
                </span>
                <p className="text-xs text-slate-600 mb-4">
                  Currently using the official Dynamic Rental vector brand or your uploaded custom logo.
                </p>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center min-h-[100px]">
                  {customLogoUrl ? (
                    <img src={customLogoUrl} alt="Current Custom Logo" className="h-12 w-auto object-contain" />
                  ) : (
                    <div className="text-white font-bold text-sm">Default Dynamic Rental Vector Logo Active</div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onOpenLogoModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Logo</span>
                </button>
              </div>
            </div>

            {/* Hero Image Customizer Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  2. Home Hero Banner Image
                </span>
                <p className="text-xs text-slate-600 mb-4">
                  Display high-impact delivery motorbikes on the home page showcase.
                </p>

                <div className="h-40 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden relative">
                  <img
                    src={customHeroUrl || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80'}
                    alt="Current Hero Banner"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3 text-white text-xs font-bold">
                    Home Page Hero Banner
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onOpenHeroModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Change Hero Banner</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SUPABASE CLOUD SYNC & DATABASE CONFIG */}
      {adminTab === 'database' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md flex flex-col gap-6" id="supabase-config-tab">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                <Database className="w-3.5 h-3.5" />
                <span>SUPABASE CLOUD POSTGRESQL</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Database Cloud Sync & Architecture
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Real-time cloud synchronization for applications, documents, and bike inventory.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                isSupabaseConfigured
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-600' : 'bg-amber-600 animate-ping'}`} />
                <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Local Fallback Active'}</span>
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-700 space-y-3">
            <strong className="text-slate-900 text-sm block">How Supabase works in this app:</strong>
            <p>
              1. When <code className="bg-slate-200 px-1.5 py-0.5 rounded text-blue-700 font-mono">VITE_SUPABASE_URL</code> and <code className="bg-slate-200 px-1.5 py-0.5 rounded text-blue-700 font-mono">VITE_SUPABASE_ANON_KEY</code> are provided in environment variables, the app automatically reads and writes to your Supabase PostgreSQL cloud tables.
            </p>
            <p>
              2. When unconfigured, the app runs smoothly on browser local storage with zero runtime crashes.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Supabase SQL Schema (Run in Supabase SQL Editor):
              </label>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-cyan-300 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-80 border border-slate-800">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / ADD BIKE WITH DEVICE IMAGE UPLOAD */}
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
                      onClick={() => bikeFileInputRef.current?.click()}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border-2 border-dashed border-blue-300 font-bold flex items-center justify-center gap-2 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Photo from Device</span>
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
    </div>
  );
};
