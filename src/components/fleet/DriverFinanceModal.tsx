import React, { useState, useEffect, useRef } from 'react';
import { 
  Driver, 
  Vehicle, 
  RentalAgreement, 
  YocoTransaction, 
  YocoPaymentMethod, 
  PaymentAllocation 
} from '../../types';
import { 
  DollarSign, 
  Calendar, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Eye, 
  Download, 
  CreditCard, 
  Plus, 
  Check, 
  X, 
  Receipt, 
  ArrowUpRight, 
  ChevronRight, 
  RefreshCw, 
  ShieldCheck, 
  Camera, 
  ZoomIn, 
  TrendingUp, 
  HelpCircle,
  Sparkles,
  Phone,
  MessageSquare,
  Bike as BikeIcon,
  User,
  ExternalLink,
  ChevronLeft,
  ChevronDown,
  Info
} from 'lucide-react';
import { compressImageFile } from '../../lib/imageUtils';
import { saveTransaction, fetchTransactions, saveDriver } from '../../lib/supabase';
import { COMPANY_DETAILS } from '../../data/bikes';

interface DriverFinanceModalProps {
  isOpen: boolean;
  driver: Driver | null;
  agreements?: RentalAgreement[];
  vehicles?: Vehicle[];
  onClose: () => void;
  onUpdateDriver: (updated: Driver) => void;
  onOpenYocoPayment: (driver: Driver) => void;
}

interface WeekScheduleItem {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  tuesdayDate: Date;
  thursdayDate: Date;
  isCurrentWeek: boolean;
  isPast: boolean;
  isFuture: boolean;
  isInPayWindow: boolean; // Today is Tue, Wed, or Thu of current week
  status: 'paid' | 'in_window' | 'overdue' | 'upcoming' | 'partial';
  amountDue: number;
  amountPaid: number;
  matchingTransactions: YocoTransaction[];
}

