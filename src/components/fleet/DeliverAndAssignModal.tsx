import React, { useState, useRef } from 'react';
import { RiderApplication, Vehicle, Driver } from '../../types';
import { 
  Bike as BikeIcon, 
  CheckCircle2, 
  X, 
  ShieldCheck, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  AlertCircle,
  Hash,
  Gauge,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  Eye,
  Plus,
  Check,
  Radio,
  Layers
} from 'lucide-react';
import { compressImageFile } from '../../lib/imageUtils';

interface DeliverAndAssignModalProps {
  isOpen: boolean;
  application: RiderApplication | null;
  vehicles: Vehicle[];
  onClose: () => void;
  onConfirmAssignment: (params: {
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
  }) => void;
}

export const DeliverAndAssignModal: React.FC<DeliverAndAssignModalProps> = ({
  isOpen,
  application,
  vehicles,
  onClose,
  onConfirmAssignment,
}) => {
  if (!isOpen || !application) return null;

  // STRICTLY AVAILABLE IN-STOCK BIKES ONLY
  const availableVehicles = vehicles.filter((v) => v.status === 'available');

  // Initial vehicle candidate
  const defaultVeh = availableVehicles.find((v) => v.bikeModelId === application.bikeId) || availableVehicles[0];

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(defaultVeh?.id || '');
  const [activeMode, setActiveMode] = useState<'stock' | 'register_new'>(availableVehicles.length > 0 ? 'stock' : 'register_new');
  
  // Quick Register New Bike Form State
  const [newBikeMake, setNewBikeMake] = useState<string>('Bajaj');
  const [newBikeModel, setNewBikeModel] = useState<string>(application.bikeName || 'Boxer 150 HD');
  const [newBikeYear, setNewBikeYear] = useState<number>(2025);
  const [newBikeCondition, setNewBikeCondition] = useState<'new' | 'used'>(application.bikeCondition || 'new');
  const [newBikePlate, setNewBikePlate] = useState<string>(application.assignedBikeVinOrPlate || '');
  const [newBikeVin, setNewBikeVin] = useState<string>('');
  const [newBikeEngineNo, setNewBikeEngineNo] = useState<string>('');
  const [newBikeTrackerId, setNewBikeTrackerId] = useState<string>('CT-99' + Math.floor(1000 + Math.random() * 9000));

  // Handover terms
  const [weeklyRate, setWeeklyRate] = useState<number>(application.weeklyRate || 750);
  const [depositPaid, setDepositPaid] = useState<number>(application.depositAmount || 1000);
  const [termMonths, setTermMonths] = useState<number>(application.termMonths || 18);
  const [startOdoKm, setStartOdoKm] = useState<number>(defaultVeh?.odometerKm || 0);
  const [handoverDate, setHandoverDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [adminNotes, setAdminNotes] = useState<string>(application.adminNotes || '');

  // COLLECTION PHOTOS IN-TAKE
  const [driverCollectionPhoto, setDriverCollectionPhoto] = useState<string>(application.collectionPhotoUrl || '');
  const [handoverPhotos, setHandoverPhotos] = useState<string[]>(application.handoverPhotos || []);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<{ title: string; url: string } | null>(null);

  const driverPhotoInputRef = useRef<HTMLInputElement>(null);
  const bikePhotoInputRef = useRef<HTMLInputElement>(null);

  // Pre-Handover Physical Checklist
  const [checklist, setChecklist] = useState({
    depositSettled: true,
    contractSigned: true,
    helmetIssued: true,
    deliveryBoxMounted: true,
    trackerLiveVerified: true,
    keysHandedOver: true,
  });

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const handleVehicleSelect = (vehId: string) => {
    setSelectedVehicleId(vehId);
    const found = vehicles.find((v) => v.id === vehId);
    if (found) {
      setStartOdoKm(found.odometerKm || 0);
    }
  };

  // Handle Driver Collection Photo Upload / Camera Snap
  const handleDriverPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
      setDriverCollectionPhoto(compressed);
    } catch (err) {
      console.error('Driver photo processing error:', err);
    } finally {
      setIsProcessingImage(false);
      if (driverPhotoInputRef.current) driverPhotoInputRef.current.value = '';
    }
  };

  // Handle Handover Bike Condition Photos Upload
  const handleBikePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsProcessingImage(true);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImageFile(files[i], { maxWidth: 1200, maxHeight: 1200, quality: 0.85 });
        newUrls.push(compressed);
      }
      setHandoverPhotos((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Handover photos processing error:', err);
    } finally {
      setIsProcessingImage(false);
      if (bikePhotoInputRef.current) bikePhotoInputRef.current.value = '';
    }
  };

  const handleRemoveHandoverPhoto = (index: number) => {
    setHandoverPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let newVehicleObj: Vehicle | undefined;
    let chosenVehId: string | undefined = selectedVehicleId;
    let chosenVinPlate: string = '';
    let chosenBikeName: string = '';

    if (activeMode === 'register_new') {
      const generatedId = `veh-${Date.now().toString().slice(-6)}`;
      const plate = (newBikePlate || `GP-${Math.floor(10 + Math.random() * 90)}-XX-GP`).trim().toUpperCase();
      const vin = (newBikeVin || `MD2A${Math.random().toString(36).substring(2, 10).toUpperCase()}`).trim();

      newVehicleObj = {
        id: generatedId,
        vin,
        engineNumber: newBikeEngineNo.trim() || `ENG-${Math.floor(100000 + Math.random() * 900000)}`,
        registrationPlate: plate,
        bikeModelId: newBikeModel.toLowerCase().includes('boxer') ? 'boxer-150' : 'velocity-150',
        make: newBikeMake.trim() || 'Bajaj',
        model: newBikeModel.trim() || 'Boxer 150 HD',
        year: newBikeYear,
        category: 'boxer',
        condition: newBikeCondition,
        status: 'assigned',
        assignedDriverId: undefined, // will be bound by driver creation
        assignedDriverName: application.fullName,
        odometerKm: startOdoKm,
        nextServiceKm: startOdoKm + 5000,
        trackerDeviceId: newBikeTrackerId.trim() || 'Cartrack SA',
        trackerProvider: 'Cartrack SA',
        batteryHealthPercent: 100,
        fuelLevelPercent: 100,
        isIgnitionOn: false,
        lastPingTime: new Date().toISOString(),
      };

      chosenVehId = generatedId;
      chosenVinPlate = plate;
      chosenBikeName = `${newVehicleObj.make} ${newVehicleObj.model} (${plate})`;
    } else {
      if (selectedVehicle) {
        chosenVinPlate = selectedVehicle.registrationPlate || selectedVehicle.vin;
        chosenBikeName = `${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.registrationPlate})`;
      } else {
        chosenVinPlate = application.assignedBikeVinOrPlate || 'GP-ASSIGNED';
        chosenBikeName = application.bikeName;
      }
    }

    onConfirmAssignment({
      application,
      selectedVehicleId: chosenVehId,
      customVinOrPlate: chosenVinPlate,
      customBikeName: chosenBikeName,
      weeklyRate,
      depositPaid,
      termMonths,
      startOdoKm,
      handoverDate,
      adminNotes: adminNotes ? `${adminNotes} | Showroom Handover Verified on ${handoverDate}` : `Showroom Handover Verified on ${handoverDate}`,
      collectionPhotoUrl: driverCollectionPhoto || undefined,
      handoverPhotos: handoverPhotos.length > 0 ? handoverPhotos : undefined,
      newVehicleToCreate: newVehicleObj,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* Hidden File Inputs for Collection Photography */}
      <input
        type="file"
        ref={driverPhotoInputRef}
        onChange={handleDriverPhotoUpload}
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

      <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 my-4 max-h-[95vh] flex flex-col justify-between overflow-hidden">
        
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-black shadow-xs">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Place in Delivered Pipeline & Handover Motorbike
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Collection Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Assign an available in-stock motorbike, take collection photos, verify checklist, and activate driver.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY FORM */}
        <form onSubmit={handleFormSubmit} className="mt-4 space-y-5 overflow-y-auto pr-1 flex-1">
          
          {/* 1. APPLICANT SUMMARY CARD */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {application.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span>{application.fullName}</span>
                  <span className="text-[11px] font-mono text-cyan-700 font-bold">({application.refNumber})</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span>{application.phone}</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">{application.primaryPlatform}</span>
                  <span>•</span>
                  <span>ID: {application.idOrPassportNumber}</span>
                  <span>•</span>
                  <span>{application.city || 'Randburg'}</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="text-[10px] font-black uppercase text-slate-400 block">Requested Bike</span>
              <span className="text-xs font-black text-indigo-900">{application.bikeName}</span>
              <span className="text-[11px] text-emerald-700 font-bold block">Deposit: R{application.depositAmount || 1000}</span>
            </div>
          </div>

          {/* 2. IN-STOCK MOTORBIKE ASSIGNMENT */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-indigo-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BikeIcon className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Assign Motorbike from In-Stock Fleet *
                </label>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  availableVehicles.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {availableVehicles.length} in stock
                </span>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveMode('stock')}
                  disabled={availableVehicles.length === 0}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeMode === 'stock'
                      ? 'bg-white text-indigo-900 shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900 disabled:opacity-40'
                  }`}
                >
                  Pick Available Stock ({availableVehicles.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode('register_new')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    activeMode === 'register_new'
                      ? 'bg-indigo-600 text-white shadow-2xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  + Stock & Register New Bike
                </button>
              </div>
            </div>

            {/* OPTION A: PICK FROM AVAILABLE FLEET STOCK */}
            {activeMode === 'stock' && (
              <div className="space-y-3">
                {availableVehicles.length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 block">
                      Select specific motorcycle to allocate to {application.fullName}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {availableVehicles.map((veh) => {
                        const isSelected = selectedVehicleId === veh.id;
                        return (
                          <div
                            key={veh.id}
                            onClick={() => handleVehicleSelect(veh.id)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50/60 shadow-xs ring-1 ring-indigo-500'
                                : 'border-slate-200 hover:border-indigo-300 bg-white'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-slate-900 text-cyan-300">
                                  {veh.registrationPlate || veh.vin}
                                </span>
                                <h4 className="text-xs font-black text-slate-900 mt-1">
                                  {veh.make} {veh.model} ({veh.year})
                                </h4>
                              </div>
                              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                {veh.condition}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100">
                              <span>Odo: <strong className="text-slate-800">{veh.odometerKm} KM</strong></span>
                              <span>Tracker: <strong className="text-emerald-700">{veh.trackerDeviceId ? 'Online' : 'Fitted'}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-2">
                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                    <p className="text-xs font-bold text-amber-900">
                      No motorbikes are currently marked as "Available" in stock.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveMode('register_new')}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register & Stock a Bike Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* OPTION B: STOCK & REGISTER NEW BIKE ON THE SPOT */}
            {activeMode === 'register_new' && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 uppercase tracking-wider">
                    New Fleet Motorcycle Intake Details:
                  </span>
                  <span className="text-[11px] text-indigo-700 font-semibold">
                    Will be added to fleet database and assigned
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Make *</label>
                    <input
                      type="text"
                      required
                      value={newBikeMake}
                      onChange={(e) => setNewBikeMake(e.target.value)}
                      placeholder="Bajaj / Big Boy / Honda"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      value={newBikeModel}
                      onChange={(e) => setNewBikeModel(e.target.value)}
                      placeholder="Boxer 150 HD / Velocity 150"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Year & Condition</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={2020}
                        max={2030}
                        value={newBikeYear}
                        onChange={(e) => setNewBikeYear(Number(e.target.value))}
                        className="w-20 px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                      />
                      <select
                        value={newBikeCondition}
                        onChange={(e) => setNewBikeCondition(e.target.value as any)}
                        className="flex-1 px-2 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                      >
                        <option value="new">Brand New</option>
                        <option value="used">Used / Reconditioned</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Registration Plate *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GP 49 RT GP"
                      value={newBikePlate}
                      onChange={(e) => setNewBikePlate(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-xl text-xs font-black font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">VIN / Chassis Number</label>
                    <input
                      type="text"
                      placeholder="e.g. MD2A24AX8NW123..."
                      value={newBikeVin}
                      onChange={(e) => setNewBikeVin(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">GPS Tracker Device ID</label>
                    <input
                      type="text"
                      placeholder="e.g. CT-982412"
                      value={newBikeTrackerId}
                      onChange={(e) => setNewBikeTrackerId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. 📸 DRIVER & MOTORBIKE COLLECTION PHOTOS IN-TAKE */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Showroom Collection & Handover Photography
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                Capture rider with bike & keys for verification
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* PHOTO 1: DRIVER AT COLLECTION (Holding Keys / Posing) */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span>1. Driver Photo at Collection</span>
                    </span>
                    {driverCollectionPhoto ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Captured
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">Required</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Clear snapshot of {application.fullName} receiving the motorcycle keys at showroom.
                  </p>
                </div>

                {driverCollectionPhoto ? (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-900 h-36 flex items-center justify-center">
                    <img
                      src={driverCollectionPhoto}
                      alt="Driver at collection"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl({ title: 'Driver at Collection', url: driverCollectionPhoto })}
                        className="p-1.5 bg-white text-slate-900 rounded-lg text-xs font-bold hover:bg-slate-100"
                        title="View Photo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDriverCollectionPhoto('')}
                        className="p-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-500"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isProcessingImage}
                      onClick={() => driverPhotoInputRef.current?.click()}
                      className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Snap Driver Photo / Upload</span>
                    </button>
                  </div>
                )}
              </div>

              {/* PHOTO 2: BIKE CONDITION & HANDOVER PHOTOS */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <BikeIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>2. Bike Handover & Odometer Photos</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {handoverPhotos.length} Attached
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Snap odometer reading, delivery box, and body condition before driving off.
                  </p>
                </div>

                {handoverPhotos.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 overflow-x-auto pb-1 max-h-36">
                      {handoverPhotos.map((url, idx) => (
                        <div key={idx} className="relative group shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-slate-200 bg-slate-900">
                          <img src={url} alt={`Handover ${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoUrl({ title: `Bike Handover Photo ${idx + 1}`, url })}
                              className="p-1 bg-white text-slate-900 rounded-md text-[10px]"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveHandoverPhoto(idx)}
                              className="p-1 bg-rose-600 text-white rounded-md text-[10px]"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => bikePhotoInputRef.current?.click()}
                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Another Handover Photo</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessingImage}
                    onClick={() => bikePhotoInputRef.current?.click()}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-600" />
                    <span>Upload Bike / Odo Photos</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4. CONTRACT & HANDOVER TERMS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Weekly Rent (ZAR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
                <input
                  type="number"
                  required
                  min={100}
                  value={weeklyRate}
                  onChange={(e) => setWeeklyRate(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Deposit Paid (ZAR)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
                <input
                  type="number"
                  required
                  min={0}
                  value={depositPaid}
                  onChange={(e) => setDepositPaid(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Term (Months)</label>
              <input
                type="number"
                required
                min={1}
                max={48}
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">Start Odometer (KM)</label>
              <input
                type="number"
                required
                min={0}
                value={startOdoKm}
                onChange={(e) => setStartOdoKm(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900"
              />
            </div>
          </div>

          {/* 5. PRE-DELIVERY HANDOVER CHECKLIST */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              Handover Physical & Safety Verification Checklist
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.depositSettled}
                  onChange={(e) => setChecklist({ ...checklist, depositSettled: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Security Deposit R{depositPaid} Received</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.contractSigned}
                  onChange={(e) => setChecklist({ ...checklist, contractSigned: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Contract & NATIS Agreement Executed</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.helmetIssued}
                  onChange={(e) => setChecklist({ ...checklist, helmetIssued: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>DOT Helmet & Phone Mount Issued</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.deliveryBoxMounted}
                  onChange={(e) => setChecklist({ ...checklist, deliveryBoxMounted: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Insulated Delivery Box Mounted</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.trackerLiveVerified}
                  onChange={(e) => setChecklist({ ...checklist, trackerLiveVerified: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Live GPS Tracker Ping Verified</span>
              </label>

              <label className="flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={checklist.keysHandedOver}
                  onChange={(e) => setChecklist({ ...checklist, keysHandedOver: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>2x Keys Handed Over to Rider</span>
              </label>
            </div>
          </div>

          {/* 6. ADMIN NOTES */}
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Handover Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Rider collected at Randburg showroom. All documents, collection photo, and safety gear verified."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium"
            />
          </div>

          {/* MODAL FOOTER */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Handover & Deliver Motorbike</span>
            </button>
          </div>
        </form>

        {/* PHOTO LIGHTBOX PREVIEW */}
        {previewPhotoUrl && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-4 border border-slate-800 text-white space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-white">{previewPhotoUrl.title}</h4>
                <button
                  type="button"
                  onClick={() => setPreviewPhotoUrl(null)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="rounded-xl overflow-hidden max-h-[75vh] flex items-center justify-center bg-black">
                <img src={previewPhotoUrl.url} alt="Preview" className="max-w-full max-h-[75vh] object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
