import React, { useState } from 'react';
import { 
  Vehicle, 
  PartsInventoryItem, 
  RepairAndService, 
  TrafficFine, 
  Driver,
  VehicleStatus 
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
  ExternalLink
} from 'lucide-react';

export type VehicleSubTab = 'register' | 'live_telematics' | 'parts_inventory' | 'repairs_service' | 'traffic_fines';

interface VehicleManagementViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  parts: PartsInventoryItem[];
  services: RepairAndService[];
  fines: TrafficFine[];
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onAddVehicle: (vehicle: Vehicle) => void;
  onUpdatePart: (part: PartsInventoryItem) => void;
  onAddPart: (part: PartsInventoryItem) => void;
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
  onUpdatePart,
  onAddPart,
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
  const [newVehicleForm, setNewVehicleForm] = useState<Partial<Vehicle>>({
    vin: '',
    engineNumber: '',
    registrationPlate: '',
    make: 'Bajaj',
    model: 'Boxer 150 HD',
    year: 2026,
    category: 'boxer',
    condition: 'new',
    status: 'available',
    odometerKm: 0,
    nextServiceKm: 5000,
    trackerDeviceId: `CT-${Math.floor(10000 + Math.random() * 90000)}-SA`,
    trackerProvider: 'Cartrack SA',
    batteryHealthPercent: 100,
    fuelLevelPercent: 100,
    isIgnitionOn: false,
    latitude: -26.0826,
    longitude: 27.9734,
    lastLocationAddress: '304 Tungsten Rd, Strijdom Park, Randburg',
    insurancePolicyNumber: 'OUT-FLEET-2026-900',
    licenseDiskExpiryDate: '2027-04-30',
  });

  // Restock Part Modal
  const [restockPart, setRestockPart] = useState<PartsInventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(10);

  // Add Service Modal
  const [isAddServiceOpen, setIsAddServiceOpen] = useState<boolean>(false);
  const [newServiceForm, setNewServiceForm] = useState<Partial<RepairAndService>>({
    vehiclePlate: vehicles[0]?.registrationPlate || '',
    driverName: 'Sipho Ndlovu',
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
  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleForm.registrationPlate || !newVehicleForm.vin) return;

    const created: Vehicle = {
      id: `veh-${Date.now()}`,
      vin: newVehicleForm.vin || '',
      engineNumber: newVehicleForm.engineNumber || 'ENG-000',
      registrationPlate: newVehicleForm.registrationPlate || '',
      bikeModelId: newVehicleForm.category === 'boxer' ? 'bajaj-boxer-150' : 'bigboy-velocity-150',
      make: newVehicleForm.make || 'Bajaj',
      model: newVehicleForm.model || 'Boxer 150 HD',
      year: Number(newVehicleForm.year) || 2026,
      category: newVehicleForm.category || 'boxer',
      condition: newVehicleForm.condition || 'new',
      status: 'available',
      odometerKm: Number(newVehicleForm.odometerKm) || 0,
      nextServiceKm: 5000,
      trackerDeviceId: newVehicleForm.trackerDeviceId || `CT-${Math.floor(10000 + Math.random() * 90000)}-SA`,
      trackerProvider: 'Cartrack SA',
      batteryHealthPercent: 100,
      fuelLevelPercent: 100,
      isIgnitionOn: false,
      latitude: -26.0826,
      longitude: 27.9734,
      lastLocationAddress: '304 Tungsten Rd, Strijdom Park, Randburg',
      lastPingTime: 'Just now',
      insurancePolicyNumber: newVehicleForm.insurancePolicyNumber || 'OUT-FLEET-2026-900',
      licenseDiskExpiryDate: newVehicleForm.licenseDiskExpiryDate || '2027-04-30',
      imageUrl: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
    };

    onAddVehicle(created);
    setIsAddVehicleOpen(false);
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

  // Submit Service Log
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedVeh = vehicles.find((v) => v.registrationPlate === newServiceForm.vehiclePlate);

    const srv: RepairAndService = {
      id: `srv-${Date.now()}`,
      vehicleId: matchedVeh?.id || '',
      vehiclePlate: newServiceForm.vehiclePlate || '',
      driverId: matchedVeh?.assignedDriverId,
      driverName: newServiceForm.driverName,
      serviceType: newServiceForm.serviceType || 'routine_5000km',
      odometerKm: Number(newServiceForm.odometerKm) || 0,
      costZar: Number(newServiceForm.costZar) || 0,
      technicianName: newServiceForm.technicianName || '',
      garageLocation: newServiceForm.garageLocation || 'Workshop',
      serviceDate: new Date().toISOString().split('T')[0],
      status: 'completed',
      partsUsed: [],
      notes: newServiceForm.notes || '',
    };

    onAddService(srv);

    // Update vehicle next service KM
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

    setIsAddServiceOpen(false);
  };

  // Submit Fine
  const handleCreateFine = (e: React.FormEvent) => {
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

            <button
              type="button"
              onClick={() => setIsAddVehicleOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Register New Vehicle</span>
            </button>
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
                    <th className="py-3 px-4">Cartrack SA Device</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredVehicles.map((veh) => (
                    <tr key={veh.id} className="hover:bg-slate-50 transition-colors">
                      {/* Plate & Model */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-cyan-400 flex items-center justify-center font-black text-xs">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-mono font-black text-slate-900 text-sm block">
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
                        {veh.assignedDriverName ? (
                          <div>
                            <span className="font-bold text-slate-900 block">{veh.assignedDriverName}</span>
                            <span className="text-[10px] text-emerald-700 font-bold">Renting to Own</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Available in Showroom
                          </span>
                        )}
                      </td>

                      {/* Odometer & Service */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900">{veh.odometerKm.toLocaleString()} KM</span>
                          <span className="text-[10px] text-slate-500 block">
                            Next Srv: {veh.nextServiceKm.toLocaleString()} KM ({Math.max(0, veh.nextServiceKm - veh.odometerKm)} km rem)
                          </span>
                        </div>
                      </td>

                      {/* Tracker */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <span className={`w-2 h-2 rounded-full ${veh.isIgnitionOn ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                          <span className="text-slate-800 font-semibold">{veh.trackerDeviceId}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          veh.status === 'assigned'
                            ? 'bg-emerald-100 text-emerald-800'
                            : veh.status === 'available'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {veh.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTrackingVehicleId(veh.id);
                            setSubTab('live_telematics');
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <Compass className="w-3.5 h-3.5 text-cyan-600" />
                          <span>Track</span>
                        </button>
                      </td>
                    </tr>
                  ))}
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Motorcycle Consumables & Fleet Maintenance Inventory
              </h3>
              <p className="text-xs text-slate-500">
                Stock levels at Randburg Hub Workshop. Low stock notifications trigger automatically below minimum thresholds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {parts.map((part) => {
              const isLowStock = part.quantityInStock <= part.minThreshold;

              return (
                <div
                  key={part.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${
                    isLowStock ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        SKU: {part.sku}
                      </span>
                      {isLowStock && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                          Low Stock Alert
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-1">{part.name}</h4>
                    <span className="text-xs text-slate-500 capitalize">{part.category.replace('_', ' ')}</span>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">In Stock</span>
                        <span className={`text-base font-black ${isLowStock ? 'text-amber-700' : 'text-slate-900'}`}>
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
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Fleet Price</span>
                        <span className="font-bold text-emerald-700">R{part.sellingPriceZar}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Restocked: {part.lastRestockedDate}</span>
                    <button
                      type="button"
                      onClick={() => setRestockPart(part)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      + Restock Stock
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
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
              onClick={() => setIsAddServiceOpen(true)}
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
                  <th className="py-3 px-4">Courier & Odometer</th>
                  <th className="py-3 px-4">Workshop & Technician</th>
                  <th className="py-3 px-4">Parts & Notes</th>
                  <th className="py-3 px-4">Cost (ZAR)</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-bold text-slate-900 block">{srv.vehiclePlate}</span>
                        <span className="text-[11px] text-slate-500 capitalize">{srv.serviceType.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{srv.driverName || 'Showroom Stock'}</span>
                        <span className="text-[11px] text-slate-500">{srv.odometerKm.toLocaleString()} KM</span>
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
                        Parts: {srv.partsUsed?.join(', ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">R{srv.costZar}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        srv.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {srv.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Register New Fleet Asset</h3>
              <button
                type="button"
                onClick={() => setIsAddVehicleOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Registration Plate</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GP registration plate"
                    value={newVehicleForm.registrationPlate}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, registrationPlate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">VIN Number (17 Digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="17-character VIN"
                    value={newVehicleForm.vin}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vin: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Make & Model</label>
                  <input
                    type="text"
                    required
                    value={newVehicleForm.model}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Engine Number</label>
                  <input
                    type="text"
                    required
                    placeholder="DHX-98241"
                    value={newVehicleForm.engineNumber}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, engineNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cartrack Device ID</label>
                  <input
                    type="text"
                    value={newVehicleForm.trackerDeviceId}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, trackerDeviceId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">License Disk Expiry</label>
                  <input
                    type="date"
                    value={newVehicleForm.licenseDiskExpiryDate}
                    onChange={(e) => setNewVehicleForm({ ...newVehicleForm, licenseDiskExpiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Register Asset in Fleet
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Log Workshop Service</h3>
              <button
                type="button"
                onClick={() => setIsAddServiceOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select Motorcycle</label>
                <select
                  value={newServiceForm.vehiclePlate}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, vehiclePlate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.registrationPlate}>
                      {v.registrationPlate} ({v.make} {v.model}) - {v.assignedDriverName || 'Showroom Stock'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Service Type</label>
                  <select
                    value={newServiceForm.serviceType}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, serviceType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="routine_5000km">Routine 5,000 KM</option>
                    <option value="oil_change">Oil Change</option>
                    <option value="brake_replacement">Brake Shoes / Pads</option>
                    <option value="chain_sprocket">Chain & Sprocket</option>
                    <option value="tyre_replacement">Tyre Replacement</option>
                    <option value="major_overhaul">Major 10,000 KM Overhaul</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Technician</label>
                  <input
                    type="text"
                    value={newServiceForm.technicianName}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, technicianName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Workshop Cost (ZAR)</label>
                  <input
                    type="number"
                    value={newServiceForm.costZar}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, costZar: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Service Notes</label>
                <textarea
                  rows={2}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Save Service Record
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
    </div>
  );
};
