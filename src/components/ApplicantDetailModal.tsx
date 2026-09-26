import React, { useState, useEffect } from 'react';
import { RiderApplication, ApplicationStatus } from '../types';
import { COMPANY_DETAILS } from '../data/bikes';
import {
  X,
  User,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Calendar,
  Bike as BikeIcon,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  FileText,
  Trash2,
  ExternalLink,
  ZoomIn,
  Copy,
  Check,
  Lock,
  UserCheck,
  Building,
  Briefcase,
  Layers,
  FileCheck,
  Download,
  AlertCircle,
  Users,
  Edit3,
  Save,
  PhoneCall
} from 'lucide-react';

interface ApplicantDetailModalProps {
  application: RiderApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onMoveStatus: (app: RiderApplication, newStatus: ApplicationStatus) => void;
  onToggleChecklist: (
    app: RiderApplication,
    key: 'idVerified' | 'licenseVerified' | 'workPermitVerified' | 'trafficRegisterVerified'
  ) => void;
  onUpdateApplication?: (app: RiderApplication) => Promise<void> | void;
  onOpenContract?: (app: RiderApplication) => void;
  onDeleteApp?: (app: RiderApplication) => void;
  onPreviewDoc?: (doc: { title: string; url: string }) => void;
  onSendApprovalWhatsApp?: (app: RiderApplication) => void;
  onSendMissingTRNWhatsApp?: (app: RiderApplication) => void;
}

const STAGE_DEFINITIONS: {
  id: ApplicationStatus;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  badgeClass: string;
  btnActiveClass: string;
  borderClass: string;
}[] = [
  {
    id: 'pending_review',
    label: 'Pending Review',
    shortLabel: 'Pending',
    icon: Clock,
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
    btnActiveClass: 'bg-blue-600 text-white shadow-md',
    borderClass: 'border-blue-300'
  },
  {
    id: 'needs_more_info',
    label: 'Needs Info / Missing TRN',
    shortLabel: 'Needs TRN',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    btnActiveClass: 'bg-amber-500 text-slate-950 shadow-md font-black',
    borderClass: 'border-amber-300'
  },
  {
    id: 'approved_for_collection',
    label: 'Approved for Collection',
    shortLabel: 'Approved',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    btnActiveClass: 'bg-emerald-600 text-white shadow-md',
    borderClass: 'border-emerald-300'
  },
  {
    id: 'contract_signed',
    label: 'Contract Signed & Delivered',
    shortLabel: 'Delivered',
    icon: ShieldCheck,
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    btnActiveClass: 'bg-indigo-600 text-white shadow-md',
    borderClass: 'border-indigo-300'
  },
  {
    id: 'declined',
    label: 'Declined',
    shortLabel: 'Declined',
    icon: XCircle,
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
    btnActiveClass: 'bg-rose-600 text-white shadow-md',
    borderClass: 'border-rose-300'
  }
];

