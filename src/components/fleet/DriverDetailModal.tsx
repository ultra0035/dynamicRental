import React, { useState, useRef } from 'react';
import { Driver, Vehicle, RiderApplication, RentalAgreement, ApplicationDocuments, DocumentCheckState } from '../../types';
import { 
  User, 
  Bike as BikeIcon, 
  FileText, 
  FileCheck, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  X, 
  Phone, 
  MessageSquare, 
  CreditCard, 
  Upload, 
  Eye, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Building2, 
  Layers, 
  ExternalLink,
  Plus,
  Check,
  Download,
  Camera,
  Search,
  Key
} from 'lucide-react';
import { compressImageFile } from '../../lib/imageUtils';

interface DriverDetailModalProps {
  isOpen: boolean;
  driver: Driver | null;
  vehicles: Vehicle[];
  application?: RiderApplication;
  agreements?: RentalAgreement[];
  onClose: () => void;
  onUpdateDriver: (driver: Driver) => void;
  onChangeBike: (driverId: string, newVehicleId: string) => void;
  onRemoveBike: (driverId: string) => void;
  onOpenYocoPayment: (driver: Driver) => void;
  onQuickRegisterBikeAndAssign?: (bikeData: Partial<Vehicle>) => void;
}

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({
  isOpen,
  driver,
  vehicles,
  application,
  agreements = [],
  onClose,
  onUpdateDriver,
  onChangeBike,
  onRemoveBike,
  onOpenYocoPayment,
  onQuickRegisterBikeAndAssign,
}) => {
  if (!isOpen || !driver) return null;

  // Active Tab inside modal: 'documents' | 'vehicle' | 'handover_photos' | 'profile' | 'financials'
  const [activeModalTab, setActiveModalTab] = useState<'documents' | 'vehicle' | 'handover_photos' | 'profile' | 'financials'>('documents');

  // Documents state
  const [documents, setDocuments] = useState<ApplicationDocuments>(
    driver.documents || application?.documents || ({} as ApplicationDocuments)
  );

  // Verification state
  const [verification, setVerification] = useState<DocumentCheckState>(
    driver.verification || application?.verification || {
      idVerified: true,
      licenseVerified: true,
      trnVerified: driver.citizenship !== 'south_african',
      proofVerified: true,
      notes: '',
    }
  );

  // Bike Assignment & Switching State
  const [isChangingBike, setIsChangingBike] = useState<boolean>(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<boolean>(false);
  const [selectedNewBikeId, setSelectedNewBikeId] = useState<string>('');
  const [bikeSearchQuery, setBikeSearchQuery] = useState<string>('');
  const [isQuickAddingBike, setIsQuickAddingBike] = useState<boolean>(false);

  // Quick Add Bike Form inside modal
  const [quickMake, setQuickMake] = useState<string>('Bajaj');
  const [quickModel, setQuickModel] = useState<string>('Boxer 150 HD');
  const [quickYear, setQuickYear] = useState<number>(2025);
  const [quickPlate, setQuickPlate] = useState<string>('');
  const [quickVin, setQuickVin] = useState<string>('');
  const [quickTracker, setQuickTracker] = useState<string>('CT-88' + Math.floor(1000 + Math.random() * 9000));
  const [quickOdo, setQuickOdo] = useState<number>(0);

  // Collection / Handover Photos State
  const [collectionPhoto, setCollectionPhoto] = useState<string>(driver.collectionPhotoUrl || application?.collectionPhotoUrl || '');
  const [handoverPhotos, setHandoverPhotos] = useState<string[]>(driver.handoverPhotos || application?.handoverPhotos || []);

  // Lightbox Document / Image Preview
  const [activeDocPreview, setActiveDocPreview] = useState<{ title: string; url: string } | null>(null);
  const [uploadingDocKey, setUploadingDocKey] = useState<keyof ApplicationDocuments | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const collectionPhotoInputRef = useRef<HTMLInputElement>(null);
  const bikePhotoInputRef = useRef<HTMLInputElement>(null);

  // Currently assigned vehicle in fleet
  const assignedVehicle = vehicles.find(
    (v) => v.id === driver.assignedVehicleId || (driver.assignedBikeVinOrPlate && (v.registrationPlate === driver.assignedBikeVinOrPlate || v.vin === driver.assignedBikeVinOrPlate))
  );

  // Available in-stock vehicles
  const availableVehicles = vehicles.filter(
    (v) => v.status === 'available' && v.id !== driver.assignedVehicleId
  );

  const filteredAvailableVehicles = availableVehicles.filter(
    (v) =>
      v.registrationPlate.toLowerCase().includes(bikeSearchQuery.toLowerCase()) ||
      v.vin.toLowerCase().includes(bikeSearchQuery.toLowerCase()) ||
      v.make.toLowerCase().includes(bikeSearchQuery.toLowerCase()) ||
      v.model.toLowerCase().includes(bikeSearchQuery.toLowerCase())
  );

  // Handle Document Upload
  const handleTriggerUpload = (key: keyof ApplicationDocuments) => {
    setUploadingDocKey(key);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingDocKey) return;

    try {
      const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
      const updatedDocs = {
        ...documents,
        [uploadingDocKey]: compressed,
      };
      setDocuments(updatedDocs);

      // Sync back to driver state
      const updatedDriver: Driver = {
        ...driver,
        documents: updatedDocs,
      };
      onUpdateDriver(updatedDriver);
    } catch (err) {
      console.error('Failed to process uploaded file:', err);
    } finally {
      setUploadingDocKey(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Verification Toggle
  const handleToggleVerification = (key: keyof DocumentCheckState) => {
    const updatedVerification = {
      ...verification,
      [key]: !verification[key],
    };
    setVerification(updatedVerification);

    const updatedDriver: Driver = {
      ...driver,
      verification: updatedVerification,
    };
    onUpdateDriver(updatedDriver);
  };

  // Handle Bike Assignment / Switch
  const handleAssignBike = (vehicleId: string) => {
    onChangeBike(driver.id, vehicleId);
    setIsChangingBike(false);
    setSelectedNewBikeId('');
    
    // Update local driver representation
    const veh = vehicles.find((v) => v.id === vehicleId);
    if (veh) {
      const updatedDriver: Driver = {
        ...driver,
        assignedVehicleId: veh.id,
        assignedBikeVinOrPlate: veh.registrationPlate || veh.vin,
        assignedBikeName: `${veh.make} ${veh.model} (${veh.registrationPlate || veh.vin})`,
      };
      onUpdateDriver(updatedDriver);
    }
  };

  // Handle Bike Unassign / Remove
  const handleConfirmBikeRemove = () => {
    onRemoveBike(driver.id);
    setShowRemoveConfirm(false);
    
    const updatedDriver: Driver = {
      ...driver,
      assignedVehicleId: undefined,
      assignedBikeVinOrPlate: undefined,
      assignedBikeName: undefined,
    };
    onUpdateDriver(updatedDriver);
  };

  // Handle Quick Register & Assign Bike
  const handleQuickRegisterAndAssign = (e: React.FormEvent) => {
    e.preventDefault();
    const plate = (quickPlate || `GP-${Math.floor(10 + Math.random() * 90)}-YY-GP`).trim().toUpperCase();
    const vin = (quickVin || `MD2A${Math.random().toString(36).substring(2, 10).toUpperCase()}`).trim();

    if (onQuickRegisterBikeAndAssign) {
      onQuickRegisterBikeAndAssign({
        make: quickMake,
        model: quickModel,
        year: quickYear,
        registrationPlate: plate,
        vin,
        odometerKm: quickOdo,
        trackerDeviceId: quickTracker,
        status: 'assigned',
        assignedDriverId: driver.id,
        assignedDriverName: driver.fullName,
      });
    }

    const updatedDriver: Driver = {
      ...driver,
      assignedBikeVinOrPlate: plate,
      assignedBikeName: `${quickMake} ${quickModel} (${plate})`,
    };
    onUpdateDriver(updatedDriver);
    setIsQuickAddingBike(false);
  };

  // Handle Collection Photo Upload
  const handleCollectionPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      setCollectionPhoto(compressed);
      const updatedDriver: Driver = {
        ...driver,
        collectionPhotoUrl: compressed,
      };
      onUpdateDriver(updatedDriver);
    } catch (err) {
      console.error('Collection photo upload error:', err);
    } finally {
      if (collectionPhotoInputRef.current) collectionPhotoInputRef.current.value = '';
    }
  };

  // Handle Handover Bike Condition Photo Upload
  const handleBikePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i], { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
        newUrls.push(compressed);
      }
      const updated = [...handoverPhotos, ...newUrls];
      setHandoverPhotos(updated);
      const updatedDriver: Driver = {
        ...driver,
        handoverPhotos: updated,
      };
      onUpdateDriver(updatedDriver);
    } catch (err) {
      console.error('Handover photo upload error:', err);
    } finally {
      if (bikePhotoInputRef.current) bikePhotoInputRef.current.value = '';
    }
  };

  const handleWhatsApp = (type: 'statement' | 'arrears' | 'handover') => {
    const phone = (driver.whatsappNumber || driver.phone).replace(/[^0-9]/g, '');
    let text = '';
    if (type === 'handover') {
      text = `Hello ${driver.fullName}, your rent-to-own motorbike ${driver.assignedBikeVinOrPlate || ''} handover record is verified at Dynamic Rental Randburg. Please remember your weekly installment of R${driver.weeklyRate} is due every Monday. Drive safely!`;
    } else if (type === 'arrears') {
      text = `Hello ${driver.fullName}, this is Dynamic Rental Randburg. Your account has an overdue balance of R${driver.balanceDue.toFixed(2)}. Please settle via Yoco or Card to avoid vehicle immobilizer activation.`;
    } else {
      text = `Hello ${driver.fullName}, here is your statement summary from Dynamic Rental. Current status: ${driver.status.replace('_', ' ')}. Weekly Rate: R${driver.weeklyRate}.`;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Document definitions
  const documentCards = [
    {
      key: 'saIdFront' as keyof ApplicationDocuments,
      altKey: 'passport' as keyof ApplicationDocuments,
      fallbackKey: 'idDocumentFront' as keyof ApplicationDocuments,
      verifyKey: 'idVerified' as keyof DocumentCheckState,
      title: driver.citizenship === 'south_african' ? 'SA National ID (Front)' : 'Passport (Photo Page)',
      subtitle: driver.citizenship === 'south_african' ? 'Green Book or Smart ID Card Front' : 'Valid International Passport',
      required: true,
      category: 'Identity',
    },
    {
      key: 'saIdBack' as keyof ApplicationDocuments,
      fallbackKey: 'idDocumentBack' as keyof ApplicationDocuments,
      verifyKey: 'idVerified' as keyof DocumentCheckState,
      title: 'SA Smart ID Card (Back)',
      subtitle: 'Required for South African Smart ID cards',
      required: driver.citizenship === 'south_african',
      category: 'Identity',
    },
    {
      key: 'driversLicenseFront' as keyof ApplicationDocuments,
      fallbackKey: 'driversLicense' as keyof ApplicationDocuments,
      verifyKey: 'licenseVerified' as keyof DocumentCheckState,
      title: "Driver's License (Code A/A1 Front)",
      subtitle: 'Valid Motorcycle Driving License Card',
      required: true,
      category: 'Licensing',
    },
    {
      key: 'driversLicenseBack' as keyof ApplicationDocuments,
      verifyKey: 'licenseVerified' as keyof DocumentCheckState,
      title: "Driver's License (Back)",
      subtitle: 'License restrictions and endorsement codes',
      required: false,
      category: 'Licensing',
    },
    {
      key: 'trafficRegisterCertificate' as keyof ApplicationDocuments,
      verifyKey: 'trnVerified' as keyof DocumentCheckState,
      title: 'Traffic Register Certificate (TRN)',
      subtitle: 'Mandatory NATIS Certificate for Foreign Nationals',
      required: driver.citizenship !== 'south_african',
      category: 'Legal Compliance',
    },
    {
      key: 'workPermitOrVisa' as keyof ApplicationDocuments,
      altKey: 'asylumOrWorkPermit' as keyof ApplicationDocuments,
      fallbackKey: 'workPermit' as keyof ApplicationDocuments,
      verifyKey: 'workPermitVerified' as keyof DocumentCheckState,
      title: 'Work Permit / Asylum Document',
      subtitle: 'Home Affairs Legal Work Authorization',
      required: driver.citizenship !== 'south_african',
      category: 'Legal Compliance',
    },
    {
      key: 'proofOfResidence' as keyof ApplicationDocuments,
      verifyKey: 'proofVerified' as keyof DocumentCheckState,
      title: 'Proof of Residential Address',
      subtitle: 'Utility bill, lease agreement or affidavit (< 3 months)',
      required: true,
      category: 'Residence',
    },
    {
      key: 'deliveryAppEarningsScreenshot' as keyof ApplicationDocuments,
      fallbackKey: 'proofOfEarnings' as keyof ApplicationDocuments,
      verifyKey: 'proofVerified' as keyof DocumentCheckState,
      title: 'Platform Profile & Earnings Proof',
      subtitle: 'Checkers Sixty60, Uber Eats, Takealot or Mr D App screenshot',
      required: true,
      category: 'Underwriting',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept="image/*,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={collectionPhotoInputRef}
        onChange={handleCollectionPhotoUpload}
        accept="image/*"
        capture="user"
        className="hidden"
      />
      <input
        type="file"
        ref={bikePhotoInputRef}
        onChange={handleBikePhotoUpload}
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
      />

      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 my-4 max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* ========================================================= */}
        {/* 1. MODAL HEADER & QUICK MOTORBIKE ACTION BAR */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-base shadow-md">
                {driver.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-white tracking-tight">{driver.fullName}</h2>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-bold">
                    {driver.refNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    driver.status === 'active'
                      ? 'bg-emerald-500 text-slate-950'
                      : driver.status === 'in_arrears'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}>
                    {driver.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-2 mt-1 flex-wrap">
                  <span>{driver.phone}</span>
                  <span>•</span>
                  <span className="text-cyan-300 font-semibold">{driver.primaryPlatform}</span>
                  <span>•</span>
                  <span>ID: {driver.idOrPassportNumber}</span>
                  <span>•</span>
                  <span>{driver.city || 'Randburg'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenYocoPayment(driver)}
                className="px-3.5 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Collect Rent</span>
              </button>

              <button
                type="button"
                onClick={() => handleWhatsApp('statement')}
                className="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors"
                title="Send WhatsApp Message"
              >
                <MessageSquare className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Bike Summary & Direct Action Strip */}
          <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <BikeIcon className="w-4 h-4 text-cyan-400 shrink-0" />
              {driver.assignedBikeVinOrPlate ? (
                <div>
                  <span className="text-slate-400 text-[11px] block">Assigned Motorbike:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-white font-black font-mono">{driver.assignedBikeVinOrPlate}</strong>
                    <span className="text-cyan-300 font-medium">({driver.assignedBikeName || 'Bajaj Boxer 150 HD'})</span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-amber-400 font-bold block">⚠️ No Motorbike Currently Assigned</span>
                  <span className="text-slate-400 text-[11px]">This approved driver is waiting for a motorcycle to be linked.</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {driver.assignedBikeVinOrPlate ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalTab('vehicle');
                      setIsChangingBike(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Switch Bike</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalTab('vehicle');
                      setShowRemoveConfirm(true);
                    }}
                    className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove Bike</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalTab('vehicle');
                    setIsChangingBike(true);
                  }}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Assign Motorbike Now</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL NAVIGATION TABS */}
        {/* ========================================================= */}
        <div className="px-6 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveModalTab('documents')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeModalTab === 'documents'
                ? 'border-cyan-600 text-cyan-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-600" />
            <span>Customer Documents Hub</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800">
              {Object.keys(documents).filter((k) => !!(documents as any)[k]).length} files
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('vehicle')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeModalTab === 'vehicle'
                ? 'border-indigo-600 text-indigo-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BikeIcon className="w-4 h-4 text-indigo-600" />
            <span>Assigned Motorbike & Fleet</span>
            {driver.assignedBikeVinOrPlate ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 font-mono">
                {driver.assignedBikeVinOrPlate}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                Unassigned
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('handover_photos')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeModalTab === 'handover_photos'
                ? 'border-indigo-600 text-indigo-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Collection & Handover Photos</span>
            {(collectionPhoto || handoverPhotos.length > 0) && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {handoverPhotos.length + (collectionPhoto ? 1 : 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('profile')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeModalTab === 'profile'
                ? 'border-cyan-600 text-cyan-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>Profile & Underwriting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('financials')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeModalTab === 'financials'
                ? 'border-cyan-600 text-cyan-900 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Financials & Agreement</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* MODAL CONTENT BODY */}
        {/* ========================================================= */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          
          {/* ========================================================= */}
          {/* TAB 1: ALL-IN-ONE CUSTOMER DOCUMENTS HUB */}
          {/* ========================================================= */}
          {activeModalTab === 'documents' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Customer Document Verification Archive</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Centralized repository for SA ID/Passport, Driver's License, Traffic Register TRN, Proof of Address, Earnings, and Digital Signature.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="text-slate-500">Citizenship:</span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 uppercase text-[10px] font-black">
                    {driver.citizenship.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Digital Touch Contract Signature */}
              {(driver.signatureDataUrl || application?.signatureDataUrl) && (
                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                      <FileCheck className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-indigo-950 block">Digitally Signed Rental Agreement</span>
                      <span className="text-[11px] text-indigo-700">Contract executed with legal digital touch signature</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-xl border border-indigo-200 shadow-2xs">
                      <img
                        src={driver.signatureDataUrl || application?.signatureDataUrl}
                        alt="Driver Digital Signature"
                        className="h-9 max-w-[140px] object-contain"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveDocPreview({
                          title: 'Digital Contract Signature',
                          url: driver.signatureDataUrl || application?.signatureDataUrl || '',
                        })
                      }
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Document Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documentCards.map((docDef) => {
                  const docUrl =
                    (documents as any)[docDef.key] ||
                    (docDef.altKey && (documents as any)[docDef.altKey]) ||
                    (docDef.fallbackKey && (documents as any)[docDef.fallbackKey]);

                  const isVerified = (verification as any)[docDef.verifyKey];

                  return (
                    <div
                      key={docDef.key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                        docUrl
                          ? isVerified
                            ? 'bg-white border-emerald-200 shadow-2xs'
                            : 'bg-white border-amber-200 shadow-2xs'
                          : docDef.required
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              {docDef.category}
                            </span>
                            <h4 className="text-xs font-black text-slate-900">{docDef.title}</h4>
                            <p className="text-[11px] text-slate-500">{docDef.subtitle}</p>
                          </div>

                          {docUrl ? (
                            isVerified ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1 shrink-0">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                              docDef.required ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {docDef.required ? 'Missing' : 'Optional'}
                            </span>
                          )}
                        </div>

                        {/* Document Preview Thumbnail if Present */}
                        {docUrl && (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-28 flex items-center justify-center">
                            {docUrl.startsWith('data:application/pdf') || docUrl.endsWith('.pdf') ? (
                              <div className="text-center p-3">
                                <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
                                <span className="text-xs text-slate-200 font-bold">PDF Document Attachment</span>
                              </div>
                            ) : (
                              <img src={docUrl} alt={docDef.title} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveDocPreview({ title: docDef.title, url: docUrl })}
                                className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Controls */}
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        {docUrl && (
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(docDef.verifyKey)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            <span>{isVerified ? 'Mark Unverified' : 'Mark Verified'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTriggerUpload(docDef.key)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Upload className="w-3 h-3 text-slate-600" />
                          <span>{docUrl ? 'Replace' : 'Upload File'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ASSIGNED MOTORBIKE (ASSIGN, SWITCH, REMOVE BIKE) */}
          {/* ========================================================= */}
          {activeModalTab === 'vehicle' && (
            <div className="space-y-5">
              
              {/* IF DRIVER HAS AN ASSIGNED BIKE */}
              {driver.assignedBikeVinOrPlate ? (
                <div className="bg-white rounded-2xl border-2 border-indigo-200 p-5 sm:p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black">
                        <BikeIcon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
                          Active Vehicle Allocation
                        </span>
                        <h3 className="text-base font-black text-slate-900">
                          {assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model}` : driver.assignedBikeName || 'Assigned Motorbike'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-slate-900 text-cyan-300 font-black">
                            {driver.assignedBikeVinOrPlate}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            Status: In Use
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsChangingBike(!isChangingBike)}
                        className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Switch Bike</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRemoveConfirm(true)}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Bike</span>
                      </button>
                    </div>
                  </div>

                  {/* REMOVE BIKE CONFIRMATION MODAL / BANNER */}
                  {showRemoveConfirm && (
                    <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2.5 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Confirm Unassigning Motorbike {driver.assignedBikeVinOrPlate}?</span>
                      </div>
                      <p className="text-xs text-rose-700">
                        This will unlink the bike from {driver.fullName} and return the vehicle back to "Available" status in the fleet register.
                      </p>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowRemoveConfirm(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-rose-100"
                        >
                          Keep Assigned
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmBikeRemove}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-black shadow-sm"
                        >
                          Yes, Return Bike to Fleet
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Detailed Specs Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">VIN Number</span>
                      <span className="font-mono font-bold text-slate-900">{assignedVehicle?.vin || 'On Record'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Engine Number</span>
                      <span className="font-mono font-bold text-slate-900">{assignedVehicle?.engineNumber || 'On Record'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Current Odometer</span>
                      <span className="font-bold text-slate-900">{assignedVehicle?.odometerKm || 0} KM</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">GPS Tracker</span>
                      <span className="font-bold text-emerald-700">{assignedVehicle?.trackerDeviceId || 'Active (Cartrack)'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* WHEN DRIVER HAS NO BIKE ASSIGNED */
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-amber-950">No Motorbike Currently Assigned</h3>
                    <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                      {driver.fullName} is an approved driver without an assigned motorbike. Pick an in-stock bike below or register a new one.
                    </p>
                  </div>
                </div>
              )}

              {/* AVAILABLE IN-STOCK MOTORBIKES SELECTION PANEL */}
              {(isChangingBike || !driver.assignedBikeVinOrPlate) && (
                <div className="bg-white rounded-2xl border-2 border-indigo-300 p-5 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-600" />
                        <span>Select In-Stock Motorbike to Assign</span>
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {availableVehicles.length} available motorcycles in stock ready for handover
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search plate / model..."
                          value={bikeSearchQuery}
                          onChange={(e) => setBikeSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium w-48"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsQuickAddingBike(!isQuickAddingBike)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isQuickAddingBike ? 'Hide Form' : '+ New Bike'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QUICK REGISTER & ASSIGN NEW BIKE FORM */}
                  {isQuickAddingBike && (
                    <form onSubmit={handleQuickRegisterAndAssign} className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                          Register New Motorbike & Immediately Assign:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsQuickAddingBike(false)}
                          className="text-xs text-slate-400 hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Make & Model *</label>
                          <input
                            type="text"
                            required
                            value={`${quickMake} ${quickModel}`}
                            onChange={(e) => {
                              setQuickMake(e.target.value.split(' ')[0] || 'Bajaj');
                              setQuickModel(e.target.value.split(' ').slice(1).join(' ') || 'Boxer 150 HD');
                            }}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">Registration Plate *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. GP 88 RT GP"
                            value={quickPlate}
                            onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
                            className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-black uppercase"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">GPS Tracker IMEI</label>
                          <input
                            type="text"
                            value={quickTracker}
                            onChange={(e) => setQuickTracker(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Register & Assign to {driver.fullName}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* IN-STOCK AVAILABLE MOTORBIKES GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                    {filteredAvailableVehicles.map((veh) => (
                      <div
                        key={veh.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white shadow-2xs flex flex-col justify-between gap-3 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-cyan-300">
                              {veh.registrationPlate || veh.vin}
                            </span>
                            <h5 className="text-xs font-black text-slate-900 mt-1">
                              {veh.make} {veh.model} ({veh.year})
                            </h5>
                            <span className="text-[10px] text-slate-500 block">
                              VIN: {veh.vin} • Odo: {veh.odometerKm} KM
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {veh.condition}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAssignBike(veh.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Assign this Bike to {driver.fullName}</span>
                        </button>
                      </div>
                    ))}

                    {filteredAvailableVehicles.length === 0 && (
                      <div className="col-span-2 py-6 text-center text-slate-400 text-xs">
                        No in-stock motorcycles matching your filter. Use "+ New Bike" to register a motorcycle.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: COLLECTION & HANDOVER PHOTOGRAPHY */}
          {/* ========================================================= */}
          {activeModalTab === 'handover_photos' && (
            <div className="space-y-5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Showroom Collection & Handover Photos</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Physical intake and handover proof of {driver.fullName} receiving motorcycle keys and delivery box.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => collectionPhotoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap Driver Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => bikePhotoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Bike Photos</span>
                  </button>
                </div>
              </div>

              {/* Photo Galleries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Driver Photo at Collection */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Driver at Collection Photo</span>
                    </span>
                    {collectionPhoto && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Verified
                      </span>
                    )}
                  </div>

                  {collectionPhoto ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-52 flex items-center justify-center">
                      <img src={collectionPhoto} alt="Driver Collection" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDocPreview({ title: 'Driver at Collection', url: collectionPhoto })}
                          className="px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 inline mr-1" /> View Full
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                      <Camera className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-400">No driver collection photo on file.</p>
                      <button
                        type="button"
                        onClick={() => collectionPhotoInputRef.current?.click()}
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold"
                      >
                        Snap Photo Now
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Bike Condition & Odometer Photos */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <BikeIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Motorbike Condition & Odometer Snapshots</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {handoverPhotos.length} Photos
                    </span>
                  </div>

                  {handoverPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                      {handoverPhotos.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-24">
                          <img src={url} alt={`Handover ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveDocPreview({ title: `Handover Photo ${idx + 1}`, url })}
                              className="p-1 bg-white text-slate-900 rounded-md text-[10px]"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                      <BikeIcon className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-400">No bike handover condition photos attached.</p>
                      <button
                        type="button"
                        onClick={() => bikePhotoInputRef.current?.click()}
                        className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Upload Photos
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 4: PROFILE & UNDERWRITING */}
          {/* ========================================================= */}
          {activeModalTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Driver Identity & Residential Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Full Name</span>
                    <strong className="text-slate-900">{driver.fullName}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">ID / Passport</span>
                    <strong className="text-slate-900">{driver.idOrPassportNumber}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Citizenship</span>
                    <strong className="text-slate-900 uppercase">{driver.citizenship.replace('_', ' ')}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Primary Courier Platform</span>
                    <strong className="text-indigo-700">{driver.primaryPlatform}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Residential Address</span>
                    <strong className="text-slate-900">{driver.address || 'Randburg'}, {driver.city || 'JHB'}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Risk Tier</span>
                    <strong className="text-emerald-700 uppercase">{driver.riskTier} Risk ({driver.riskScore}/100)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: FINANCIALS & AGREEMENT */}
          {/* ========================================================= */}
          {activeModalTab === 'financials' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Rent-to-Own Financial Summary</span>
                  <span className="text-emerald-700 font-black text-sm">R{driver.weeklyRate} / week</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Deposit Settled</span>
                    <strong className="text-slate-900">R{driver.depositPaid}</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Term Length</span>
                    <strong className="text-slate-900">{driver.termMonths} Months</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Ledger Balance</span>
                    <strong className={driver.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                      {driver.balanceDue > 0 ? `Overdue: R${driver.balanceDue}` : 'Paid Up to Date'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Payment Rating</span>
                    <strong className="text-emerald-700">{driver.paymentScore}% On-Time</strong>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenYocoPayment(driver)}
                    className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Launch Yoco Payment Gateway</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* DOCUMENT / PHOTO LIGHTBOX PREVIEW */}
        {/* ========================================================= */}
        {activeDocPreview && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-5 border border-slate-800 text-white space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-black text-white">{activeDocPreview.title}</h4>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={activeDocPreview.url}
                    download={`${activeDocPreview.title.replace(/\s+/g, '_')}.png`}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden max-h-[72vh] flex items-center justify-center bg-black/80">
                {activeDocPreview.url.startsWith('data:application/pdf') || activeDocPreview.url.endsWith('.pdf') ? (
                  <iframe
                    src={activeDocPreview.url}
                    className="w-full h-[65vh] border-0"
                    title={activeDocPreview.title}
                  />
                ) : (
                  <img
                    src={activeDocPreview.url}
                    alt={activeDocPreview.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
