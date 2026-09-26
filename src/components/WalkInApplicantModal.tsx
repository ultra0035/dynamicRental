import React, { useState, useRef } from 'react';
import { 
  RiderApplication, 
  Bike, 
  BikeCondition, 
  ApplicationStatus, 
  CitizenshipType,
  ApplicationDocuments
} from '../types';
import { compressImageFile } from '../lib/imageUtils';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Bike as BikeIcon, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Briefcase,
  ShieldCheck,
  Upload,
  Camera,
  Trash2,
  Check,
  Eye,
  Loader2,
  Sparkles,
  Info,
  CreditCard,
  Layers
} from 'lucide-react';

interface WalkInApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  bikes: Bike[];
  onSubmit: (newApp: RiderApplication) => Promise<void> | void;
}

const SA_PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
];

const DELIVERY_PLATFORMS = [
  { id: 'Mr Delivery', name: 'Mr D', color: 'bg-cyan-50 border-cyan-300 text-cyan-800' },
  { id: 'Uber Eats', name: 'Uber Eats', color: 'bg-emerald-50 border-emerald-300 text-emerald-800' },
  { id: 'Checkers Sixty60', name: 'Sixty60', color: 'bg-teal-50 border-teal-300 text-teal-800' },
  { id: 'Woolies Dash', name: 'Woolies Dash', color: 'bg-slate-100 border-slate-400 text-slate-800' },
  { id: 'Zulzi', name: 'Zulzi', color: 'bg-rose-50 border-rose-300 text-rose-800' },
  { id: 'Picup', name: 'Picup', color: 'bg-sky-50 border-sky-300 text-sky-800' },
  { id: 'Takealot', name: 'Takealot', color: 'bg-blue-50 border-blue-300 text-blue-800' },
  { id: 'Bolt Food', name: 'Bolt Food', color: 'bg-green-50 border-green-300 text-green-800' }
];