export const ApplicantDetailModal: React.FC<ApplicantDetailModalProps> = ({
  application,
  isOpen,
  onClose,
  onMoveStatus,
  onToggleChecklist,
  onUpdateApplication,
  onOpenContract,
  onDeleteApp,
  onPreviewDoc,
  onSendApprovalWhatsApp,
  onSendMissingTRNWhatsApp
}) => {
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'underwriting' | 'timeline'>('overview');

  // Next of Kin and Supervisor Edit State
  const [isEditingContacts, setIsEditingContacts] = useState<boolean>(false);
  const [isSavingContacts, setIsSavingContacts] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');
  
  const [editKin1, setEditKin1] = useState<{ name: string; relationship: string; phone: string }>({
    name: '',
    relationship: 'Parent / Guardian',
    phone: '',
  });
  const [editKin2, setEditKin2] = useState<{ name: string; relationship: string; phone: string }>({
    name: '',
    relationship: 'Sibling / Family Member',
    phone: '',
  });
  const [editKin3, setEditKin3] = useState<{ name: string; relationship: string; phone: string }>({
    name: '',
    relationship: 'Spouse / Partner / Friend',
    phone: '',
  });
  const [editSupervisorName, setEditSupervisorName] = useState<string>('');
  const [editSupervisorPhone, setEditSupervisorPhone] = useState<string>('');

  useEffect(() => {
    if (application) {
      setEditKin1({
        name: application.nextOfKin1?.name || application.alternativeContactName || '',
        relationship: application.nextOfKin1?.relationship || 'Parent / Guardian',
        phone: application.nextOfKin1?.phone || application.alternativeContactPhone || '',
      });
      setEditKin2({
        name: application.nextOfKin2?.name || '',
        relationship: application.nextOfKin2?.relationship || 'Sibling / Family Member',
        phone: application.nextOfKin2?.phone || '',
      });
      setEditKin3({
        name: application.nextOfKin3?.name || '',
        relationship: application.nextOfKin3?.relationship || 'Spouse / Partner / Friend',
        phone: application.nextOfKin3?.phone || '',
      });
      setEditSupervisorName(application.supervisorName || '');
      setEditSupervisorPhone(application.supervisorPhone || '');
      setIsEditingContacts(false);
      setSaveSuccessMsg('');
    }
  }, [application?.id]);

  const handleSaveContacts = async () => {
    if (!application || !onUpdateApplication) return;
    setIsSavingContacts(true);
    try {
      const updated: RiderApplication = {
        ...application,
        nextOfKin1: {
          name: editKin1.name.trim(),
          relationship: editKin1.relationship.trim(),
          phone: editKin1.phone.trim(),
        },
        nextOfKin2: {
          name: editKin2.name.trim(),
          relationship: editKin2.relationship.trim(),
          phone: editKin2.phone.trim(),
        },
        nextOfKin3: {
          name: editKin3.name.trim(),
          relationship: editKin3.relationship.trim(),
          phone: editKin3.phone.trim(),
        },
        alternativeContactName: editKin1.name.trim() || application.alternativeContactName,
        alternativeContactPhone: editKin1.phone.trim() || application.alternativeContactPhone,
        supervisorName: editSupervisorName.trim(),
        supervisorPhone: editSupervisorPhone.trim(),
        updatedAt: new Date().toISOString(),
      };
      await onUpdateApplication(updated);
      setIsEditingContacts(false);
      setSaveSuccessMsg('Contacts & references successfully saved to database!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to save applicant contacts:', err);
    } finally {
      setIsSavingContacts(false);
    }
  };

  if (!isOpen || !application) return null;

  const currentStage = STAGE_DEFINITIONS.find((s) => s.id === application.status) || STAGE_DEFINITIONS[0];
  const isDelivered = application.status === 'contract_signed';

  const handleCopyRef = () => {
    navigator.clipboard.writeText(application.refNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleDocClick = (title: string, url?: string) => {
    if (!url) return;
    if (onPreviewDoc) {
      onPreviewDoc({ title, url });
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 flex flex-wrap items-start justify-between gap-4 sticky top-0 z-20">
          <div className="space-y-1.5 flex-1 min-w-[260px]">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {application.fullName}
              </h2>
              
              {/* Reference Code with Copy button */}
              <button
                type="button"
                onClick={handleCopyRef}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1.5"
                title="Click to copy reference number"
              >
                <span>{application.refNumber}</span>
                {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>

              {/* Status Badge */}
              <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${currentStage.badgeClass}`}>
                <currentStage.icon className="w-3.5 h-3.5" />
                <span>{currentStage.label}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Applied: {new Date(application.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <BikeIcon className="w-3.5 h-3.5 text-emerald-400" />
                {application.bikeName} ({application.bikeCondition.toUpperCase()})
              </span>
              <span>•</span>
              <span className="font-bold text-amber-400 font-mono">
                R{application.weeklyRate}/wk • R{application.depositAmount} Dep
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIPELINE BOARD STAGE TRANSITION BAR */}
        <div className="bg-slate-100 p-3 sm:p-4 border-b border-slate-200">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Move on Pipeline Board:
              </span>
              {isDelivered && (
                <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-3 h-3 text-indigo-600" />
                  Delivered & Converted to Driver
                </span>
              )}
            </div>

            {isDelivered ? (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-950">Bike Handed Over & Lease Active</h4>
                    <p className="text-[11px] text-indigo-700">
                      Applicant is now an active driver in Approved Customers. Bike VIN/Plate: <strong className="font-mono">{application.assignedBikeVinOrPlate || 'Assigned'}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {STAGE_DEFINITIONS.map((st) => {
                  const isCurrent = application.status === st.id;
                  const StageIcon = st.icon;

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => onMoveStatus(application, st.id)}
                      className={`p-2 sm:p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                        isCurrent
                          ? st.btnActiveClass
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <StageIcon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{st.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* QUICK ACTION BUTTONS STRIP */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* WhatsApp Approval Button */}
            {onSendApprovalWhatsApp && (
              <button
                type="button"
                onClick={() => onSendApprovalWhatsApp(application)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Send WhatsApp approval notice with showroom pickup instructions"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Pickup Approval</span>
              </button>
            )}

            {/* Request TRN Button (for foreign national) */}
            {onSendMissingTRNWhatsApp && application.citizenship === 'foreign_national' && (
              <button
                type="button"
                onClick={() => onSendMissingTRNWhatsApp(application)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Request Traffic Register Certificate (TRN)"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Request TRN Notice</span>
              </button>
            )}

            {/* Direct WhatsApp Chat */}
            <button
              type="button"
              onClick={() => window.open(`https://wa.me/${application.whatsappNumber.replace(/[^0-9]/g, '')}`, '_blank')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Direct Chat</span>
            </button>

            {/* Direct Phone Call */}
            <a
              href={`tel:${application.phone}`}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Call ({application.phone})</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* View / Print Contract */}
            {onOpenContract && (
              <button
                type="button"
                onClick={() => onOpenContract(application)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                title="View & Print Official Contract"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                <span>Rental Contract</span>
              </button>
            )}

            {/* Delete Application */}
            {onDeleteApp && (
              <button
                type="button"
                onClick={() => onDeleteApp(application)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors flex items-center gap-1.5 shadow-2xs"
                title="Delete applicant record"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="px-5 border-b border-slate-200 bg-slate-50 flex gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Applicant & Courier Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'documents'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Documents ({Object.values(application.documents || {}).filter(Boolean).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('underwriting')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'underwriting'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Underwriting Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Audit History ({application.timeline?.length || 0})</span>
          </button>
        </div>

        {/* MODAL BODY (SCROLLABLE) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* TAB 1: APPLICANT OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* 1. Vehicle Selection Summary */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                  <BikeIcon className="w-4 h-4 text-emerald-600" />
                  <span>Motorbike & Lease Terms</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Bike Model</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{application.bikeName}</strong>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">{application.bikeCondition}</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Weekly Installment</span>
                    <strong className="text-blue-600 text-base font-mono block mt-0.5">R{application.weeklyRate}/wk</strong>
                    <span className="text-[10px] text-slate-500">Rent-to-Own</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Security Deposit</span>
                    <strong className="text-amber-800 text-base font-mono block mt-0.5">R{application.depositAmount}</strong>
                    <span className="text-[10px] text-emerald-600 font-bold">Payable at signing</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Term Duration</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{application.termMonths} Months</strong>
                    <span className="text-[10px] text-slate-500">Full ownership at end</span>
                  </div>
                </div>
              </div>

              {/* 2. Personal & Contact Information */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Personal & Identification Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Full Legal Name</span>
                    <span className="font-bold text-slate-900 text-sm">{application.fullName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Citizenship</span>
                    <span className="font-bold text-slate-900">
                      {application.citizenship === 'south_african' 
                        ? '🇿🇦 South African Citizen' 
                        : `🌍 Foreign National (${application.nationalityCountry || 'Non-SA'})`}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">ID / Passport / TRN Number</span>
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {application.idOrPassportNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                    <a href={`tel:${application.phone}`} className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1">
                      <Phone className="w-3 h-3 text-blue-500" />
                      {application.phone}
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">WhatsApp Number</span>
                    <a 
                      href={`https://wa.me/${application.whatsappNumber.replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="font-mono font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      {application.whatsappNumber}
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Email Address</span>
                    <a href={`mailto:${application.email}`} className="font-semibold text-slate-700 hover:underline truncate block">
                      {application.email || 'None provided'}
                    </a>
                  </div>

                  <div className="sm:col-span-3">
                    <span className="text-slate-400 block text-[11px]">Residential Address</span>
                    <span className="font-medium text-slate-800 flex items-start gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      {application.address}, {application.suburb}, {application.city || 'Johannesburg'} {application.province ? `(${application.province})` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. THREE NEXT OF KIN CONTACTS & REFERENCES */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      3 Next of Kin Contacts & References
                    </span>
                  </div>

                  {onUpdateApplication && (
                    <button
                      type="button"
                      onClick={() => setIsEditingContacts(!isEditingContacts)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingContacts ? 'Cancel Editing' : 'Edit Contacts / References'}</span>
                    </button>
                  )}
                </div>

                {saveSuccessMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {isEditingContacts ? (
                  /* EDITING FORM FOR NEXT OF KIN & SUPERVISOR */
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Edit Kin 1 */}
                      <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2.5">
                        <span className="text-xs font-black text-blue-800 block">1. Next of Kin 1 (Primary)</span>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Name</label>
                          <input
                            type="text"
                            value={editKin1.name}
                            onChange={(e) => setEditKin1(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-blue-500"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Relationship</label>
                          <input
                            type="text"
                            value={editKin1.relationship}
                            onChange={(e) => setEditKin1(prev => ({ ...prev, relationship: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-blue-500"
                            placeholder="e.g. Parent / Spouse"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mobile Phone</label>
                          <input
                            type="tel"
                            value={editKin1.phone}
                            onChange={(e) => setEditKin1(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                            placeholder="082 123 4567"
                          />
                        </div>
                      </div>

                      {/* Edit Kin 2 */}
                      <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
                        <span className="text-xs font-black text-indigo-800 block">2. Next of Kin 2</span>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Name</label>
                          <input
                            type="text"
                            value={editKin2.name}
                            onChange={(e) => setEditKin2(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-blue-500"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Relationship</label>
                          <input
                            type="text"
                            value={editKin2.relationship}
                            onChange={(e) => setEditKin2(prev => ({ ...prev, relationship: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-blue-500"
                            placeholder="e.g. Sibling / Brother"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mobile Phone</label>
                          <input
                            type="tel"
                            value={editKin2.phone}
                            onChange={(e) => setEditKin2(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                            placeholder="073 456 7890"
                          />
                        </div>
                      </div>

                      {/* Edit Kin 3 */}
                      <div className="p-3.5 rounded-xl border border-cyan-200 bg-cyan-50/40 space-y-2.5">
                        <span className="text-xs font-black text-cyan-800 block">3. Next of Kin 3</span>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Name</label>
                          <input
                            type="text"
                            value={editKin3.name}
                            onChange={(e) => setEditKin3(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-blue-500"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Relationship</label>
                          <input
                            type="text"
                            value={editKin3.relationship}
                            onChange={(e) => setEditKin3(prev => ({ ...prev, relationship: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-blue-500"
                            placeholder="e.g. Spouse / Friend"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mobile Phone</label>
                          <input
                            type="tel"
                            value={editKin3.phone}
                            onChange={(e) => setEditKin3(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 outline-none focus:border-blue-500"
                            placeholder="061 987 6543"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Edit Supervisor */}
                    <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2.5">
                      <span className="text-xs font-black text-purple-900 block">Delivery Hub Supervisor / Fleet Reference</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Supervisor Full Name</label>
                          <input
                            type="text"
                            value={editSupervisorName}
                            onChange={(e) => setEditSupervisorName(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 outline-none focus:border-purple-500"
                            placeholder="Supervisor Name"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Supervisor Phone Number</label>
                          <input
                            type="tel"
                            value={editSupervisorPhone}
                            onChange={(e) => setEditSupervisorPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-900 outline-none focus:border-purple-500"
                            placeholder="082 555 0192"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingContacts(false)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveContacts}
                        disabled={isSavingContacts}
                        className="px-4 py-1.5 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingContacts ? 'Saving...' : 'Save Contacts to Database'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* READ VIEW OF 3 NEXT OF KIN */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Next of Kin 1 */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                            Kin 1 (Primary)
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {application.nextOfKin1?.relationship || 'Parent / Relative'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900">
                          {application.nextOfKin1?.name || application.alternativeContactName || 'None recorded'}
                        </h4>
                        <div className="text-xs font-mono text-slate-600 mt-1">
                          {application.nextOfKin1?.phone || application.alternativeContactPhone || 'No number'}
                        </div>
                      </div>

                      {(application.nextOfKin1?.phone || application.alternativeContactPhone) && (
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60">
                          <a
                            href={`tel:${application.nextOfKin1?.phone || application.alternativeContactPhone}`}
                            className="px-2 py-1 rounded bg-white hover:bg-blue-50 text-blue-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${(application.nextOfKin1?.phone || application.alternativeContactPhone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-white hover:bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Next of Kin 2 */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                            Kin 2
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {application.nextOfKin2?.relationship || 'Sibling / Relative'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900">
                          {application.nextOfKin2?.name || 'None recorded'}
                        </h4>
                        <div className="text-xs font-mono text-slate-600 mt-1">
                          {application.nextOfKin2?.phone || 'No number'}
                        </div>
                      </div>

                      {application.nextOfKin2?.phone && (
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60">
                          <a
                            href={`tel:${application.nextOfKin2.phone}`}
                            className="px-2 py-1 rounded bg-white hover:bg-blue-50 text-blue-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${application.nextOfKin2.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-white hover:bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Next of Kin 3 */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-black text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded">
                            Kin 3
                          </span>
                          <span className="text-[10px] font-bold text-slate-500">
                            {application.nextOfKin3?.relationship || 'Spouse / Friend'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900">
                          {application.nextOfKin3?.name || 'None recorded'}
                        </h4>
                        <div className="text-xs font-mono text-slate-600 mt-1">
                          {application.nextOfKin3?.phone || 'No number'}
                        </div>
                      </div>

                      {application.nextOfKin3?.phone && (
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-200/60">
                          <a
                            href={`tel:${application.nextOfKin3.phone}`}
                            className="px-2 py-1 rounded bg-white hover:bg-blue-50 text-blue-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                          <a
                            href={`https://wa.me/${application.nextOfKin3.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 rounded bg-white hover:bg-emerald-50 text-emerald-600 text-[11px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Courier & Delivery Platform + Supervisor */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
                  <Briefcase className="w-4 h-4 text-purple-600" />
                  <span>Courier Background & Delivery Hub Supervisor</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                    <span className="text-purple-700 block text-[11px] font-semibold">Primary Platform</span>
                    <strong className="text-purple-950 text-sm block mt-0.5">{application.primaryPlatform || 'Checkers Sixty60'}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Delivery Experience</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{application.deliveryExperience || '1-2 years'}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Est. Weekly Earnings</span>
                    <strong className="text-emerald-700 text-base font-mono block mt-0.5">
                      R{application.approxWeeklyEarnings || 3500}+ / week
                    </strong>
                  </div>

                  <div className="p-3 bg-purple-50/30 rounded-xl border border-purple-100 flex flex-col justify-between">
                    <div>
                      <span className="text-purple-700 block text-[11px] font-semibold">Hub Supervisor</span>
                      <strong className="text-slate-900 text-xs block mt-0.5">
                        {application.supervisorName || 'Not recorded'}
                      </strong>
                      {application.supervisorPhone && (
                        <span className="text-[11px] font-mono text-slate-600 block mt-0.5">
                          {application.supervisorPhone}
                        </span>
                      )}
                    </div>
                    {application.supervisorPhone && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <a
                          href={`tel:${application.supervisorPhone}`}
                          className="px-2 py-0.5 rounded bg-white text-blue-600 text-[10px] font-bold border border-purple-200 hover:bg-purple-50 flex items-center gap-1"
                        >
                          <Phone className="w-2.5 h-2.5" /> Call
                        </a>
                        <a
                          href={`https://wa.me/${application.supervisorPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-0.5 rounded bg-white text-emerald-600 text-[10px] font-bold border border-purple-200 hover:bg-emerald-50 flex items-center gap-1"
                        >
                          <MessageSquare className="w-2.5 h-2.5" /> WA
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SUBMITTED DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Uploaded Verification Documents
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Click any document card to view high-resolution zoom or download.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* 1. SA ID / Passport */}
                {(application.documents.idDocumentFront || application.documents.saIdFront) && (
                  <div 
                    onClick={() => handleDocClick('SA ID Document (Front)', application.documents.idDocumentFront || application.documents.saIdFront)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={application.documents.idDocumentFront || application.documents.saIdFront} 
                        alt="ID Front" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" /> Zoom View
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white">
                      <span className="text-xs font-bold text-slate-900">SA ID Document (Front)</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Passport Bio */}
                {application.documents.passport && (
                  <div 
                    onClick={() => handleDocClick('Passport Bio Page', application.documents.passport)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={application.documents.passport} 
                        alt="Passport" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" /> Zoom View
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white">
                      <span className="text-xs font-bold text-slate-900">Passport Bio Page</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Drivers License */}
                {(application.documents.driversLicense || application.documents.driversLicenseFront) && (
                  <div 
                    onClick={() => handleDocClick("Driver's License (Code A/A1)", application.documents.driversLicense || application.documents.driversLicenseFront)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={application.documents.driversLicense || application.documents.driversLicenseFront} 
                        alt="License" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" /> Zoom View
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white">
                      <span className="text-xs font-bold text-slate-900">Motorcycle License (Code A)</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Work Permit / Asylum */}
                {(application.documents.asylumDocument || application.documents.workPermit) && (
                  <div 
                    onClick={() => handleDocClick('Work Permit / Asylum Document', application.documents.asylumDocument || application.documents.workPermit)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={application.documents.asylumDocument || application.documents.workPermit} 
                        alt="Work Permit" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" /> Zoom View
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white">
                      <span className="text-xs font-bold text-slate-900">Work Permit / Asylum</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Uploaded</span>
                    </div>
                  </div>
                )}

                {/* Traffic Register Certificate (TRN) */}
                {application.documents.trafficRegisterCertificate ? (
                  <div 
                    onClick={() => handleDocClick('Traffic Register Certificate (TRN)', application.documents.trafficRegisterCertificate)}
                    className="bg-white rounded-2xl border-2 border-amber-300 overflow-hidden group cursor-pointer hover:border-amber-500 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 bg-amber-50 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={application.documents.trafficRegisterCertificate} 
                        alt="TRN Certificate" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" /> Zoom View
                      </div>
                    </div>
                    <div className="p-3 border-t border-amber-200 flex items-center justify-between bg-amber-50/50">
                      <span className="text-xs font-black text-amber-950">TRN Certificate</span>
                      <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">Verified</span>
                    </div>
                  </div>
                ) : application.citizenship === 'foreign_national' ? (
                  <div className="bg-amber-50/70 rounded-2xl border-2 border-dashed border-amber-300 p-5 flex flex-col items-center justify-center text-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    <span className="text-xs font-black text-amber-950">Missing TRN Certificate</span>
                    <p className="text-[11px] text-amber-800 max-w-xs">
                      Mandatory Traffic Register Certificate required for foreign motorcycle registration.
                    </p>
                    {onSendMissingTRNWhatsApp && (
                      <button
                        type="button"
                        onClick={() => onSendMissingTRNWhatsApp(application)}
                        className="mt-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-colors"
                      >
                        Request via WhatsApp
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Proof of Residence */}
                {application.documents.proofOfResidence && (
                  <div 
                    onClick={() => handleDocClick('Proof of Residence', application.documents.proofOfResidence)}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden group cursor-pointer hover:border-blue-400 hover:shadow-md transition-all flex flex-col"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      <img 
                        src={application.documents.proofOfResidence} 
                        alt="Proof of Residence" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <ZoomIn className="w-4 h-4" /> Zoom View
                      </div>
                    </div>
                    <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-white">
                      <span className="text-xs font-bold text-slate-900">Proof of Residence</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Uploaded</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: UNDERWRITING CHECKLIST */}
          {activeTab === 'underwriting' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                    Underwriting & Staff Verification Checklist
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Check off verified credentials. Updates are saved automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={application.verification.idVerified}
                      onChange={() => onToggleChecklist(application, 'idVerified')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-slate-900 block font-bold">1. ID / Passport Document Verified</strong>
                      <span className="text-[11px] text-slate-500">Matches official Home Affairs / Foreign passport database</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={application.verification.licenseVerified}
                      onChange={() => onToggleChecklist(application, 'licenseVerified')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <div>
                      <strong className="text-slate-900 block font-bold">2. Motorcycle License (Code A/A1)</strong>
                      <span className="text-[11px] text-slate-500">Valid South African or accredited license confirmed</span>
                    </div>
                  </label>

                  {application.citizenship === 'foreign_national' && (
                    <>
                      <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={application.verification.workPermitVerified}
                          onChange={() => onToggleChecklist(application, 'workPermitVerified')}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <strong className="text-slate-900 block font-bold">3. Valid Work Permit / Asylum</strong>
                          <span className="text-[11px] text-slate-500">Permit expiration date verified within active term</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100/70 border border-amber-300 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={application.verification.trafficRegisterVerified}
                          onChange={() => onToggleChecklist(application, 'trafficRegisterVerified')}
                          className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                        />
                        <div>
                          <strong className="text-amber-950 block font-bold">4. Traffic Register Certificate (TRN)</strong>
                          <span className="text-[11px] text-amber-800">Department of Transport TRN Certificate attached</span>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TIMELINE HISTORY */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                  Status History & Audit Trail
                </h3>

                {application.timeline && application.timeline.length > 0 ? (
                  <div className="space-y-2.5">
                    {application.timeline.map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{entry.title}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(entry.timestamp).toLocaleString('en-ZA')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{entry.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No timeline history recorded yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Dynamic Rental Operations • Ref: <strong className="font-mono text-slate-900">{application.refNumber}</strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs transition-colors shadow-xs"
          >
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
};
