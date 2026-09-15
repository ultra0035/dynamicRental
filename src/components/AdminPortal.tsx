import React, { useState } from 'react';
import { 
  RiderApplication, 
  ApplicationStatus, 
  CitizenshipType,
  Bike
} from '../types';
import { COMPANY_DETAILS } from '../data/bikes';
import { ContractModal } from './ContractModal';
import { isSupabaseConfigured, SUPABASE_SQL_SCHEMA } from '../lib/supabase';
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
  Layers
} from 'lucide-react';

interface AdminPortalProps {
  applications: RiderApplication[];
  bikes: Bike[];
  onUpdateApplication: (updated: RiderApplication) => Promise<void> | void;
  onSaveBike: (bike: Bike) => Promise<void> | void;
  onDeleteBike: (bikeId: string) => Promise<void> | void;
  onAddNewWalkin?: () => void;
  onCloseAdmin?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  applications,
  bikes,
  onUpdateApplication,
  onSaveBike,
  onDeleteBike,
  onAddNewWalkin,
  onCloseAdmin,
}) => {
  // Admin Tabs: 'applications' | 'inventory' | 'database'
  const [adminTab, setAdminTab] = useState<'applications' | 'inventory' | 'database'>('applications');

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
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

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
  const weeklyRevenueEst = applications
    .filter((a) => a.status === 'approved_for_collection' || a.status === 'contract_signed')
    .reduce((sum, a) => sum + a.weeklyRate, 0);

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

  // Status Change Handler
  const handleStatusChange = (newStatus: ApplicationStatus) => {
    if (!activeApp) return;
    let title = 'Status Updated';
    let desc = `Application status changed to ${newStatus}.`;

    if (newStatus === 'approved_for_collection') {
      title = 'Approved for Showroom Handover';
      desc = `Ready for contract signing and motorbike collection at ${COMPANY_DETAILS.address}.`;
    } else if (newStatus === 'needs_more_info') {
      title = 'Action Required: Missing Documentation / TRN';
      desc = 'Rider notified to submit missing Traffic Register certificate or ID docs.';
    } else if (newStatus === 'contract_signed') {
      title = 'Contract Signed & Bike Delivered';
      desc = 'Deposit received, contract executed, keys handed over to rider.';
    }

    const updated: RiderApplication = {
      ...activeApp,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      timeline: [
        {
          timestamp: new Date().toISOString(),
          status: newStatus,
          title,
          description: desc,
        },
        ...activeApp.timeline,
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

Great news from *Dynamic Rental Randburg*! Your rent-to-own motorbike application for the *${app.bikeName}* (Ref: *${app.refNumber}*) has been *APPROVED*!

📍 *Collection Location:*
${COMPANY_DETAILS.address}
⏰ *Hours:* Mon-Fri 08:00-17:00, Sat 08:30-13:00

💰 *Deposit Due at Signing:* R${app.depositAmount} (Non-refundable)
🏍️ *Weekly Installment:* R${app.weeklyRate}/week

*Please bring with you:*
1. R${app.depositAmount} Deposit (Cash or Instant EFT)
2. Original Smart ID / Passport & TRN
3. Original Motorcycle Driver's License

Please reply to confirm what time you will visit the showroom today!`;

    window.open(`https://wa.me/${app.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 1-Click WhatsApp Trigger for Missing TRN
  const sendMissingTRNWhatsApp = (app: RiderApplication) => {
    const text = `Good day ${app.fullName},

This is *Dynamic Rental Randburg* regarding your Rent-to-Own bike application (*${app.refNumber}*).

⚠️ *Attention Required:*
Because you hold a foreign driver's license, our insurance & compliance policy strictly requires an official *Traffic Register Number (TRN) Certificate* issued by the traffic department.

Please take a clear photo of your TRN certificate and reply directly on this WhatsApp chat so we can approve your bike for collection today!`;

    window.open(`https://wa.me/${app.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
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
            304 Tungsten Rd, Strijdom Park · Underwrite applications, verify documents, and manage bike stock.
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
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs"
            >
              Exit Staff Mode
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: APPLICATIONS PIPELINE */}
      {adminTab === 'applications' && (
        <>
          {/* KPI Analytics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Applications</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalApps}</div>
              <span className="text-[11px] text-slate-400">All submissions on record</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-xs font-semibold text-blue-700">Pending Review</span>
              <div className="text-2xl font-black text-blue-700 mt-1">{pendingCount}</div>
              <span className="text-[11px] text-blue-600">Awaiting vetting</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-xs font-semibold text-emerald-700">Approved for Handover</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">{approvedCount}</div>
              <span className="text-[11px] text-emerald-600">Ready at Randburg</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs">
              <span className="text-xs font-semibold text-amber-700">Missing TRN / Action</span>
              <div className="text-2xl font-black text-amber-700 mt-1">{missingDocsCount}</div>
              <span className="text-[11px] text-amber-600">Requires follow-up</span>
            </div>
          </div>

          {/* Search, Filters, and Export */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, ref code (DR-), phone, ID/Passport..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved_for_collection">Approved for Collection</option>
                <option value="needs_more_info">Needs Info / Missing TRN</option>
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
                <span>Export CSV</span>
              </button>

              {onAddNewWalkin && (
                <button
                  type="button"
                  onClick={onAddNewWalkin}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Walk-in Application</span>
                </button>
              )}
            </div>
          </div>

          {/* Master Detail Grid: Left List, Right Inspector */}
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
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSelectedAppId(app.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
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

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          app.status === 'approved_for_collection'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'needs_more_info'
                            ? 'bg-amber-100 text-amber-800'
                            : app.status === 'contract_signed'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {app.status.replace(/_/g, ' ')}
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

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {app.citizenship === 'south_african' ? '🇿🇦 SA Citizen' : `🌍 Foreign (${app.nationalityCountry || 'TRN'})`}
                        </span>
                        <span>{new Date(app.createdAt).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
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

                {/* Status Updater Buttons */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Update Underwriting Status:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleStatusChange('approved_for_collection')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeApp.status === 'approved_for_collection'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                      }`}
                    >
                      ✓ Approve Pickup
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('needs_more_info')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeApp.status === 'needs_more_info'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      ⚠️ Missing Info / TRN
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('contract_signed')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeApp.status === 'contract_signed'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                      }`}
                    >
                      🤝 Contract Executed
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange('declined')}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                        activeApp.status === 'declined'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                      }`}
                    >
                      ✕ Decline
                    </button>
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

                {/* Vetting Checklist Toggles */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-700 mb-2">Staff Vetting Checklist:</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeApp.verification.idVerified}
                        onChange={() => handleChecklistToggle('idVerified')}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>ID / Passport Number Verified</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeApp.verification.licenseVerified}
                        onChange={() => handleChecklistToggle('licenseVerified')}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Motorcycle License Code Verified</span>
                    </label>

                    {activeApp.citizenship === 'foreign_national' && (
                      <>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeApp.verification.workPermitVerified}
                            onChange={() => handleChecklistToggle('workPermitVerified')}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span>Work Permit / Asylum Valid</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeApp.verification.trafficRegisterVerified}
                            onChange={() => handleChecklistToggle('trafficRegisterVerified')}
                            className="w-4 h-4 rounded text-blue-600"
                          />
                          <span className="font-bold text-amber-800">Traffic Register (TRN) Validated</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Signed Signature Preview */}
                {activeApp.signatureDataUrl && (
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                      Applicant Touch Signature:
                    </span>
                    <div className="h-16 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center">
                      <img src={activeApp.signatureDataUrl} alt="Signature" className="max-h-full object-contain" />
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </>
      )}

      {/* TAB 2: BIKE INVENTORY & STOCK MANAGER */}
      {adminTab === 'inventory' && (
        <div className="flex flex-col gap-6" id="inventory-manager">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900">Motorbike Fleet & Stock Inventory</h2>
              <p className="text-xs text-slate-500">
                Add, edit pricing, update weekly rates, or toggle stock availability for delivery couriers.
              </p>
            </div>

            <button
              type="button"
              onClick={startAddNewBike}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Motorbike to Catalog</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bikes.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="relative h-44 bg-slate-100">
                  <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
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
                        <span className="text-slate-500 block">New Bike:</span>
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

      {/* TAB 3: SUPABASE CLOUD SYNC & DATABASE CONFIG */}
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
                Real-time synchronization for applications, documents, and bike inventory.
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

      {/* MODAL: EDIT / ADD BIKE */}
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

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingBike.image}
                  onChange={(e) => setEditingBike({ ...editingBike, image: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-4 pt-2">
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
