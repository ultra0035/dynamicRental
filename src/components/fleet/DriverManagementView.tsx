import React, { useState } from 'react';
import { Driver, DriverReferral, DriverRiskTier, DriverStatus, Vehicle } from '../../types';
import { 
  Users, 
  ShieldAlert, 
  Gift, 
  Search, 
  Filter, 
  Phone, 
  MessageSquare, 
  Bike, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Plus, 
  X, 
  ArrowUpRight, 
  CreditCard,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export type DriverSubTab = 'directory' | 'risk_registry' | 'referrals';

interface DriverManagementViewProps {
  drivers: Driver[];
  vehicles: Vehicle[];
  referrals: DriverReferral[];
  onUpdateDriver: (driver: Driver) => void;
  onAddDriver: (driver: Driver) => void;
  onUpdateReferral: (referral: DriverReferral) => void;
  onOpenYocoPaymentForDriver: (driver: Driver) => void;
  activeSubTab?: DriverSubTab;
}

export const DriverManagementView: React.FC<DriverManagementViewProps> = ({
  drivers,
  vehicles,
  referrals,
  onUpdateDriver,
  onAddDriver,
  onUpdateReferral,
  onOpenYocoPaymentForDriver,
  activeSubTab,
}) => {
  const [subTab, setSubTab] = useState<DriverSubTab>(activeSubTab || 'directory');

  React.useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Selected Driver for Details Modal
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Add Incident Modal
  const [incidentDriver, setIncidentDriver] = useState<Driver | null>(null);
  const [incidentDescription, setIncidentDescription] = useState<string>('');
  const [incidentPenaltyScore, setIncidentPenaltyScore] = useState<number>(10);

  // Add Driver Modal
  const [isAddDriverOpen, setIsAddDriverOpen] = useState<boolean>(false);
  const [newDriverForm, setNewDriverForm] = useState<Partial<Driver>>({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    idOrPassportNumber: '',
    citizenship: 'south_african',
    address: '',
    suburb: 'Randburg',
    city: 'Randburg',
    weeklyRate: 750,
    depositPaid: 1000,
    termMonths: 18,
    primaryPlatform: 'Checkers Sixty60',
    riskTier: 'low',
    riskScore: 90,
    paymentScore: 100,
    status: 'active',
  });

  // Filtered Drivers
  const filteredDrivers = drivers.filter((d) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      d.fullName.toLowerCase().includes(q) ||
      d.refNumber.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.assignedBikeVinOrPlate && d.assignedBikeVinOrPlate.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchRisk = riskFilter === 'all' || d.riskTier === riskFilter;

    return matchQuery && matchStatus && matchRisk;
  });

  // Metrics
  const activeCount = drivers.filter((d) => d.status === 'active').length;
  const inArrearsCount = drivers.filter((d) => d.status === 'in_arrears' || d.balanceDue > 0).length;
  const highRiskCount = drivers.filter((d) => d.riskTier === 'high' || d.riskTier === 'critical').length;
  const totalArrearsZar = drivers.reduce((sum, d) => sum + (d.balanceDue > 0 ? d.balanceDue : 0), 0);

  // WhatsApp Handler
  const sendDriverWhatsApp = (driver: Driver, messageType: 'statement' | 'arrears' | 'general') => {
    let text = `Hi ${driver.fullName},\nThis is Dynamic Rental Randburg.\n`;
    if (messageType === 'arrears') {
      text += `\n⚠️ *Payment Reminder:* Your account currently has an overdue balance of *R${driver.balanceDue.toFixed(2)}* for bike *${driver.assignedBikeVinOrPlate || ''}*.\n\nPlease settle via Yoco today to avoid automated tracker immobilization.\nShowroom Hub: 304 Tungsten Rd, Randburg.`;
    } else if (messageType === 'statement') {
      text += `\n📄 *Account Summary:*\n• Assigned Bike: ${driver.assignedBikeName || driver.assignedBikeVinOrPlate}\n• Weekly Rate: R${driver.weeklyRate}/week\n• Current Balance: ${driver.balanceDue <= 0 ? 'R0.00 (Up to date)' : `R${driver.balanceDue.toFixed(2)} (Due)`}\n• Total Paid to Date: R${(driver.totalPaid || 0).toLocaleString()}\n\nThank you for riding safely with Dynamic Rental!`;
    }
    window.open(`https://wa.me/${driver.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Submit Incident Handler
  const handleLogIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentDriver) return;

    const newScore = Math.max(10, incidentDriver.riskScore - incidentPenaltyScore);
    const newTier: DriverRiskTier = newScore < 40 ? 'critical' : newScore < 60 ? 'high' : newScore < 80 ? 'medium' : 'low';

    const updated: Driver = {
      ...incidentDriver,
      riskScore: newScore,
      riskTier: newTier,
      incidentCount: (incidentDriver.incidentCount || 0) + 1,
      notes: `${incidentDriver.notes || ''}\n[Incident Logged ${new Date().toLocaleDateString('en-ZA')}]: ${incidentDescription} (-${incidentPenaltyScore} pts)`,
    };

    onUpdateDriver(updated);
    setIncidentDriver(null);
    setIncidentDescription('');
  };

  // Submit New Driver Handler
  const handleCreateDriver = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverForm.fullName || !newDriverForm.phone) return;

    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      refNumber: `DRV-${Math.floor(1000 + Math.random() * 9000)}-JHB`,
      fullName: newDriverForm.fullName || '',
      phone: newDriverForm.phone || '',
      whatsappNumber: newDriverForm.whatsappNumber || newDriverForm.phone || '',
      email: newDriverForm.email,
      idOrPassportNumber: newDriverForm.idOrPassportNumber || 'N/A',
      citizenship: newDriverForm.citizenship || 'south_african',
      address: newDriverForm.address || 'Randburg Hub Area',
      suburb: newDriverForm.suburb || 'Randburg',
      city: newDriverForm.city || 'Randburg',
      status: 'active',
      assignedBikeVinOrPlate: newDriverForm.assignedBikeVinOrPlate || 'JH 55 XP GP',
      assignedBikeName: newDriverForm.assignedBikeName || 'Bajaj Boxer 150 HD',
      weeklyRate: Number(newDriverForm.weeklyRate) || 750,
      balanceDue: 0,
      depositPaid: Number(newDriverForm.depositPaid) || 1000,
      contractStartDate: new Date().toISOString().split('T')[0],
      termMonths: Number(newDriverForm.termMonths) || 18,
      primaryPlatform: newDriverForm.primaryPlatform || 'Checkers Sixty60',
      riskTier: 'low',
      riskScore: 90,
      paymentScore: 100,
      incidentCount: 0,
      totalPaid: Number(newDriverForm.depositPaid) || 1000,
    };

    onAddDriver(newDriver);
    setIsAddDriverOpen(false);
  };

  // Dynamic Header based on active subtab
  const getHeaderInfo = () => {
    switch (subTab) {
      case 'risk_registry':
        return {
          tag: 'Driver Risk',
          title: 'Driver Risk Registry & Behavioral Scoring',
          desc: 'Automated risk profiling, telematics safety telemetry, on-time payment scoring, and incident records.',
        };
      case 'referrals':
        return {
          tag: 'Referral Rewards',
          title: 'Driver Referral Program',
          desc: 'Track rider referrals, onboarding milestones, and R350 cash bonus disbursements.',
        };
      default:
        return {
          tag: 'Driver Operations',
          title: 'Approved Customers & Active Drivers Directory',
          desc: 'Active motorcycle couriers, assigned fleet assets, weekly balance ledgers, and KYC profiles.',
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
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-cyan-100 text-cyan-800 border border-cyan-200">
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

        {/* Quick KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Active Couriers</span>
            <span className="text-lg font-black text-slate-900">{activeCount}</span>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
            <span className="text-[10px] font-bold uppercase text-amber-600 block">In Arrears / Due</span>
            <span className="text-lg font-black text-amber-800">{inArrearsCount}</span>
          </div>
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/80">
            <span className="text-[10px] font-bold uppercase text-rose-600 block">Total Overdue (ZAR)</span>
            <span className="text-lg font-black text-rose-800">R{totalArrearsZar.toLocaleString()}</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-bold uppercase text-emerald-600 block">Avg On-Time Score</span>
            <span className="text-lg font-black text-emerald-800">
              {drivers.length > 0 ? Math.round(drivers.reduce((acc, d) => acc + (d.paymentScore || 90), 0) / drivers.length) : 100}%
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: DRIVERS DIRECTORY */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search driver name, ref code, plate, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active (On Road)</option>
                <option value="in_arrears">In Arrears</option>
                <option value="suspended">Suspended</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddDriverOpen(true)}
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Driver</span>
            </button>
          </div>

          {/* Drivers Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Driver Profile</th>
                    <th className="py-3 px-4">Assigned Motorbike</th>
                    <th className="py-3 px-4">Weekly Rate & Ledger</th>
                    <th className="py-3 px-4">Risk & Safety</th>
                    <th className="py-3 px-4">Platform & Term</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Profile */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-sm">
                            {driver.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{driver.fullName}</span>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono font-semibold text-cyan-700">{driver.refNumber}</span>
                              <span>•</span>
                              <span>{driver.phone}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned Bike */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-900">{driver.assignedBikeVinOrPlate || 'Pending Bike'}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block">{driver.assignedBikeName || 'Bajaj Boxer 150'}</span>
                        </div>
                      </td>

                      {/* Weekly Rate & Ledger Balance */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900">R{driver.weeklyRate}/week</span>
                          <div>
                            {driver.balanceDue > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">
                                Overdue: R{driver.balanceDue.toFixed(2)}
                              </span>
                            ) : driver.balanceDue < 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Credit: R{Math.abs(driver.balanceDue).toFixed(2)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Paid Up to Date
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Risk & Safety */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              driver.riskTier === 'low'
                                ? 'bg-emerald-100 text-emerald-800'
                                : driver.riskTier === 'medium'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {driver.riskTier} Risk
                            </span>
                            <span className="text-[11px] font-bold text-slate-600">{driver.riskScore}/100</span>
                          </div>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                driver.riskScore >= 80 ? 'bg-emerald-500' : driver.riskScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${driver.riskScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Platform & Term */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 text-[11px]">
                          <span className="font-bold text-slate-800 block">{driver.primaryPlatform}</span>
                          <span className="text-slate-500 block">
                            Term: {driver.termMonths} Mo (Since {driver.contractStartDate || '2026'})
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Yoco Payment Quick Button */}
                          <button
                            type="button"
                            onClick={() => onOpenYocoPaymentForDriver(driver)}
                            title="Collect Yoco Card / Link Payment"
                            className="p-1.5 rounded-lg bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200 transition-colors font-bold flex items-center gap-1 text-[11px] px-2"
                          >
                            <CreditCard className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Yoco</span>
                          </button>

                          {/* WhatsApp Statement */}
                          <button
                            type="button"
                            onClick={() => sendDriverWhatsApp(driver, driver.balanceDue > 0 ? 'arrears' : 'statement')}
                            title="Send WhatsApp Statement"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Log Incident */}
                          <button
                            type="button"
                            onClick={() => setIncidentDriver(driver)}
                            title="Log Incident / Penalty"
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredDrivers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No active drivers matching filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 2: DRIVER RISK REGISTRY */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'risk_registry' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
              Automated Telematics & Risk Scoring Algorithm
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Each driver receives an automated safety rating calculated from on-time Yoco settlements (50%), GPS over-speed alerts & geofence violations (25%), and AARTO traffic fines (25%). Scores below 60 trigger alert protocols; scores below 40 mandate bike lockdown.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-sm font-black text-slate-900 block">{driver.fullName}</span>
                      <span className="text-[11px] font-mono text-slate-500">{driver.refNumber}</span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                        driver.riskTier === 'low'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : driver.riskTier === 'medium'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {driver.riskTier} Risk ({driver.riskScore}/100)
                    </span>
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Payment Reliability</span>
                      <span className="font-bold text-slate-900">{driver.paymentScore}% On-Time</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${driver.paymentScore}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-slate-600 pt-1">
                      <span>Logged Incidents</span>
                      <span className={`font-bold ${driver.incidentCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                        {driver.incidentCount} events
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Current Arrears Balance</span>
                      <span className={`font-bold ${driver.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {driver.balanceDue > 0 ? `R${driver.balanceDue.toFixed(2)}` : 'R0.00'}
                      </span>
                    </div>

                    {driver.notes && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600 border border-slate-100">
                        <span className="font-bold text-slate-800 block mb-0.5">Underwriting Notes:</span>
                        {driver.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIncidentDriver(driver)}
                    className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Log Incident</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenYocoPaymentForDriver(driver)}
                    className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Collect Rent</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 3: DRIVER REFERRALS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'referrals' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Driver Referral Rewards Program (R350 per Active Courier)
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Existing riders earn a R350 credit towards their weekly rent when their referred peer passes underwriting and completes 30 active days.
              </p>
            </div>
            <div className="px-4 py-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-black text-center">
              Total Bonus Pool: R{referrals.reduce((sum, r) => sum + r.rewardAmountZar, 0)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Referrer (Active Driver)</th>
                  <th className="py-3 px-4">Referred Applicant</th>
                  <th className="py-3 px-4">Referral Date</th>
                  <th className="py-3 px-4">Reward Amount</th>
                  <th className="py-3 px-4">Qualification Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{ref.referrerDriverName}</td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-bold text-slate-900 block">{ref.referredApplicantName}</span>
                        <span className="text-[11px] text-slate-500">{ref.referredPhone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{ref.referralDate}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-700">R{ref.rewardAmountZar}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ref.status === 'paid_out'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ref.status === 'active_driving'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ref.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {ref.status !== 'paid_out' ? (
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateReferral({
                              ...ref,
                              status: 'paid_out',
                              paidDate: new Date().toISOString().split('T')[0],
                            });
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          Mark R350 Paid
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-bold">Paid on {ref.paidDate}</span>
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
      {/* MODAL: LOG DRIVER INCIDENT */}
      {/* ------------------------------------------------------------- */}
      {incidentDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-900 text-sm">Log Driver Incident</h3>
              </div>
              <button
                type="button"
                onClick={() => setIncidentDriver(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogIncident} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Driver</label>
                <input
                  type="text"
                  disabled
                  value={`${incidentDriver.fullName} (${incidentDriver.refNumber})`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Incident Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Minor collision on Sandton delivery run. Front reflector broken. Bike repaired at workshop."
                  value={incidentDescription}
                  onChange={(e) => setIncidentDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Safety Score Penalty Points (Deduct)
                </label>
                <select
                  value={incidentPenaltyScore}
                  onChange={(e) => setIncidentPenaltyScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                >
                  <option value={5}>-5 Points (Minor Over-speed Warning)</option>
                  <option value={10}>-10 Points (Late Payment / Minor Scrape)</option>
                  <option value={20}>-20 Points (Traffic Infringement / Red Light)</option>
                  <option value={35}>-35 Points (Accident / Negligent Riding)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIncidentDriver(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Save Incident Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD DRIVER DIRECTLY */}
      {/* ------------------------------------------------------------- */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Add New Active Courier</h3>
              <button
                type="button"
                onClick={() => setIsAddDriverOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sipho Ndlovu"
                    value={newDriverForm.fullName}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="083 456 7890"
                    value={newDriverForm.phone}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, phone: e.target.value, whatsappNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ID / Passport Number</label>
                  <input
                    type="text"
                    required
                    placeholder="920415..."
                    value={newDriverForm.idOrPassportNumber}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, idOrPassportNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Primary Platform</label>
                  <select
                    value={newDriverForm.primaryPlatform}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, primaryPlatform: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  >
                    <option value="Checkers Sixty60">Checkers Sixty60</option>
                    <option value="Uber Eats">Uber Eats</option>
                    <option value="Takealot">Takealot</option>
                    <option value="Mr D">Mr D Food</option>
                    <option value="Bolt Food">Bolt Food</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Weekly Rate (ZAR)</label>
                  <input
                    type="number"
                    value={newDriverForm.weeklyRate}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, weeklyRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Deposit (ZAR)</label>
                  <input
                    type="number"
                    value={newDriverForm.depositPaid}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, depositPaid: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Term (Months)</label>
                  <input
                    type="number"
                    value={newDriverForm.termMonths}
                    onChange={(e) => setNewDriverForm({ ...newDriverForm, termMonths: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black shadow-md"
                >
                  Create Driver Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
