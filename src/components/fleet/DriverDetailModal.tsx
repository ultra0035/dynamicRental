import React, { useState, useEffect, useRef } from 'react';
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
  Key,
  ShieldCheck,
  ZoomIn,
  Clock,
  Sparkles
} from 'lucide-react';
import { compressImageFile } from '../../lib/imageUtils';
import { DriverFinanceTracker } from './DriverFinanceTracker';

interface DriverDetailModalProps {
  isOpen: boolean;
  driver: Driver | null;
  vehicles: Vehicle[];
  application?: RiderApplication;
  agreements?: RentalAgreement[];
  initialTab?: 'documents' | 'vehicle' | 'handover_photos' | 'profile' | 'financials';
  onClose: () => void;
  onUpdateDriver: (driver: Driver) => void;
  onChangeBike: (driverId: string, newVehicleId: string) => void;
  onRemoveBike: (driverId: string) => void;
  onOpenYocoPayment: (driver: Driver) => void;
  onDeleteDriver?: (driverId: string) => void;
  onQuickRegisterBikeAndAssign?: (bikeData: Partial<Vehicle>) => void;
}

export const DriverDetailModal: React.FC<DriverDetailModalProps> = ({
  isOpen,
  driver,
  vehicles,
  application,
  agreements = [],
  initialTab = 'documents',
  onClose,
  onUpdateDriver,
  onChangeBike,
  onRemoveBike,
  onOpenYocoPayment,
  onDeleteDriver,
  onQuickRegisterBikeAndAssign,
}) => {
  if (!isOpen || !driver) return null;

  // Active Tab inside modal: 'documents' | 'vehicle' | 'handover_photos' | 'profile' | 'financials'
  const [activeModalTab, setActiveModalTab] = useState<'documents' | 'vehicle' | 'handover_photos' | 'profile' | 'financials'>(
    initialTab || 'documents'
  );

  // Sync activeModalTab when initialTab changes or modal reopens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveModalTab(initialTab);
    }
  }, [isOpen, initialTab, driver.id]);

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
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState<boolean>(false);
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

  // Handle Delete Driver completely
  const handleConfirmDeleteCustomer = () => {
    if (onDeleteDriver) {
      onDeleteDriver(driver.id);
      onClose();
    }
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

  const docsCount = Object.keys(documents).filter((k) => !!(documents as any)[k]).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
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

      <div className="bg-white rounded-3xl max-w-5xl lg:max-w-6xl w-full shadow-2xl border border-slate-200 my-2 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* ========================================================= */}
        {/* 1. SPACIOUS PREMIUM HEADER & ACTION BAR */}
        {/* ========================================================= */}
        <div className="p-6 bg-slate-900 text-white flex flex-col gap-4 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Driver Identity Block */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shrink-0">
                {driver.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-black text-white tracking-tight">{driver.fullName}</h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-bold border border-slate-700">
                    {driver.refNumber}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    driver.status === 'active'
                      ? 'bg-emerald-500 text-slate-950'
                      : driver.status === 'in_arrears'
                      ? 'bg-rose-500 text-white'
                      : 'bg-amber-500 text-slate-950'
                  }`}>
                    {driver.status.replace('_', ' ')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 uppercase border border-slate-700">
                    {driver.citizenship.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 font-mono font-bold text-white">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    {driver.phone}
                  </span>
                  <span>•</span>
                  <span className="text-cyan-300 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                    {driver.primaryPlatform}
                  </span>
                  <span>•</span>
                  <span>ID / TRN: <strong className="text-white font-mono">{driver.idOrPassportNumber}</strong></span>
                  <span>•</span>
                  <span>Location: <strong className="text-slate-200">{driver.city || 'Randburg'}</strong></span>
                </div>
              </div>
            </div>

            {/* Top Right Actions */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={() => onOpenYocoPayment(driver)}
                className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Collect Rent (Yoco)</span>
              </button>

              <button
                type="button"
                onClick={() => handleWhatsApp('statement')}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold border border-slate-700 cursor-pointer"
                title="Send WhatsApp Statement"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              {onDeleteDriver && (
                <button
                  type="button"
                  onClick={() => setShowDeleteCustomerConfirm(true)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/90 text-rose-400 hover:text-white transition-colors border border-slate-700 cursor-pointer"
                  title="Delete / Archive Driver Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700 cursor-pointer ml-1"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Delete Customer Confirmation Banner */}
          {showDeleteCustomerConfirm && (
            <div className="p-4 bg-rose-950/80 border border-rose-600/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <strong className="text-rose-200 font-black block">
                    Delete Customer Record for {driver.fullName}?
                  </strong>
                  <span className="text-rose-300 text-[11px]">
                    This will remove the driver from Approved Customers and automatically return any assigned motorbike ({driver.assignedBikeVinOrPlate || 'N/A'}) back to available fleet stock.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDeleteCustomerConfirm(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCustomer}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-sm"
                >
                  Yes, Delete Customer
                </button>
              </div>
            </div>
          )}

          {/* Dedicated Motorbike Allocation Bar */}
          <div className="bg-slate-800/90 rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                <BikeIcon className="w-5 h-5 text-cyan-400" />
              </div>
              {driver.assignedBikeVinOrPlate ? (
                <div>
                  <span className="text-slate-400 text-[11px] block uppercase font-bold tracking-wider">
                    Assigned Motorbike Allocation:
                  </span>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <strong className="text-cyan-300 font-black font-mono text-sm tracking-wide bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      {driver.assignedBikeVinOrPlate}
                    </strong>
                    <span className="text-white font-bold">
                      {driver.assignedBikeName || assignedVehicle?.model || 'Bajaj Boxer 150 HD'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Live GPS Active
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-amber-400 font-bold block flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    No Motorbike Assigned Yet
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    This approved customer has signed the contract and is awaiting motorcycle allocation from stock.
                  </span>
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
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Switch Bike</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveModalTab('vehicle');
                      setShowRemoveConfirm(true);
                    }}
                    className="px-3.5 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Unassign</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalTab('vehicle');
                    setIsChangingBike(true);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Assign Motorbike from Fleet</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MODERN NAVIGATION TABS */}
        {/* ========================================================= */}
        <div className="px-6 bg-slate-100 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0 pt-2">
          <button
            type="button"
            onClick={() => setActiveModalTab('documents')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeModalTab === 'documents'
                ? 'border-cyan-600 text-cyan-950 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4 text-cyan-600" />
            <span>Customer Documents Hub</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800">
              {docsCount} files
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('vehicle')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeModalTab === 'vehicle'
                ? 'border-indigo-600 text-indigo-950 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BikeIcon className="w-4 h-4 text-indigo-600" />
            <span>Assigned Motorbike & Fleet</span>
            {driver.assignedBikeVinOrPlate ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 font-mono">
                {driver.assignedBikeVinOrPlate}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                Awaiting Bike
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('handover_photos')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeModalTab === 'handover_photos'
                ? 'border-indigo-600 text-indigo-950 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <span>Collection & Handover Photos</span>
            {(collectionPhoto || handoverPhotos.length > 0) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                {handoverPhotos.length + (collectionPhoto ? 1 : 0)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('profile')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeModalTab === 'profile'
                ? 'border-cyan-600 text-cyan-950 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-slate-600" />
            <span>Profile & Underwriting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveModalTab('financials')}
            className={`px-4 py-3 text-xs font-black border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeModalTab === 'financials'
                ? 'border-cyan-600 text-cyan-950 bg-white shadow-2xs rounded-t-xl'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Financials & Agreement</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* 3. SPACIOUS, UN-CRAMMED MODAL CONTENT BODY */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50 space-y-6">
          
          {/* ========================================================= */}
          {/* TAB 1: ALL-IN-ONE CUSTOMER DOCUMENTS HUB */}
          {/* ========================================================= */}
          {activeModalTab === 'documents' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span>Customer Document Verification Archive</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Centralized repository for SA ID/Passport, Driver's License, Traffic Register TRN, Proof of Address, Platform Profile, and Digital Touch Signature.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                  <span className="text-slate-500">Citizenship Profile:</span>
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 uppercase text-xs font-black border border-slate-200">
                    {driver.citizenship.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Digital Touch Contract Signature Box */}
              {(driver.signatureDataUrl || application?.signatureDataUrl) && (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black shrink-0">
                      <FileCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <span className="text-sm font-black text-indigo-950 block">Digitally Signed Rental Agreement</span>
                      <span className="text-xs text-indigo-700">Contract executed with binding digital touch signature on record</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-indigo-200 shadow-2xs">
                      <img
                        src={driver.signatureDataUrl || application?.signatureDataUrl}
                        alt="Driver Digital Signature"
                        className="h-10 max-w-[160px] object-contain"
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
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Document Cards: Generous 3-column Grid on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {documentCards.map((docDef) => {
                  const docUrl =
                    (documents as any)[docDef.key] ||
                    (docDef.altKey && (documents as any)[docDef.altKey]) ||
                    (docDef.fallbackKey && (documents as any)[docDef.fallbackKey]);

                  const isVerified = (verification as any)[docDef.verifyKey];

                  return (
                    <div
                      key={docDef.key}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        docUrl
                          ? isVerified
                            ? 'bg-white border-emerald-300 shadow-xs ring-1 ring-emerald-100'
                            : 'bg-white border-amber-300 shadow-xs ring-1 ring-amber-100'
                          : docDef.required
                          ? 'bg-rose-50/60 border-rose-200'
                          : 'bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                              {docDef.category}
                            </span>
                            <h4 className="text-xs font-black text-slate-900 mt-0.5">{docDef.title}</h4>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{docDef.subtitle}</p>
                          </div>

                          {docUrl ? (
                            isVerified ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 flex items-center gap-1 shrink-0">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                              docDef.required ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {docDef.required ? 'Missing' : 'Optional'}
                            </span>
                          )}
                        </div>

                        {/* Document Preview Thumbnail Frame */}
                        {docUrl ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-36 flex items-center justify-center">
                            {docUrl.startsWith('data:application/pdf') || docUrl.endsWith('.pdf') ? (
                              <div className="text-center p-3">
                                <FileText className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
                                <span className="text-xs text-slate-200 font-bold">PDF Document Attachment</span>
                              </div>
                            ) : (
                              <img src={docUrl} alt={docDef.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            )}
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setActiveDocPreview({ title: docDef.title, url: docUrl })}
                                className="px-3.5 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 shadow-md cursor-pointer"
                              >
                                <ZoomIn className="w-3.5 h-3.5 text-blue-600" />
                                <span>View Full</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center p-3">
                            <Upload className="w-6 h-6 text-slate-300 mb-1" />
                            <span className="text-[11px] text-slate-400 font-medium">No document uploaded</span>
                          </div>
                        )}
                      </div>

                      {/* Action Controls */}
                      <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        {docUrl && (
                          <button
                            type="button"
                            onClick={() => handleToggleVerification(docDef.verifyKey)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isVerified ? 'Verified' : 'Verify'}</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTriggerUpload(docDef.key)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto cursor-pointer border border-slate-200"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-600" />
                          <span>{docUrl ? 'Replace' : 'Upload'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ASSIGNED MOTORBIKE & FLEET ALLOCATION */}
          {/* ========================================================= */}
          {activeModalTab === 'vehicle' && (
            <div className="space-y-6">
              
              {/* IF DRIVER HAS AN ASSIGNED BIKE */}
              {driver.assignedBikeVinOrPlate ? (
                <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 sm:p-7 shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black shrink-0">
                        <BikeIcon className="w-7 h-7 text-indigo-600" />
                      </div>
                      <div>
                        <span className="text-[11px] font-black uppercase text-indigo-600 tracking-wider block">
                          Active Vehicle Allocation
                        </span>
                        <h3 className="text-lg font-black text-slate-900 mt-0.5">
                          {assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model}` : driver.assignedBikeName || 'Assigned Motorbike'}
                        </h3>
                        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                          <span className="font-mono text-xs px-3 py-1 rounded-lg bg-slate-900 text-cyan-300 font-black">
                            {driver.assignedBikeVinOrPlate}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                            Status: In Use & Active
                          </span>
                          <span className="text-xs text-slate-500">
                            Weekly Rate: <strong className="text-slate-900 font-mono">R{driver.weeklyRate}/wk</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setIsChangingBike(!isChangingBike)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Switch Bike</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowRemoveConfirm(true)}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Unassign Bike</span>
                      </button>
                    </div>
                  </div>

                  {/* REMOVE BIKE CONFIRMATION BANNER */}
                  {showRemoveConfirm && (
                    <div className="p-5 bg-rose-50 rounded-2xl border border-rose-200 space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>Confirm Unassigning Motorbike {driver.assignedBikeVinOrPlate}?</span>
                      </div>
                      <p className="text-xs text-rose-700">
                        This will unlink the motorcycle from {driver.fullName} and safely return the vehicle back to "Available" status in the fleet register.
                      </p>
                      <div className="flex justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowRemoveConfirm(false)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-rose-100"
                        >
                          Keep Assigned
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmBikeRemove}
                          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-sm"
                        >
                          Yes, Return Bike to Fleet
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Vehicle Detailed Specifications: Spacious 4-Column Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">VIN Number</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{assignedVehicle?.vin || 'MD2A150HD89231'}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Engine Number</span>
                      <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{assignedVehicle?.engineNumber || 'ENG-882901'}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Current Odometer</span>
                      <span className="font-bold text-slate-900 text-sm mt-0.5 block">{assignedVehicle?.odometerKm || 0} KM</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">GPS Cartrack ID</span>
                      <span className="font-bold text-emerald-700 text-sm mt-0.5 block">{assignedVehicle?.trackerDeviceId || 'CT-889021 (Active)'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* WHEN DRIVER HAS NO BIKE ASSIGNED */
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-950">No Motorbike Currently Assigned</h3>
                    <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                      {driver.fullName} is an approved driver without an assigned motorbike. Pick an in-stock motorcycle from available inventory below or register a new one.
                    </p>
                  </div>
                </div>
              )}

              {/* AVAILABLE IN-STOCK MOTORBIKES SELECTION PANEL */}
              {(isChangingBike || !driver.assignedBikeVinOrPlate) && (
                <div className="bg-white rounded-3xl border-2 border-indigo-300 p-6 sm:p-7 space-y-5 shadow-sm animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <Key className="w-4 h-4 text-indigo-600" />
                        <span>Select In-Stock Motorbike to Assign</span>
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {availableVehicles.length} available motorcycles in stock ready for showroom handover
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Search plate / VIN / model..."
                          value={bikeSearchQuery}
                          onChange={(e) => setBikeSearchQuery(e.target.value)}
                          className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs font-medium w-56 bg-slate-50 focus:bg-white transition-colors"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsQuickAddingBike(!isQuickAddingBike)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isQuickAddingBike ? 'Hide Form' : '+ New Bike'}</span>
                      </button>
                    </div>
                  </div>

                  {/* QUICK REGISTER & ASSIGN NEW BIKE FORM */}
                  {isQuickAddingBike && (
                    <form onSubmit={handleQuickRegisterAndAssign} className="p-5 bg-indigo-50/80 rounded-2xl border border-indigo-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          Register New Motorbike & Immediately Assign:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsQuickAddingBike(false)}
                          className="text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Make & Model *</label>
                          <input
                            type="text"
                            required
                            value={`${quickMake} ${quickModel}`}
                            onChange={(e) => {
                              setQuickMake(e.target.value.split(' ')[0] || 'Bajaj');
                              setQuickModel(e.target.value.split(' ').slice(1).join(' ') || 'Boxer 150 HD');
                            }}
                            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Registration Plate *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. GP 88 RT GP"
                            value={quickPlate}
                            onChange={(e) => setQuickPlate(e.target.value.toUpperCase())}
                            className="w-full px-3.5 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-mono font-black uppercase"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">GPS Tracker IMEI</label>
                          <input
                            type="text"
                            value={quickTracker}
                            onChange={(e) => setQuickTracker(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Register & Assign to {driver.fullName}</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* IN-STOCK AVAILABLE MOTORBIKES GRID: 2 COLUMNS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto pr-1">
                    {filteredAvailableVehicles.map((veh) => (
                      <div
                        key={veh.id}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-white shadow-2xs flex flex-col justify-between gap-4 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-slate-900 text-cyan-300">
                              {veh.registrationPlate || veh.vin}
                            </span>
                            <h5 className="text-sm font-black text-slate-900 mt-1.5">
                              {veh.make} {veh.model} ({veh.year})
                            </h5>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              VIN: {veh.vin} • Odometer: {veh.odometerKm} KM
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            {veh.condition}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleAssignBike(veh.id)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Assign this Motorbike to {driver.fullName}</span>
                        </button>
                      </div>
                    ))}

                    {filteredAvailableVehicles.length === 0 && (
                      <div className="col-span-2 py-8 text-center text-slate-400 text-xs">
                        No in-stock motorcycles matching your filter. Use "+ New Bike" above to register a motorcycle.
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
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-indigo-600" />
                    <span>Showroom Collection & Handover Photography</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Intake proof of {driver.fullName} receiving motorcycle keys, helmet, tracker activation and delivery box.
                  </p>
                </div>

                <div className="flex gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => collectionPhotoInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Driver Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => bikePhotoInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>Upload Bike Photos</span>
                  </button>
                </div>
              </div>

              {/* Photo Galleries: 2 Large Side-by-Side Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* 1. Driver Photo at Collection */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Driver at Collection Photo</span>
                    </span>
                    {collectionPhoto && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        Verified
                      </span>
                    )}
                  </div>

                  {collectionPhoto ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 h-64 flex items-center justify-center">
                      <img src={collectionPhoto} alt="Driver Collection" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveDocPreview({ title: 'Driver at Collection', url: collectionPhoto })}
                          className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span>View Full Photo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50">
                      <Camera className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500">No driver collection photo on file.</p>
                      <button
                        type="button"
                        onClick={() => collectionPhotoInputRef.current?.click()}
                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Snap Photo Now
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Bike Condition & Odometer Photos */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <BikeIcon className="w-4 h-4 text-indigo-600" />
                      <span>Motorbike Condition & Odometer Snapshots</span>
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {handoverPhotos.length} Photos
                    </span>
                  </div>

                  {handoverPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                      {handoverPhotos.map((url, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-28">
                          <img src={url} alt={`Handover ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setActiveDocPreview({ title: `Handover Photo ${idx + 1}`, url })}
                              className="p-2 bg-white text-slate-900 rounded-lg text-xs font-bold shadow-md cursor-pointer"
                            >
                              <ZoomIn className="w-4 h-4 text-blue-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-3 bg-slate-50">
                      <BikeIcon className="w-10 h-10 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500">No bike handover condition photos attached.</p>
                      <button
                        type="button"
                        onClick={() => bikePhotoInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
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
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-600" />
                  <span>Driver Identity & Residential Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Full Legal Name</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">{driver.fullName}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">ID / Passport Number</span>
                    <strong className="text-slate-900 text-sm font-mono mt-0.5 block">{driver.idOrPassportNumber}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Citizenship</span>
                    <strong className="text-slate-900 uppercase text-sm mt-0.5 block">{driver.citizenship.replace('_', ' ')}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Primary Courier Platform</span>
                    <strong className="text-indigo-700 text-sm mt-0.5 block">{driver.primaryPlatform}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Residential Address</span>
                    <strong className="text-slate-900 text-sm mt-0.5 block">{driver.address || 'Randburg'}, {driver.city || 'JHB'}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Risk Tier Rating</span>
                    <strong className="text-emerald-700 uppercase text-sm mt-0.5 block">{driver.riskTier} Risk ({driver.riskScore}/100)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 5: FINANCIALS & AGREEMENT */}
          {/* ========================================================= */}
          {activeModalTab === 'financials' && (
            <DriverFinanceTracker
              driver={driver}
              agreements={agreements}
              assignedVehicle={assignedVehicle}
              onUpdateDriver={onUpdateDriver}
              onOpenYocoPayment={onOpenYocoPayment}
              onViewDocPreview={(preview) => setActiveDocPreview(preview)}
            />
          )}
        </div>

        {/* ========================================================= */}
        {/* DOCUMENT / PHOTO LIGHTBOX PREVIEW */}
        {/* ========================================================= */}
        {activeDocPreview && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-slate-900 rounded-3xl max-w-4xl w-full p-6 border border-slate-800 text-white space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-black text-white">{activeDocPreview.title}</h4>
                </div>

                <div className="flex items-center gap-2.5">
                  <a
                    href={activeDocPreview.url}
                    download={`${activeDocPreview.title.replace(/\s+/g, '_')}.png`}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveDocPreview(null)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden max-h-[72vh] flex items-center justify-center bg-black/90 p-2">
                {activeDocPreview.url.startsWith('data:application/pdf') || activeDocPreview.url.endsWith('.pdf') ? (
                  <iframe
                    src={activeDocPreview.url}
                    className="w-full h-[65vh] border-0 rounded-xl"
                    title={activeDocPreview.title}
                  />
                ) : (
                  <img
                    src={activeDocPreview.url}
                    alt={activeDocPreview.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
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
