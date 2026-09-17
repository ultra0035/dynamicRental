import React, { useState } from 'react';
import { RiderApplication, Bike, BikeCondition, ApplicationStatus, CitizenshipType } from '../types';
import { 
  X, 
  User, 
  Phone, 
  MapPin, 
  Bike as BikeIcon, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Calendar,
  Briefcase,
  ShieldCheck
} from 'lucide-react';

interface WalkInApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  bikes: Bike[];
  onSubmit: (newApp: RiderApplication) => Promise<void> | void;
}

export const WalkInApplicantModal: React.FC<WalkInApplicantModalProps> = ({
  isOpen,
  onClose,
  bikes,
  onSubmit,
}) => {
  if (!isOpen) return null;

  // Selected bike model
  const defaultBike = bikes.find(b => b.isAvailable) || bikes[0] || {
    id: 'bajaj-boxer-150',
    name: 'Bajaj Boxer 150 HD',
    pricing: {
      new: { weeklyPayment: 750, deposit: 1000, termMonthsOptions: [15, 18] },
      used: { weeklyPayment: 650, deposit: 650, termMonths: 20 }
    }
  };

  const [selectedBikeId, setSelectedBikeId] = useState<string>(defaultBike.id);
  const [bikeCondition, setBikeCondition] = useState<BikeCondition>('new');
  const [termMonths, setTermMonths] = useState<number>(18);

  // Rider details
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [sameAsPhone, setSameAsPhone] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [citizenship, setCitizenship] = useState<CitizenshipType>('south_african');
  const [idOrPassportNumber, setIdOrPassportNumber] = useState<string>('');
  const [nationalityCountry, setNationalityCountry] = useState<string>('Zimbabwe');
  
  // Residence
  const [address, setAddress] = useState<string>('');
  const [suburb, setSuburb] = useState<string>('Randburg');
  const [city, setCity] = useState<string>('Johannesburg');

  // Work & Experience
  const [primaryPlatform, setPrimaryPlatform] = useState<string>('Checkers Sixty60');
  const [deliveryExperience, setDeliveryExperience] = useState<string>('1-2 years');
  const [approxWeeklyEarnings, setApproxWeeklyEarnings] = useState<number>(3800);
  
  // Intake Status & Notes
  const [initialStatus, setInitialStatus] = useState<ApplicationStatus>('pending_review');
  const [assignedPlate, setAssignedPlate] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('Walk-in applicant registered at Randburg showroom.');
  
  // Document verification on-site
  const [idVerified, setIdVerified] = useState<boolean>(true);
  const [licenseVerified, setLicenseVerified] = useState<boolean>(false);
  const [trnVerified, setTrnVerified] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Active bike calculation
  const activeBike = bikes.find(b => b.id === selectedBikeId) || defaultBike;
  const weeklyRate = bikeCondition === 'new' 
    ? (activeBike.pricing?.new?.weeklyPayment || 750) 
    : (activeBike.pricing?.used?.weeklyPayment || 650);
  const depositAmount = bikeCondition === 'new' 
    ? (activeBike.pricing?.new?.deposit || 1000) 
    : (activeBike.pricing?.used?.deposit || 650);

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
      setErrorMsg('Please enter ID or Passport number');
      return;
    }

    setIsSubmitting(true);
    try {
      const walkinRef = `DR-WLK-${Math.floor(1000 + Math.random() * 9000)}`;
      const nowIso = new Date().toISOString();

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
        email: email.trim() || 'walkin@dynamicrental.co.za',
        citizenship,
        idOrPassportNumber: idOrPassportNumber.trim(),
        nationalityCountry: citizenship !== 'south_african' ? nationalityCountry : undefined,
        address: address.trim() || 'Showroom Walk-in',
        suburb: suburb.trim() || 'Randburg',
        city: city.trim() || 'Johannesburg',
        primaryPlatform,
        deliveryExperience,
        approxWeeklyEarnings: Number(approxWeeklyEarnings) || 3500,
        documents: {},
        verification: {
          idVerified,
          licenseVerified,
          workPermitVerified: citizenship !== 'south_african',
          trafficRegisterVerified: trnVerified,
          proofVerified: true,
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
            description: `Driver visited Randburg showroom. Selected ${activeBike.name} (${bikeCondition.toUpperCase()}) at R${weeklyRate}/wk.`,
          },
        ],
      };

      await onSubmit(newApp);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save walk-in applicant.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" id="walkin-modal">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">Showroom Walk-in Intake</h3>
              <p className="text-xs text-slate-400">Log an in-person rider application directly into the system</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div>
            <h4 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyan-600" />
              <span>1. Rider Personal Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Legal Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Ndlovu or Aaron Mutsvanga"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone / Mobile <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 083 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 083 123 4567"
                  value={sameAsPhone ? phone : whatsappNumber}
                  disabled={sameAsPhone}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium outline-hidden ${
                    sameAsPhone ? 'bg-slate-100 text-slate-500' : 'focus:border-cyan-500 text-slate-900'
                  }`}
                />
                <label className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Same as phone number</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Citizenship Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={citizenship}
                  onChange={(e) => setCitizenship(e.target.value as CitizenshipType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-sm font-medium text-slate-900 bg-white outline-hidden"
                >
                  <option value="south_african">South African Citizen (SA ID)</option>
                  <option value="foreign_national">Foreign National (Passport & Asylum/Work Permit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {citizenship === 'south_african' ? 'SA ID Number' : 'Passport / Asylum Permit Number'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={citizenship === 'south_african' ? '13-digit SA ID' : 'Passport / Permit No.'}
                  value={idOrPassportNumber}
                  onChange={(e) => setIdOrPassportNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-hidden"
                />
              </div>

              {citizenship !== 'south_african' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={nationalityCountry}
                    onChange={(e) => setNationalityCountry(e.target.value)}
                    placeholder="e.g. Zimbabwe, Malawi, Mozambique"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-sm font-medium text-slate-900 outline-hidden"
                  />
                </div>
              )}

              <div className={citizenship !== 'south_african' ? '' : 'sm:col-span-2'}>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Residential Suburb / Area (JHB)
                </label>
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  placeholder="e.g. Randburg, Ferndale, Windsor, Soweto"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-sm font-medium text-slate-900 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Courier Platform & Bike Selection */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <BikeIcon className="w-3.5 h-3.5 text-cyan-600" />
              <span>2. Delivery Work & Bike Model</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Primary Delivery Platform
                </label>
                <select
                  value={primaryPlatform}
                  onChange={(e) => setPrimaryPlatform(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-sm font-medium text-slate-900 bg-white outline-hidden"
                >
                  <option value="Checkers Sixty60">Checkers Sixty60</option>
                  <option value="Uber Eats">Uber Eats</option>
                  <option value="Takealot">Takealot</option>
                  <option value="Mr D Food">Mr D Food</option>
                  <option value="Bolt Food">Bolt Food</option>
                  <option value="Private Courier">Private Courier / Independent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motorbike Model
                </label>
                <select
                  value={selectedBikeId}
                  onChange={(e) => setSelectedBikeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-sm font-medium text-slate-900 bg-white outline-hidden font-bold"
                >
                  {bikes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Condition & Pricing Tier
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBikeCondition('new');
                      setTermMonths(18);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                      bikeCondition === 'new'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>Brand New</div>
                    <div className="text-[11px] font-black text-cyan-700">R750/wk • R1k Dep</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBikeCondition('used');
                      setTermMonths(20);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border text-center transition-all ${
                      bikeCondition === 'used'
                        ? 'border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-400'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>Demo / Refurbished</div>
                    <div className="text-[11px] font-black text-slate-600">R650/wk • R650 Dep</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contract Term Length
                </label>
                <select
                  value={termMonths}
                  onChange={(e) => setTermMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-sm font-medium text-slate-900 bg-white outline-hidden"
                >
                  <option value={12}>12 Months (Fast-Track Ownership)</option>
                  <option value={15}>15 Months</option>
                  <option value={18}>18 Months (Standard Rent-to-Own)</option>
                  <option value={20}>20 Months</option>
                  <option value={24}>24 Months</option>
                </select>
              </div>
            </div>

            {/* Pricing Summary Box */}
            <div className="mt-3.5 p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-semibold">Calculated Contract Rates:</div>
                <div className="text-sm font-black text-white">{activeBike.name} • {bikeCondition === 'new' ? 'New' : 'Used'}</div>
              </div>
              <div className="text-right">
                <div className="text-base font-black text-cyan-400">R{weeklyRate} <span className="text-xs text-slate-300 font-normal">/ week</span></div>
                <div className="text-xs text-amber-300 font-bold">Deposit: R{depositAmount}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Status & On-Site Verification */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
              <span>3. Intake Stage & On-Site Checks</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Initial Pipeline Stage
                </label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as ApplicationStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-sm font-bold text-slate-900 bg-white outline-hidden"
                >
                  <option value="pending_review">Pending Review (Awaiting Full Vetting)</option>
                  <option value="approved_for_collection">Approved for Collection (Ready to Handover)</option>
                  <option value="needs_more_info">Needs Info / Missing TRN Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Assigned Bike Number / VIN (Optional)
                </label>
                <input
                  type="text"
                  value={assignedPlate}
                  onChange={(e) => setAssignedPlate(e.target.value)}
                  placeholder="e.g. Boxer White #04 / GP-77-BX-JHB"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-cyan-500 text-sm font-medium text-slate-900 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Receptionist / Staff Notes
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes from in-person conversation, deposit payment status, documents shown..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-cyan-500 text-xs font-medium text-slate-900 outline-hidden"
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idVerified}
                    onChange={(e) => setIdVerified(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Original ID / Passport Inspected</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={licenseVerified}
                    onChange={(e) => setLicenseVerified(e.target.checked)}
                    className="rounded text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Motorcycle License Checked</span>
                </label>
                {citizenship !== 'south_african' && (
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trnVerified}
                      onChange={(e) => setTrnVerified(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>TRN Certificate Checked</span>
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-5 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register Walk-in Driver</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
