import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  RiderApplication, 
  BikeCondition, 
  CitizenshipType, 
  ApplicationDocuments,
  Bike
} from '../types';
import { FileUploadBox } from './FileUploadBox';
import { SignaturePad } from './SignaturePad';
import { 
  CheckCircle2, 
  Sparkles, 
  ShieldAlert, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Bike as BikeIcon, 
  User, 
  FileText, 
  PenTool, 
  MessageSquare, 
  MapPin, 
  Check, 
  Clock, 
  Phone, 
  Copy,
  Printer
} from 'lucide-react';

interface ApplicationFormProps {
  bikes: Bike[];
  initialBikeId?: string;
  initialCondition?: BikeCondition;
  initialTerm?: number;
  onApplicationSubmitted: (application: RiderApplication) => Promise<void> | void;
  onViewStatus: (refNumber: string) => void;
  onViewContract?: (application: RiderApplication) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  bikes,
  initialBikeId = 'bajaj-boxer-150',
  initialCondition = 'new',
  initialTerm = 18,
  onApplicationSubmitted,
  onViewStatus,
  onViewContract,
}) => {
  // Wizard Step: 1: Bike Selection | 2: Personal & Work | 3: Documents | 4: Agreement & Sign | 5: Completed
  const [step, setStep] = useState<number>(1);

  // Form State
  const [bikeId, setBikeId] = useState<string>(initialBikeId);
  const [condition, setCondition] = useState<BikeCondition>(initialCondition);
  const [termMonths, setTermMonths] = useState<number>(initialTerm);

  // Applicant info
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [whatsappNumber, setWhatsappNumber] = useState<string>('');
  const [sameWhatsapp, setSameWhatsapp] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [citizenship, setCitizenship] = useState<CitizenshipType>('south_african');
  const [nationalityCountry, setNationalityCountry] = useState<string>('Zimbabwe');
  const [idOrPassportNumber, setIdOrPassportNumber] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [suburb, setSuburb] = useState<string>('Randburg');
  const [primaryPlatform, setPrimaryPlatform] = useState<string>('Checkers Sixty60');
  const [deliveryExperience, setDeliveryExperience] = useState<string>('1-2 years');
  const [approxWeeklyEarnings, setApproxWeeklyEarnings] = useState<number>(4500);

  // Documents
  const [documents, setDocuments] = useState<ApplicationDocuments>({});

  // Agreement
  const [depositAcknowledged, setDepositAcknowledged] = useState<boolean>(false);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  // Submitted Application result & UI states
  const [submittedApp, setSubmittedApp] = useState<RiderApplication | null>(null);
  const [copiedRef, setCopiedRef] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedBike = bikes.find((b) => b.id === bikeId) || bikes[0];
  const isElectric = selectedBike?.category === 'electric';
  const weeklyRate = condition === 'new' 
    ? (selectedBike?.pricing?.new?.weeklyPayment || 750) 
    : (selectedBike?.pricing?.used?.weeklyPayment || 650);
  const depositAmount = condition === 'new' 
    ? (selectedBike?.pricing?.new?.deposit || 1000) 
    : (selectedBike?.pricing?.used?.deposit || 650);

  // Auto update term options when condition / bike changes
  const handleConditionChange = (newCond: BikeCondition) => {
    setCondition(newCond);
    if (isElectric) {
      setTermMonths(20);
    } else if (newCond === 'new') {
      setTermMonths(18);
    } else {
      setTermMonths(20);
    }
  };

  const handleBikeChange = (newBikeId: string) => {
    setBikeId(newBikeId);
    const bike = bikes.find((b) => b.id === newBikeId);
    if (bike?.category === 'electric') {
      setTermMonths(20);
    }
  };

  // Validation before advancing steps
  const handleNext = () => {
    setErrorMsg('');

    if (step === 1) {
      if (!bikeId) {
        setErrorMsg('Please select a bike to continue.');
        return;
      }
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 2) {
      if (!fullName.trim()) {
        setErrorMsg('Please enter your full name as it appears on your ID/Passport.');
        return;
      }
      if (!phone.trim()) {
        setErrorMsg('Please enter your primary mobile phone number.');
        return;
      }
      if (!idOrPassportNumber.trim()) {
        setErrorMsg(
          citizenship === 'south_african'
            ? 'Please enter your 13-digit South African ID Number.'
            : 'Please enter your Passport Number.'
        );
        return;
      }
      if (!address.trim() || !suburb.trim()) {
        setErrorMsg('Please provide your residential address and suburb in Gauteng.');
        return;
      }
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step === 3) {
      if (citizenship === 'south_african') {
        if (!documents.idDocumentFront) {
          setErrorMsg('Please upload a photo of your South African ID.');
          return;
        }
        if (!documents.driversLicense) {
          setErrorMsg("Please upload your Motorcycle Driver's License.");
          return;
        }
      } else {
        if (!documents.passport) {
          setErrorMsg('Please upload your Passport photo page.');
          return;
        }
        if (!documents.workPermit) {
          setErrorMsg('Please upload your valid Work Permit or Asylum/Visa document.');
          return;
        }
        if (!documents.driversLicense) {
          setErrorMsg("Please upload your Driver's License.");
          return;
        }
        if (!documents.trafficRegisterCertificate) {
          setErrorMsg('Mandatory: Traffic Register Number (TRN) certificate is required for foreign license verification.');
          return;
        }
      }
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
  };

  // Final Submit Application Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!depositAcknowledged) {
      setErrorMsg(`Please acknowledge the R${depositAmount} deposit payable upon contract signing.`);
      return;
    }
    if (!termsAgreed) {
      setErrorMsg('Please agree to the rent-to-own terms and conditions.');
      return;
    }
    if (!signatureDataUrl) {
      setErrorMsg('Please provide your digital signature using the signature box below.');
      return;
    }

    setIsSubmitting(true);

    const refNum = `DR-${Math.floor(1000 + Math.random() * 9000)}-JHB`;
    const newApp: RiderApplication = {
      id: `app_${Date.now()}`,
      refNumber: refNum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending_review',
      bikeId,
      bikeName: selectedBike?.name || 'Bajaj Boxer 150 HD',
      bikeCondition: condition,
      termMonths,
      weeklyRate,
      depositAmount,
      fullName: fullName.trim(),
      phone: phone.trim(),
      whatsappNumber: (sameWhatsapp ? phone : whatsappNumber).trim(),
      email: email.trim(),
      citizenship,
      idOrPassportNumber: idOrPassportNumber.trim(),
      nationalityCountry: citizenship === 'foreign_national' ? nationalityCountry : undefined,
      address: address.trim(),
      suburb: suburb.trim(),
      city: 'Randburg / Johannesburg',
      primaryPlatform,
      deliveryExperience,
      approxWeeklyEarnings,
      documents,
      verification: {
        idVerified: false,
        licenseVerified: false,
        workPermitVerified: false,
        trafficRegisterVerified: false,
      },
      signatureDataUrl,
      depositAcknowledged: true,
      termsAgreed: true,
      timeline: [
        {
          timestamp: new Date().toISOString(),
          status: 'pending_review',
          title: 'Application Submitted Online',
          description: 'Document package received and placed in Randburg dealer verification queue.',
        },
      ],
    };

    try {
      await onApplicationSubmitted(newApp);
      setSubmittedApp(newApp);
      setStep(5);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0052FF', '#00C49F', '#FFBB28', '#FF8042'],
        });
      } catch (err) {
        // ignore
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyRef = () => {
    if (!submittedApp) return;
    navigator.clipboard.writeText(submittedApp.refNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  };

  // Generate WhatsApp Direct Pre-filled URL
  const generateWhatsAppMessage = () => {
    if (!submittedApp) return '';
    const text = `Hi Dynamic Rental Team! 🏍️

I just completed my online Rent-to-Own bike application on your website.

*Application Ref:* ${submittedApp.refNumber}
*Applicant:* ${submittedApp.fullName}
*Bike:* ${submittedApp.bikeName} (${submittedApp.bikeCondition.toUpperCase()})
*Weekly Rate:* R${submittedApp.weeklyRate}/week
*Deposit at Signing:* R${submittedApp.depositAmount}
*Delivery Platform:* ${submittedApp.primaryPlatform}

All my documents & signature are uploaded. Please let me know once approved for collection at 304 Tungsten Rd, Randburg!`;

    return `https://wa.me/${COMPANY_DETAILS.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
  };

  // Sample Documents Auto-Populate for Demonstration
  const handleAutoFillSampleDocs = () => {
    if (citizenship === 'south_african') {
      setDocuments({
        idDocumentFront: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        idDocumentBack: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        driversLicense: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        proofOfEarnings: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      });
    } else {
      setDocuments({
        passport: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        workPermit: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        driversLicense: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
        trafficRegisterCertificate: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
        proofOfEarnings: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8" id="application-flow">
      {/* Step Indicator Header (Steps 1 - 4) */}
      {step < 5 && (
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>2-MINUTE FAST-TRACK APPLICATION</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Randburg Rent-to-Own Application
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm">
                Complete 4 simple steps to get pre-approved and collect your bike today.
              </p>
            </div>

            {/* Step Counter Pills */}
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
              {[
                { num: 1, label: 'Bike', icon: BikeIcon },
                { num: 2, label: 'Profile', icon: User },
                { num: 3, label: 'Docs', icon: FileText },
                { num: 4, label: 'Sign', icon: PenTool },
              ].map((s) => {
                const Icon = s.icon;
                const isCurrent = step === s.num;
                const isPassed = step > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => {
                      if (isPassed) setStep(s.num);
                    }}
                    disabled={!isPassed && !isCurrent}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer'
                        : 'text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isPassed ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Icon className="w-3.5 h-3.5" />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.num}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">{errorMsg}</div>
        </div>
      )}

      {/* STEP 1: BIKE & TERMS SELECTION */}
      {step === 1 && (
        <div className="flex flex-col gap-6" id="form-step-1">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
            <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <BikeIcon className="w-5 h-5 text-blue-600" />
              <span>Step 1: Choose Your Bike & Rent-to-Own Terms</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Select your preferred motorbike model, condition, and ownership timeline.
            </p>

            {/* Bike Grid Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {bikes.filter(b => !b.isComingSoon).map((b) => {
                const isSelected = bikeId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => handleBikeChange(b.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={b.image}
                        alt={b.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          {b.brand}
                        </span>
                        <div className="text-sm font-bold text-slate-900 truncate mt-1">{b.name}</div>
                        <div className="text-xs text-slate-500">{b.engineCapacity}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
                      <span className="text-slate-500">Weekly:</span>
                      <span className="font-bold text-blue-600 font-mono">
                        R{condition === 'new' ? 750 : 650}/wk
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Condition Toggle */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-700 mb-2 block">
                Select Bike Condition:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => handleConditionChange('new')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    condition === 'new'
                      ? 'border-blue-500 bg-blue-50/80 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      condition === 'new' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                    }`}>
                      {condition === 'new' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Brand New Motorbike</div>
                      <div className="text-xs text-slate-500">15 or 18 Month Term Options</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-blue-600 font-mono">R750/wk</div>
                    <div className="text-[11px] text-amber-800 font-semibold font-mono">R1,000 Deposit</div>
                  </div>
                </div>

                <div
                  onClick={() => handleConditionChange('used')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                    condition === 'used'
                      ? 'border-cyan-500 bg-cyan-50/80 shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      condition === 'used' ? 'border-cyan-600 bg-cyan-600' : 'border-slate-300'
                    }`}>
                      {condition === 'used' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Pre-Owned (Used)</div>
                      <div className="text-xs text-slate-500">20 Month Term · Workshop Tested</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-cyan-700 font-mono">R650/wk</div>
                    <div className="text-[11px] text-amber-800 font-semibold font-mono">R650 Deposit</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ownership Term Duration */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-700 mb-2 block">
                Select Term to 100% Full Ownership:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {isElectric ? (
                  <button
                    type="button"
                    onClick={() => setTermMonths(20)}
                    className="p-3.5 rounded-xl border border-blue-500 bg-blue-50 text-blue-900 text-left font-bold"
                  >
                    <div className="text-sm">20 Months</div>
                    <div className="text-[11px] text-blue-700">Standard Electric Term</div>
                  </button>
                ) : condition === 'new' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setTermMonths(18)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        termMonths === 18
                          ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-sm">18 Months (Recommended)</div>
                      <div className="text-[11px] text-slate-500">Standard New Bike Term</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTermMonths(15)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        termMonths === 15
                          ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-sm">15 Months (Fast Payoff)</div>
                      <div className="text-[11px] text-slate-500">Quick ownership transfer</div>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTermMonths(20)}
                    className="p-3.5 rounded-xl border border-blue-500 bg-blue-50 text-blue-900 text-left font-bold"
                  >
                    <div className="text-sm">20 Months</div>
                    <div className="text-[11px] text-blue-700">Standard Pre-Owned Term</div>
                  </button>
                )}
              </div>
            </div>

            {/* Summary Highlights Card */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-500 font-medium">Selected Package:</span>
                <div className="text-base font-black text-slate-900">
                  {selectedBike?.name} ({condition.toUpperCase()}) · {termMonths} Months
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-xs text-slate-500">Weekly Payment:</span>
                  <div className="text-lg font-black text-blue-600 font-mono">R{weeklyRate}/wk</div>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <span className="text-xs text-slate-500">Deposit Due at Signing:</span>
                  <div className="text-lg font-black text-amber-700 font-mono">R{depositAmount}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3.5 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <span>Continue to Rider Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: RIDER PERSONAL & DELIVERY PROFILE */}
      {step === 2 && (
        <div className="flex flex-col gap-6" id="form-step-2">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
            <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>Step 2: Rider Personal & Delivery Information</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter your details exactly as they appear on your identification documents.
            </p>

            {/* Nationality / Citizenship Toggle */}
            <div className="mb-6 p-4 rounded-2xl bg-blue-50/60 border border-blue-200">
              <label className="text-xs font-bold text-slate-800 mb-2 block">
                Select Your Citizenship / Identification Type:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCitizenship('south_african')}
                  className={`p-3 rounded-xl border text-left font-bold transition-all ${
                    citizenship === 'south_african'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm">🇿🇦 South African Citizen</div>
                  <div className={`text-xs mt-0.5 ${citizenship === 'south_african' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Requires SA ID + Motorcycle Driver's License
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCitizenship('foreign_national')}
                  className={`p-3 rounded-xl border text-left font-bold transition-all ${
                    citizenship === 'foreign_national'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-sm">🌍 Non-South African / Foreign National</div>
                  <div className={`text-xs mt-0.5 ${citizenship === 'foreign_national' ? 'text-blue-100' : 'text-slate-500'}`}>
                    Requires Passport, Work Permit, License & Traffic Register (TRN)
                  </div>
                </button>
              </div>
            </div>

            {/* Input Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Full Name & Surname *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sipho Ndlovu or Tinashe Moyo"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Primary Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 071 054 2015"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rider@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white"
                />
              </div>

              {citizenship === 'south_african' ? (
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1 block">
                    13-Digit South African ID Number *
                  </label>
                  <input
                    type="text"
                    maxLength={13}
                    value={idOrPassportNumber}
                    onChange={(e) => setIdOrPassportNumber(e.target.value)}
                    placeholder="e.g. 9501015800084"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 font-mono bg-white"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Nationality / Country of Origin *
                    </label>
                    <select
                      value={nationalityCountry}
                      onChange={(e) => setNationalityCountry(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white"
                    >
                      <option value="Zimbabwe">Zimbabwe</option>
                      <option value="Mozambique">Mozambique</option>
                      <option value="Malawi">Malawi</option>
                      <option value="Lesotho">Lesotho</option>
                      <option value="Eswatini">Eswatini</option>
                      <option value="DR Congo">DR Congo</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Other">Other African Nation</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1 block">
                      Passport Number *
                    </label>
                    <input
                      type="text"
                      value={idOrPassportNumber}
                      onChange={(e) => setIdOrPassportNumber(e.target.value)}
                      placeholder="e.g. FN1234567"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 font-mono bg-white"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Residential Street Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 45 Republic Rd, Apt 12"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Suburb / Area in Gauteng *
                </label>
                <input
                  type="text"
                  value={suburb}
                  onChange={(e) => setSuburb(e.target.value)}
                  placeholder="e.g. Randburg, Ferndale, Strijdom Park"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Primary Delivery Platform *
                </label>
                <select
                  value={primaryPlatform}
                  onChange={(e) => setPrimaryPlatform(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white font-semibold"
                >
                  <option value="Checkers Sixty60">Checkers Sixty60</option>
                  <option value="Uber Eats">Uber Eats</option>
                  <option value="Takealot">Takealot</option>
                  <option value="Mr D Food">Mr D Food</option>
                  <option value="Bolt Food">Bolt Food</option>
                  <option value="Private Courier / Fleet">Private Courier / Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Delivery Riding Experience
                </label>
                <select
                  value={deliveryExperience}
                  onChange={(e) => setDeliveryExperience(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-900 bg-white"
                >
                  <option value="Less than 6 months">Less than 6 months</option>
                  <option value="6 - 12 months">6 - 12 months</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="3+ years">3+ years (Experienced)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3.5 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <span>Continue to Documents</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: DOCUMENT UPLOADS & VERIFICATION */}
      {step === 3 && (
        <div className="flex flex-col gap-6" id="form-step-3">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Step 3: Document Verification Checklist</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload clear photos or scans of your documents. No WhatsApp paperwork delays!
                </p>
              </div>

              {/* Demo Helper to quick-populate demo sample documents */}
              <button
                type="button"
                onClick={handleAutoFillSampleDocs}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors self-start sm:self-auto"
              >
                ⚡ Auto-Fill Sample Docs (Demo)
              </button>
            </div>

            {/* Foreign License Special Notice (From WhatsApp Transcript) */}
            {citizenship === 'foreign_national' && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-amber-950 block mb-0.5">
                    ⚠️ Official Traffic Register Number (TRN) Requirement:
                  </strong>
                  As per dealership policy, applicants holding foreign driver's licenses{' '}
                  <span className="font-black underline">must provide an official Traffic Register Certificate (TRN)</span>.
                  This is strictly non-negotiable for rent-to-own motorcycle insurance and registration.
                </div>
              </div>
            )}

            {/* Document Upload Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {citizenship === 'south_african' ? (
                <>
                  <FileUploadBox
                    id="doc-sa-id-front"
                    label="South African ID (Front / ID Book)"
                    sublabel="Clear photo of your Smart ID Card (Front) or Green ID Book page"
                    required
                    value={documents.idDocumentFront}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({ ...prev, idDocumentFront: dataUrl }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({ ...prev, idDocumentFront: undefined }))
                    }
                  />

                  <FileUploadBox
                    id="doc-sa-id-back"
                    label="South African ID (Back)"
                    sublabel="Back of Smart ID card showing barcode"
                    value={documents.idDocumentBack}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({ ...prev, idDocumentBack: dataUrl }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({ ...prev, idDocumentBack: undefined }))
                    }
                  />

                  <FileUploadBox
                    id="doc-drivers-license"
                    label="Motorcycle Driver's License (Code A / A1)"
                    sublabel="Valid SA driver's license card front"
                    required
                    value={documents.driversLicense}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({ ...prev, driversLicense: dataUrl }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({ ...prev, driversLicense: undefined }))
                    }
                  />

                  <FileUploadBox
                    id="doc-proof-earnings"
                    label="Delivery App Weekly Statement / Screenshot"
                    sublabel="Screenshot of earnings from Checkers, Uber Eats, Takealot, or Mr D"
                    value={documents.proofOfEarnings}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({ ...prev, proofOfEarnings: dataUrl }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({ ...prev, proofOfEarnings: undefined }))
                    }
                  />
                </>
              ) : (
                <>
                  <FileUploadBox
                    id="doc-passport"
                    label="Passport (Bio/Photo Page)"
                    sublabel="Valid international passport document"
                    required
                    value={documents.passport}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({ ...prev, passport: dataUrl }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({ ...prev, passport: undefined }))
                    }
                  />

                  <FileUploadBox
                    id="doc-work-permit"
                    label="Work Permit / Asylum / Visa"
                    sublabel="Valid South African Department of Home Affairs document"
                    required
                    value={documents.workPermit}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({ ...prev, workPermit: dataUrl }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({ ...prev, workPermit: undefined }))
                    }
                  />

                  <FileUploadBox
                    id="doc-foreign-license"
                    label="Driver's License"
                    sublabel="Country of origin or international driver's license"
                    required
                    value={documents.driversLicense}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({ ...prev, driversLicense: dataUrl }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({ ...prev, driversLicense: undefined }))
                    }
                  />

                  <FileUploadBox
                    id="doc-traffic-register"
                    label="Traffic Register Certificate (TRN)"
                    sublabel="Traffic Register Number issued by SA Licensing Department (Non-Negotiable)"
                    badge="Mandatory"
                    required
                    value={documents.trafficRegisterCertificate}
                    onChange={(dataUrl) =>
                      setDocuments((prev) => ({
                        ...prev,
                        trafficRegisterCertificate: dataUrl,
                      }))
                    }
                    onRemove={() =>
                      setDocuments((prev) => ({
                        ...prev,
                        trafficRegisterCertificate: undefined,
                      }))
                    }
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-8 py-3.5 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              <span>Continue to Contract & Sign</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: TERMS AGREEMENT & DIGITAL TOUCH SIGNATURE */}
      {step === 4 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6" id="form-step-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-md">
            <h2 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-600" />
              <span>Step 4: Rent-to-Own Terms & Digital Signature</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Review your lease obligations and sign digitally to finalize your application.
            </p>

            {/* Contract Summary Box */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Summary of Agreed Rent-to-Own Terms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Selected Bike:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedBike?.name}</div>
                  <span className="text-[11px] text-blue-600 font-semibold">{condition.toUpperCase()}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Weekly Installment:</span>
                  <div className="font-black text-blue-600 text-sm mt-0.5 font-mono">
                    R{weeklyRate} / week
                  </div>
                  <span className="text-[11px] text-slate-500">Payable weekly</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Contract Deposit:</span>
                  <div className="font-black text-amber-700 text-sm mt-0.5 font-mono">
                    R{depositAmount} (Non-refundable)
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">Payable upon contract signing</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-500">Term to Full Ownership:</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5 font-mono">
                    {termMonths} Months
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">100% Title Transfer</span>
                </div>
              </div>
            </div>

            {/* Official Policies & Checkbox Toggles */}
            <div className="flex flex-col gap-4 mb-6">
              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={depositAcknowledged}
                  onChange={(e) => setDepositAcknowledged(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900 block">
                    Deposit Policy Acknowledgment:
                  </strong>
                  I acknowledge that the deposit of{' '}
                  <span className="font-bold text-amber-700">R{depositAmount}</span> is non-refundable and
                  payable upon signing the formal contract at the Randburg showroom (304 Tungsten Rd,
                  Strijdom Park) prior to taking custody of the motorbike.
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900 block">
                    Rent-to-Own Agreement & GPS Monitoring Terms:
                  </strong>
                  I agree to make punctual weekly payments of{' '}
                  <span className="font-bold text-blue-600">R{weeklyRate}</span> for the duration of{' '}
                  <span className="font-bold text-slate-900">{termMonths} months</span>. The motorbike
                  remains equipped with 24/7 active GPS tracking until all payments are settled and title is
                  transferred.
                </div>
              </label>
            </div>

            {/* Signature Pad */}
            <div className="mb-4">
              <SignaturePad
                id="applicant-signature-canvas"
                value={signatureDataUrl}
                onChange={setSignatureDataUrl}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-5 py-3 rounded-2xl font-bold text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-9 py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit Application Now</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* STEP 5: SUBMISSION SUCCESS SCREEN */}
      {step === 5 && submittedApp && (
        <div className="flex flex-col gap-6" id="form-step-success">
          <div className="bg-white rounded-3xl border border-emerald-200 p-6 sm:p-10 shadow-xl text-center flex flex-col items-center">
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
              ⚡ APPLICATION RECEIVED & QUEUED FOR APPROVAL
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Congratulations, {submittedApp.fullName}!
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mt-1 mb-6">
              Your 2-minute rent-to-own application for the{' '}
              <strong className="text-slate-900">{submittedApp.bikeName}</strong> has been submitted.
              All documents are sorted and ready for dealership review!
            </p>

            {/* Reference Card Box */}
            <div className="bg-blue-50/70 rounded-2xl border border-blue-200 p-5 w-full max-w-md mb-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Application Reference:</span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedRef ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="text-2xl font-black text-blue-700 font-mono tracking-wider bg-white p-3 rounded-xl border border-blue-200 text-center shadow-xs">
                {submittedApp.refNumber}
              </div>

              <div className="mt-4 pt-3 border-t border-blue-200 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500">Weekly Rate:</span>
                  <div className="font-bold text-slate-900 font-mono">R{submittedApp.weeklyRate}/week</div>
                </div>
                <div>
                  <span className="text-slate-500">Deposit at Signing:</span>
                  <div className="font-bold text-amber-800 font-mono">R{submittedApp.depositAmount}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-6">
              {/* 1-Click WhatsApp Button */}
              <a
                href={generateWhatsAppMessage()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>1-Click WhatsApp Dealership</span>
              </a>

              {/* Track Status */}
              <button
                type="button"
                onClick={() => onViewStatus(submittedApp.refNumber)}
                className="w-full py-3.5 rounded-2xl font-bold text-sm bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Track Application Status</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Next Steps List */}
            <div className="w-full max-w-md bg-slate-50 rounded-2xl p-4 text-left border border-slate-200 text-xs text-slate-600 flex flex-col gap-2">
              <strong className="font-bold text-slate-900">What happens next?</strong>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Our Randburg team reviews your documents (typically under 1 hour).</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>You receive a collection notice with appointment time.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>
                  Visit <strong>304 Tungsten Rd, Strijdom Park</strong> with original ID, pay deposit of R
                  {submittedApp.depositAmount}, sign contract, and ride away!
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
