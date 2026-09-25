import React, { useState } from 'react';
import { 
  Vehicle, 
  PartsInventoryItem, 
  RepairAndService, 
  TrafficFine, 
  Driver,
  VehicleStatus,
  BikeCategory
} from '../../types';
import { 
  Bike, 
  MapPin, 
  Wrench, 
  Package, 
  AlertCircle, 
  Search, 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Power, 
  BatteryCharging, 
  Fuel, 
  ShieldCheck, 
  Compass, 
  Layers, 
  X, 
  DollarSign, 
  FileText,
  AlertTriangle,
  Send,
  Radio,
  ExternalLink,
  ShoppingCart,
  Tag,
  Trash2,
  Edit,
  Printer,
  Receipt,
  Share2,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Upload,
  Camera,
  MessageSquare,
  Phone,
  UserCheck,
  Lock,
  Gauge,
  Sliders,
  Database,
  RefreshCw,
  AlertOctagon,
  CheckSquare,
  Copy,
  ShieldAlert,
  CheckCheck,
  Download,
  Eye,
  Shield,
  StickyNote
} from 'lucide-react';
import { 
  saveSingleVehicleAsync, 
  syncAllVehiclesToDatabase,
  saveSinglePartAsync,
  saveSingleServiceAsync,
  saveSingleFineAsync
} from '../../lib/fleetStore';

export type VehicleSubTab = 'register' | 'live_telematics' | 'parts_inventory' | 'repairs_service' | 'traffic_fines';

interface VehicleManagementViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  parts: PartsInventoryItem[];
  services: RepairAndService[];
  fines: TrafficFine[];
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdateDriver?: (driver: Driver) => void;
  onUpdatePart: (part: PartsInventoryItem) => void;
  onAddPart: (part: PartsInventoryItem) => void;
  onDeletePart?: (partId: string) => void;
  onAddService: (service: RepairAndService) => void;
  onUpdateFine: (fine: TrafficFine) => void;
  onAddFine: (fine: TrafficFine) => void;
  activeSubTab?: VehicleSubTab;
}