export const WalkInApplicantModal: React.FC<WalkInApplicantModalProps> = ({
  isOpen,
  onClose,
  bikes,
  onSubmit,
}) => {
  if (!isOpen) return null;

  // Selected bike model
  const [selectedBikeId, setSelectedBikeId] = useState<string>(bikes[0]?.id || 'custom-bike');
  const [customBikeName, setCustomBikeName] = useState<string>('Commercial Delivery Motorbike (150cc)');
  const [bikeCondition, setBikeCondition] = useState<BikeCondition>('new');
  const [termMonths, setTermMonths] = useState<number>(18);

  // Rider Personal & Contact details
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [sameAsPhone, setSameAsPhone] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [citizenship, setCitizenship] = useState<CitizenshipType>('south_african');
  const [idOrPassportNumber, setIdOrPassportNumber] = useState<string>('');
  const [nationalityCountry, setNationalityCountry] = useState<string>('Zimbabwe');
  
  // Residence & Address Information
  const [address, setAddress] = useState<string>('');
  const [suburb, setSuburb] = useState<string>('Randburg');
  const [city, setCity] = useState<string>('Johannesburg');
  const [province, setProvince] = useState<string>('Gauteng');

  // Alternative Contact & 3 Next of Kin
  const [altContactName, setAltContactName] = useState<string>('');
  const [altContactPhone, setAltContactPhone] = useState<string>('');

  const [kin1, setKin1] = useState<{ name: string; relationship: string; phone: string }>({
    name: '',
    relationship: 'Parent / Guardian',
    phone: '',
  });
  const [kin2, setKin2] = useState<{ name: string; relationship: string; phone: string }>({
    name: '',
    relationship: 'Sibling / Family Member',
    phone: '',
  });
  const [kin3, setKin3] = useState<{ name: string; relationship: string; phone: string }>({
    name: '',
    relationship: 'Spouse / Partner / Friend',
    phone: '',
  });

  // Courier Supervisor
  const [supervisorName, setSupervisorName] = useState<string>('');
  const [supervisorPhone, setSupervisorPhone] = useState<string>('');

  // Work & Delivery Platforms
  const [selectedApps, setSelectedApps] = useState<string[]>(['Checkers Sixty60']);
  const [deliveryExperience, setDeliveryExperience] = useState<string>('1-2 years');
  const [weeklyEarningsBracket, setWeeklyEarningsBracket] = useState<string>('R2000-R3500');
  const [referredBy, setReferredBy] = useState<string>('');
  const [creditScore, setCreditScore] = useState<string>('650');
  
  // Intake Status & Notes
  const [initialStatus, setInitialStatus] = useState<ApplicationStatus>('pending_review');
  const [assignedPlate, setAssignedPlate] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('Showroom walk-in applicant intake registered.');
  
  // Document verification on-site
  const [idVerified, setIdVerified] = useState<boolean>(true);
  const [licenseVerified, setLicenseVerified] = useState<boolean>(false);
  const [trnVerified, setTrnVerified] = useState<boolean>(false);
  const [proofVerified, setProofVerified] = useState<boolean>(true);

  // Uploaded Documents State
  const [uploadedDocs, setUploadedDocs] = useState<ApplicationDocuments>({});
  const [uploadingDocKey, setUploadingDocKey] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  const fileInputRefs = {
    idDocumentFront: useRef<HTMLInputElement>(null),
    passport: useRef<HTMLInputElement>(null),
    asylumDocument: useRef<HTMLInputElement>(null),
    driversLicenseFront: useRef<HTMLInputElement>(null),
    trafficRegisterCertificate: useRef<HTMLInputElement>(null),
    proofOfResidence: useRef<HTMLInputElement>(null),
  };

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Active bike calculation
  const foundBike = bikes.find(b => b.id === selectedBikeId);
  const activeBike = foundBike || {
    id: 'custom-bike',
    name: customBikeName || 'Commercial Delivery Motorbike (150cc)',
    pricing: {
      new: { weeklyPayment: 750, deposit: 1000, termMonthsOptions: [15, 18] },
      used: { weeklyPayment: 650, deposit: 650, termMonths: 20 }
    }
  };
  const weeklyRate = bikeCondition === 'new' 
    ? (activeBike.pricing?.new?.weeklyPayment || 750) 
    : (activeBike.pricing?.used?.weeklyPayment || 650);
  const depositAmount = bikeCondition === 'new' 
    ? (activeBike.pricing?.new?.deposit || 1000) 
    : (activeBike.pricing?.used?.deposit || 650);

  // Handle Delivery Apps Toggle
  const toggleDeliveryApp = (appName: string) => {
    setSelectedApps(prev => 
      prev.includes(appName) 
        ? prev.filter(a => a !== appName) 
        : [...prev, appName]
    );
  };

  // Handle Document File Upload & Compression
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docKey: keyof ApplicationDocuments
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocKey(docKey as string);
    try {
      const compressedDataUrl = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.85,
        mimeType: 'image/jpeg'
      });

      setUploadedDocs(prev => ({
        ...prev,
        [docKey]: compressedDataUrl,
        // Also map legacy aliases
        ...(docKey === 'driversLicenseFront' ? { driversLicense: compressedDataUrl } : {}),
        ...(docKey === 'asylumDocument' ? { workPermit: compressedDataUrl, workPermitOrVisa: compressedDataUrl } : {}),
        ...(docKey === 'idDocumentFront' ? { saIdFront: compressedDataUrl } : {})
      }));

      // Auto-tick verification checklist when file is provided
      if (docKey === 'idDocumentFront' || docKey === 'passport' || docKey === 'asylumDocument') {
        setIdVerified(true);
      }
      if (docKey === 'driversLicenseFront') {
        setLicenseVerified(true);
      }
      if (docKey === 'trafficRegisterCertificate') {
        setTrnVerified(true);
      }
      if (docKey === 'proofOfResidence') {
        setProofVerified(true);
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      alert(err?.message || 'Error processing document image. Please try another file.');
    } finally {
      setUploadingDocKey(null);
      if (e.target) e.target.value = '';
    }
  };

  const removeDocument = (docKey: keyof ApplicationDocuments) => {
    setUploadedDocs(prev => {
      const next = { ...prev };
      delete next[docKey];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Please enter applicant full name');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter contact phone number');
      return;
    }
    if (!idOrPassportNumber.trim()) {
      setErrorMsg('Please enter ID or Passport / Asylum number');
      return;
    }

    setIsSubmitting(true);
    try {
      const walkinRef = `DR-WLK-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();

      // Estimate earnings number from bracket
      let approxEarnings = 3500;
      if (weeklyEarningsBracket.includes('1000')) approxEarnings = 1800;
      if (weeklyEarningsBracket.includes('2000')) approxEarnings = 2800;
      if (weeklyEarningsBracket.includes('3500')) approxEarnings = 4200;
      if (weeklyEarningsBracket.includes('5000')) approxEarnings = 5500;

      const newApp: RiderApplication = {
        id: `walkin-${Date.now()}`,
        refNumber: walkinRef,
        createdAt: nowIso,
        updatedAt: nowIso,
        status: initialStatus,
        bikeId: activeBike.id,
        bikeName: activeBike.name,
        bikeCondition,
        termMonths,
        weeklyRate,
        depositAmount,
        fullName: fullName.trim(),
        phone: phone.trim(),
        whatsappNumber: (sameAsPhone ? phone : whatsappNumber).trim() || phone.trim(),
        email: email.trim() || `${fullName.trim().toLowerCase().replace(/\s+/g, '.')}@rider.dynamicrental.co.za`,
        citizenship,
        idOrPassportNumber: idOrPassportNumber.trim(),
        nationalityCountry: citizenship !== 'south_african' ? nationalityCountry : undefined,
        address: address.trim() || 'Walk-in Intake',
        suburb: suburb.trim() || 'Randburg',
        city: city.trim() || 'Johannesburg',
        alternativeContactName: kin1.name.trim() || altContactName.trim() || undefined,
        alternativeContactPhone: kin1.phone.trim() || altContactPhone.trim() || undefined,
        nextOfKin1: kin1.name.trim() ? {
          name: kin1.name.trim(),
          relationship: kin1.relationship.trim(),
          phone: kin1.phone.trim(),
        } : (altContactName.trim() ? {
          name: altContactName.trim(),
          relationship: 'Relative',
          phone: altContactPhone.trim(),
        } : undefined),
        nextOfKin2: kin2.name.trim() ? {
          name: kin2.name.trim(),
          relationship: kin2.relationship.trim(),
          phone: kin2.phone.trim(),
        } : undefined,
        nextOfKin3: kin3.name.trim() ? {
          name: kin3.name.trim(),
          relationship: kin3.relationship.trim(),
          phone: kin3.phone.trim(),
        } : undefined,
        supervisorName: supervisorName.trim() || undefined,
        supervisorPhone: supervisorPhone.trim() || undefined,
        primaryPlatform: selectedApps[0] || 'Checkers Sixty60',
        deliveryApps: selectedApps.length > 0 ? selectedApps : ['Checkers Sixty60'],
        deliveryExperience,
        approxWeeklyEarnings: approxEarnings,
        referredBy: referredBy.trim() || undefined,
        creditScore: creditScore.trim() || '650',
        documents: {
          ...uploadedDocs,
          idDocumentFront: uploadedDocs.idDocumentFront || (citizenship === 'south_african' ? uploadedDocs.idDocumentFront : undefined),
          passport: uploadedDocs.passport,
          asylumDocument: uploadedDocs.asylumDocument,
          workPermit: uploadedDocs.asylumDocument || uploadedDocs.workPermit,
          driversLicense: uploadedDocs.driversLicenseFront || uploadedDocs.driversLicense,
          driversLicenseFront: uploadedDocs.driversLicenseFront,
          trafficRegisterCertificate: uploadedDocs.trafficRegisterCertificate,
          proofOfResidence: uploadedDocs.proofOfResidence,
        },
        verification: {
          idVerified,
          licenseVerified,
          workPermitVerified: citizenship !== 'south_african',
          trafficRegisterVerified: trnVerified,
          proofVerified,
          notes: adminNotes,
        },
        depositAcknowledged: true,
        termsAgreed: true,
        assignedBikeVinOrPlate: assignedPlate.trim() || undefined,
        adminNotes: adminNotes.trim(),
        timeline: [
          {
            timestamp: nowIso,
            status: initialStatus,
            title: 'Walk-in Intake Registered',
            description: `Driver registered at showroom with verified documents. Assigned ${activeBike.name} (${bikeCondition.toUpperCase()}) at R${weeklyRate}/wk.`,
          },
        ],
      };

      await onSubmit(newApp);
      onClose();
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrorMsg(err?.message || 'Failed to save walk-in applicant. Please check all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="walkin-applicant-modal-backdrop">
      <div 
        className="bg-white rounded-3xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        id="walkin-applicant-modal-content"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">ADD NEW CUSTOMER</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-400 text-slate-950">
                  WALK-IN INTAKE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Register on-site delivery rider with email, document uploads, and contract specs
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SECTION 1: CUSTOMER PERSONAL & CONTACT INFORMATION */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <User className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                1. Customer & Contact Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Full Name */}
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Tendai Moyo / Sipho Ndlovu"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="079 098 8764"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Email Address (Requested Specific Feature) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver.name@gmail.com"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* WhatsApp Number & Toggle */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">WhatsApp Number</label>
                  <label className="text-[11px] text-slate-500 flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => setSameAsPhone(e.target.checked)}
                      className="rounded text-cyan-600"
                    />
                    <span>Same as phone</span>
                  </label>
                </div>
                {!sameAsPhone && (
                  <input
                    type="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="079 098 8764"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>

              {/* Citizenship Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Citizenship Status
                </label>
                <select
                  value={citizenship}
                  onChange={(e) => setCitizenship(e.target.value as CitizenshipType)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="south_african">🇿🇦 South African Citizen</option>
                  <option value="foreign_national">🌍 Foreign National (Passport / Asylum)</option>
                </select>
              </div>

              {/* ID / Passport / Asylum Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {citizenship === 'south_african' ? 'SA ID Number' : 'Passport / Asylum Number'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={idOrPassportNumber}
                  onChange={(e) => setIdOrPassportNumber(e.target.value)}
                  placeholder={citizenship === 'south_african' ? '9208145028087' : '063635218764522'}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Country of Origin (if foreign) */}
              {citizenship !== 'south_african' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={nationalityCountry}
                    onChange={(e) => setNationalityCountry(e.target.value)}
                    placeholder="e.g. Zimbabwe / Malawi / DRC"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION 2: ADDRESS & ALTERNATIVE CONTACT INFORMATION */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <MapPin className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                2. Address & Alternative Contact
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Physical Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Physical Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="000 Road Street, Apartment/House"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Suburb */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Suburb <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  placeholder="Suburb (e.g. Randburg)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City (e.g. Johannesburg)"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Province Dropdown (from screenshot) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Province <span className="text-rose-500">*</span>
                </label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  {SA_PROVINCES.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* 3 NEXT OF KIN CONTACTS */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2.5">
                3 Next of Kin Contacts & References
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Kin 1 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-cyan-800 block">1. Next of Kin 1 (Primary)</span>
                  <input
                    type="text"
                    value={kin1.name}
                    onChange={(e) => setKin1(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full Name"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={kin1.relationship}
                    onChange={(e) => setKin1(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Parent / Guardian">Parent / Guardian</option>
                    <option value="Spouse / Partner">Spouse / Partner</option>
                    <option value="Sibling (Brother/Sister)">Sibling (Brother/Sister)</option>
                    <option value="Child (Adult Son/Daughter)">Child (Adult Son/Daughter)</option>
                    <option value="Uncle / Aunt">Uncle / Aunt</option>
                    <option value="Cousin / Relative">Cousin / Relative</option>
                    <option value="Close Friend">Close Friend</option>
                  </select>
                  <input
                    type="tel"
                    value={kin1.phone}
                    onChange={(e) => setKin1(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Mobile Phone"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Kin 2 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-cyan-800 block">2. Next of Kin 2</span>
                  <input
                    type="text"
                    value={kin2.name}
                    onChange={(e) => setKin2(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full Name"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={kin2.relationship}
                    onChange={(e) => setKin2(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Sibling (Brother/Sister)">Sibling (Brother/Sister)</option>
                    <option value="Parent / Guardian">Parent / Guardian</option>
                    <option value="Spouse / Partner">Spouse / Partner</option>
                    <option value="Child (Adult Son/Daughter)">Child (Adult Son/Daughter)</option>
                    <option value="Uncle / Aunt">Uncle / Aunt</option>
                    <option value="Cousin / Relative">Cousin / Relative</option>
                    <option value="Close Friend">Close Friend</option>
                  </select>
                  <input
                    type="tel"
                    value={kin2.phone}
                    onChange={(e) => setKin2(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Mobile Phone"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Kin 3 */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-black text-cyan-800 block">3. Next of Kin 3</span>
                  <input
                    type="text"
                    value={kin3.name}
                    onChange={(e) => setKin3(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full Name"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                  <select
                    value={kin3.relationship}
                    onChange={(e) => setKin3(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="Spouse / Partner">Spouse / Partner</option>
                    <option value="Parent / Guardian">Parent / Guardian</option>
                    <option value="Sibling (Brother/Sister)">Sibling (Brother/Sister)</option>
                    <option value="Child (Adult Son/Daughter)">Child (Adult Son/Daughter)</option>
                    <option value="Uncle / Aunt">Uncle / Aunt</option>
                    <option value="Cousin / Relative">Cousin / Relative</option>
                    <option value="Close Friend">Close Friend</option>
                  </select>
                  <input
                    type="tel"
                    value={kin3.phone}
                    onChange={(e) => setKin3(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Mobile Phone"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* SUPERVISOR REFERENCE */}
            <div className="pt-3 border-t border-slate-200">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-2.5">
                Delivery Hub Supervisor / Fleet Reference
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supervisor / Hub Manager Name
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="e.g. Peter Khumalo / Sibusiso"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Supervisor Phone Number
                  </label>
                  <input
                    type="tel"
                    value={supervisorPhone}
                    onChange={(e) => setSupervisorPhone(e.target.value)}
                    placeholder="082 555 0192"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION 3: DELIVERY PLATFORMS & EXPERIENCE */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <Briefcase className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                3. Delivery Apps & Income
              </h3>
            </div>

            {/* Delivery Apps selector (Styled badges from screenshot) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Active Delivery Apps (Select all that apply):
              </label>
              <div className="flex flex-wrap gap-2">
                {DELIVERY_PLATFORMS.map((app) => {
                  const isSelected = selectedApps.includes(app.id);
                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => toggleDeliveryApp(app.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? `${app.color} ring-2 ring-cyan-500 shadow-xs font-black`
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 text-cyan-600" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                      <span>{app.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
              {/* Experience */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Experience
                </label>
                <select
                  value={deliveryExperience}
                  onChange={(e) => setDeliveryExperience(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="Starting Fresh">Starting Fresh / New Rider</option>
                  <option value="< 6 months">&lt; 6 months</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3+ years">3+ years</option>
                </select>
              </div>

              {/* Weekly Earnings */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Weekly Earnings
                </label>
                <select
                  value={weeklyEarningsBracket}
                  onChange={(e) => setWeeklyEarningsBracket(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="R1000-R2000">R1000 - R2000 / week</option>
                  <option value="R2000-R3500">R2000 - R3500 / week</option>
                  <option value="R3500-R5000">R3500 - R5000 / week</option>
                  <option value="R5000+">R5000+ / week</option>
                </select>
              </div>

              {/* Referred By */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Referred By
                </label>
                <input
                  type="text"
                  value={referredBy}
                  onChange={(e) => setReferredBy(e.target.value)}
                  placeholder="Referral Rider / Agent"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Credit Score */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Credit Score
                </label>
                <input
                  type="text"
                  value={creditScore}
                  onChange={(e) => setCreditScore(e.target.value)}
                  placeholder="650"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION 4: MOTORBIKE LEASE PACKAGE */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <BikeIcon className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                4. Select Motorbike Package
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Bike Model Select */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motorbike Model
                </label>
                {bikes.length > 0 ? (
                  <select
                    value={selectedBikeId}
                    onChange={(e) => setSelectedBikeId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  >
                    {bikes.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={customBikeName}
                    onChange={(e) => setCustomBikeName(e.target.value)}
                    placeholder="e.g. Commercial Delivery Motorbike (150cc)"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                  />
                )}
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bike Condition
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBikeCondition('new');
                      setTermMonths(18);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      bikeCondition === 'new'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Brand New
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBikeCondition('used');
                      setTermMonths(20);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      bikeCondition === 'used'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Quality Used
                  </button>
                </div>
              </div>

              {/* Term Duration */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rent-to-Own Term
                </label>
                <select
                  value={termMonths}
                  onChange={(e) => setTermMonths(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  {bikeCondition === 'new' ? (
                    <>
                      <option value={15}>15 Months</option>
                      <option value={18}>18 Months (Standard)</option>
                    </>
                  ) : (
                    <option value={20}>20 Months (Standard)</option>
                  )}
                </select>
              </div>
            </div>

            {/* Calculated Pricing Summary */}
            <div className="grid grid-cols-3 gap-2 bg-slate-900 text-white p-3.5 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Weekly Rent</span>
                <span className="text-sm sm:text-base font-black text-cyan-400 font-mono">R{weeklyRate}/wk</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Deposit</span>
                <span className="text-sm sm:text-base font-black text-amber-400 font-mono">R{depositAmount}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Term</span>
                <span className="text-sm sm:text-base font-black text-white font-mono">{termMonths} Mos</span>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION 5: DOCUMENT UPLOAD & CAPTURE (Requested Feature) */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-600" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  5. Upload & Capture Documents
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Snap photo from mobile or upload from computer
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {/* Document 1: ID / Passport */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      {citizenship === 'south_african' ? 'SA ID Document (Front)' : 'Passport Bio Page'}
                    </span>
                    {uploadedDocs.idDocumentFront || uploadedDocs.passport ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-500 font-bold">Required</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Smart ID card, green ID book, or passport bio page.
                  </p>

                  {/* Thumbnail */}
                  {(uploadedDocs.idDocumentFront || uploadedDocs.passport) && (
                    <div className="mt-2 h-24 bg-slate-950 rounded-lg overflow-hidden relative group">
                      <img
                        src={uploadedDocs.idDocumentFront || uploadedDocs.passport}
                        alt="ID Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeDocument(citizenship === 'south_african' ? 'idDocumentFront' : 'passport')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-xs hover:bg-rose-700"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRefs.idDocumentFront}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, citizenship === 'south_african' ? 'idDocumentFront' : 'passport')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingDocKey === 'idDocumentFront' || uploadingDocKey === 'passport'}
                    onClick={() => fileInputRefs.idDocumentFront.current?.click()}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploadingDocKey === 'idDocumentFront' || uploadingDocKey === 'passport' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                    )}
                    <span>{uploadedDocs.idDocumentFront || uploadedDocs.passport ? 'Replace ID Photo' : 'Upload ID / Passport'}</span>
                  </button>
                </div>
              </div>

              {/* Document 2: Driver's License */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      Motorcycle Driver's License
                    </span>
                    {uploadedDocs.driversLicenseFront ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-bold">Code A/A1</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Valid Code A or A1 motorcycle license card.
                  </p>

                  {/* Thumbnail */}
                  {uploadedDocs.driversLicenseFront && (
                    <div className="mt-2 h-24 bg-slate-950 rounded-lg overflow-hidden relative group">
                      <img
                        src={uploadedDocs.driversLicenseFront}
                        alt="License Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeDocument('driversLicenseFront')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-xs hover:bg-rose-700"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRefs.driversLicenseFront}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'driversLicenseFront')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingDocKey === 'driversLicenseFront'}
                    onClick={() => fileInputRefs.driversLicenseFront.current?.click()}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploadingDocKey === 'driversLicenseFront' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                    )}
                    <span>{uploadedDocs.driversLicenseFront ? 'Replace License' : 'Upload License'}</span>
                  </button>
                </div>
              </div>

              {/* Document 3: Asylum Seeker / Work Permit Document */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      Asylum / Work Permit
                    </span>
                    {uploadedDocs.asylumDocument ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Foreign National</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Home Affairs valid Asylum seeker or Work Visa paper.
                  </p>

                  {/* Thumbnail */}
                  {uploadedDocs.asylumDocument && (
                    <div className="mt-2 h-24 bg-slate-950 rounded-lg overflow-hidden relative group">
                      <img
                        src={uploadedDocs.asylumDocument}
                        alt="Asylum Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeDocument('asylumDocument')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-xs hover:bg-rose-700"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRefs.asylumDocument}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'asylumDocument')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingDocKey === 'asylumDocument'}
                    onClick={() => fileInputRefs.asylumDocument.current?.click()}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploadingDocKey === 'asylumDocument' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                    )}
                    <span>{uploadedDocs.asylumDocument ? 'Replace Asylum/Permit' : 'Upload Asylum / Permit'}</span>
                  </button>
                </div>
              </div>

              {/* Document 4: Traffic Register Certificate (TRN) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      Traffic Register (TRN)
                    </span>
                    {uploadedDocs.trafficRegisterCertificate ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 font-bold">Mandatory for TRN</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Official certificate from DLTC / Licensing Department.
                  </p>

                  {/* Thumbnail */}
                  {uploadedDocs.trafficRegisterCertificate && (
                    <div className="mt-2 h-24 bg-slate-950 rounded-lg overflow-hidden relative group">
                      <img
                        src={uploadedDocs.trafficRegisterCertificate}
                        alt="TRN Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeDocument('trafficRegisterCertificate')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-xs hover:bg-rose-700"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRefs.trafficRegisterCertificate}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'trafficRegisterCertificate')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingDocKey === 'trafficRegisterCertificate'}
                    onClick={() => fileInputRefs.trafficRegisterCertificate.current?.click()}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploadingDocKey === 'trafficRegisterCertificate' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                    )}
                    <span>{uploadedDocs.trafficRegisterCertificate ? 'Replace TRN' : 'Upload TRN Certificate'}</span>
                  </button>
                </div>
              </div>

              {/* Document 5: Proof of Residence */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">
                      Proof of Residence
                    </span>
                    {uploadedDocs.proofOfResidence ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Uploaded
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Utility / Lease</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Recent utility bill, rental affidavit, or store statement.
                  </p>

                  {/* Thumbnail */}
                  {uploadedDocs.proofOfResidence && (
                    <div className="mt-2 h-24 bg-slate-950 rounded-lg overflow-hidden relative group">
                      <img
                        src={uploadedDocs.proofOfResidence}
                        alt="Proof Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeDocument('proofOfResidence')}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md shadow-xs hover:bg-rose-700"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    ref={fileInputRefs.proofOfResidence}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'proofOfResidence')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingDocKey === 'proofOfResidence'}
                    onClick={() => fileInputRefs.proofOfResidence.current?.click()}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-cyan-50 hover:text-cyan-900 text-slate-700 font-bold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {uploadingDocKey === 'proofOfResidence' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5 text-cyan-600" />
                    )}
                    <span>{uploadedDocs.proofOfResidence ? 'Replace Proof' : 'Upload Proof of Address'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SECTION 6: ON-SITE STAFF CHECKLIST & STATUS */}
          {/* ------------------------------------------------------------- */}
          <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-600" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                6. Staff Underwriting & Initial Stage
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white border border-slate-200">
                <input
                  type="checkbox"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="rounded text-cyan-600"
                />
                <span className="font-semibold text-slate-800">1. ID Checked</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white border border-slate-200">
                <input
                  type="checkbox"
                  checked={licenseVerified}
                  onChange={(e) => setLicenseVerified(e.target.checked)}
                  className="rounded text-cyan-600"
                />
                <span className="font-semibold text-slate-800">2. License Checked</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white border border-slate-200">
                <input
                  type="checkbox"
                  checked={trnVerified}
                  onChange={(e) => setTrnVerified(e.target.checked)}
                  className="rounded text-cyan-600"
                />
                <span className="font-semibold text-slate-800">3. TRN Validated</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-white border border-slate-200">
                <input
                  type="checkbox"
                  checked={proofVerified}
                  onChange={(e) => setProofVerified(e.target.checked)}
                  className="rounded text-cyan-600"
                />
                <span className="font-semibold text-slate-800">4. Proof Checked</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Pipeline Status
                </label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                >
                  <option value="pending_review">Pending Review</option>
                  <option value="needs_more_info">Needs Info / Missing TRN</option>
                  <option value="approved_for_collection">Approved for Collection</option>
                  <option value="contract_signed">Contract Signed / Delivered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assign Motorbike Plate / Reg (Optional)
                </label>
                <input
                  type="text"
                  value={assignedPlate}
                  onChange={(e) => setAssignedPlate(e.target.value)}
                  placeholder="e.g. KC 48 NM GP"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Internal Staff Notes
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes regarding deposit payment, physical inspection, delivery app schedule..."
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Bar */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white sticky bottom-0">
            <div className="text-xs text-slate-500">
              Customer record will immediately synchronize with the Pipeline Board and cloud database.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black text-xs transition-colors shadow-md flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Adding Customer...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Add Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