export const DriverFinanceModal: React.FC<DriverFinanceModalProps> = ({
  isOpen,
  driver,
  agreements = [],
  vehicles = [],
  onClose,
  onUpdateDriver,
  onOpenYocoPayment,
}) => {
  if (!isOpen || !driver) return null;

  // Find assigned vehicle & agreement
  const assignedVehicle = vehicles.find((v) => v.id === driver.assignedVehicleId || v.registrationPlate === driver.assignedVehiclePlate);
  const driverAgreement = agreements.find((a) => a.driverId === driver.id || a.applicationId === driver.applicationId);

  // Transactions state for this driver
  const [transactions, setTransactions] = useState<YocoTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState<boolean>(true);

  // Selected week for detail popover / inspection
  const [selectedWeek, setSelectedWeek] = useState<WeekScheduleItem | null>(null);

  // Manual Payment (POP) Logger Modal State
  const [isLogPaymentOpen, setIsLogPaymentOpen] = useState<boolean>(false);
  const [popAmount, setPopAmount] = useState<number>(driver.weeklyRate || 750);
  const [popDate, setPopDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [popTargetWeek, setPopTargetWeek] = useState<number>(1);
  const [popMethod, setPopMethod] = useState<YocoPaymentMethod>('manual_eft');
  const [popAllocation, setPopAllocation] = useState<PaymentAllocation>('weekly_rental');
  const [popReference, setPopReference] = useState<string>('');
  const [popFileUrl, setPopFileUrl] = useState<string>('');
  const [popFileName, setPopFileName] = useState<string>('');
  const [popRecordedBy, setPopRecordedBy] = useState<string>('Dynamic Rental Randburg Hub');
  const [isSubmittingPop, setIsSubmittingPop] = useState<boolean>(false);
  const [popSuccessMessage, setPopSuccessMessage] = useState<string | null>(null);

  // Lightbox for POP or Agreement preview
  const [activeDocPreview, setActiveDocPreview] = useState<{ title: string; url: string } | null>(null);

  // Filter state for transaction table
  const [txFilterAllocation, setTxFilterAllocation] = useState<string>('all');

  const popFileInputRef = useRef<HTMLInputElement>(null);

  // Load transactions for this driver on mount / update
  useEffect(() => {
    let isMounted = true;
    const loadTx = async () => {
      setIsLoadingTx(true);
      try {
        const all = await fetchTransactions();
        if (isMounted) {
          const filtered = all.filter(
            (t) =>
              t.driverId === driver.id ||
              (driver.idOrPassportNumber && t.driverId === driver.idOrPassportNumber) ||
              (t.driverName && t.driverName.toLowerCase().trim() === driver.fullName.toLowerCase().trim())
          );
          setTransactions(filtered);
        }
      } catch (err) {
        console.warn('Could not load transactions:', err);
      } finally {
        if (isMounted) setIsLoadingTx(false);
      }
    };
    loadTx();
    return () => {
      isMounted = false;
    };
  }, [driver.id, driver.fullName, driver.idOrPassportNumber]);

  // Contract calculation variables
  const termMonths = driver.termMonths || 18;
  const totalWeeks = Math.round((termMonths * 52) / 12); // e.g. 18m = 78 weeks
  const weeklyRate = driver.weeklyRate || 750;
  const totalContractValue = totalWeeks * weeklyRate;
  const totalPaid = driver.totalPaid || 0;
  const balanceDue = driver.balanceDue || 0;

  // Base contract start date
  const contractStartDate = React.useMemo(() => {
    if (driver.contractStartDate) return new Date(driver.contractStartDate);
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d;
  }, [driver.contractStartDate]);

  // Today reference
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Compute the full weekly schedule and payment mapping
  const scheduleWeeks: WeekScheduleItem[] = React.useMemo(() => {
    const weeks: WeekScheduleItem[] = [];
    const baseDate = new Date(contractStartDate);
    
    // Normalize baseDate to the Monday of that week
    const day = baseDate.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    baseDate.setDate(baseDate.getDate() + diffToMonday);
    baseDate.setHours(0, 0, 0, 0);

    let cumulativePaidPool = totalPaid;

    for (let w = 1; w <= totalWeeks; w++) {
      const wStart = new Date(baseDate);
      wStart.setDate(baseDate.getDate() + (w - 1) * 7);

      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);

      const wTuesday = new Date(wStart);
      wTuesday.setDate(wStart.getDate() + 1);

      const wThursday = new Date(wStart);
      wThursday.setDate(wStart.getDate() + 3);

      const isCurrentWeek = today >= wStart && today <= wEnd;
      const isPast = today > wEnd;
      const isFuture = today < wStart;

      const todayDayOfWeek = today.getDay();
      const isInPayWindow = isCurrentWeek && todayDayOfWeek >= 2 && todayDayOfWeek <= 4;

      const matching = transactions.filter((t) => {
        if (t.weekNumber === w) return true;
        if (t.status !== 'successful') return false;
        const txDate = new Date(t.transactionDate);
        return txDate >= wStart && txDate <= wEnd && t.allocation === 'weekly_rental';
      });

      const txPaidSum = matching.reduce((sum, t) => sum + (t.status === 'successful' ? t.amountZar : 0), 0);

      let effectivePaid = txPaidSum;
      if (effectivePaid === 0 && cumulativePaidPool >= weeklyRate) {
        effectivePaid = weeklyRate;
        cumulativePaidPool -= weeklyRate;
      } else if (effectivePaid === 0 && cumulativePaidPool > 0) {
        effectivePaid = cumulativePaidPool;
        cumulativePaidPool = 0;
      }

      let status: WeekScheduleItem['status'] = 'upcoming';
      if (effectivePaid >= weeklyRate) {
        status = 'paid';
      } else if (effectivePaid > 0) {
        status = 'partial';
      } else if (isPast) {
        status = 'overdue';
      } else if (isCurrentWeek) {
        status = isInPayWindow ? 'in_window' : (todayDayOfWeek > 4 ? 'overdue' : 'in_window');
      } else {
        status = 'upcoming';
      }

      weeks.push({
        weekNumber: w,
        startDate: wStart,
        endDate: wEnd,
        tuesdayDate: wTuesday,
        thursdayDate: wThursday,
        isCurrentWeek,
        isPast,
        isFuture,
        isInPayWindow,
        status,
        amountDue: weeklyRate,
        amountPaid: effectivePaid,
        matchingTransactions: matching,
      });
    }

    return weeks;
  }, [contractStartDate, totalWeeks, weeklyRate, totalPaid, transactions]);

  // Aggregate stats
  const paidWeeksCount = scheduleWeeks.filter((w) => w.status === 'paid').length;
  const overdueWeeksCount = scheduleWeeks.filter((w) => w.status === 'overdue').length;
  const currentWeekItem = scheduleWeeks.find((w) => w.isCurrentWeek) || scheduleWeeks[0];
  const remainingWeeksCount = Math.max(0, totalWeeks - paidWeeksCount);
  const percentComplete = Math.min(100, Math.round((paidWeeksCount / totalWeeks) * 100));

  // Next unpaid week for auto-selecting in the logger
  const nextUnpaidWeek = scheduleWeeks.find((w) => w.status !== 'paid')?.weekNumber || 1;

  // Initialize popTargetWeek when opening logger
  useEffect(() => {
    if (isLogPaymentOpen) {
      setPopTargetWeek(nextUnpaidWeek);
      setPopAmount(weeklyRate);
    }
  }, [isLogPaymentOpen, nextUnpaidWeek, weeklyRate]);

  // Handle Proof of Payment File selection
  const handlePopFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setPopFileName(file.name);
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.85 });
        setPopFileUrl(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setPopFileUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Failed processing POP file:', err);
    }
  };

  // Submit Manual Payment with Proof of Payment
  const handleSubmitManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!popAmount || popAmount <= 0) return;

    setIsSubmittingPop(true);
    setPopSuccessMessage(null);

    const txId = `pop-manual-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTx: YocoTransaction = {
      id: txId,
      yocoChargeId: `man_pop_${Date.now()}`,
      driverId: driver.id,
      driverName: driver.fullName,
      amountZar: Number(popAmount),
      currency: 'ZAR',
      paymentMethod: popMethod,
      allocation: popAllocation,
      status: 'successful',
      yocoFeeZar: 0,
      netAmountZar: Number(popAmount),
      reconciliationStatus: 'reconciled',
      transactionDate: new Date(popDate).toISOString(),
      weekNumber: popTargetWeek,
      proofOfPaymentUrl: popFileUrl || undefined,
      notes: popReference || `Manual payment recorded for Week ${popTargetWeek}`,
      recordedBy: popRecordedBy,
      yocoMetadata: {
        channel: 'manual_eft_pop',
        proofFileName: popFileName,
      }
    };

    try {
      await saveTransaction(newTx);
      setTransactions((prev) => [newTx, ...prev]);

      const newTotalPaid = (driver.totalPaid || 0) + Number(popAmount);
      const newBalanceDue = Math.max(0, (driver.balanceDue || 0) - (popAllocation === 'weekly_rental' ? Number(popAmount) : 0));
      const newDepositPaid = (driver.depositPaid || 0) + (popAllocation === 'deposit' ? Number(popAmount) : 0);

      const updatedDriver: Driver = {
        ...driver,
        totalPaid: newTotalPaid,
        balanceDue: newBalanceDue,
        depositPaid: newDepositPaid,
        paymentScore: Math.min(100, Math.max(60, (driver.paymentScore || 90) + 2)),
        updatedAt: new Date().toISOString(),
      };

      await saveDriver(updatedDriver);
      onUpdateDriver(updatedDriver);

      setPopSuccessMessage(`Successfully logged R${popAmount} for Week ${popTargetWeek}. Driver ledger updated!`);
      setTimeout(() => {
        setIsLogPaymentOpen(false);
        setPopSuccessMessage(null);
        setPopFileUrl('');
        setPopFileName('');
        setPopReference('');
      }, 1400);
    } catch (err) {
      console.error('Error logging POP transaction:', err);
      alert('Failed to save manual payment. Please check database connection.');
    } finally {
      setIsSubmittingPop(false);
    }
  };

  // WhatsApp Statement Generator
  const sendWhatsAppStatement = () => {
    const rawNumber = driver.whatsappNumber || driver.phone || '';
    const cleanPhone = rawNumber.replace(/[^0-9]/g, '');
    const msg = 
      `*DYNAMIC RENTAL - RENT-TO-OWN STATEMENT*\n` +
      `-----------------------------------------\n` +
      `*Rider:* ${driver.fullName}\n` +
      `*Motorbike:* ${driver.assignedVehiclePlate || 'Assigned Fleet Bike'}\n` +
      `*Weekly Rate:* R${driver.weeklyRate} / week\n` +
      `*Collection Window:* Every Tuesday – Thursday\n` +
      `-----------------------------------------\n` +
      `*Weeks Settled:* ${paidWeeksCount} / ${totalWeeks} (${percentComplete}% toward ownership)\n` +
      `*Current Ledger Balance:* ${balanceDue > 0 ? `⚠️ Overdue R${balanceDue}` : '✅ Fully Paid Up-to-Date'}\n` +
      `*Total Paid to Date:* R${totalPaid.toLocaleString()}\n` +
      `-----------------------------------------\n` +
      `*Banking Details for EFT:*\n` +
      `Bank: ${COMPANY_DETAILS.bankName || 'Standard Bank'}\n` +
      `Account: ${COMPANY_DETAILS.bankAccountNumber || '023456789'}\n` +
      `Branch: ${COMPANY_DETAILS.bankBranchCode || '051001'}\n` +
      `Reference: *${driver.refNumber || driver.fullName.split(' ')[0]}* (Important)\n\n` +
      `Please send Proof of Payment (POP) here once paid! 🛵💨`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Filtered transactions for the audit ledger
  const filteredTransactions = transactions.filter((t) => {
    if (txFilterAllocation === 'all') return true;
    return t.allocation === txFilterAllocation;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-6xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================= */}
        {/* MODAL HEADER (Optimized for Laptop and Phone) */}
        {/* ========================================================= */}
        <div className="bg-white px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center border border-emerald-200 shrink-0 shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                  {driver.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                  Rent-to-Own Financials
                </span>
                {driver.assignedVehiclePlate && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 shrink-0">
                    🏍️ {driver.assignedVehiclePlate}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                <span>Ref: <strong className="text-slate-700 font-mono">{driver.refNumber || 'N/A'}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-700">{driver.phone}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={sendWhatsAppStatement}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
              title="Send WhatsApp Payment Statement"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Statement</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Close Modal"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL BODY SCROLLER */}
        {/* ========================================================= */}
        <div className="p-3 sm:p-5 md:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1">
          
          {/* ========================================================= */}
          {/* 1. FINANCIAL SUMMARY METRIC CARDS (Responsive Grid) */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
            {/* Weekly Rate */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Weekly Rent</span>
              <strong className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 block">
                R{weeklyRate}
              </strong>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">Tue – Thu Cycle</span>
            </div>

            {/* Deposit Settled */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Deposit Settled</span>
              <strong className="text-base sm:text-lg font-black text-cyan-800 font-mono mt-0.5 block">
                R{driver.depositPaid || 0}
              </strong>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Secure Holding</span>
            </div>

            {/* Ledger Balance */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ledger Balance</span>
              <strong className={`text-base sm:text-lg font-mono mt-0.5 block font-black ${
                balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {balanceDue > 0 ? `R${balanceDue.toFixed(2)}` : 'R0.00 (Current)'}
              </strong>
              <span className={`text-[10px] font-bold block mt-0.5 ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {balanceDue > 0 ? '⚠️ Arrears Due' : '✅ Paid Up-to-Date'}
              </span>
            </div>

            {/* Total Paid */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Paid</span>
              <strong className="text-base sm:text-lg font-black text-slate-900 font-mono mt-0.5 block">
                R{totalPaid.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">of R{totalContractValue.toLocaleString()}</span>
            </div>

            {/* Term Progress */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Term Progress</span>
              <strong className="text-base sm:text-lg font-black text-indigo-900 mt-0.5 block">
                {paidWeeksCount} / {totalWeeks} Wks
              </strong>
              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">{percentComplete}% Completed</span>
            </div>

            {/* On-Time Payment Score */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">On-Time Score</span>
              <strong className="text-base sm:text-lg font-black text-emerald-700 mt-0.5 block">
                {driver.paymentScore || 100}%
              </strong>
              <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Behavior Rating</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. RENT-TO-OWN AGREEMENT DETAILS BAR */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    Rent-to-Own Master Agreement #{driverAgreement?.agreementNumber || `RTO-ZA-${driver.id.slice(0, 6).toUpperCase()}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                    {termMonths} Months Term
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Assigned Bike: <strong className="text-slate-800">{assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model}` : (driver.assignedVehiclePlate || 'Fleet Motorbike')}</strong> · VIN: <strong className="text-slate-800 font-mono">{assignedVehicle?.vin || 'VIN Verified'}</strong> · Weekly Rent: <strong className="text-emerald-700 font-mono">R{weeklyRate}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
              {driverAgreement?.digitalSignatureUrl && (
                <button
                  type="button"
                  onClick={() => setActiveDocPreview({ title: 'Signed Rental Agreement', url: driverAgreement.digitalSignatureUrl! })}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  <span>View Contract</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsLogPaymentOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Payment (POP)</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenYocoPayment(driver)}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Yoco Gateway</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. GITHUB-STYLE WEEKLY PAYMENT HEATMAP (Optimized Phone/Laptop) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <span>Weekly Rent Contribution Heatmap ({totalWeeks} Weeks Total)</span>
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Visual payment schedule representing each week of the {termMonths}-month contract. Collection window is <strong className="text-slate-800">Every Tuesday to Thursday</strong>.
                </p>
              </div>

              {/* Progress pill */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold">Ownership Progress:</span>
                <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {paidWeeksCount} / {totalWeeks} Paid ({percentComplete}%)
                </span>
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-3 sm:gap-5 text-[11px] text-slate-600 flex-wrap pt-1">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-md bg-emerald-500 border border-emerald-600 shadow-2xs" />
                <span className="font-semibold">Paid On-Time</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-md bg-amber-400 border border-amber-500 shadow-2xs animate-pulse" />
                <span className="font-semibold">Pay Window Active (Tue-Thu)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-md bg-rose-500 border border-rose-600 shadow-2xs" />
                <span className="font-semibold">Missed / Overdue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300" />
                <span className="font-semibold">Upcoming Week</span>
              </div>
            </div>

            {/* Heatmap Contribution Grid */}
            <div className="p-3 sm:p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
              <div className="overflow-x-auto pb-2">
                <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-13 lg:grid-cols-13 gap-1.5 sm:gap-2 min-w-[320px]">
                  {scheduleWeeks.map((wk) => {
                    const isSelected = selectedWeek?.weekNumber === wk.weekNumber;
                    
                    let bgClass = 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700';
                    let dotColor = 'bg-slate-600';

                    if (wk.status === 'paid') {
                      bgClass = 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-xs';
                      dotColor = 'bg-emerald-300';
                    } else if (wk.status === 'in_window') {
                      bgClass = 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300/40';
                      dotColor = 'bg-slate-950';
                    } else if (wk.status === 'overdue') {
                      bgClass = 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-xs';
                      dotColor = 'bg-rose-300';
                    } else if (wk.status === 'partial') {
                      bgClass = 'bg-cyan-600 hover:bg-cyan-500 border-cyan-500 text-white';
                      dotColor = 'bg-cyan-300';
                    }

                    return (
                      <button
                        key={wk.weekNumber}
                        type="button"
                        onClick={() => setSelectedWeek(isSelected ? null : wk)}
                        title={`Week ${wk.weekNumber}: ${wk.startDate.toLocaleDateString('en-ZA')} - ${wk.endDate.toLocaleDateString('en-ZA')} (${wk.status.toUpperCase()})`}
                        className={`min-h-[44px] min-w-[40px] sm:min-w-0 p-1.5 sm:p-2 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer select-none text-center ${bgClass} ${
                          isSelected ? 'ring-2 ring-cyan-300 scale-105 z-10' : ''
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold leading-none">
                          W{wk.weekNumber}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${dotColor} mt-1`} />
                        <span className="text-[8px] font-mono leading-none mt-0.5 opacity-80">
                          {wk.status === 'paid' ? '✓' : wk.status === 'overdue' ? '!' : wk.isCurrentWeek ? 'NOW' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Week Inspection Card (Drawer/Popover) */}
            {selectedWeek && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-black bg-slate-900 text-cyan-300">
                      Week {selectedWeek.weekNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      selectedWeek.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedWeek.status === 'in_window'
                        ? 'bg-amber-100 text-amber-900'
                        : selectedWeek.status === 'overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedWeek.status.replace('_', ' ')}
                    </span>
                    {selectedWeek.isCurrentWeek && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Current Active Week
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Cycle Dates: <strong className="text-slate-800">{selectedWeek.startDate.toLocaleDateString('en-ZA')}</strong> to <strong className="text-slate-800">{selectedWeek.endDate.toLocaleDateString('en-ZA')}</strong> · Expected Rent: <strong className="text-slate-900 font-mono">R{selectedWeek.amountDue}</strong> · Amount Paid: <strong className="text-emerald-700 font-mono">R{selectedWeek.amountPaid}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedWeek.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => {
                        setPopTargetWeek(selectedWeek.weekNumber);
                        setPopAmount(selectedWeek.amountDue - selectedWeek.amountPaid);
                        setIsLogPaymentOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Log POP for Week {selectedWeek.weekNumber}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedWeek(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Close Inspection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 4. PAYMENT HISTORY & PROOF OF PAYMENT AUDIT LEDGER */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-600" />
                  <span>Payment History & Proof of Payment (POP) Ledger</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete audit trail of all manual EFTs, Yoco card payments, cash receipts, and uploaded POP slips.
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
                {(['all', 'weekly_rental', 'deposit', 'traffic_fine', 'repair_deductible'] as const).map((alloc) => (
                  <button
                    key={alloc}
                    type="button"
                    onClick={() => setTxFilterAllocation(alloc)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      txFilterAllocation === alloc
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {alloc === 'all' ? 'All Transactions' : alloc.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Ledger Table / List */}
            {isLoadingTx ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Loading transaction ledger...</span>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No payment records logged yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Click "Log Payment (POP)" above to record an EFT proof slip, cash collection, or trigger a live Yoco link.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="pb-2.5 pl-2 font-black">Date</th>
                      <th className="pb-2.5 font-black">Reference / Target</th>
                      <th className="pb-2.5 font-black">Method</th>
                      <th className="pb-2.5 font-black">Allocation</th>
                      <th className="pb-2.5 font-black">Amount</th>
                      <th className="pb-2.5 font-black">Proof of Payment</th>
                      <th className="pb-2.5 pr-2 text-right font-black">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pl-2 font-mono text-slate-600">
                          {new Date(tx.transactionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900">{tx.notes || 'Weekly Rent Installment'}</div>
                          {tx.weekNumber && (
                            <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                              Week #{tx.weekNumber}
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                            {tx.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold capitalize bg-slate-100 text-slate-800">
                            {tx.allocation.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-black text-emerald-700 text-sm">
                          R{tx.amountZar.toFixed(2)}
                        </td>
                        <td className="py-3">
                          {tx.proofOfPaymentUrl ? (
                            <button
                              type="button"
                              onClick={() => setActiveDocPreview({ title: `Proof of Payment - ${tx.notes || tx.id}`, url: tx.proofOfPaymentUrl! })}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>View POP Slip</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No file attached</span>
                          )}
                        </td>
                        <td className="py-3 pr-2 text-right">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                            ✓ {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* MODAL FOOTER */}
        {/* ========================================================= */}
        <div className="bg-white px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Encrypted Ledger • Standard Bank & Yoco Reconciled</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={sendWhatsAppStatement}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
            >
              WhatsApp Statement
            </button>
            <button
              type="button"
              onClick={() => setIsLogPaymentOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors shadow-xs cursor-pointer"
            >
              + Log Payment (POP)
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* LOG MANUAL PAYMENT & POP UPLOAD MODAL (Sub-Modal) */}
        {/* ========================================================= */}
        {isLogPaymentOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-black text-sm text-white">Log Manual Payment & Proof of Payment (POP)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsLogPaymentOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitManualPayment} className="p-6 space-y-4 text-xs">
                {popSuccessMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{popSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Payment Amount (ZAR)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold">R</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={popAmount}
                        onChange={(e) => setPopAmount(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Target Contract Week
                    </label>
                    <select
                      value={popTargetWeek}
                      onChange={(e) => setPopTargetWeek(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      {scheduleWeeks.map((wk) => (
                        <option key={wk.weekNumber} value={wk.weekNumber}>
                          Week {wk.weekNumber} ({wk.status.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Payment Method
                    </label>
                    <select
                      value={popMethod}
                      onChange={(e) => setPopMethod(e.target.value as YocoPaymentMethod)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="manual_eft">Bank EFT (Standard Bank)</option>
                      <option value="cash">Cash Showroom Receipt</option>
                      <option value="card_present">Card Swipe / POS Terminal</option>
                      <option value="payment_link">Payment Link / Gateway</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Allocation
                    </label>
                    <select
                      value={popAllocation}
                      onChange={(e) => setPopAllocation(e.target.value as PaymentAllocation)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="weekly_rental">Weekly Rent Installment</option>
                      <option value="deposit">Security Deposit</option>
                      <option value="traffic_fine">Traffic Fine Settlement</option>
                      <option value="repair_deductible">Repair / Insurance Deductible</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Payment Date & Reference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={popDate}
                      onChange={(e) => setPopDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Bank Ref / Slip #"
                      value={popReference}
                      onChange={(e) => setPopReference(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* File Upload Box (Drag-Drop / Camera) */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Attach Proof of Payment (POP) Receipt / Photo
                  </label>
                  <input
                    type="file"
                    ref={popFileInputRef}
                    accept="image/*,application/pdf"
                    onChange={handlePopFileUpload}
                    className="hidden"
                  />
                  
                  {popFileUrl ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-bold text-emerald-900 text-xs truncate">{popFileName || 'Proof of Payment Attached'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setActiveDocPreview({ title: 'Proof of Payment Preview', url: popFileUrl })}
                          className="px-2 py-1 rounded bg-white text-emerald-800 font-bold text-[10px] border border-emerald-200"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPopFileUrl('');
                            setPopFileName('');
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => popFileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-4 text-center bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1.5"
                    >
                      <Upload className="w-6 h-6 text-slate-400" />
                      <p className="font-bold text-slate-700 text-xs">Click or drag bank slip, ATM receipt or WhatsApp POP screenshot</p>
                      <span className="text-[10px] text-slate-400">Supports JPG, PNG, PDF (Auto-compressed)</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsLogPaymentOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPop}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingPop ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Confirm & Update Ledger</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* LIGHTBOX PREVIEW MODAL */}
        {/* ========================================================= */}
        {activeDocPreview && (
          <div className="fixed inset-0 z-70 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <span className="text-xs font-black">{activeDocPreview.title}</span>
                <button
                  type="button"
                  onClick={() => setActiveDocPreview(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-100">
                <img
                  src={activeDocPreview.url}
                  alt={activeDocPreview.title}
                  className="max-h-[75vh] w-auto object-contain rounded-xl shadow-md"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