export const VehicleManagementView: React.FC<VehicleManagementViewProps> = ({
  vehicles,
  drivers,
  parts,
  services,
  fines,
  onUpdateVehicle,
  onAddVehicle,
  onUpdateDriver,
  onUpdatePart,
  onAddPart,
  onDeletePart,
  onAddService,
  onUpdateFine,
  onAddFine,
  activeSubTab,
}) => {
  const [subTab, setSubTab] = useState<VehicleSubTab>(activeSubTab || 'register');

  React.useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected vehicle for Live Tracking Map View
  const [selectedTrackingVehicleId, setSelectedTrackingVehicleId] = useState<string>(vehicles[0]?.id || '');

  // Add Vehicle Modal
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState<boolean>(false);
  const [isSyncingWithDb, setIsSyncingWithDb] = useState<boolean>(false);
  const [dbNotification, setDbNotification] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
    details?: string;
    sqlFix?: string;
  } | null>(null);

  // Document Lightbox Previewer
  const [activeDocViewer, setActiveDocViewer] = useState<{
    title: string;
    url: string;
    fileName?: string;
  } | null>(null);

  // -------------------------------------------------------------
  // DEDICATED MANAGE DOCUMENTS MODAL STATE & HANDLERS
  // -------------------------------------------------------------
  const [managingDocsVehicle, setManagingDocsVehicle] = useState<Vehicle | null>(null);
  const [managingDocsForm, setManagingDocsForm] = useState<{
    rc1DocumentUrl: string;
    rc1DocumentName: string;
    insuranceDocumentUrl: string;
    insuranceDocumentName: string;
    insuranceProvider: string;
    insurancePolicyNumber: string;
    insuranceExpiryDate: string;
    licenseDiskExpiryDate: string;
  }>({
    rc1DocumentUrl: '',
    rc1DocumentName: '',
    insuranceDocumentUrl: '',
    insuranceDocumentName: '',
    insuranceProvider: 'Santam Commercial',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '',
    licenseDiskExpiryDate: '',
  });
  const [isSavingDocs, setIsSavingDocs] = useState<boolean>(false);

  // -------------------------------------------------------------
  // DEDICATED BIKE NOTES MODAL STATE & HANDLERS
  // -------------------------------------------------------------
  const [editingNotesVehicle, setEditingNotesVehicle] = useState<Vehicle | null>(null);
  const [notesInputText, setNotesInputText] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  const [newVehicleForm, setNewVehicleForm] = useState({
    registration_plate: '',
    vin: '',
    engine_number: '',
    bike_id: 'bigboy-velocity-150',
    model_name: 'Big Boy Velocity 150',
    year: 2025,
    color: 'Fleet White',
    status: 'available_showroom',
    current_mileage_km: 0,
    last_service_mileage_km: 0,
    next_service_mileage_km: 5000,
    telematics_imei: `CT-${Math.floor(10000 + Math.random() * 90000)}-SA`,
    telematics_battery_health: 98,
    license_disk_expiry_date: '2027-04-30',
    tracker_provider: 'Cartrack SA',
    insurance_policy_number: '',
    insurance_provider: 'Santam Commercial',
    insurance_expiry_date: '2027-04-30',
    insurance_document_url: '',
    insurance_document_name: '',
    rc1_document_url: '',
    rc1_document_name: '',
    notes: '',
  });

  // -------------------------------------------------------------
  // EDIT / MANAGE VEHICLE (STATUS, ODOMETER & SERVICE INTERVALS)
  // -------------------------------------------------------------
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editVehicleForm, setEditVehicleForm] = useState<{
    status: string;
    odometerKm: number;
    lastServiceMileageKm: number;
    nextServiceKm: number;
    batteryHealthPercent: number;
    assignedDriverId: string;
    assignedDriverName: string;
    insurancePolicyNumber: string;
    insuranceProvider: string;
    insuranceExpiryDate: string;
    insuranceDocumentUrl: string;
    insuranceDocumentName: string;
    rc1DocumentUrl: string;
    rc1DocumentName: string;
    notes: string;
  }>({
    status: 'available_showroom',
    odometerKm: 0,
    lastServiceMileageKm: 0,
    nextServiceKm: 5000,
    batteryHealthPercent: 98,
    assignedDriverId: '',
    assignedDriverName: '',
    insurancePolicyNumber: '',
    insuranceProvider: 'Santam Commercial',
    insuranceExpiryDate: '',
    insuranceDocumentUrl: '',
    insuranceDocumentName: '',
    rc1DocumentUrl: '',
    rc1DocumentName: '',
    notes: '',
  });

  const handleDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'rc1' | 'insurance',
    isNewForm: boolean = false
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isNewForm) {
        if (docType === 'rc1') {
          setNewVehicleForm((prev) => ({
            ...prev,
            rc1_document_url: dataUrl,
            rc1_document_name: file.name,
          }));
        } else {
          setNewVehicleForm((prev) => ({
            ...prev,
            insurance_document_url: dataUrl,
            insurance_document_name: file.name,
          }));
        }
      } else {
        if (docType === 'rc1') {
          setEditVehicleForm((prev) => ({
            ...prev,
            rc1DocumentUrl: dataUrl,
            rc1DocumentName: file.name,
          }));
        } else {
          setEditVehicleForm((prev) => ({
            ...prev,
            insuranceDocumentUrl: dataUrl,
            insuranceDocumentName: file.name,
          }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManageDocsUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: 'rc1' | 'insurance'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (docType === 'rc1') {
        setManagingDocsForm((prev) => ({
          ...prev,
          rc1DocumentUrl: dataUrl,
          rc1DocumentName: file.name,
        }));
      } else {
        setManagingDocsForm((prev) => ({
          ...prev,
          insuranceDocumentUrl: dataUrl,
          insuranceDocumentName: file.name,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleOpenManageDocs = (veh: Vehicle) => {
    setManagingDocsVehicle(veh);
    setManagingDocsForm({
      rc1DocumentUrl: veh.rc1DocumentUrl || (veh as any).rc1_document_url || '',
      rc1DocumentName: veh.rc1DocumentName || (veh as any).rc1_document_name || '',
      insuranceDocumentUrl: veh.insuranceDocumentUrl || (veh as any).insurance_document_url || '',
      insuranceDocumentName: veh.insuranceDocumentName || (veh as any).insurance_document_name || '',
      insuranceProvider: veh.insuranceProvider || (veh as any).insurance_provider || 'Santam Commercial',
      insurancePolicyNumber: veh.insurancePolicyNumber || (veh as any).insurance_policy_number || '',
      insuranceExpiryDate: veh.insuranceExpiryDate || (veh as any).insurance_expiry_date || '',
      licenseDiskExpiryDate: veh.licenseDiskExpiryDate || (veh as any).license_disk_expiry_date || '',
    });
  };

  const handleSaveManageDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingDocsVehicle) return;
    setIsSavingDocs(true);

    const updatedVehicle: Vehicle = {
      ...managingDocsVehicle,
      rc1DocumentUrl: managingDocsForm.rc1DocumentUrl,
      rc1_document_url: managingDocsForm.rc1DocumentUrl,
      rc1DocumentName: managingDocsForm.rc1DocumentName,
      rc1_document_name: managingDocsForm.rc1DocumentName,
      insuranceDocumentUrl: managingDocsForm.insuranceDocumentUrl,
      insurance_document_url: managingDocsForm.insuranceDocumentUrl,
      insuranceDocumentName: managingDocsForm.insuranceDocumentName,
      insurance_document_name: managingDocsForm.insuranceDocumentName,
      insuranceProvider: managingDocsForm.insuranceProvider,
      insurance_provider: managingDocsForm.insuranceProvider,
      insurancePolicyNumber: managingDocsForm.insurancePolicyNumber,
      insurance_policy_number: managingDocsForm.insurancePolicyNumber,
      insuranceExpiryDate: managingDocsForm.insuranceExpiryDate,
      insurance_expiry_date: managingDocsForm.insuranceExpiryDate,
      licenseDiskExpiryDate: managingDocsForm.licenseDiskExpiryDate,
      license_disk_expiry_date: managingDocsForm.licenseDiskExpiryDate,
    };

    onUpdateVehicle(updatedVehicle);
    const dbRes = await saveSingleVehicleAsync(updatedVehicle);
    setIsSavingDocs(false);
    setManagingDocsVehicle(null);

    if (dbRes.success) {
      setDbNotification({
        type: 'success',
        message: `✓ Documents updated for ${updatedVehicle.registrationPlate} and synced to Supabase database!`,
      });
    } else if (dbRes.error) {
      setDbNotification({
        type: 'error',
        message: `Saved locally, but Supabase reported: ${dbRes.error}`,
      });
    }
  };

  const handleOpenNotes = (veh: Vehicle) => {
    setEditingNotesVehicle(veh);
    setNotesInputText(veh.notes || (veh as any).bike_notes || (veh as any).bikeNotes || '');
  };

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotesVehicle) return;
    setIsSavingNotes(true);

    const updatedVehicle: Vehicle = {
      ...editingNotesVehicle,
      notes: notesInputText.trim(),
      bike_notes: notesInputText.trim(),
      bikeNotes: notesInputText.trim(),
    };

    onUpdateVehicle(updatedVehicle);
    const dbRes = await saveSingleVehicleAsync(updatedVehicle);
    setIsSavingNotes(false);
    setEditingNotesVehicle(null);

    if (dbRes.success) {
      setDbNotification({
        type: 'success',
        message: `✓ Bike notes for ${updatedVehicle.registrationPlate} updated and synced to database!`,
      });
    } else if (dbRes.error) {
      setDbNotification({
        type: 'error',
        message: `Notes updated locally, but Supabase reported: ${dbRes.error}`,
      });
    }
  };

  const handleOpenEditVehicle = (veh: Vehicle) => {
    setEditingVehicle(veh);
    const currKm = Number(veh.odometerKm ?? (veh as any).current_mileage_km ?? 0);
    const lastKm = Number(veh.lastServiceMileageKm ?? (veh as any).last_service_mileage_km ?? 0);
    const nextKm = Number(veh.nextServiceKm ?? (veh as any).next_service_mileage_km ?? (currKm + 5000));
    const battery = Number(veh.batteryHealthPercent ?? (veh as any).telematics_battery_health ?? 98);

    setEditVehicleForm({
      status: veh.status || 'available_showroom',
      odometerKm: currKm,
      lastServiceMileageKm: lastKm,
      nextServiceKm: nextKm,
      batteryHealthPercent: battery,
      assignedDriverId: veh.assignedDriverId || '',
      assignedDriverName: veh.assignedDriverName || '',
      insurancePolicyNumber: veh.insurancePolicyNumber || (veh as any).insurance_policy_number || '',
      insuranceProvider: veh.insuranceProvider || (veh as any).insurance_provider || 'Santam Commercial',
      insuranceExpiryDate: veh.insuranceExpiryDate || (veh as any).insurance_expiry_date || '',
      insuranceDocumentUrl: veh.insuranceDocumentUrl || (veh as any).insurance_document_url || '',
      insuranceDocumentName: veh.insuranceDocumentName || (veh as any).insurance_document_name || '',
      rc1DocumentUrl: veh.rc1DocumentUrl || (veh as any).rc1_document_url || '',
      rc1DocumentName: veh.rc1DocumentName || (veh as any).rc1_document_name || '',
      notes: veh.notes || (veh as any).bike_notes || (veh as any).bikeNotes || '',
    });
  };

  const handleSaveEditVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    const currOdo = Number(editVehicleForm.odometerKm) || 0;
    const nextSrv = Number(editVehicleForm.nextServiceKm) || (currOdo + 5000);
    const lastSrv = Number(editVehicleForm.lastServiceMileageKm) || 0;
    const batt = Number(editVehicleForm.batteryHealthPercent) || 98;

    let driverId = editVehicleForm.assignedDriverId;
    let driverName = editVehicleForm.assignedDriverName;

    if (driverId === 'none' || !driverId) {
      driverId = undefined;
      driverName = undefined;
    } else {
      const d = drivers.find((drv) => drv.id === driverId);
      if (d) {
        driverName = d.fullName;
      }
    }

    const updatedVehicle: Vehicle = {
      ...editingVehicle,
      status: editVehicleForm.status as any,
      odometerKm: currOdo,
      current_mileage_km: currOdo,
      currentMileageKm: currOdo,
      lastServiceMileageKm: lastSrv,
      last_service_mileage_km: lastSrv,
      nextServiceKm: nextSrv,
      next_service_mileage_km: nextSrv,
      nextServiceMileageKm: nextSrv,
      batteryHealthPercent: batt,
      telematics_battery_health: batt,
      telematicsBatteryHealth: batt,
      assignedDriverId: driverId,
      assignedDriverName: driverName,
      insurancePolicyNumber: editVehicleForm.insurancePolicyNumber,
      insurance_policy_number: editVehicleForm.insurancePolicyNumber,
      insuranceProvider: editVehicleForm.insuranceProvider,
      insurance_provider: editVehicleForm.insuranceProvider,
      insuranceExpiryDate: editVehicleForm.insuranceExpiryDate,
      insurance_expiry_date: editVehicleForm.insuranceExpiryDate,
      insuranceDocumentUrl: editVehicleForm.insuranceDocumentUrl,
      insurance_document_url: editVehicleForm.insuranceDocumentUrl,
      insuranceDocumentName: editVehicleForm.insuranceDocumentName,
      insurance_document_name: editVehicleForm.insuranceDocumentName,
      rc1DocumentUrl: editVehicleForm.rc1DocumentUrl,
      rc1_document_url: editVehicleForm.rc1DocumentUrl,
      rc1DocumentName: editVehicleForm.rc1DocumentName,
      rc1_document_name: editVehicleForm.rc1DocumentName,
      notes: editVehicleForm.notes,
      bike_notes: editVehicleForm.notes,
      bikeNotes: editVehicleForm.notes,
    };

    onUpdateVehicle(updatedVehicle);
    setEditingVehicle(null);

    // Save to Supabase
    const dbRes = await saveSingleVehicleAsync(updatedVehicle);
    if (dbRes.success) {
      setDbNotification({
        type: 'success',
        message: `Vehicle ${updatedVehicle.registrationPlate} updated with documents & notes and synced to Supabase!`,
      });
    } else if (dbRes.error) {
      setDbNotification({
        type: 'error',
        message: `Updated in app, but Supabase reported: ${dbRes.error}`,
        sqlFix: dbRes.error.includes('row-level security')
          ? `CREATE POLICY "Public full access on vehicles" ON public.vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`
          : undefined,
      });
    }
  };

  const handleSyncWithSupabase = async () => {
    setIsSyncingWithDb(true);
    try {
      const res = await syncAllVehiclesToDatabase();
      if (res.errors.length === 0) {
        setDbNotification({
          type: 'success',
          message: `Successfully synchronized all ${res.synced} vehicle(s) directly to Supabase public.vehicles table!`,
        });
      } else {
        setDbNotification({
          type: 'error',
          message: `Synced ${res.synced} of ${res.total} vehicles.`,
          details: res.errors.join(' | '),
          sqlFix: res.errors.some(e => e.includes('row-level security') || e.includes('RLS'))
            ? `CREATE POLICY "Public full access on vehicles" ON public.vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`
            : undefined,
        });
      }
    } catch (err: any) {
      setDbNotification({
        type: 'error',
        message: `Sync failed: ${err?.message || 'Database error'}`,
      });
    } finally {
      setIsSyncingWithDb(false);
    }
  };

  // -------------------------------------------------------------
  // PARTS INVENTORY & POINT OF SALE (POS) STATE
  // -------------------------------------------------------------
  const [partsSearchQuery, setPartsSearchQuery] = useState<string>('');
  const [partsCategoryFilter, setPartsCategoryFilter] = useState<string>('all');
  const [partsStockStatusFilter, setPartsStockStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');

  // Add New Part Modal
  const [isAddPartOpen, setIsAddPartOpen] = useState<boolean>(false);
  const [newPartForm, setNewPartForm] = useState<Partial<PartsInventoryItem>>({
    name: '',
    sku: '',
    category: 'general',
    quantityInStock: 10,
    minThreshold: 3,
    costPriceZar: 150,
    sellingPriceZar: 250,
    compatibleModels: ['Bajaj Boxer 150 HD', 'Big Boy Velocity 150'],
    supplierName: 'Midas Randburg Auto Spares',
    imageUrl: '',
  });

  // Edit Part Modal
  const [editingPart, setEditingPart] = useState<PartsInventoryItem | null>(null);

  // Restock Part Modal
  const [restockPart, setRestockPart] = useState<PartsInventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // Point of Sale (POS) / Over-The-Counter Sell Part Modal
  const [isSellPartOpen, setIsSellPartOpen] = useState<boolean>(false);
  const [sellPartForm, setSellPartForm] = useState<{
    partId: string;
    quantity: number;
    customerType: 'fleet_driver' | 'walk_in' | 'workshop';
    driverId?: string;
    customerName: string;
    customerPhone: string;
    unitPriceZar: number;
    paymentMethod: 'cash' | 'yoco_card' | 'driver_balance' | 'instant_eft';
    notes: string;
  }>({
    partId: '',
    quantity: 1,
    customerType: 'fleet_driver',
    driverId: '',
    customerName: '',
    customerPhone: '',
    unitPriceZar: 0,
    paymentMethod: 'yoco_card',
    notes: 'Counter sales - Randburg Hub Workshop',
  });

  // Completed Sale Receipt Modal (Printable & WhatsApp)
  const [completedSaleReceipt, setCompletedSaleReceipt] = useState<{
    receiptNumber: string;
    date: string;
    customerName: string;
    customerPhone: string;
    customerType: string;
    partName: string;
    partSku: string;
    quantity: number;
    unitPriceZar: number;
    totalZar: number;
    paymentMethod: string;
    notes: string;
  } | null>(null);

  // Add Service Modal
  const [isAddServiceOpen, setIsAddServiceOpen] = useState<boolean>(false);
  const [notifyDriverWhatsApp, setNotifyDriverWhatsApp] = useState<boolean>(true);
  const [newServiceForm, setNewServiceForm] = useState<Partial<RepairAndService>>({
    vehiclePlate: vehicles[0]?.registrationPlate || '',
    driverId: vehicles[0]?.assignedDriverId || '',
    driverName: vehicles[0]?.assignedDriverName || 'Sipho Ndlovu',
    driverPhone: '',
    serviceType: 'routine_5000km',
    odometerKm: 5000,
    costZar: 350,
    technicianName: 'Master Siphesihle',
    garageLocation: 'Randburg Hub Workshop - 304 Tungsten Rd',
    status: 'completed',
    notes: 'Routine oil replacement, spark plug clean, chain tensioned.',
  });

  // Add Fine Modal
  const [isAddFineOpen, setIsAddFineOpen] = useState<boolean>(false);
  const [newFineForm, setNewFineForm] = useState<Partial<TrafficFine>>({
    noticeNumber: `JMPD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    infringementDate: new Date().toISOString().split('T')[0],
    vehiclePlate: vehicles[0]?.registrationPlate || '',
    driverName: 'Sipho Ndlovu',
    location: 'Bram Fischer Dr & Republic Rd, Randburg',
    municipality: 'JMPD - City of Johannesburg',
    infringementType: 'Exceeding speed limit (65km/h in 60km/h zone)',
    amountZar: 250,
    discountedAmountZar: 125,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    aartoStatus: 'notice_issued',
    paymentStatus: 'allocated_to_driver',
  });

  // Selected vehicle for telemetry focus
  const trackingVehicle = vehicles.find((v) => v.id === selectedTrackingVehicleId) || vehicles[0] || null;

  // Remote Ignition Toggle (Immobilize / Re-enable)
  const handleToggleIgnition = (vehicle: Vehicle) => {
    const updated: Vehicle = {
      ...vehicle,
      isIgnitionOn: !vehicle.isIgnitionOn,
    };
    onUpdateVehicle(updated);
  };

  // Filtered Vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      v.registrationPlate.toLowerCase().includes(q) ||
      v.vin.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.assignedDriverName && v.assignedDriverName.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchQuery && matchStatus;
  });

  // Low Stock Parts
  const lowStockParts = parts.filter((p) => p.quantityInStock <= p.minThreshold);

  // Submit Add Vehicle
  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleForm.registration_plate || !newVehicleForm.vin) return;

    setIsSubmittingVehicle(true);

    const regPlate = newVehicleForm.registration_plate.toUpperCase().trim();
    const vinCode = newVehicleForm.vin.toUpperCase().trim();
    const engNum = (newVehicleForm.engine_number || 'ENG-000').toUpperCase().trim();
    const bikeId = newVehicleForm.bike_id || 'bigboy-velocity-150';
    const modelName = newVehicleForm.model_name || 'Big Boy Velocity 150';

    let make = 'Bajaj';
    let category: BikeCategory = 'boxer';

    if (bikeId.includes('bigboy') || bikeId.includes('velocity') || modelName.toLowerCase().includes('big boy')) {
      make = 'Big Boy';
      category = 'bigboy';
    } else if (bikeId.includes('honda') || modelName.toLowerCase().includes('honda')) {
      make = 'Honda';
      category = 'honda';
    } else if (bikeId.includes('hero') || modelName.toLowerCase().includes('hero')) {
      make = 'Hero';
      category = 'hero';
    } else if (bikeId.includes('arch') || bikeId.includes('electric') || modelName.toLowerCase().includes('arch') || modelName.toLowerCase().includes('electric')) {
      make = 'Arch Electric';
      category = 'electric';
    } else if (bikeId === 'custom') {
      make = modelName.split(' ')[0] || 'Custom';
      category = 'custom';
    } else {
      make = 'Bajaj';
      category = 'boxer';
    }

    const currMileage = Number(newVehicleForm.current_mileage_km) || 0;
    const lastServiceMileage = Number(newVehicleForm.last_service_mileage_km) || 0;
    const nextServiceMileage = Number(newVehicleForm.next_service_mileage_km) || 5000;
    const telematicsImei = newVehicleForm.telematics_imei || `CT-${Math.floor(10000 + Math.random() * 90000)}-SA`;
    const telematicsBattery = Number(newVehicleForm.telematics_battery_health) || 98;
    const vehicleColor = newVehicleForm.color || 'Fleet White';
    const vehicleStatus = (newVehicleForm.status as any) || 'available_showroom';

    const created: Vehicle = {
      id: `veh-${Date.now()}`,
      vin: vinCode,
      engineNumber: engNum,
      engine_number: engNum,
      registrationPlate: regPlate,
      registration_plate: regPlate,
      bikeModelId: bikeId,
      bike_id: bikeId,
      bikeId: bikeId,
      make: make,
      model: modelName,
      model_name: modelName,
      modelName: modelName,
      year: Number(newVehicleForm.year) || 2025,
      color: vehicleColor,
      category: category,
      condition: 'new',
      status: vehicleStatus,
      odometerKm: currMileage,
      current_mileage_km: currMileage,
      currentMileageKm: currMileage,
      last_service_mileage_km: lastServiceMileage,
      lastServiceMileageKm: lastServiceMileage,
      nextServiceKm: nextServiceMileage,
      next_service_mileage_km: nextServiceMileage,
      nextServiceMileageKm: nextServiceMileage,
      trackerDeviceId: telematicsImei,
      telematics_imei: telematicsImei,
      telematicsImei: telematicsImei,
      trackerProvider: newVehicleForm.tracker_provider || 'Cartrack SA',
      batteryHealthPercent: telematicsBattery,
      telematics_battery_health: telematicsBattery,
      telematicsBatteryHealth: telematicsBattery,
      fuelLevelPercent: 100,
      isIgnitionOn: false,
      latitude: -26.0826,
      longitude: 27.9734,
      lastLocationAddress: '304 Tungsten Rd, Strijdom Park, Randburg',
      lastPingTime: new Date().toISOString(),
      insurancePolicyNumber: newVehicleForm.insurance_policy_number || 'OUT-FLEET-2026-900',
      insurance_policy_number: newVehicleForm.insurance_policy_number || 'OUT-FLEET-2026-900',
      insuranceProvider: newVehicleForm.insurance_provider || 'Santam Commercial',
      insurance_provider: newVehicleForm.insurance_provider || 'Santam Commercial',
      insuranceExpiryDate: newVehicleForm.insurance_expiry_date || '2027-04-30',
      insurance_expiry_date: newVehicleForm.insurance_expiry_date || '2027-04-30',
      insuranceDocumentUrl: newVehicleForm.insurance_document_url || undefined,
      insurance_document_url: newVehicleForm.insurance_document_url || undefined,
      insuranceDocumentName: newVehicleForm.insurance_document_name || undefined,
      insurance_document_name: newVehicleForm.insurance_document_name || undefined,
      rc1DocumentUrl: newVehicleForm.rc1_document_url || undefined,
      rc1_document_url: newVehicleForm.rc1_document_url || undefined,
      rc1DocumentName: newVehicleForm.rc1_document_name || undefined,
      rc1_document_name: newVehicleForm.rc1_document_name || undefined,
      licenseDiskExpiryDate: newVehicleForm.license_disk_expiry_date || '2027-04-30',
      license_disk_expiry_date: newVehicleForm.license_disk_expiry_date || '2027-04-30',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      image_url: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      notes: newVehicleForm.notes || undefined,
      bike_notes: newVehicleForm.notes || undefined,
      bikeNotes: newVehicleForm.notes || undefined,
    };

    onAddVehicle(created);

    // Save directly to Supabase
    const dbRes = await saveSingleVehicleAsync(created);
    setIsSubmittingVehicle(false);

    if (dbRes.success) {
      setDbNotification({
        type: 'success',
        message: `✓ Motorcycle ${regPlate} (${modelName}) was successfully saved and registered with compliance documents!`,
      });
    } else {
      setDbNotification({
        type: 'error',
        message: `Registered locally, but Supabase reported: ${dbRes.error || 'Unknown error'}`,
        sqlFix: dbRes.error?.includes('row-level security') || dbRes.error?.includes('RLS')
          ? `CREATE POLICY "Public full access on vehicles" ON public.vehicles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`
          : undefined,
      });
    }

    setNewVehicleForm({
      registration_plate: '',
      vin: '',
      engine_number: '',
      bike_id: 'bigboy-velocity-150',
      model_name: 'Big Boy Velocity 150',
      year: 2025,
      color: 'Fleet White',
      status: 'available_showroom',
      current_mileage_km: 0,
      last_service_mileage_km: 0,
      next_service_mileage_km: 5000,
      telematics_imei: `CT-${Math.floor(10000 + Math.random() * 90000)}-SA`,
      telematics_battery_health: 98,
      license_disk_expiry_date: '2027-04-30',
      tracker_provider: 'Cartrack SA',
      insurance_policy_number: '',
      insurance_provider: 'Santam Commercial',
      insurance_expiry_date: '2027-04-30',
      insurance_document_url: '',
      insurance_document_name: '',
      rc1_document_url: '',
      rc1_document_name: '',
      notes: '',
    });
    setIsAddVehicleOpen(false);
  };

  // -------------------------------------------------------------
  // PARTS INVENTORY & POINT OF SALE (POS) HANDLERS
  // -------------------------------------------------------------
  const handlePartImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (isEditing && editingPart) {
          setEditingPart({ ...editingPart, imageUrl: reader.result });
        } else {
          setNewPartForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreatePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartForm.name || !newPartForm.sku) {
      alert('Please provide Part Name and SKU');
      return;
    }

    const createdPart: PartsInventoryItem = {
      id: `part-${Date.now()}`,
      name: newPartForm.name.trim(),
      sku: newPartForm.sku.trim().toUpperCase(),
      category: newPartForm.category || 'general',
      quantityInStock: Number(newPartForm.quantityInStock) || 0,
      minThreshold: Number(newPartForm.minThreshold) || 1,
      costPriceZar: Number(newPartForm.costPriceZar) || 0,
      sellingPriceZar: Number(newPartForm.sellingPriceZar) || 0,
      compatibleModels: newPartForm.compatibleModels || ['Bajaj Boxer 150 HD', 'Big Boy Velocity 150'],
      supplierName: newPartForm.supplierName || 'Workshop Auto Spares',
      lastRestockedDate: new Date().toISOString().split('T')[0],
      imageUrl: newPartForm.imageUrl || '',
    };

    onAddPart(createdPart);
    setIsAddPartOpen(false);

    // Persist directly to Supabase
    const dbRes = await saveSinglePartAsync(createdPart);
    if (dbRes.success) {
      setDbNotification({
        type: 'success',
        message: `✓ Part "${createdPart.name}" (SKU: ${createdPart.sku}) successfully saved and synced to Supabase parts_inventory!`,
      });
    } else if (dbRes.error) {
      setDbNotification({
        type: 'error',
        message: `Saved locally, but Supabase reported: ${dbRes.error}`,
      });
    }

    setNewPartForm({
      name: '',
      sku: '',
      category: 'general',
      quantityInStock: 10,
      minThreshold: 3,
      costPriceZar: 150,
      sellingPriceZar: 250,
      compatibleModels: ['Bajaj Boxer 150 HD', 'Big Boy Velocity 150'],
      supplierName: 'Midas Randburg Auto Spares',
      imageUrl: '',
    });
  };

  const handleEditPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;
    onUpdatePart(editingPart);
    setEditingPart(null);
  };

  const handleDeletePartClick = (partId: string) => {
    if (window.confirm('Are you sure you want to remove this part from workshop inventory?')) {
      if (onDeletePart) {
        onDeletePart(partId);
      }
    }
  };

  const handleOpenSellModalForPart = (part: PartsInventoryItem) => {
    setSellPartForm({
      partId: part.id,
      quantity: 1,
      customerType: 'fleet_driver',
      driverId: drivers[0]?.id || '',
      customerName: drivers[0]?.fullName || '',
      customerPhone: drivers[0]?.phone || '',
      unitPriceZar: part.sellingPriceZar,
      paymentMethod: 'yoco_card',
      notes: `Over-the-counter sale: ${part.name}`,
    });
    setIsSellPartOpen(true);
  };

  const handleExecutePartSale = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPart = parts.find((p) => p.id === sellPartForm.partId);
    if (!targetPart) {
      alert('Selected part not found.');
      return;
    }

    const saleQty = Number(sellPartForm.quantity);
    if (saleQty <= 0) {
      alert('Sale quantity must be at least 1 unit.');
      return;
    }

    if (targetPart.quantityInStock < saleQty) {
      alert(`Insufficient stock! Only ${targetPart.quantityInStock} units available in workshop.`);
      return;
    }

    // 1. Deduct Stock
    const updatedPart: PartsInventoryItem = {
      ...targetPart,
      quantityInStock: targetPart.quantityInStock - saleQty,
    };
    onUpdatePart(updatedPart);

    const totalZar = Number(sellPartForm.unitPriceZar) * saleQty;
    const customerDisplayName = sellPartForm.customerType === 'fleet_driver'
      ? drivers.find(d => d.id === sellPartForm.driverId)?.fullName || sellPartForm.customerName || 'Fleet Driver'
      : sellPartForm.customerName || 'Walk-In Customer';

    // 2. If charged to driver balance, update driver account
    if (sellPartForm.customerType === 'fleet_driver' && sellPartForm.paymentMethod === 'driver_balance' && sellPartForm.driverId) {
      const selectedDriver = drivers.find((d) => d.id === sellPartForm.driverId);
      if (selectedDriver && onUpdateDriver) {
        onUpdateDriver({
          ...selectedDriver,
          balanceDue: (selectedDriver.balanceDue || 0) + totalZar,
        });
      }
    }

    // 3. Generate Receipt
    const receipt = {
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleString(),
      customerName: customerDisplayName,
      customerPhone: sellPartForm.customerPhone || 'N/A',
      customerType: sellPartForm.customerType === 'fleet_driver' ? 'Fleet Courier' : 'Direct Workshop Client',
      partName: targetPart.name,
      partSku: targetPart.sku,
      quantity: saleQty,
      unitPriceZar: Number(sellPartForm.unitPriceZar),
      totalZar,
      paymentMethod: sellPartForm.paymentMethod.replace(/_/g, ' ').toUpperCase(),
      notes: sellPartForm.notes || 'Workshop parts counter sale',
    };

    setCompletedSaleReceipt(receipt);
    setIsSellPartOpen(false);
  };

  // Restock Submit
  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockPart) return;

    const updated: PartsInventoryItem = {
      ...restockPart,
      quantityInStock: restockPart.quantityInStock + Number(restockQty),
      lastRestockedDate: new Date().toISOString().split('T')[0],
    };
    onUpdatePart(updated);
    setRestockPart(null);
  };

  // -------------------------------------------------------------
  // REPAIRS & SERVICE SYNCHRONIZATION HANDLERS
  // -------------------------------------------------------------
  const [selectedServiceParts, setSelectedServiceParts] = useState<Array<{
    partId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPriceZar: number;
    totalZar: number;
  }>>([]);
  const [serviceLaborCost, setServiceLaborCost] = useState<number>(250);
  const [servicePartsCost, setServicePartsCost] = useState<number>(0);
  const [billServiceToDriver, setBillServiceToDriver] = useState<boolean>(true);
  const [serviceAssignmentError, setServiceAssignmentError] = useState<string | null>(null);

  const handleOpenAddService = (defaultPlate?: string) => {
    setServiceAssignmentError(null);
    setSelectedServiceParts([]);
    setServiceLaborCost(250);
    setServicePartsCost(0);
    setBillServiceToDriver(true);

    const plate = defaultPlate || (vehicles[0]?.registrationPlate ?? '');
    const matchedVeh = vehicles.find((v) => v.registrationPlate === plate);
    const matchedDriver = drivers.find(
      (d) => d.id === matchedVeh?.assignedDriverId || d.fullName === matchedVeh?.assignedDriverName
    );

    setNewServiceForm({
      vehiclePlate: plate,
      driverId: matchedDriver?.id || matchedVeh?.assignedDriverId || '',
      driverName: matchedDriver?.fullName || matchedVeh?.assignedDriverName || 'Unassigned / Showroom Stock',
      driverPhone: matchedDriver?.phone || '',
      serviceType: 'routine_5000km',
      odometerKm: matchedVeh?.odometerKm || 5000,
      costZar: 250,
      technicianName: 'Master Siphesihle',
      garageLocation: 'Randburg Hub Workshop - 304 Tungsten Rd',
      status: 'completed',
      notes: 'Routine 5,000 km oil replacement, spark plug inspect, chain tensioned.',
    });
    setNotifyDriverWhatsApp(Boolean(matchedDriver?.phone));
    setIsAddServiceOpen(true);
  };

  const handleServiceVehicleChange = (plate: string) => {
    setServiceAssignmentError(null);
    const matchedVeh = vehicles.find((v) => v.registrationPlate === plate);
    const matchedDriver = drivers.find(
      (d) => d.id === matchedVeh?.assignedDriverId || d.fullName === matchedVeh?.assignedDriverName
    );
    setNewServiceForm((prev) => ({
      ...prev,
      vehiclePlate: plate,
      driverId: matchedDriver?.id || matchedVeh?.assignedDriverId || '',
      driverName: matchedDriver?.fullName || matchedVeh?.assignedDriverName || 'Unassigned / Showroom Stock',
      driverPhone: matchedDriver?.phone || '',
      odometerKm: matchedVeh?.odometerKm || prev.odometerKm || 5000,
    }));
  };

  const handleServiceDriverChange = (driverId: string) => {
    setServiceAssignmentError(null);
    if (driverId === 'none') {
      setNewServiceForm((prev) => ({
        ...prev,
        driverId: undefined,
        driverName: 'Unassigned / Showroom Stock',
        driverPhone: undefined,
      }));
      return;
    }
    const d = drivers.find((drv) => drv.id === driverId);
    if (d) {
      // Check if driver has an assigned bike
      const assignedPlate = d.assignedBikeVinOrPlate || d.assignedVehiclePlate;
      const assignedVeh = vehicles.find(
        (v) => v.id === d.assignedVehicleId || v.registrationPlate === assignedPlate || v.assignedDriverId === d.id
      );

      if (!assignedVeh && !assignedPlate) {
        setServiceAssignmentError(`⚠️ ${d.fullName} does not have an assigned bike. A driver cannot service a bike that is not assigned to them.`);
        setNewServiceForm((prev) => ({
          ...prev,
          driverId: d.id,
          driverName: d.fullName,
          driverPhone: d.phone,
          vehiclePlate: '',
        }));
      } else {
        const plate = assignedVeh?.registrationPlate || assignedPlate || '';
        setNewServiceForm((prev) => ({
          ...prev,
          driverId: d.id,
          driverName: d.fullName,
          driverPhone: d.phone,
          vehiclePlate: plate,
          odometerKm: assignedVeh?.odometerKm || prev.odometerKm || 5000,
        }));
      }
    }
  };

  const handleAddPartToService = (partId: string) => {
    const part = parts.find((p) => p.id === partId);
    if (!part) return;
    if (part.quantityInStock <= 0) {
      alert(`Part "${part.name}" is out of stock in the workshop inventory.`);
      return;
    }

    setSelectedServiceParts((prev) => {
      const existing = prev.find((p) => p.partId === partId);
      let updated;
      if (existing) {
        updated = prev.map((p) =>
          p.partId === partId
            ? { ...p, quantity: p.quantity + 1, totalZar: (p.quantity + 1) * p.unitPriceZar }
            : p
        );
      } else {
        updated = [
          ...prev,
          {
            partId: part.id,
            name: part.name,
            sku: part.sku,
            quantity: 1,
            unitPriceZar: part.sellingPriceZar,
            totalZar: part.sellingPriceZar,
          },
        ];
      }
      const newPartsSum = updated.reduce((sum, item) => sum + item.totalZar, 0);
      setServicePartsCost(newPartsSum);
      setNewServiceForm((f) => ({ ...f, costZar: serviceLaborCost + newPartsSum }));
      return updated;
    });
  };

  const handleRemovePartFromService = (partId: string) => {
    setSelectedServiceParts((prev) => {
      const updated = prev.filter((p) => p.partId !== partId);
      const newPartsSum = updated.reduce((sum, item) => sum + item.totalZar, 0);
      setServicePartsCost(newPartsSum);
      setNewServiceForm((f) => ({ ...f, costZar: serviceLaborCost + newPartsSum }));
      return updated;
    });
  };

  const sendServiceWhatsApp = (srv: RepairAndService, phoneOverride?: string) => {
    const phone = phoneOverride || srv.driverPhone || drivers.find(d => d.id === srv.driverId || d.fullName === srv.driverName)?.phone;
    if (!phone) {
      alert('No phone number found for this driver.');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const partsList = srv.partsUsed && srv.partsUsed.length > 0 ? `\n📦 *Parts / Items Bought:* ${srv.partsUsed.join(', ')}` : '';
    const msg = `Good day ${srv.driverName || 'Rider'}! 🏍️\n\nYour assigned motorbike (*${srv.vehiclePlate}*) service record has been logged by *Dynamic Rental Workshop*:\n\n🔧 *Service Type:* ${srv.serviceType.replace(/_/g, ' ').toUpperCase()}\n📍 *Workshop:* ${srv.garageLocation}\n👨‍🔧 *Technician:* ${srv.technicianName}\n⏱️ *Odometer:* ${(srv.odometerKm || 0).toLocaleString()} KM${partsList}\n📝 *Notes:* ${srv.notes || 'Routine 5,000 km maintenance completed.'}\n💰 *Total Service Cost:* R${srv.costZar}\n\nYour motorbike is roadworthy and cleared for operations! Safe riding!`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Submit Service Log
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceForm.vehiclePlate) {
      alert('Please select a valid assigned motorbike plate.');
      return;
    }

    const matchedVeh = vehicles.find((v) => v.registrationPlate === newServiceForm.vehiclePlate);
    const assignedDrv = drivers.find((d) => d.id === newServiceForm.driverId || d.fullName === newServiceForm.driverName) || 
      drivers.find((d) => d.id === matchedVeh?.assignedDriverId || d.fullName === matchedVeh?.assignedDriverName);

    // Enforce driver-vehicle assignment rule
    if (newServiceForm.driverId && newServiceForm.driverId !== 'none') {
      const selectedDriver = drivers.find((d) => d.id === newServiceForm.driverId);
      const assignedPlate = selectedDriver?.assignedBikeVinOrPlate || selectedDriver?.assignedVehiclePlate;
      if (assignedPlate && assignedPlate !== newServiceForm.vehiclePlate) {
        alert(`Rule Violation: Driver ${selectedDriver?.fullName} is assigned to bike ${assignedPlate}. A driver cannot repair a bike (${newServiceForm.vehiclePlate}) that is not assigned to them.`);
        return;
      }
    }

    const partsNames = selectedServiceParts.map((p) => `${p.name} (x${p.quantity})`);
    const totalCost = serviceLaborCost + servicePartsCost;

    const srv: RepairAndService = {
      id: `srv-${Date.now()}`,
      vehicleId: matchedVeh?.id || '',
      vehiclePlate: newServiceForm.vehiclePlate || '',
      driverId: newServiceForm.driverId || assignedDrv?.id || matchedVeh?.assignedDriverId,
      driverName: newServiceForm.driverName || assignedDrv?.fullName || matchedVeh?.assignedDriverName || 'Unassigned / Showroom Stock',
      driverPhone: newServiceForm.driverPhone || assignedDrv?.phone,
      serviceType: newServiceForm.serviceType || 'routine_5000km',
      odometerKm: Number(newServiceForm.odometerKm) || 0,
      costZar: totalCost,
      laborCostZar: serviceLaborCost,
      partsCostZar: servicePartsCost,
      itemsBought: selectedServiceParts,
      technicianName: newServiceForm.technicianName || '',
      garageLocation: newServiceForm.garageLocation || 'Workshop',
      serviceDate: new Date().toISOString().split('T')[0],
      status: 'completed',
      partsUsed: partsNames,
      notes: newServiceForm.notes || '',
      billedToDriver: billServiceToDriver,
    };

    onAddService(srv);

    // 1. Deduct parts inventory quantities
    selectedServiceParts.forEach((sp) => {
      const originalPart = parts.find((p) => p.id === sp.partId);
      if (originalPart) {
        const updatedPart: PartsInventoryItem = {
          ...originalPart,
          quantityInStock: Math.max(0, originalPart.quantityInStock - sp.quantity),
        };
        onUpdatePart(updatedPart);
      }
    });

    // 2. Update vehicle next service KM and odometer
    if (matchedVeh) {
      const nextKm = (Number(newServiceForm.odometerKm) || matchedVeh.odometerKm) + 5000;
      onUpdateVehicle({
        ...matchedVeh,
        lastServiceDate: new Date().toISOString().split('T')[0],
        nextServiceKm: nextKm,
        odometerKm: Number(newServiceForm.odometerKm) || matchedVeh.odometerKm,
        status: matchedVeh.status === 'in_maintenance' ? 'assigned' : matchedVeh.status,
      });
    }

    // 3. Persist directly to Supabase
    const dbRes = await saveSingleServiceAsync(srv);
    if (dbRes.success) {
      setDbNotification({
        type: 'success',
        message: `✓ Workshop service & parts record for ${srv.vehiclePlate} (${srv.serviceType.replace(/_/g, ' ')}) logged and saved to Supabase!`,
      });
    } else if (dbRes.error) {
      setDbNotification({
        type: 'error',
        message: `Logged locally, but Supabase reported: ${dbRes.error}`,
      });
    }

    // Broadcast WhatsApp if enabled
    if (notifyDriverWhatsApp && srv.driverPhone) {
      sendServiceWhatsApp(srv, srv.driverPhone);
    }

    setIsAddServiceOpen(false);
  };

  // Submit Fine
  const handleCreateFine = async (e: React.FormEvent) => {
    e.preventDefault();
    const fine: TrafficFine = {
      id: `fine-${Date.now()}`,
      noticeNumber: newFineForm.noticeNumber || `FINE-${Date.now()}`,
      infringementDate: newFineForm.infringementDate || new Date().toISOString().split('T')[0],
      vehiclePlate: newFineForm.vehiclePlate || '',
      driverName: newFineForm.driverName,
      location: newFineForm.location || 'Johannesburg',
      municipality: newFineForm.municipality || 'JMPD',
      infringementType: newFineForm.infringementType || 'Traffic Violation',
      amountZar: Number(newFineForm.amountZar) || 0,
      discountedAmountZar: (Number(newFineForm.amountZar) || 0) / 2,
      dueDate: newFineForm.dueDate || new Date().toISOString().split('T')[0],
      aartoStatus: 'notice_issued',
      paymentStatus: 'allocated_to_driver',
    };

    onAddFine(fine);

    // Direct Supabase sync
    const dbRes = await saveSingleFineAsync(fine);
    if (dbRes.success) {
      setDbNotification({
        type: 'success',
        message: `✓ Traffic fine notice ${fine.noticeNumber} for ${fine.vehiclePlate} synced to Supabase!`,
      });
    }

    setIsAddFineOpen(false);
  };

  // Dynamic Header based on active subtab
  const getHeaderInfo = () => {
    switch (subTab) {
      case 'live_telematics':
        return {
          tag: 'GPS Telematics',
          title: 'Live GPS Telematics & Remote Fleet Control',
          desc: 'Real-time telemetry, location coordinates, battery health, speed logs, and remote ignition immobilizer kill switch.',
        };
      case 'parts_inventory':
        return {
          tag: 'Stock & Inventory',
          title: 'Parts & Consumables Inventory',
          desc: 'Spare parts stock levels, cost and retail pricing, minimum thresholds, and workshop supplier restocks.',
        };
      case 'repairs_service':
        return {
          tag: 'Workshop & Maintenance',
          title: 'Repairs & 5,000 km Scheduled Maintenance',
          desc: 'Routine 5,000 km oil/filter services, brake replacements, overhaul work orders, and technician logs.',
        };
      case 'traffic_fines':
        return {
          tag: 'AARTO & Compliance',
          title: 'Traffic Fines & AARTO Infringements',
          desc: 'JMPD/TMPD fine allocations to couriers, 50% prompt settlement discounts, and payment deduction ledgers.',
        };
      default:
        return {
          tag: 'Fleet Assets',
          title: 'Vehicle & Asset Register',
          desc: 'Motorcycle asset inventory, VINs, engine numbers, NATIS registration plates, and assigned couriers.',
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
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
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

        {/* Quick Fleet Health Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Motorbikes</span>
            <span className="text-lg font-black text-slate-900">{vehicles.length} Units</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-bold uppercase text-emerald-600 block">Assigned / Active</span>
            <span className="text-lg font-black text-emerald-800">
              {vehicles.filter((v) => v.status === 'assigned').length}
            </span>
          </div>
          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200/80">
            <span className="text-[10px] font-bold uppercase text-blue-600 block">Available in Showroom</span>
            <span className="text-lg font-black text-blue-800">
              {vehicles.filter((v) => v.status === 'available').length}
            </span>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
            <span className="text-[10px] font-bold uppercase text-amber-600 block">In Workshop / Service</span>
            <span className="text-lg font-black text-amber-800">
              {vehicles.filter((v) => v.status === 'in_maintenance').length}
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: ASSET REGISTER */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'register' && (
        <div className="space-y-4">
          {/* Supabase Persistence Notification Banner */}
          {dbNotification && (
            <div
              className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs transition-all ${
                dbNotification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : dbNotification.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {dbNotification.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{dbNotification.message}</p>
                  {dbNotification.details && (
                    <p className="text-[11px] opacity-80 mt-0.5 font-mono">{dbNotification.details}</p>
                  )}
                  {dbNotification.sqlFix && (
                    <div className="mt-2 p-2.5 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] select-all">
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-700 text-[10px] text-amber-400 font-bold uppercase">
                        <span>Supabase SQL Fix for RLS:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(dbNotification.sqlFix || '');
                            alert('SQL query copied! Run this in your Supabase SQL Editor.');
                          }}
                          className="flex items-center gap-1 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy SQL</span>
                        </button>
                      </div>
                      <code>{dbNotification.sqlFix}</code>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDbNotification(null)}
                className="p-1 hover:bg-black/5 rounded transition-colors text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search registration plate, VIN, engine number, driver..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="assigned">Assigned</option>
                <option value="available">Available</option>
                <option value="in_maintenance">In Maintenance</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSyncingWithDb}
                onClick={handleSyncWithSupabase}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
                title="Sync all local and registered vehicles to Supabase PostgreSQL database"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncingWithDb ? 'animate-spin' : ''}`} />
                <span>{isSyncingWithDb ? 'Syncing...' : 'Sync with Supabase'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Vehicle</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Plate & Model</th>
                    <th className="py-3 px-4">VIN & Engine Number</th>
                    <th className="py-3 px-4">Assigned Courier</th>
                    <th className="py-3 px-4">Odometer & Next Service</th>
                    <th className="py-3 px-4">Cartrack SA (Track)</th>
                    <th className="py-3 px-4">Bike Notes</th>
                    <th className="py-3 px-4">Manage Documents</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredVehicles.map((veh) => {
                    // Deep search for assigned courier across vehicle properties and drivers list
                    const assignedDriver = drivers.find(
                      (d) =>
                        (veh.assignedDriverId && d.id === veh.assignedDriverId) ||
                        (d.assignedBikeVinOrPlate && (d.assignedBikeVinOrPlate.toLowerCase() === veh.registrationPlate.toLowerCase() || d.assignedBikeVinOrPlate.toLowerCase() === veh.vin.toLowerCase())) ||
                        (d.assignedVehiclePlate && d.assignedVehiclePlate.toLowerCase() === veh.registrationPlate.toLowerCase()) ||
                        (d.assignedVehicleId && d.assignedVehicleId === veh.id) ||
                        (veh.assignedDriverName && d.fullName && d.fullName.toLowerCase() === veh.assignedDriverName.toLowerCase())
                    );
                    const driverName = assignedDriver?.fullName || veh.assignedDriverName;
                    const driverPhone = assignedDriver?.phone;
                    const driverRef = assignedDriver?.refNumber || (assignedDriver?.id ? `DRV-${assignedDriver.id.slice(-4)}` : undefined);
                    const isAssigned = Boolean(driverName && driverName.trim() !== '' && driverName.toLowerCase() !== 'none' && driverName.toLowerCase() !== 'unassigned');
                    const bikeNotesText = veh.notes || (veh as any).bike_notes || (veh as any).bikeNotes || '';

                    return (
                      <tr key={veh.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Plate & Model */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-black text-xs shrink-0">
                              <Bike className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-mono font-black text-slate-900 text-sm block leading-tight">
                                {veh.registrationPlate}
                              </span>
                              <span className="text-[11px] text-slate-500">{veh.make} {veh.model} ({veh.year})</span>
                            </div>
                          </div>
                        </td>

                        {/* VIN & Engine */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          <div>
                            <span className="font-semibold text-slate-800 block">VIN: {veh.vin}</span>
                            <span className="text-slate-500">ENG: {veh.engineNumber}</span>
                          </div>
                        </td>

                        {/* Assigned Courier */}
                        <td className="py-3.5 px-4">
                          {isAssigned ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-[10px] shrink-0 border border-emerald-300">
                                  {driverName!.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 block truncate leading-tight">
                                    {driverName}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                    {driverRef && <span className="font-mono">{driverRef}</span>}
                                    {driverPhone && <span className="text-emerald-700 font-semibold">{driverPhone}</span>}
                                  </div>
                                </div>
                              </div>
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Active Courier (Rent-to-Own)
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-blue-800 bg-blue-100/90 px-2.5 py-1 rounded-lg border border-blue-300 shadow-2xs">
                                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                                <span>Available on Showroom</span>
                              </span>
                              <span className="text-[10px] text-slate-400 block pl-1 font-medium">
                                Showroom Stock · Unassigned
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Odometer & Service */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 font-mono">{veh.odometerKm.toLocaleString()} KM</span>
                            <span className="text-[10px] text-slate-500 block">
                              Next: {veh.nextServiceKm.toLocaleString()} KM ({Math.max(0, veh.nextServiceKm - veh.odometerKm)} km rem)
                            </span>
                          </div>
                        </td>

                        {/* Tracker */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 font-mono text-[11px]">
                              <span className={`w-2 h-2 rounded-full ${veh.isIgnitionOn ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                              <span className="text-slate-800 font-bold">{veh.trackerDeviceId || 'Cartrack SA'}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTrackingVehicleId(veh.id);
                                setSubTab('live_telematics');
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="View Live GPS Telematics Radar"
                            >
                              <Compass className="w-3 h-3 text-cyan-600" />
                              <span>Track Live</span>
                            </button>
                          </div>
                        </td>

                        {/* Bike Notes (Next to Track column) */}
                        <td className="py-3.5 px-4">
                          {bikeNotesText ? (
                            <button
                              type="button"
                              onClick={() => handleOpenNotes(veh)}
                              className="max-w-[170px] text-left p-1.5 bg-amber-50/90 hover:bg-amber-100 border border-amber-200 rounded-lg text-[11px] text-amber-950 font-medium transition-colors flex items-start gap-1.5 group cursor-pointer"
                              title="Click to view or edit bike notes"
                            >
                              <StickyNote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                              <span className="line-clamp-2 leading-tight">
                                {bikeNotesText}
                              </span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenNotes(veh)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-50 text-slate-500 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 border border-slate-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              title="Add bike notes / inspection remarks"
                            >
                              <StickyNote className="w-3 h-3 text-slate-400" />
                              <span>+ Add Note</span>
                            </button>
                          )}
                        </td>

                        {/* Manage Documents (RC1 & Insurance) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* RC1 Document Badge */}
                              {veh.rc1DocumentUrl || (veh as any).rc1_document_url ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveDocViewer({
                                    title: `RC1 Certificate of Registration (Proof of Ownership): ${veh.registrationPlate}`,
                                    url: veh.rc1DocumentUrl || (veh as any).rc1_document_url,
                                    fileName: veh.rc1DocumentName || (veh as any).rc1_document_name || 'RC1_Registration_Certificate.pdf'
                                  })}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="View Verified RC1 Proof of Ownership Document"
                                >
                                  <FileText className="w-3 h-3 text-emerald-600" />
                                  <span>RC1 ✓</span>
                                </button>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                  No RC1
                                </span>
                              )}

                              {/* Insurance Document Badge */}
                              {veh.insuranceDocumentUrl || (veh as any).insurance_document_url ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveDocViewer({
                                    title: `Comprehensive Fleet Insurance Policy: ${veh.registrationPlate}`,
                                    url: veh.insuranceDocumentUrl || (veh as any).insurance_document_url,
                                    fileName: veh.insuranceDocumentName || (veh as any).insurance_document_name || 'Insurance_Policy.pdf'
                                  })}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-50 text-sky-800 border border-sky-300 hover:bg-sky-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="View Comprehensive Insurance Policy Document"
                                >
                                  <ShieldCheck className="w-3 h-3 text-sky-600" />
                                  <span>Insured ✓</span>
                                </button>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-400 border border-slate-200">
                                  No Policy
                                </span>
                              )}
                            </div>

                            {/* Prominent Manage Documents Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenManageDocs(veh)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold transition-colors inline-flex items-center gap-1 border border-indigo-200 shadow-2xs cursor-pointer w-full justify-center"
                              title="Upload and manage RC1 and Insurance compliance documents"
                            >
                              <Upload className="w-3 h-3 text-indigo-600" />
                              <span>Manage Documents</span>
                            </button>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            veh.status === 'assigned'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : veh.status === 'available' || veh.status === 'available_showroom'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {veh.status === 'available_showroom' ? 'Showroom Stock' : veh.status.replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditVehicle(veh)}
                              className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                              title="Manage Vehicle Status, Odometer & Next Service"
                            >
                              <Edit className="w-3.5 h-3.5 text-indigo-300" />
                              <span>Manage</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenManageDocs(veh)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-indigo-200/80 shadow-2xs"
                              title="Upload & Manage Documents"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Docs</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenNotes(veh)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 border border-amber-200 shadow-2xs"
                              title="View or edit bike notes"
                            >
                              <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                              <span>Notes</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 2: LIVE GPS TELEMATICS SIMULATOR */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'live_telematics' && trackingVehicle && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Interactive Map Visualization */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 text-white shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-white">
                      Gauteng Fleet Live GPS Radar
                    </h3>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      Cartrack SA & Netstar Telematics Protocol (Active Feed)
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold">
                  Hub: Randburg Showroom (-26.0826, 27.9734)
                </span>
              </div>

              {/* Simulated Map Area */}
              <div className="relative h-80 w-full mt-4 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden">
                {/* Visual Grid Lines */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Road Corridor Mock Lines */}
                <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-cyan-500/20" />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-500/20" />
                <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-cyan-500/20" />
                <div className="absolute left-2/3 top-0 bottom-0 w-0.5 bg-cyan-500/20" />

                {/* Showroom Hub Marker */}
                <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 z-10 text-center">
                  <div className="w-8 h-8 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-lg mx-auto border-2 border-white animate-bounce">
                    🏢
                  </div>
                  <span className="text-[10px] font-black uppercase text-cyan-300 bg-slate-950/80 px-2 py-0.5 rounded mt-1 inline-block">
                    Dynamic Randburg Hub
                  </span>
                </div>

                {/* Vehicle Pins across Gauteng */}
                {vehicles.map((v, i) => {
                  const offsets = [
                    { top: '35%', left: '42%' },
                    { top: '55%', left: '68%' },
                    { top: '22%', left: '50%' },
                    { top: '65%', left: '60%' },
                    { top: '50%', left: '33%' },
                    { top: '48%', left: '36%' },
                  ];
                  const pos = offsets[i % offsets.length];
                  const isSelected = v.id === trackingVehicle.id;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedTrackingVehicleId(v.id)}
                      style={{ top: pos.top, left: pos.left }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 transition-transform ${
                        isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                      }`}
                    >
                      <div className={`p-1.5 rounded-full shadow-lg flex items-center justify-center ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30'
                          : v.isIgnitionOn
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        <Bike className="w-4 h-4" />
                      </div>
                      <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded mt-0.5 block whitespace-nowrap ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-900/90 text-slate-200'
                      }`}>
                        {v.registrationPlate}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Map Footer Info */}
              <div className="flex items-center justify-between text-xs text-slate-400 mt-4 pt-3 border-t border-slate-800">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Ignition On / Driving
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Parked / Standby
                  </span>
                </div>
                <span>Geofence Zone: Greater Johannesburg & Pretoria</span>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Vehicle Telemetry Card & Remote Controls */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Focused Telematics Unit
                  </span>
                  <h4 className="font-mono font-black text-lg text-slate-900">
                    {trackingVehicle.registrationPlate}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {trackingVehicle.make} {trackingVehicle.model} ({trackingVehicle.year})
                  </span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                  trackingVehicle.isIgnitionOn
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {trackingVehicle.isIgnitionOn ? 'Engine Active' : 'Ignition Off'}
                </span>
              </div>

              {/* Location telemetry */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span className="font-bold text-slate-700">Last Reported Location</span>
                </div>
                <p className="font-medium text-slate-900 pl-5">{trackingVehicle.lastLocationAddress}</p>
                <span className="text-[10px] text-slate-400 pl-5 block">
                  Ping: {trackingVehicle.lastPingTime} • GPS: {trackingVehicle.latitude}, {trackingVehicle.longitude}
                </span>
              </div>

              {/* Courier & Telemetry Stats */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Assigned Rider</span>
                  <span className="font-bold text-slate-900">{trackingVehicle.assignedDriverName || 'Unassigned'}</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Odometer</span>
                  <span className="font-bold text-slate-900">{trackingVehicle.odometerKm.toLocaleString()} KM</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Battery Health</span>
                  <span className="font-bold text-emerald-700">{trackingVehicle.batteryHealthPercent}%</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Fuel / Charge Level</span>
                  <span className="font-bold text-cyan-700">{trackingVehicle.fuelLevelPercent}%</span>
                </div>
              </div>

              {/* Remote Immobilizer Action */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-800 block mb-2">
                  Emergency Telematics Action (Cartrack Protocol)
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleIgnition(trackingVehicle)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm ${
                    trackingVehicle.isIgnitionOn
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>
                    {trackingVehicle.isIgnitionOn ? 'Remote Engine Cut-Off (Immobilize)' : 'Re-Enable Engine Ignition'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 3: PARTS & STOCK INVENTORY */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'parts_inventory' && (
        <div className="space-y-4">
          {/* Header & Main Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Parts & Consumables Workshop Inventory
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage spare parts, stock levels, over-the-counter counter sales, and repairs consumption for Randburg Hub.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  if (parts.length === 0) {
                    alert('Please add a part to inventory first before making a sale.');
                    setIsAddPartOpen(true);
                    return;
                  }
                  setSellPartForm({
                    partId: parts[0]?.id || '',
                    quantity: 1,
                    customerType: 'fleet_driver',
                    driverId: drivers[0]?.id || '',
                    customerName: drivers[0]?.fullName || '',
                    customerPhone: drivers[0]?.phone || '',
                    unitPriceZar: parts[0]?.sellingPriceZar || 0,
                    paymentMethod: 'yoco_card',
                    notes: 'Over-the-counter sale - Workshop Counter',
                  });
                  setIsSellPartOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>🛒 Sell Part (Over-The-Counter)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddPartOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add New Part / Stock Item</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Catalog Items</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">{parts.length} SKUs</span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Units in Stock</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {parts.reduce((sum, p) => sum + (p.quantityInStock || 0), 0)} Units
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cost Value (ZAR)</span>
              <span className="text-lg font-black text-slate-700 mt-0.5 block">
                R{parts.reduce((sum, p) => sum + ((p.costPriceZar || 0) * (p.quantityInStock || 0)), 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Retail Value (ZAR)</span>
              <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                R{parts.reduce((sum, p) => sum + ((p.sellingPriceZar || 0) * (p.quantityInStock || 0)), 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Low Stock Alerts</span>
              <span className="text-lg font-black text-amber-600 mt-0.5 block">
                {parts.filter((p) => (p.quantityInStock || 0) <= (p.minThreshold || 0)).length} Items
              </span>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={partsSearchQuery}
                onChange={(e) => setPartsSearchQuery(e.target.value)}
                placeholder="Search by part name, SKU code, supplier..."
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={partsCategoryFilter}
                  onChange={(e) => setPartsCategoryFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
                >
                  <option value="all">All Categories</option>
                  <option value="engine_oil">Engine Oil & Fluids</option>
                  <option value="brakes">Brakes & Pads</option>
                  <option value="tires_tubes">Tires & Tubes</option>
                  <option value="chain_sprockets">Chain & Sprockets</option>
                  <option value="spark_plugs">Spark Plugs</option>
                  <option value="cables">Clutch / Throttle Cables</option>
                  <option value="electrical_bulbs">Electrical & Bulbs</option>
                  <option value="filters">Air & Oil Filters</option>
                  <option value="accessories">Helmets & Delivery Boxes</option>
                  <option value="general">General Spares</option>
                </select>
              </div>

              <select
                value={partsStockStatusFilter}
                onChange={(e) => setPartsStockStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
              >
                <option value="all">All Stock Statuses</option>
                <option value="in_stock">In Stock (&gt; Min)</option>
                <option value="low_stock">⚠️ Low Stock (≤ Min)</option>
                <option value="out_of_stock">🚫 Out of Stock (0)</option>
              </select>
            </div>
          </div>

          {/* Parts Grid */}
          {(() => {
            const filteredParts = parts.filter((part) => {
              const q = partsSearchQuery.toLowerCase().trim();
              const matchQuery =
                !q ||
                part.name.toLowerCase().includes(q) ||
                part.sku.toLowerCase().includes(q) ||
                (part.supplierName && part.supplierName.toLowerCase().includes(q)) ||
                (part.compatibleModels && part.compatibleModels.some(m => m.toLowerCase().includes(q)));

              const matchCat = partsCategoryFilter === 'all' || part.category === partsCategoryFilter;

              let matchStock = true;
              if (partsStockStatusFilter === 'in_stock') {
                matchStock = part.quantityInStock > part.minThreshold;
              } else if (partsStockStatusFilter === 'low_stock') {
                matchStock = part.quantityInStock > 0 && part.quantityInStock <= part.minThreshold;
              } else if (partsStockStatusFilter === 'out_of_stock') {
                matchStock = part.quantityInStock === 0;
              }

              return matchQuery && matchCat && matchStock;
            });

            if (filteredParts.length === 0) {
              return (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 space-y-3">
                  <Package className="w-10 h-10 text-slate-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-900">No Parts Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {parts.length === 0
                      ? 'No parts in inventory yet. Add your workshop spares and consumables to start tracking inventory and selling parts.'
                      : 'No inventory items match your current search or category filter.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddPartOpen(true)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    + Add Part to Workshop
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredParts.map((part) => {
                  const isLowStock = part.quantityInStock <= part.minThreshold && part.quantityInStock > 0;
                  const isOutOfStock = part.quantityInStock === 0;
                  const grossProfitZar = (part.sellingPriceZar || 0) - (part.costPriceZar || 0);
                  const marginPct = part.costPriceZar > 0 
                    ? Math.round((grossProfitZar / part.costPriceZar) * 100) 
                    : 0;

                  return (
                    <div
                      key={part.id}
                      className={`bg-white rounded-2xl border overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow ${
                        isOutOfStock 
                          ? 'border-rose-300 bg-rose-50/10' 
                          : isLowStock 
                          ? 'border-amber-300 bg-amber-50/10' 
                          : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Part Image / Visual Header */}
                        <div className="relative h-36 bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                          {part.imageUrl ? (
                            <img
                              src={part.imageUrl}
                              alt={part.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                              <Package className="w-8 h-8 text-slate-300" />
                              <span className="text-[11px] font-medium text-slate-400">Workshop Spares</span>
                            </div>
                          )}

                          {/* Stock Status Badge */}
                          <div className="absolute top-2.5 right-2.5">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                                Low ({part.quantityInStock} left)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-xs">
                                In Stock ({part.quantityInStock})
                              </span>
                            )}
                          </div>

                          {/* SKU Pill */}
                          <div className="absolute bottom-2.5 left-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white font-mono text-[10px] font-bold">
                              SKU: {part.sku}
                            </span>
                          </div>
                        </div>

                        <div className="p-4">
                          {/* Title & Category */}
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{part.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-indigo-700 font-semibold uppercase tracking-wider">
                              {part.category.replace(/_/g, ' ')}
                            </span>
                            {part.supplierName && (
                              <span className="text-[10px] text-slate-400 font-medium truncate">
                                • {part.supplierName}
                              </span>
                            )}
                          </div>

                          {/* Compatible Bike Models */}
                          {part.compatibleModels && part.compatibleModels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2.5">
                              {part.compatibleModels.map((model, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                                  {model}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Inventory Metrics Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs px-4">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Stock</span>
                            <span className={`text-base font-black ${isOutOfStock ? 'text-rose-600' : isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
                              {part.quantityInStock} units
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Min Threshold</span>
                            <span className="text-base font-bold text-slate-600">{part.minThreshold} units</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Cost Price</span>
                            <span className="font-bold text-slate-800">R{part.costPriceZar}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Selling / Fleet</span>
                            <span className="font-bold text-emerald-700">R{part.sellingPriceZar}</span>
                            {marginPct > 0 && (
                              <span className="text-[10px] text-emerald-600 font-bold ml-1">(+{marginPct}%)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Footer & Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-400">Restocked: {part.lastRestockedDate}</span>

                        <div className="flex items-center gap-1.5">
                          {/* Sell Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenSellModalForPart(part)}
                            disabled={isOutOfStock}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                              isOutOfStock
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Sell</span>
                          </button>

                          {/* Restock Button */}
                          <button
                            type="button"
                            onClick={() => setRestockPart(part)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                          >
                            + Restock
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingPart(part)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Part Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleDeletePartClick(part.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete Part"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 4: REPAIRS & 5,000 KM SERVICES */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'repairs_service' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                5,000 KM Maintenance Intervals & Workshop Logs
              </h3>
              <p className="text-xs text-slate-500">
                Mandatory routine service records to maintain warranty, insurance validity, and courier road safety.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddService()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Workshop Service</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Plate & Service Type</th>
                  <th className="py-3 px-4">Assigned Driver & Phone</th>
                  <th className="py-3 px-4">Odometer & Date</th>
                  <th className="py-3 px-4">Workshop & Technician</th>
                  <th className="py-3 px-4">Parts & Notes</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Driver Broadcast</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {services.map((srv) => {
                  const driverMatch = drivers.find(d => d.id === srv.driverId || d.fullName === srv.driverName);
                  const driverPhone = srv.driverPhone || driverMatch?.phone;
                  return (
                    <tr key={srv.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-mono font-bold text-slate-900 block">{srv.vehiclePlate}</span>
                          <span className="text-[11px] text-slate-500 capitalize">{srv.serviceType.replace(/_/g, ' ')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 block flex items-center gap-1">
                            {srv.driverName && srv.driverName !== 'Unassigned / Showroom Stock' ? (
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            ) : null}
                            {srv.driverName || 'Showroom Stock'}
                          </span>
                          {driverPhone ? (
                            <span className="text-[10px] text-slate-500 font-mono">{driverPhone}</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">No phone assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 block">{srv.odometerKm.toLocaleString()} KM</span>
                          <span className="text-[10px] text-slate-400">{srv.serviceDate}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div>
                          <span className="font-bold text-slate-900 block">{srv.technicianName}</span>
                          <span className="text-[10px] text-slate-500">{srv.garageLocation}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="truncate text-slate-600">{srv.notes}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Parts: {srv.partsUsed?.join(', ') || 'Standard service'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">R{srv.costZar}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          srv.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {srv.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => sendServiceWhatsApp(srv, driverPhone)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                          title="Broadcast Service Record via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 5: AARTO TRAFFIC FINES */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'traffic_fines' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                AARTO Traffic Infringements & Municipality Fine Allocation
              </h3>
              <p className="text-xs text-slate-500">
                Automatically allocate JMPD/EMPD/TMPD notices to active riders, track 50% discount windows, and settle via Yoco link.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddFineOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Log Traffic Fine</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Notice Number</th>
                  <th className="py-3 px-4">Vehicle & Driver</th>
                  <th className="py-3 px-4">Infringement Details</th>
                  <th className="py-3 px-4">Amount & 50% Discount</th>
                  <th className="py-3 px-4">AARTO Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {fines.map((fine) => (
                  <tr key={fine.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{fine.noticeNumber}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">{fine.vehiclePlate}</span>
                        <span className="text-[11px] text-slate-500">{fine.driverName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-900 font-medium">{fine.infringementType}</p>
                      <span className="text-[10px] text-slate-400 block">{fine.location} • {fine.municipality}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900">R{fine.amountZar}</span>
                        <span className="text-[10px] text-emerald-700 font-bold block">
                          Discount: R{fine.discountedAmountZar} (Due {fine.dueDate})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        fine.paymentStatus === 'deducted_from_earnings' || fine.aartoStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {fine.paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {fine.paymentStatus !== 'deducted_from_earnings' && (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateFine({
                              ...fine,
                              paymentStatus: 'deducted_from_earnings',
                              aartoStatus: 'paid',
                            });
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Mark Settled
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: REGISTER NEW VEHICLE */}
      {/* ------------------------------------------------------------- */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-lg">Register New Fleet Asset</h3>
                <p className="text-xs text-slate-500 mt-0.5">Enter bike specifications, identification, telematics, and maintenance parameters</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="mt-5 space-y-5">
              {/* Section 1: Identification & Registration */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block mb-3">
                  1. Identification & Registration
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Registration Plate <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CA 123-456 / GP"
                      value={newVehicleForm.registration_plate}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, registration_plate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      VIN (17 Characters) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={17}
                      placeholder="e.g. MD2A24BY8PW091244"
                      value={newVehicleForm.vin}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vin: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Engine Number</label>
                    <input
                      type="text"
                      placeholder="e.g. DHX-98241"
                      value={newVehicleForm.engine_number}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, engine_number: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Model Specifications & Status */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block mb-3">
                  2. Model Specifications & Asset Status
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Bike Model Preset (bike_id)</label>
                    <select
                      value={newVehicleForm.bike_id}
                      onChange={(e) => {
                        const bId = e.target.value;
                        let autoModel = newVehicleForm.model_name;
                        if (bId === 'bigboy-velocity-150' || bId === 'bigboy') autoModel = 'Big Boy Velocity 150';
                        else if (bId === 'bajaj-boxer-150' || bId === 'baja-boxer') autoModel = 'Bajaj Boxer 150 HD';
                        else if (bId === 'honda-ace-125' || bId === 'honda') autoModel = 'Honda Ace 125';
                        else if (bId === 'hero-hunter-150' || bId === 'hero') autoModel = 'Hero Hunter 150';
                        else if (bId === 'arch-electric' || bId === 'arch-eclectic') autoModel = 'Arch Eclectic E-Bike';
                        else if (bId === 'custom') autoModel = '';
                        setNewVehicleForm({ ...newVehicleForm, bike_id: bId, model_name: autoModel });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    >
                      <option value="bigboy-velocity-150">Big Boy</option>
                      <option value="bajaj-boxer-150">Baja Boxer</option>
                      <option value="honda-ace-125">Honda</option>
                      <option value="hero-hunter-150">Hero</option>
                      <option value="arch-electric">Arch Eclectic</option>
                      <option value="custom">Custom Model</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Model Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bajaj Boxer 150 HD"
                      value={newVehicleForm.model_name}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, model_name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Year of Manufacture</label>
                    <input
                      type="number"
                      required
                      min={2018}
                      max={2030}
                      value={newVehicleForm.year}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, year: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Color / Livery</label>
                    <input
                      type="text"
                      placeholder="e.g. Fleet White / Matte Black"
                      value={newVehicleForm.color}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, color: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Initial Status</label>
                    <select
                      value={newVehicleForm.status}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    >
                      <option value="available_showroom">Available / Showroom Stock</option>
                      <option value="available">Available for Deployment</option>
                      <option value="in_maintenance">In Maintenance / Workshop</option>
                      <option value="assigned">Assigned to Driver</option>
                      <option value="impounded">Impounded / Grounded</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Mileage & Service Intervals (KM) */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block mb-3">
                  3. Mileage & Service Intervals (KM)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Current Mileage (KM)</label>
                    <input
                      type="number"
                      min={0}
                      value={newVehicleForm.current_mileage_km}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, current_mileage_km: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Last Service Mileage (KM)</label>
                    <input
                      type="number"
                      min={0}
                      value={newVehicleForm.last_service_mileage_km}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, last_service_mileage_km: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Next Service Due (KM)</label>
                    <input
                      type="number"
                      min={0}
                      value={newVehicleForm.next_service_mileage_km}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, next_service_mileage_km: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Telematics & Tracking Hardware */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block mb-3">
                  4. Telematics & Tracking Hardware
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Telematics IMEI / Tracker ID</label>
                    <input
                      type="text"
                      placeholder="e.g. CT-99636-SA"
                      value={newVehicleForm.telematics_imei}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, telematics_imei: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Telematics Battery Health (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={newVehicleForm.telematics_battery_health}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, telematics_battery_health: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">License Disk Expiry</label>
                    <input
                      type="date"
                      value={newVehicleForm.license_disk_expiry_date}
                      onChange={(e) => setNewVehicleForm({ ...newVehicleForm, license_disk_expiry_date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Ownership & Compliance Documents (RC1 & Insurance) */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>5. Compliance & Ownership Documents (Required for Fleet Deploy)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                    NATIS & Underwriting
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DOCUMENT 1: RC1 NATIS OWNERSHIP DOCUMENT */}
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-slate-900">RC1 Document (Ownership)</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        NATIS RC1
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Upload the official RSA NATIS RC1 Certificate of Registration proving company ownership.
                    </p>

                    {newVehicleForm.rc1_document_url ? (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-900 truncate">
                              {newVehicleForm.rc1_document_name || 'RC1_Ownership_Doc.pdf'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewVehicleForm(prev => ({ ...prev, rc1_document_url: '', rc1_document_name: '' }))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveDocViewer({
                              title: `RC1 Document Preview - ${newVehicleForm.registration_plate || 'New Vehicle'}`,
                              url: newVehicleForm.rc1_document_url,
                              fileName: newVehicleForm.rc1_document_name || 'RC1_Doc.pdf'
                            })}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview RC1</span>
                          </button>
                          <label className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer transition-colors">
                            <span>Change File</span>
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/jpg"
                              onChange={(e) => handleDocumentUpload(e, 'rc1', true)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all group">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-900">
                          Upload RC1 Ownership File
                        </span>
                        <span className="text-[10px] text-slate-400">
                          PDF, PNG, or JPG (Max 15MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleDocumentUpload(e, 'rc1', true)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* DOCUMENT 2: INSURANCE DOCUMENT & POLICY DETAILS */}
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-slate-900">Insurance Policy Document</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Fleet Policy
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Upload active comprehensive cover schedule or fleet insurance policy note.
                    </p>

                    {newVehicleForm.insurance_document_url ? (
                      <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                            <span className="text-xs font-bold text-sky-900 truncate">
                              {newVehicleForm.insurance_document_name || 'Insurance_Policy.pdf'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setNewVehicleForm(prev => ({ ...prev, insurance_document_url: '', insurance_document_name: '' }))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveDocViewer({
                              title: `Insurance Policy Preview - ${newVehicleForm.registration_plate || 'New Vehicle'}`,
                              url: newVehicleForm.insurance_document_url,
                              fileName: newVehicleForm.insurance_document_name || 'Insurance_Policy.pdf'
                            })}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview Insurance</span>
                          </button>
                          <label className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-sky-300 text-sky-800 rounded-lg text-[10px] font-bold cursor-pointer transition-colors">
                            <span>Change File</span>
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/jpg"
                              onChange={(e) => handleDocumentUpload(e, 'insurance', true)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-sky-50/30 transition-all group">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-sky-900">
                          Upload Insurance Document
                        </span>
                        <span className="text-[10px] text-slate-400">
                          PDF, PNG, or JPG (Max 15MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleDocumentUpload(e, 'insurance', true)}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* Policy Metadata Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Provider</label>
                        <select
                          value={newVehicleForm.insurance_provider}
                          onChange={(e) => setNewVehicleForm({ ...newVehicleForm, insurance_provider: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium bg-white"
                        >
                          <option value="Santam Commercial">Santam Commercial</option>
                          <option value="Discovery Insure">Discovery Insure</option>
                          <option value="Hollard Commercial">Hollard Commercial</option>
                          <option value="Old Mutual Insure">Old Mutual Insure</option>
                          <option value="Outsurance Fleet">Outsurance Fleet</option>
                          <option value="Guardrisk">Guardrisk</option>
                          <option value="Other">Other Underwriter</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Policy Number</label>
                        <input
                          type="text"
                          placeholder="e.g. POL-90241-FLT"
                          value={newVehicleForm.insurance_policy_number}
                          onChange={(e) => setNewVehicleForm({ ...newVehicleForm, insurance_policy_number: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={newVehicleForm.insurance_expiry_date}
                          onChange={(e) => setNewVehicleForm({ ...newVehicleForm, insurance_expiry_date: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 6: Bike Notes & Handover Remarks */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700">
                    <StickyNote className="w-4 h-4 text-amber-600" />
                    <span>6. Bike Notes & Workshop / Handover Remarks</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Optional</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="e.g. Spare key in manager safe, brand new Pirelli tires fitted, top delivery box mounted..."
                  value={newVehicleForm.notes}
                  onChange={(e) => setNewVehicleForm({ ...newVehicleForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingVehicle}
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVehicle}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-75 disabled:cursor-wait"
                >
                  {isSubmittingVehicle ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase Database...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Save & Register Asset in Fleet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: MANAGE / EDIT VEHICLE STATUS & ODOMETER */}
      {/* ------------------------------------------------------------- */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Asset Management
                  </span>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    Manage Vehicle: <span className="font-mono text-indigo-600">{editingVehicle.registrationPlate}</span>
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Update operational status, odometer reading, and maintenance intervals. Permanent identification fields are locked.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingVehicle(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditVehicle} className="mt-5 space-y-4">
              {/* LOCKED IDENTIFIERS (READ-ONLY) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Permanent Identifiers (Locked / Read-Only)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded-md">
                    NATIS Compliance
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Registration Plate</span>
                    <span className="font-mono font-black text-slate-900 text-sm flex items-center gap-1">
                      {editingVehicle.registrationPlate}
                      <Lock className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Chassis VIN</span>
                    <span className="font-mono font-bold text-slate-800 truncate block" title={editingVehicle.vin}>
                      {editingVehicle.vin || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Engine Number</span>
                    <span className="font-mono font-bold text-slate-800 truncate block">
                      {editingVehicle.engineNumber || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Make & Model</span>
                    <span className="font-bold text-slate-900 truncate block">
                      {editingVehicle.make} {editingVehicle.model}
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Color & Year</span>
                    <span className="font-medium text-slate-700">
                      {editingVehicle.color || 'Fleet White'} ({editingVehicle.year || 2025})
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Telematics IMEI</span>
                    <span className="font-mono text-slate-700 truncate block">
                      {editingVehicle.trackerDeviceId || 'Cartrack SA'}
                    </span>
                  </div>
                </div>
              </div>

              {/* EDITABLE SECTION 1: OPERATIONAL STATUS & COURIER */}
              <div className="bg-indigo-50/40 rounded-xl p-4 border border-indigo-100 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-900 block">
                  1. Operational Status & Driver Assignment
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Vehicle Status *
                    </label>
                    <select
                      value={editVehicleForm.status}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white text-slate-900"
                    >
                      <option value="available_showroom">Available / Showroom Stock</option>
                      <option value="available">Available for Deployment</option>
                      <option value="assigned">Assigned / Active with Courier</option>
                      <option value="in_maintenance">In Workshop / Scheduled Maintenance</option>
                      <option value="impounded">Impounded / Grounded</option>
                      <option value="decommissioned">Decommissioned / Retired</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Assigned Courier / Rider
                    </label>
                    <select
                      value={editVehicleForm.assignedDriverId || 'none'}
                      onChange={(e) => {
                        const drvId = e.target.value;
                        if (drvId === 'none') {
                          setEditVehicleForm({
                            ...editVehicleForm,
                            assignedDriverId: '',
                            assignedDriverName: '',
                            status: editVehicleForm.status === 'assigned' ? 'available_showroom' : editVehicleForm.status,
                          });
                        } else {
                          const matched = drivers.find((d) => d.id === drvId);
                          setEditVehicleForm({
                            ...editVehicleForm,
                            assignedDriverId: drvId,
                            assignedDriverName: matched?.fullName || '',
                            status: 'assigned',
                          });
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white text-slate-900"
                    >
                      <option value="none">Unassigned / Showroom Inventory</option>
                      {drivers.map((drv) => (
                        <option key={drv.id} value={drv.id}>
                          {drv.fullName} ({drv.phone || drv.idOrPassportNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* EDITABLE SECTION 2: ODOMETER & NEXT SERVICE MILEAGE */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block">
                  2. Odometer Reading & Maintenance Intervals (KM)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Current Odometer (KM) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editVehicleForm.odometerKm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditVehicleForm({
                          ...editVehicleForm,
                          odometerKm: val,
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    />
                    <div className="flex gap-1 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setEditVehicleForm(prev => ({ ...prev, odometerKm: prev.odometerKm + 250 }))}
                        className="px-1.5 py-0.5 bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded"
                      >
                        +250km
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditVehicleForm(prev => ({ ...prev, odometerKm: prev.odometerKm + 500 }))}
                        className="px-1.5 py-0.5 bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded"
                      >
                        +500km
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditVehicleForm(prev => ({ ...prev, odometerKm: prev.odometerKm + 1000 }))}
                        className="px-1.5 py-0.5 bg-slate-200/70 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded"
                      >
                        +1,000km
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Next Service Due (KM) *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={editVehicleForm.nextServiceKm}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, nextServiceKm: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    />
                    <div className="flex gap-1 mt-1.5">
                      <button
                        type="button"
                        onClick={() => setEditVehicleForm(prev => ({ ...prev, nextServiceKm: prev.odometerKm + 5000 }))}
                        className="px-1.5 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-[10px] font-bold rounded"
                      >
                        Odo + 5,000km
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Last Service Mileage (KM)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editVehicleForm.lastServiceMileageKm}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, lastServiceMileageKm: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    />
                  </div>
                </div>

                {/* Remaining KM helper calculation */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Service Status:{' '}
                    <strong className={editVehicleForm.nextServiceKm - editVehicleForm.odometerKm <= 500 ? 'text-amber-600' : 'text-emerald-600'}>
                      {Math.max(0, editVehicleForm.nextServiceKm - editVehicleForm.odometerKm).toLocaleString()} KM remaining
                    </strong>{' '}
                    until next routine maintenance.
                  </span>
                </div>
              </div>

              {/* EDITABLE SECTION 3: TELEMATICS BATTERY HEALTH */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100">
                <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block mb-2">
                  3. Telematics & GPS Hardware Health
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Tracker Battery Health (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editVehicleForm.batteryHealthPercent}
                      onChange={(e) => setEditVehicleForm({ ...editVehicleForm, batteryHealthPercent: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
                    />
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500 font-bold">Battery Gauge:</span>
                      <span className="font-mono font-black text-slate-900">{editVehicleForm.batteryHealthPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          editVehicleForm.batteryHealthPercent > 50
                            ? 'bg-emerald-500'
                            : editVehicleForm.batteryHealthPercent > 20
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, editVehicleForm.batteryHealthPercent))}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* EDITABLE SECTION 4: OWNERSHIP & COMPLIANCE DOCUMENTS (RC1 & INSURANCE) */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>4. Compliance & Ownership Documents (RC1 & Insurance)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                    NATIS & Underwriting
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DOCUMENT 1: RC1 NATIS OWNERSHIP DOCUMENT */}
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-slate-900">RC1 Document (Ownership)</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        NATIS RC1
                      </span>
                    </div>

                    {editVehicleForm.rc1DocumentUrl ? (
                      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-900 truncate">
                              {editVehicleForm.rc1DocumentName || 'RC1_Ownership_Doc.pdf'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditVehicleForm(prev => ({ ...prev, rc1DocumentUrl: '', rc1DocumentName: '' }))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveDocViewer({
                              title: `RC1 Ownership Document: ${editingVehicle.registrationPlate}`,
                              url: editVehicleForm.rc1DocumentUrl,
                              fileName: editVehicleForm.rc1DocumentName || 'RC1_Ownership_Doc.pdf'
                            })}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview RC1</span>
                          </button>
                          <label className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer transition-colors">
                            <span>Replace File</span>
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/jpg"
                              onChange={(e) => handleDocumentUpload(e, 'rc1', false)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all group">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-900">
                          Upload RC1 Ownership File
                        </span>
                        <span className="text-[10px] text-slate-400">
                          PDF, PNG, or JPG (Max 15MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleDocumentUpload(e, 'rc1', false)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* DOCUMENT 2: INSURANCE DOCUMENT & POLICY DETAILS */}
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-black text-slate-900">Insurance Policy Document</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        Fleet Policy
                      </span>
                    </div>

                    {editVehicleForm.insuranceDocumentUrl ? (
                      <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                            <span className="text-xs font-bold text-sky-900 truncate">
                              {editVehicleForm.insuranceDocumentName || 'Insurance_Policy.pdf'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditVehicleForm(prev => ({ ...prev, insuranceDocumentUrl: '', insuranceDocumentName: '' }))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setActiveDocViewer({
                              title: `Insurance Policy: ${editingVehicle.registrationPlate}`,
                              url: editVehicleForm.insuranceDocumentUrl,
                              fileName: editVehicleForm.insuranceDocumentName || 'Insurance_Policy.pdf'
                            })}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview Insurance</span>
                          </button>
                          <label className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-sky-300 text-sky-800 rounded-lg text-[10px] font-bold cursor-pointer transition-colors">
                            <span>Replace File</span>
                            <input
                              type="file"
                              accept=".pdf,image/png,image/jpeg,image/jpg"
                              onChange={(e) => handleDocumentUpload(e, 'insurance', false)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-slate-50/50 hover:bg-sky-50/30 transition-all group">
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-sky-600 transition-colors" />
                        <span className="text-xs font-bold text-slate-700 group-hover:text-sky-900">
                          Upload Insurance Document
                        </span>
                        <span className="text-[10px] text-slate-400">
                          PDF, PNG, or JPG (Max 15MB)
                        </span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleDocumentUpload(e, 'insurance', false)}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* Policy Metadata Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Provider</label>
                        <select
                          value={editVehicleForm.insuranceProvider}
                          onChange={(e) => setEditVehicleForm({ ...editVehicleForm, insuranceProvider: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium bg-white"
                        >
                          <option value="Santam Commercial">Santam Commercial</option>
                          <option value="Discovery Insure">Discovery Insure</option>
                          <option value="Hollard Commercial">Hollard Commercial</option>
                          <option value="Old Mutual Insure">Old Mutual Insure</option>
                          <option value="Outsurance Fleet">Outsurance Fleet</option>
                          <option value="Guardrisk">Guardrisk</option>
                          <option value="Other">Other Underwriter</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Policy Number</label>
                        <input
                          type="text"
                          placeholder="e.g. POL-90241-FLT"
                          value={editVehicleForm.insurancePolicyNumber}
                          onChange={(e) => setEditVehicleForm({ ...editVehicleForm, insurancePolicyNumber: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={editVehicleForm.insuranceExpiryDate}
                          onChange={(e) => setEditVehicleForm({ ...editVehicleForm, insuranceExpiryDate: e.target.value })}
                          className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* EDITABLE SECTION 5: BIKE NOTES & REMARKS */}
              <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-indigo-700">
                    <StickyNote className="w-4 h-4 text-amber-600" />
                    <span>5. Bike Notes & Operational Remarks</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Internal Hub Log</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Add or update notes for this motorbike..."
                  value={editVehicleForm.notes}
                  onChange={(e) => setEditVehicleForm({ ...editVehicleForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
                />
              </div>

              {/* MODAL FOOTER */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Save & Update Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: RESTOCK PART */}
      {/* ------------------------------------------------------------- */}
      {restockPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-black text-slate-900 text-sm">Restock Part Inventory</h3>
            <p className="text-xs text-slate-500 mt-1">{restockPart.name}</p>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Units to Add</label>
                <input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockPart(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold"
                >
                  Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: LOG SERVICE */}
      {/* ------------------------------------------------------------- */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-slate-900 text-base">Log Workshop Service & Maintenance</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="mt-4 space-y-4">
              {serviceAssignmentError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{serviceAssignmentError}</span>
                </div>
              )}

              {/* Courier / Driver Selection First (Enforces Driver-Bike Lock) */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Courier / Assigned Driver *</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Bike locked to driver's assigned asset</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <select
                      value={newServiceForm.driverId || 'none'}
                      onChange={(e) => handleServiceDriverChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-white"
                    >
                      <option value="none">Unassigned / Showroom Inventory</option>
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.assignedBikeVinOrPlate || d.assignedVehiclePlate || 'No bike'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Driver Phone (e.g. +27 82 123 4567)"
                      value={newServiceForm.driverPhone || ''}
                      onChange={(e) => setNewServiceForm({ ...newServiceForm, driverPhone: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                    />
                  </div>
                </div>

                {/* Assigned Motorcycle (Locked to Driver) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Assigned Motorbike Plate *
                  </label>
                  <select
                    value={newServiceForm.vehiclePlate}
                    onChange={(e) => handleServiceVehicleChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-900"
                    required
                  >
                    <option value="" disabled>-- Select Motorbike --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.registrationPlate}>
                        {v.registrationPlate} ({v.make} {v.model}) — Driver: {v.assignedDriverName || 'Stock'}
                      </option>
                    ))}
                  </select>
                </div>

                {newServiceForm.driverPhone && (
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyDriverWhatsApp}
                      onChange={(e) => setNotifyDriverWhatsApp(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-emerald-600" />
                      Broadcast WhatsApp clearance receipt to driver upon save
                    </span>
                  </label>
                )}
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Service / Repair Type *</label>
                  <select
                    value={newServiceForm.serviceType}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, serviceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="routine_5000km">Routine 5,000 KM Maintenance</option>
                    <option value="brake_replacement">Brake Shoes / Pads Replacement</option>
                    <option value="tire_change">Tire & Tube Replacement</option>
                    <option value="accident_repair">Accident & Body Repair</option>
                    <option value="electrical_tracker">Electrical & GPS Tracker</option>
                    <option value="major_overhaul">Major Overhaul / Engine Service</option>
                    <option value="cosmetic_box">Delivery Box / Mount Repair</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Current Odometer (KM)</label>
                  <input
                    type="number"
                    value={newServiceForm.odometerKm}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, odometerKm: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              {/* Workshop Items Bought / Spares Used Section */}
              <div className="p-3.5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-indigo-700" />
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Parts & Items Bought from Workshop ({selectedServiceParts.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">Auto-deducted from stock</span>
                </div>

                {/* Part selector */}
                <div className="flex items-center gap-2">
                  <select
                    id="add-part-to-service-select"
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddPartToService(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="" disabled>+ Select part to add to repair...</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.quantityInStock <= 0}>
                        {p.name} (SKU: {p.sku}) — R{p.sellingPriceZar} ({p.quantityInStock} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Parts List */}
                {selectedServiceParts.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedServiceParts.map((sp) => (
                      <div key={sp.partId} className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <strong className="text-slate-900 font-bold">{sp.name}</strong>
                          <span className="text-slate-500 ml-2">Qty: {sp.quantity} @ R{sp.unitPriceZar}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-emerald-700">R{sp.totalZar}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePartFromService(sp.partId)}
                            className="p-1 text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right text-xs font-bold text-indigo-950 pt-1">
                      Parts Subtotal: <strong className="font-mono text-indigo-900">R{servicePartsCost}</strong>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No parts added yet. Select a part above if spares/consumables were bought.</p>
                )}
              </div>

              {/* Technician & Labor Cost Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Technician Name</label>
                  <input
                    type="text"
                    value={newServiceForm.technicianName}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Labor / Service Fee (ZAR)</label>
                  <input
                    type="number"
                    min={0}
                    value={serviceLaborCost}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setServiceLaborCost(val);
                      setNewServiceForm((f) => ({ ...f, costZar: val + servicePartsCost }));
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Total Cost (Labor + Parts)</label>
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-sm font-black font-mono text-emerald-800">
                    R{(serviceLaborCost + servicePartsCost).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Service Notes & Completed Work</label>
                <textarea
                  rows={2}
                  placeholder="Details of inspection, parts replaced, road clearance..."
                  value={newServiceForm.notes}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(serviceAssignmentError)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md disabled:opacity-50"
                >
                  Save Service Record & Update Bike
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: LOG TRAFFIC FINE */}
      {/* ------------------------------------------------------------- */}
      {isAddFineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Log Traffic Fine Notice</h3>
              <button
                type="button"
                onClick={() => setIsAddFineOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFine} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Notice Number</label>
                <input
                  type="text"
                  required
                  value={newFineForm.noticeNumber}
                  onChange={(e) => setNewFineForm({ ...newFineForm, noticeNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle Plate</label>
                  <select
                    value={newFineForm.vehiclePlate}
                    onChange={(e) => setNewFineForm({ ...newFineForm, vehiclePlate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.registrationPlate}>
                        {v.registrationPlate} ({v.assignedDriverName || 'Stock'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Infringement Amount (ZAR)</label>
                  <input
                    type="number"
                    value={newFineForm.amountZar}
                    onChange={(e) => setNewFineForm({ ...newFineForm, amountZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Infringement Description</label>
                <input
                  type="text"
                  required
                  value={newFineForm.infringementType}
                  onChange={(e) => setNewFineForm({ ...newFineForm, infringementType: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddFineOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Record AARTO Fine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW PART / STOCK ITEM */}
      {/* ------------------------------------------------------------- */}
      {isAddPartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">Add Part to Workshop Inventory</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePartSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Part / Consumable Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Motul 20W-50 4T 1L Engine Oil"
                  value={newPartForm.name}
                  onChange={(e) => setNewPartForm({ ...newPartForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Part Image Upload / URL */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Part Image / Photo</span>
                </label>
                
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {newPartForm.imageUrl ? (
                      <img
                        src={newPartForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Image URL (https://...)"
                      value={newPartForm.imageUrl || ''}
                      onChange={(e) => setNewPartForm({ ...newPartForm, imageUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePartImageUpload(e, false)}
                          className="hidden"
                        />
                      </label>
                      {newPartForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewPartForm({ ...newPartForm, imageUrl: '' })}
                          className="text-[10px] text-rose-600 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">SKU Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OIL-MOT-20W50"
                    value={newPartForm.sku}
                    onChange={(e) => setNewPartForm({ ...newPartForm, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newPartForm.category}
                    onChange={(e) => setNewPartForm({ ...newPartForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    <option value="general">General Spares</option>
                    <option value="engine_oil">Engine Oil & Fluids</option>
                    <option value="brakes">Brakes & Pads</option>
                    <option value="tires_tubes">Tires & Tubes</option>
                    <option value="chain_sprockets">Chain & Sprockets</option>
                    <option value="spark_plugs">Spark Plugs</option>
                    <option value="cables">Clutch / Throttle Cables</option>
                    <option value="electrical_bulbs">Electrical & Bulbs</option>
                    <option value="filters">Air & Oil Filters</option>
                    <option value="accessories">Helmets & Delivery Boxes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cost Price (ZAR)</label>
                  <input
                    type="number"
                    min={0}
                    value={newPartForm.costPriceZar}
                    onChange={(e) => setNewPartForm({ ...newPartForm, costPriceZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling / Fleet Price (ZAR) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newPartForm.sellingPriceZar}
                    onChange={(e) => setNewPartForm({ ...newPartForm, sellingPriceZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Initial Quantity in Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={newPartForm.quantityInStock}
                    onChange={(e) => setNewPartForm({ ...newPartForm, quantityInStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min={1}
                    value={newPartForm.minThreshold}
                    onChange={(e) => setNewPartForm({ ...newPartForm, minThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Supplier / Distributer</label>
                <input
                  type="text"
                  placeholder="e.g. Midas Randburg Auto Spares"
                  value={newPartForm.supplierName}
                  onChange={(e) => setNewPartForm({ ...newPartForm, supplierName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPartOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Save Part to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT PART */}
      {/* ------------------------------------------------------------- */}
      {editingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-600" />
                <h3 className="font-black text-slate-900 text-base">Edit Part Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPart(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditPartSubmit} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Part Name</label>
                <input
                  type="text"
                  required
                  value={editingPart.name}
                  onChange={(e) => setEditingPart({ ...editingPart, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                />
              </div>

              {/* Edit Part Image Upload / URL */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Part Image / Photo</span>
                </label>
                
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                    {editingPart.imageUrl ? (
                      <img
                        src={editingPart.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Camera className="w-6 h-6 text-slate-300" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      placeholder="Image URL (https://...)"
                      value={editingPart.imageUrl || ''}
                      onChange={(e) => setEditingPart({ ...editingPart, imageUrl: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    />
                    <div className="flex items-center gap-2">
                      <label className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1">
                        <Upload className="w-3 h-3 text-slate-500" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePartImageUpload(e, true)}
                          className="hidden"
                        />
                      </label>
                      {editingPart.imageUrl && (
                        <button
                          type="button"
                          onClick={() => setEditingPart({ ...editingPart, imageUrl: '' })}
                          className="text-[10px] text-rose-600 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={editingPart.sku}
                    onChange={(e) => setEditingPart({ ...editingPart, sku: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editingPart.category}
                    onChange={(e) => setEditingPart({ ...editingPart, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
                  >
                    <option value="general">General Spares</option>
                    <option value="engine_oil">Engine Oil & Fluids</option>
                    <option value="brakes">Brakes & Pads</option>
                    <option value="tires_tubes">Tires & Tubes</option>
                    <option value="chain_sprockets">Chain & Sprockets</option>
                    <option value="spark_plugs">Spark Plugs</option>
                    <option value="cables">Clutch / Throttle Cables</option>
                    <option value="electrical_bulbs">Electrical & Bulbs</option>
                    <option value="filters">Air & Oil Filters</option>
                    <option value="accessories">Helmets & Delivery Boxes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cost Price (ZAR)</label>
                  <input
                    type="number"
                    min={0}
                    value={editingPart.costPriceZar}
                    onChange={(e) => setEditingPart({ ...editingPart, costPriceZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling / Fleet Price (ZAR)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingPart.sellingPriceZar}
                    onChange={(e) => setEditingPart({ ...editingPart, sellingPriceZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold font-mono text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity in Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={editingPart.quantityInStock}
                    onChange={(e) => setEditingPart({ ...editingPart, quantityInStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    min={1}
                    value={editingPart.minThreshold}
                    onChange={(e) => setEditingPart({ ...editingPart, minThreshold: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Supplier</label>
                <input
                  type="text"
                  value={editingPart.supplierName || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, supplierName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPart(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Update Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: POINT OF SALE (POS) / OVER-THE-COUNTER PART SALE */}
      {/* ------------------------------------------------------------- */}
      {isSellPartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">Point of Sale (POS) - Sell Part</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSellPartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecutePartSale} className="space-y-4">
              {/* Part Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Part / Stock Item *</label>
                <select
                  value={sellPartForm.partId}
                  onChange={(e) => {
                    const selected = parts.find((p) => p.id === e.target.value);
                    setSellPartForm({
                      ...sellPartForm,
                      partId: e.target.value,
                      unitPriceZar: selected ? selected.sellingPriceZar : 0,
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {parts.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.quantityInStock <= 0}>
                      {p.name} (SKU: {p.sku}) — R{p.sellingPriceZar} ({p.quantityInStock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Unit Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Quantity to Sell</label>
                  <input
                    type="number"
                    min={1}
                    max={parts.find((p) => p.id === sellPartForm.partId)?.quantityInStock || 999}
                    required
                    value={sellPartForm.quantity}
                    onChange={(e) => setSellPartForm({ ...sellPartForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Selling Price per Unit (ZAR)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={sellPartForm.unitPriceZar}
                    onChange={(e) => setSellPartForm({ ...sellPartForm, unitPriceZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-black font-mono text-emerald-700"
                  />
                </div>
              </div>

              {/* Customer Type */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-4 text-xs font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="custType"
                      checked={sellPartForm.customerType === 'fleet_driver'}
                      onChange={() => setSellPartForm({ ...sellPartForm, customerType: 'fleet_driver' })}
                      className="text-emerald-600"
                    />
                    <span>Fleet Active Courier</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="custType"
                      checked={sellPartForm.customerType === 'walk_in'}
                      onChange={() => setSellPartForm({ ...sellPartForm, customerType: 'walk_in' })}
                      className="text-emerald-600"
                    />
                    <span>Walk-In / External Rider</span>
                  </label>
                </div>

                {sellPartForm.customerType === 'fleet_driver' ? (
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Select Active Fleet Driver</label>
                    {drivers.length > 0 ? (
                      <select
                        value={sellPartForm.driverId}
                        onChange={(e) => {
                          const d = drivers.find((drv) => drv.id === e.target.value);
                          setSellPartForm({
                            ...sellPartForm,
                            driverId: e.target.value,
                            customerName: d ? d.fullName : '',
                            customerPhone: d ? d.phone : '',
                          });
                        }}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.fullName} ({d.assignedVehiclePlate || 'No Bike'}) — Balance Due: R{d.balanceDue || 0}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Driver Full Name"
                        value={sellPartForm.customerName}
                        onChange={(e) => setSellPartForm({ ...sellPartForm, customerName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Customer Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Tendai Mokoena"
                        value={sellPartForm.customerName}
                        onChange={(e) => setSellPartForm({ ...sellPartForm, customerName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Phone / WhatsApp</label>
                      <input
                        type="text"
                        placeholder="083 123 4567"
                        value={sellPartForm.customerPhone}
                        onChange={(e) => setSellPartForm({ ...sellPartForm, customerPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={sellPartForm.paymentMethod}
                  onChange={(e) => setSellPartForm({ ...sellPartForm, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="yoco_card">💳 Yoco Card Machine (Workshop Counter)</option>
                  <option value="cash">💵 Cash Received</option>
                  <option value="driver_balance">📋 Add to Courier Ledger / Deduct from Weekly Payout</option>
                  <option value="instant_eft">⚡ Instant EFT</option>
                </select>
              </div>

              {/* Sale Total Preview Box */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-black text-emerald-800 tracking-wider block">
                    TOTAL AMOUNT DUE
                  </span>
                  <span className="text-xs text-emerald-700">
                    {sellPartForm.quantity} x R{sellPartForm.unitPriceZar}
                  </span>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  R{(Number(sellPartForm.unitPriceZar) * Number(sellPartForm.quantity)).toLocaleString()}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSellPartOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Confirm Sale & Print Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: COMPLETED SALE RECEIPT & INVOICE */}
      {/* ------------------------------------------------------------- */}
      {completedSaleReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-900 text-base">Workshop Sale Receipt</h3>
              </div>
              <button
                type="button"
                onClick={() => setCompletedSaleReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Ticket */}
            <div id="print-workshop-receipt" className="p-5 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h4 className="font-black text-slate-900 text-sm">RANDBURG WORKSHOP & SPARES</h4>
                <p className="text-[10px] text-slate-500">304 Tungsten Rd, Strijdom Park, Randburg</p>
                <p className="text-[10px] text-slate-500">Tel / WhatsApp: 082 000 1234</p>
                <div className="mt-2 text-[11px] font-bold text-slate-800">
                  RECEIPT #{completedSaleReceipt.receiptNumber}
                </div>
                <div className="text-[10px] text-slate-400">{completedSaleReceipt.date}</div>
              </div>

              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between text-slate-600">
                  <span>Customer:</span>
                  <span className="font-bold text-slate-900">{completedSaleReceipt.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Client Type:</span>
                  <span className="text-slate-800">{completedSaleReceipt.customerType}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment:</span>
                  <span className="font-bold text-emerald-700">{completedSaleReceipt.paymentMethod}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 py-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Item Description</span>
                  <span>Total</span>
                </div>
                <div className="flex justify-between text-slate-800">
                  <div>
                    <div>{completedSaleReceipt.partName}</div>
                    <div className="text-[10px] text-slate-400">
                      SKU: {completedSaleReceipt.partSku} • {completedSaleReceipt.quantity} @ R{completedSaleReceipt.unitPriceZar}
                    </div>
                  </div>
                  <div className="font-bold text-slate-900">
                    R{completedSaleReceipt.totalZar.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center text-sm font-black text-slate-900 pt-1">
                <span>TOTAL PAID (ZAR)</span>
                <span className="text-base text-emerald-700 font-mono">
                  R{completedSaleReceipt.totalZar.toFixed(2)}
                </span>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-dashed border-slate-300">
                Thank you for your business! · Safe Riding.
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const text = `*RANDBURG WORKSHOP SALE RECEIPT*\nReceipt: ${completedSaleReceipt.receiptNumber}\nDate: ${completedSaleReceipt.date}\nCustomer: ${completedSaleReceipt.customerName}\nItem: ${completedSaleReceipt.partName} (Qty: ${completedSaleReceipt.quantity})\nTotal: R${completedSaleReceipt.totalZar}\nPayment: ${completedSaleReceipt.paymentMethod}`;
                  window.open(`https://wa.me/${(completedSaleReceipt.customerPhone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setCompletedSaleReceipt(null)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DEDICATED MANAGE DOCUMENTS MODAL (RC1 & INSURANCE) */}
      {/* ------------------------------------------------------------- */}
      {managingDocsVehicle && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800">
                      Manage Documents
                    </span>
                    <h3 className="font-black text-slate-900 text-base">
                      {managingDocsVehicle.registrationPlate}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {managingDocsVehicle.make} {managingDocsVehicle.model} ({managingDocsVehicle.year}) · VIN: {managingDocsVehicle.vin}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setManagingDocsVehicle(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManageDocs} className="mt-5 space-y-5">
              {/* DOCUMENT 1: RC1 NATIS PROOF OF OWNERSHIP */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        1. RC1 Certificate of Registration (NATIS Ownership)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Official Republic of South Africa NATIS RC1 Certificate proving legal fleet ownership.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Required
                  </span>
                </div>

                {managingDocsForm.rc1DocumentUrl ? (
                  <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-emerald-950 truncate">
                          {managingDocsForm.rc1DocumentName || 'RC1_Registration_Certificate.pdf'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setManagingDocsForm(prev => ({ ...prev, rc1DocumentUrl: '', rc1DocumentName: '' }))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove attached RC1 document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveDocViewer({
                          title: `RC1 Certificate of Registration: ${managingDocsVehicle.registrationPlate}`,
                          url: managingDocsForm.rc1DocumentUrl,
                          fileName: managingDocsForm.rc1DocumentName || 'RC1_Doc.pdf'
                        })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Document</span>
                      </button>
                      <a
                        href={managingDocsForm.rc1DocumentUrl}
                        download={managingDocsForm.rc1DocumentName || 'RC1_Doc.pdf'}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors ml-auto">
                        <span>Replace File</span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleManageDocsUpload(e, 'rc1')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white hover:bg-indigo-50/30 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-950 block">
                        Upload RC1 Ownership Document
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Supports PDF, PNG, JPG, or JPEG (Max 15MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleManageDocsUpload(e, 'rc1')}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* DOCUMENT 2: COMPREHENSIVE INSURANCE POLICY */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                        2. Comprehensive Fleet Insurance Policy Document
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Active commercial underwriting schedule covering road risk, theft, and third-party liabilities.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                    Required
                  </span>
                </div>

                {managingDocsForm.insuranceDocumentUrl ? (
                  <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                        <span className="text-xs font-bold text-sky-950 truncate">
                          {managingDocsForm.insuranceDocumentName || 'Insurance_Policy.pdf'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setManagingDocsForm(prev => ({ ...prev, insuranceDocumentUrl: '', insuranceDocumentName: '' }))}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Remove attached Insurance document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setActiveDocViewer({
                          title: `Insurance Policy Document: ${managingDocsVehicle.registrationPlate}`,
                          url: managingDocsForm.insuranceDocumentUrl,
                          fileName: managingDocsForm.insuranceDocumentName || 'Insurance_Policy.pdf'
                        })}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview Document</span>
                      </button>
                      <a
                        href={managingDocsForm.insuranceDocumentUrl}
                        download={managingDocsForm.insuranceDocumentName || 'Insurance_Policy.pdf'}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-sky-300 text-sky-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                      <label className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors ml-auto">
                        <span>Replace File</span>
                        <input
                          type="file"
                          accept=".pdf,image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleManageDocsUpload(e, 'insurance')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer bg-white hover:bg-sky-50/30 transition-all group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-sky-100 text-slate-500 group-hover:text-sky-600 flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-sky-950 block">
                        Upload Insurance Policy File
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Supports PDF, PNG, JPG, or JPEG (Max 15MB)
                      </span>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={(e) => handleManageDocsUpload(e, 'insurance')}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Insurance Policy Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Underwriting Provider</label>
                    <select
                      value={managingDocsForm.insuranceProvider}
                      onChange={(e) => setManagingDocsForm({ ...managingDocsForm, insuranceProvider: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white"
                    >
                      <option value="Santam Commercial">Santam Commercial</option>
                      <option value="Discovery Insure">Discovery Insure</option>
                      <option value="Hollard Commercial">Hollard Commercial</option>
                      <option value="Old Mutual Insure">Old Mutual Insure</option>
                      <option value="Outsurance Fleet">Outsurance Fleet</option>
                      <option value="Guardrisk">Guardrisk</option>
                      <option value="Other">Other Underwriter</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Policy / Schedule Number</label>
                    <input
                      type="text"
                      placeholder="e.g. POL-90241-FLT"
                      value={managingDocsForm.insurancePolicyNumber}
                      onChange={(e) => setManagingDocsForm({ ...managingDocsForm, insurancePolicyNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Policy Renewal Date</label>
                    <input
                      type="date"
                      value={managingDocsForm.insuranceExpiryDate}
                      onChange={(e) => setManagingDocsForm({ ...managingDocsForm, insuranceExpiryDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* DOCUMENT 3: LICENSE DISK EXPIRY */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  NATIS License Disk Expiry Date
                </label>
                <input
                  type="date"
                  value={managingDocsForm.licenseDiskExpiryDate}
                  onChange={(e) => setManagingDocsForm({ ...managingDocsForm, licenseDiskExpiryDate: e.target.value })}
                  className="w-full sm:w-1/2 px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingDocs}
                  onClick={() => setManagingDocsVehicle(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingDocs}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-75"
                >
                  {isSavingDocs ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save & Sync Documents</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DEDICATED BIKE NOTES & INSPECTION REMARKS */}
      {/* ------------------------------------------------------------- */}
      {editingNotesVehicle && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black">
                  <StickyNote className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                      Bike Notes Log
                    </span>
                    <h3 className="font-black text-slate-900 text-base">
                      {editingNotesVehicle.registrationPlate}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {editingNotesVehicle.make} {editingNotesVehicle.model} ({editingNotesVehicle.year})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingNotesVehicle(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotes} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Internal Bike Notes, Mechanic Remarks & Handover Logs
                </label>
                <textarea
                  rows={5}
                  placeholder="e.g. Spare key in safe #2, brand new rear tire installed, delivery box lock repaired, tracker GPS antenna verified..."
                  value={notesInputText}
                  onChange={(e) => setNotesInputText(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none leading-relaxed"
                />
              </div>

              {/* Quick Template Chips */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Quick Insertion Tags
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    'Ready for courier handover',
                    'Spare key in manager safe',
                    'Box & phone mount inspected',
                    'Tracker & kill switch tested',
                    'Routine 5,000km service completed',
                    'Minor fairing scratches recorded'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setNotesInputText(prev => {
                          const separator = prev.trim() ? ' · ' : '';
                          return `${prev.trim()}${separator}${chip}`;
                        });
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNotesInputText('')}
                  className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear Notes
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSavingNotes}
                    onClick={() => setEditingNotesVehicle(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNotes}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/20 transition-all flex items-center gap-1.5 disabled:opacity-75"
                  >
                    {isSavingNotes ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Bike Notes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DOCUMENT LIGHTBOX PREVIEWER (RC1 & INSURANCE) */}
      {/* ------------------------------------------------------------- */}
      {activeDocViewer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-4">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight text-white">{activeDocViewer.title}</h3>
                  {activeDocViewer.fileName && (
                    <span className="text-[11px] font-mono text-slate-400 block">{activeDocViewer.fileName}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={activeDocViewer.url}
                  download={activeDocViewer.fileName || 'compliance_document'}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Download copy of this document"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => setActiveDocViewer(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content Area */}
            <div className="flex-1 p-4 bg-slate-100 overflow-y-auto flex items-center justify-center min-h-[420px]">
              {activeDocViewer.url.startsWith('data:image/') || activeDocViewer.url.endsWith('.png') || activeDocViewer.url.endsWith('.jpg') || activeDocViewer.url.endsWith('.jpeg') || activeDocViewer.url.startsWith('http') && !activeDocViewer.url.includes('.pdf') ? (
                <div className="max-h-[70vh] overflow-auto flex items-center justify-center p-2">
                  <img
                    src={activeDocViewer.url}
                    alt={activeDocViewer.title}
                    className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-lg border border-slate-300"
                  />
                </div>
              ) : activeDocViewer.url.startsWith('data:application/pdf') || activeDocViewer.url.endsWith('.pdf') ? (
                <iframe
                  src={activeDocViewer.url}
                  title={activeDocViewer.title}
                  className="w-full h-[68vh] rounded-xl border border-slate-300 bg-white shadow-inner"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
                  <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
                  <h4 className="font-black text-slate-900 text-sm mb-1">Compliance Document Available</h4>
                  <p className="text-xs text-slate-500 mb-4">{activeDocViewer.fileName || 'Attached document file'}</p>
                  <a
                    href={activeDocViewer.url}
                    download={activeDocViewer.fileName || 'compliance_document'}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download & Open Document</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Dynafleet Fleet Asset Document</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocViewer(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
