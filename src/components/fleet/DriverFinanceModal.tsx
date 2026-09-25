import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Driver, 
  Vehicle, 
  RentalAgreement, 
  YocoTransaction, 
  YocoPaymentMethod, 
  PaymentAllocation,
  RepairAndService,
  PartsInventoryItem
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
  Info,
  Wrench,
  Printer,
  Search,
  Filter,
  Package
} from 'lucide-react';
import { compressImageFile } from '../../lib/imageUtils';
import { saveTransaction, fetchTransactions, saveDriver } from '../../lib/supabase';
import { COMPANY_DETAILS } from '../../data/bikes';

interface DriverFinanceModalProps {
  isOpen: boolean;
  driver: Driver | null;
  agreements?: RentalAgreement[];
  vehicles?: Vehicle[];
  services?: RepairAndService[];
  parts?: PartsInventoryItem[];
  onClose: () => void;
  onUpdateDriver: (updated: Driver) => void;
  onOpenYocoPayment?: (driver: Driver) => void;
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
  remainingDue: number;
  matchingTransactions: YocoTransaction[];
}

export const DriverFinanceModal: React.FC<DriverFinanceModalProps> = ({
  isOpen,
  driver,
  agreements = [],
  vehicles = [],
  services = [],
  parts = [],
  onClose,
  onUpdateDriver,
}) => {
  if (!isOpen || !driver) return null;

  // Find assigned vehicle & agreement
  const assignedVehicle = vehicles.find(
    (v) => v.id === driver.assignedVehicleId || v.registrationPlate === driver.assignedVehiclePlate || v.registrationPlate === driver.assignedBikeVinOrPlate
  );
  const driverAgreement = agreements.find(
    (a) => a.driverId === driver.id || a.applicationId === driver.applicationId
  );

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

  // Contract Statement PDF Modal State
  const [isContractPdfModalOpen, setIsContractPdfModalOpen] = useState<boolean>(false);

  // Filter & search state for transaction table
  const [txFilterAllocation, setTxFilterAllocation] = useState<string>('all');
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');

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

  // Base contract start date and end date
  const contractStartDate = useMemo(() => {
    if (driver.contractStartDate) return new Date(driver.contractStartDate);
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d;
  }, [driver.contractStartDate]);

  const contractEndDate = useMemo(() => {
    if (driver.contractEndDate) return new Date(driver.contractEndDate);
    const end = new Date(contractStartDate);
    end.setDate(end.getDate() + totalWeeks * 7);
    return end;
  }, [driver.contractEndDate, contractStartDate, totalWeeks]);

  // Today reference
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Driver repairs and services logs
  const driverServices = useMemo(() => {
    return services.filter(
      (s) =>
        s.driverId === driver.id ||
        (s.driverName && s.driverName.toLowerCase().trim() === driver.fullName.toLowerCase().trim()) ||
        (driver.assignedVehiclePlate && s.vehiclePlate === driver.assignedVehiclePlate) ||
        (driver.assignedBikeVinOrPlate && s.vehiclePlate === driver.assignedBikeVinOrPlate)
    );
  }, [services, driver.id, driver.fullName, driver.assignedVehiclePlate, driver.assignedBikeVinOrPlate]);

  // Total repairs cost incurred vs settled
  const totalRepairsIncurred = useMemo(() => {
    return driverServices.reduce((sum, s) => sum + (s.costZar || 0), 0);
  }, [driverServices]);

  const totalRepairsSettled = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          (t.allocation === 'repairs_service' || t.allocation === 'repair_deductible' || t.allocation === 'parts_purchase') &&
          t.status === 'successful'
      )
      .reduce((sum, t) => sum + t.amountZar, 0);
  }, [transactions]);

  const outstandingRepairsBalance = Math.max(0, totalRepairsIncurred - totalRepairsSettled);

  // Compute the full weekly schedule and payment mapping (accurately preserving partial payments)
  const scheduleWeeks: WeekScheduleItem[] = useMemo(() => {
    const weeks: WeekScheduleItem[] = [];
    const baseDate = new Date(contractStartDate);
    
    // Normalize baseDate to the Monday of that week
    const day = baseDate.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    baseDate.setDate(baseDate.getDate() + diffToMonday);
    baseDate.setHours(0, 0, 0, 0);

    // Group transactions by explicit weekNumber or date range
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

      // Find all successful rental payments matching this week
      const matching = transactions.filter((t) => {
        if (t.status !== 'successful') return false;
        if (t.allocation !== 'weekly_rental') return false;
        if (t.weekNumber === w) return true;
        const txDate = new Date(t.transactionDate);
        return txDate >= wStart && txDate <= wEnd && !t.weekNumber;
      });

      const txPaidSum = matching.reduce((sum, t) => sum + t.amountZar, 0);
      const effectivePaid = txPaidSum;
      const remainingDue = Math.max(0, weeklyRate - effectivePaid);

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
        remainingDue,
        matchingTransactions: matching,
      });
    }

    return weeks;
  }, [contractStartDate, totalWeeks, weeklyRate, transactions]);

  // Aggregate stats
  const paidWeeksCount = scheduleWeeks.filter((w) => w.status === 'paid').length;
  const partialWeeksCount = scheduleWeeks.filter((w) => w.status === 'partial').length;
  const overdueWeeksCount = scheduleWeeks.filter((w) => w.status === 'overdue').length;
  const percentComplete = Math.min(100, Math.round((paidWeeksCount / totalWeeks) * 100));

  // Next unpaid or partially paid week for auto-selecting in the logger
  const nextUnpaidWeekItem = scheduleWeeks.find((w) => w.status !== 'paid') || scheduleWeeks[0];
  const nextUnpaidWeek = nextUnpaidWeekItem ? nextUnpaidWeekItem.weekNumber : 1;
  const nextUnpaidAmountDue = nextUnpaidWeekItem ? (nextUnpaidWeekItem.amountDue - nextUnpaidWeekItem.amountPaid) : weeklyRate;

  // Initialize popTargetWeek when opening logger
  useEffect(() => {
    if (isLogPaymentOpen) {
      setPopTargetWeek(nextUnpaidWeek);
      setPopAmount(nextUnpaidAmountDue > 0 ? nextUnpaidAmountDue : weeklyRate);
    }
  }, [isLogPaymentOpen, nextUnpaidWeek, nextUnpaidAmountDue, weeklyRate]);

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
    const allocationLabel = 
      popAllocation === 'weekly_rental' ? `Week ${popTargetWeek} Rental` :
      popAllocation === 'repairs_service' ? 'Repairs & Workshop Spares' :
      popAllocation === 'security_deposit' || popAllocation === 'deposit' ? 'Security Deposit' :
      popAllocation.replace(/_/g, ' ');

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
      weekNumber: popAllocation === 'weekly_rental' ? popTargetWeek : undefined,
      proofOfPaymentUrl: popFileUrl || undefined,
      notes: popReference ? `${popReference} (${allocationLabel})` : `Payment logged for ${allocationLabel}`,
      recordedBy: popRecordedBy,
      yocoMetadata: {
        channel: 'manual_eft_pop',
        proofFileName: popFileName,
        isPartialPayment: popAllocation === 'weekly_rental' && Number(popAmount) < weeklyRate,
      }
    };

    try {
      await saveTransaction(newTx);
      setTransactions((prev) => [newTx, ...prev]);

      const paymentNum = Number(popAmount);
      const newTotalPaid = (driver.totalPaid || 0) + paymentNum;
      
      let newBalanceDue = driver.balanceDue || 0;
      if (popAllocation === 'weekly_rental') {
        newBalanceDue = Math.max(0, newBalanceDue - paymentNum);
      }

      let newDepositPaid = driver.depositPaid || 0;
      if (popAllocation === 'security_deposit' || popAllocation === 'deposit') {
        newDepositPaid += paymentNum;
      }

      const updatedDriver: Driver = {
        ...driver,
        totalPaid: newTotalPaid,
        balanceDue: newBalanceDue,
        depositPaid: newDepositPaid,
        paymentScore: Math.min(100, Math.max(60, (driver.paymentScore || 90) + 2)),
      };

      await saveDriver(updatedDriver);
      onUpdateDriver(updatedDriver);

      setPopSuccessMessage(`Successfully logged R${popAmount} for ${allocationLabel}. Ledger updated!`);
      setTimeout(() => {
        setIsLogPaymentOpen(false);
        setPopSuccessMessage(null);
        setPopFileUrl('');
        setPopFileName('');
        setPopReference('');
      }, 1200);
    } catch (err) {
      console.error('Error logging transaction:', err);
      alert('Failed to save payment record. Please check database connection.');
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
      `*Ref Number:* ${driver.refNumber || 'N/A'}\n` +
      `*Motorbike:* ${driver.assignedBikeVinOrPlate || driver.assignedVehiclePlate || 'Assigned Fleet Bike'}\n` +
      `*Weekly Rate:* R${driver.weeklyRate} / week\n` +
      `*Contract Term:* ${termMonths} Months (${totalWeeks} Weeks)\n` +
      `*Start Date:* ${contractStartDate.toLocaleDateString('en-ZA')}\n` +
      `*Maturity End Date:* ${contractEndDate.toLocaleDateString('en-ZA')}\n` +
      `-----------------------------------------\n` +
      `*Weeks Settled:* ${paidWeeksCount} / ${totalWeeks} (${percentComplete}% ownership progress)\n` +
      `*Current Rental Arrears:* ${balanceDue > 0 ? `⚠️ R${balanceDue.toFixed(2)}` : '✅ R0.00 (Up-to-Date)'}\n` +
      `*Repairs & Spares Balance:* ${outstandingRepairsBalance > 0 ? `⚠️ R${outstandingRepairsBalance.toFixed(2)}` : '✅ R0.00 (Cleared)'}\n` +
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
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchAllocation = 
        txFilterAllocation === 'all' || 
        t.allocation === txFilterAllocation ||
        (txFilterAllocation === 'repairs_service' && (t.allocation === 'repair_deductible' || t.allocation === 'parts_purchase'));

      if (!matchAllocation) return false;

      if (!txSearchQuery) return true;
      const q = txSearchQuery.toLowerCase().trim();
      return (
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        (t.paymentMethod && t.paymentMethod.toLowerCase().includes(q)) ||
        (t.recordedBy && t.recordedBy.toLowerCase().includes(q)) ||
        (t.weekNumber && `week ${t.weekNumber}`.includes(q)) ||
        t.amountZar.toString().includes(q)
      );
    });
  }, [transactions, txFilterAllocation, txSearchQuery]);

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
                  Financials & Contract Ledger
                </span>
                {(driver.assignedBikeVinOrPlate || driver.assignedVehiclePlate) && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 shrink-0">
                    🏍️ {driver.assignedBikeVinOrPlate || driver.assignedVehiclePlate}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate flex items-center gap-2 mt-0.5">
                <span>Ref: <strong className="text-slate-700 font-mono">{driver.refNumber || 'N/A'}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-slate-700">{driver.phone}</strong></span>
                <span>•</span>
                <span>Contract: <strong className="text-slate-700">{contractStartDate.toLocaleDateString('en-ZA')} → {contractEndDate.toLocaleDateString('en-ZA')}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Download / View Contract PDF button */}
            <button
              type="button"
              onClick={() => setIsContractPdfModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer"
              title="View Contract Value & Print PDF Statement"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Contract PDF</span>
            </button>

            <button
              type="button"
              onClick={sendWhatsAppStatement}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
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

            {/* Total Contract Value */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Contract Value</span>
              <strong className="text-base sm:text-lg font-black text-indigo-950 font-mono mt-0.5 block">
                R{totalContractValue.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">{totalWeeks} Wks @ R{weeklyRate}/wk</span>
            </div>

            {/* Total Paid */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Paid to Date</span>
              <strong className="text-base sm:text-lg font-black text-emerald-700 font-mono mt-0.5 block">
                R{totalPaid.toLocaleString()}
              </strong>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">Settled across ledger</span>
            </div>

            {/* Rent Ledger Balance (Arrears) */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Rental Balance</span>
              <strong className={`text-base sm:text-lg font-mono mt-0.5 block font-black ${
                balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {balanceDue > 0 ? `R${balanceDue.toFixed(2)}` : 'R0.00 (Current)'}
              </strong>
              <span className={`text-[10px] font-bold block mt-0.5 ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {balanceDue > 0 ? '⚠️ Arrears Due' : '✅ Paid Up-to-Date'}
              </span>
            </div>

            {/* Repairs & Services Debt */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Repairs / Parts Debt</span>
              <strong className={`text-base sm:text-lg font-mono mt-0.5 block font-black ${
                outstandingRepairsBalance > 0 ? 'text-amber-700' : 'text-slate-800'
              }`}>
                {outstandingRepairsBalance > 0 ? `R${outstandingRepairsBalance.toFixed(2)}` : 'R0.00 (Clear)'}
              </strong>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                {driverServices.length} workshop logs
              </span>
            </div>

            {/* Term Progress */}
            <div className="p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ownership Progress</span>
              <strong className="text-base sm:text-lg font-black text-indigo-900 mt-0.5 block">
                {paidWeeksCount} / {totalWeeks} Wks
              </strong>
              <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">{percentComplete}% Completed</span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. RENT-TO-OWN CONTRACT & LOG PAYMENT ACTION BAR */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-black text-slate-900">
                    Master Agreement #{driverAgreement?.agreementNumber || `RTO-ZA-${driver.id.slice(0, 6).toUpperCase()}`}
                  </h3>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                    {termMonths} Months Duration ({totalWeeks} Weeks)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Start: <strong className="text-slate-800">{contractStartDate.toLocaleDateString('en-ZA')}</strong> · Maturity End: <strong className="text-slate-800">{contractEndDate.toLocaleDateString('en-ZA')}</strong> · Total Value: <strong className="text-slate-900 font-mono">R{totalContractValue.toLocaleString()}</strong> · Weekly Rent: <strong className="text-emerald-700 font-mono">R{weeklyRate}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-end md:self-center">
              {/* Contract PDF Generator Button */}
              <button
                type="button"
                onClick={() => setIsContractPdfModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-indigo-200"
              >
                <Printer className="w-3.5 h-3.5 text-indigo-600" />
                <span>Contract Statement (PDF)</span>
              </button>

              {/* Fast Payment Logger Button */}
              <button
                type="button"
                onClick={() => {
                  setPopAllocation('weekly_rental');
                  setIsLogPaymentOpen(true);
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Payment</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. REPAIRS & WORKSHOP SPARES FINANCE SUMMARY (New Feature) */}
          {/* ========================================================= */}
          {driverServices.length > 0 && (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider">
                    Assigned Bike Repairs & Workshop Spares Log ({driverServices.length} Records)
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    Total Incurred: <strong className="text-slate-900">R{totalRepairsIncurred.toLocaleString()}</strong>
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-500">
                    Outstanding Debt: <strong className={outstandingRepairsBalance > 0 ? 'text-amber-700 font-mono font-bold' : 'text-emerald-700 font-mono font-bold'}>
                      R{outstandingRepairsBalance.toFixed(2)}
                    </strong>
                  </span>
                  {outstandingRepairsBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPopAllocation('repairs_service');
                        setPopAmount(outstandingRepairsBalance);
                        setIsLogPaymentOpen(true);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[11px] font-black transition-colors ml-2"
                    >
                      Settle Repair Debt
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {driverServices.map((srv) => (
                  <div key={srv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span className="capitalize">{srv.serviceType.replace(/_/g, ' ')}</span>
                        <span className="font-mono text-emerald-800">R{srv.costZar}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                        <span>Plate: <strong className="font-mono text-slate-700">{srv.vehiclePlate}</strong></span>
                        <span>{srv.serviceDate}</span>
                      </div>
                      {srv.notes && (
                        <p className="text-[11px] text-slate-600 mt-1 italic line-clamp-1">{srv.notes}</p>
                      )}
                      {srv.partsUsed && srv.partsUsed.length > 0 && (
                        <div className="text-[10px] text-indigo-700 font-medium mt-1">
                          Parts: {srv.partsUsed.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. GITHUB-STYLE WEEKLY PAYMENT HEATMAP */}
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
                  Visual payment schedule representing each week of the {termMonths}-month contract. Supports full and partial payment logging. Collection window is <strong className="text-slate-800">Every Tuesday to Thursday</strong>.
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
                <span className="font-semibold">Paid In Full</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-md bg-cyan-500 border border-cyan-600 shadow-2xs" />
                <span className="font-semibold">Partially Paid (e.g. R550/R750)</span>
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
                    } else if (wk.status === 'partial') {
                      bgClass = 'bg-cyan-600 hover:bg-cyan-500 border-cyan-400 text-white shadow-xs ring-1 ring-cyan-300';
                      dotColor = 'bg-cyan-200';
                    } else if (wk.status === 'in_window') {
                      bgClass = 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300/40';
                      dotColor = 'bg-slate-950';
                    } else if (wk.status === 'overdue') {
                      bgClass = 'bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-xs';
                      dotColor = 'bg-rose-300';
                    }

                    return (
                      <button
                        key={wk.weekNumber}
                        type="button"
                        onClick={() => setSelectedWeek(isSelected ? null : wk)}
                        title={`Week ${wk.weekNumber}: Paid R${wk.amountPaid} of R${wk.amountDue} (${wk.status.toUpperCase()})`}
                        className={`min-h-[44px] min-w-[40px] sm:min-w-0 p-1.5 sm:p-2 rounded-xl border flex flex-col items-center justify-between transition-all cursor-pointer select-none text-center ${bgClass} ${
                          isSelected ? 'ring-2 ring-cyan-300 scale-105 z-10' : ''
                        }`}
                      >
                        <span className="text-[10px] font-mono font-bold leading-none">
                          W{wk.weekNumber}
                        </span>
                        <div className={`w-2 h-2 rounded-full ${dotColor} mt-1`} />
                        <span className="text-[8px] font-mono leading-none mt-0.5 opacity-90">
                          {wk.status === 'paid' ? '✓' : wk.status === 'partial' ? `R${wk.amountPaid}` : wk.status === 'overdue' ? '!' : wk.isCurrentWeek ? 'NOW' : ''}
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
                        : selectedWeek.status === 'partial'
                        ? 'bg-cyan-100 text-cyan-800 font-black'
                        : selectedWeek.status === 'in_window'
                        ? 'bg-amber-100 text-amber-900'
                        : selectedWeek.status === 'overdue'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {selectedWeek.status === 'partial' ? `Partially Paid (R${selectedWeek.amountPaid} / R${selectedWeek.amountDue})` : selectedWeek.status.replace('_', ' ')}
                    </span>
                    {selectedWeek.isCurrentWeek && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Current Active Week
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    Cycle Dates: <strong className="text-slate-800">{selectedWeek.startDate.toLocaleDateString('en-ZA')}</strong> to <strong className="text-slate-800">{selectedWeek.endDate.toLocaleDateString('en-ZA')}</strong> · Target Rate: <strong className="text-slate-900 font-mono">R{selectedWeek.amountDue}</strong> · Amount Paid: <strong className="text-emerald-700 font-mono">R{selectedWeek.amountPaid}</strong>
                    {selectedWeek.remainingDue > 0 && (
                      <span> · Balance Due: <strong className="text-rose-600 font-mono">R{selectedWeek.remainingDue}</strong></span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedWeek.status !== 'paid' && (
                    <button
                      type="button"
                      onClick={() => {
                        setPopAllocation('weekly_rental');
                        setPopTargetWeek(selectedWeek.weekNumber);
                        setPopAmount(selectedWeek.remainingDue > 0 ? selectedWeek.remainingDue : selectedWeek.amountDue);
                        setIsLogPaymentOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Payment for Week {selectedWeek.weekNumber}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedWeek(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* 5. PAYMENT HISTORY & PROOF OF PAYMENT AUDIT LEDGER */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-cyan-600" />
                  <span>Payment History & Proof of Payment (POP) Ledger</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Complete audit trail of all manual EFTs, cash collections, partial rental settlements, and workshop maintenance payments.
                </p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={txSearchQuery}
                    onChange={(e) => setTxSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 bg-slate-100 rounded-lg text-xs font-medium focus:bg-white border border-slate-200 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                  {(['all', 'weekly_rental', 'repairs_service', 'security_deposit', 'deposit'] as const).map((alloc) => (
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
                      {alloc === 'all' ? 'All' : alloc === 'weekly_rental' ? 'Rent' : alloc === 'repairs_service' ? 'Repairs' : 'Deposit'}
                    </button>
                  ))}
                </div>
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
                <p className="text-xs font-bold text-slate-700">No payment records match filter</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Click "+ Log Payment" above to record a full or partial payment, EFT slip, or repair fee.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-wider">
                      <th className="pb-2.5 pl-2 font-black">Date</th>
                      <th className="pb-2.5 font-black">Reference / Description</th>
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
                        <td className="py-3 pl-2 font-mono text-slate-600 whitespace-nowrap">
                          {new Date(tx.transactionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900">{tx.notes || 'Payment Installment'}</div>
                          {tx.weekNumber && (
                            <span className="text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.2 rounded border border-cyan-200">
                              Week #{tx.weekNumber}
                            </span>
                          )}
                          {tx.yocoMetadata?.isPartialPayment && (
                            <span className="ml-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              Partial Payment
                            </span>
                          )}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700">
                            {tx.paymentMethod.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                            tx.allocation === 'weekly_rental'
                              ? 'bg-blue-50 text-blue-800'
                              : tx.allocation === 'repairs_service' || tx.allocation === 'repair_deductible'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}>
                            {tx.allocation.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-black text-emerald-700 text-sm whitespace-nowrap">
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
                              <span>View POP</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No slip attached</span>
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
            <span>Encrypted Ledger • Dynamic Rental Hub Finance</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsContractPdfModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Contract PDF Statement</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLogPaymentOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Log Payment</span>
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
        {/* LOG PAYMENT MODAL (Sub-Modal - Easy, Multi-Allocation) */}
        {/* ========================================================= */}
        {isLogPaymentOpen && (
          <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-black text-sm text-white">Log Driver Payment</h3>
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

                {/* Settle Allocation Type Selection */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Select What You Are Settling *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPopAllocation('weekly_rental');
                        setPopAmount(weeklyRate);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        popAllocation === 'weekly_rental'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block">Weekly Rental</span>
                      <span className="text-[10px] text-slate-500 font-mono">R{weeklyRate}/wk</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPopAllocation('repairs_service');
                        setPopAmount(outstandingRepairsBalance > 0 ? outstandingRepairsBalance : 500);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        popAllocation === 'repairs_service'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block">Repairs / Spares</span>
                      <span className="text-[10px] text-amber-700 font-mono">Due: R{outstandingRepairsBalance}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPopAllocation('security_deposit');
                        setPopAmount(1000);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                        popAllocation === 'security_deposit' || popAllocation === 'deposit'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="block">Security Deposit</span>
                      <span className="text-[10px] text-slate-500 font-mono">Paid: R{driver.depositPaid || 0}</span>
                    </button>
                  </div>
                </div>

                {/* Amount and Quick Presets */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                      Payment Amount (ZAR) *
                    </label>
                    <span className="text-[10px] text-slate-400">Supports partial payments (e.g. R550)</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">R</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={popAmount}
                      onChange={(e) => setPopAmount(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-base font-mono font-black text-slate-900 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  {/* Quick Preset Chips */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-bold">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setPopAmount(weeklyRate)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                    >
                      Full Week (R{weeklyRate})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopAmount(550)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                    >
                      Partial (R550)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopAmount(Math.round(weeklyRate / 2))}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                    >
                      Half (R{Math.round(weeklyRate / 2)})
                    </button>
                    {outstandingRepairsBalance > 0 && (
                      <button
                        type="button"
                        onClick={() => setPopAmount(outstandingRepairsBalance)}
                        className="px-2 py-0.5 rounded-md bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold cursor-pointer"
                      >
                        Repairs (R{outstandingRepairsBalance})
                      </button>
                    )}
                  </div>
                </div>

                {/* Target Week (if rental) & Payment Method */}
                <div className="grid grid-cols-2 gap-3">
                  {popAllocation === 'weekly_rental' ? (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        Contract Week
                      </label>
                      <select
                        value={popTargetWeek}
                        onChange={(e) => setPopTargetWeek(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      >
                        {scheduleWeeks.map((wk) => (
                          <option key={wk.weekNumber} value={wk.weekNumber}>
                            Week {wk.weekNumber} ({wk.status === 'paid' ? 'PAID' : wk.status === 'partial' ? `PAID R${wk.amountPaid}` : 'UNPAID'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                        Settlement Purpose
                      </label>
                      <input
                        type="text"
                        disabled
                        value={popAllocation === 'repairs_service' ? 'Repairs / Workshop Spares' : 'Security Deposit'}
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                      />
                    </div>
                  )}

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
                      <option value="cash">Cash (Showroom Hub Receipt)</option>
                      <option value="card_pos">Card POS Terminal</option>
                      <option value="instant_eft">Instant EFT / Ozow</option>
                    </select>
                  </div>
                </div>

                {/* Date & Reference */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={popDate}
                      onChange={(e) => setPopDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                      Bank Ref / Slip / Receipt #
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. EFT-9824 / POP"
                      value={popReference}
                      onChange={(e) => setPopReference(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                </div>

                {/* Proof of Payment Upload */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">
                    Proof of Payment (POP) Receipt / Photo (Optional)
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
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-3.5 text-center bg-slate-50 hover:bg-emerald-50/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1"
                    >
                      <Upload className="w-5 h-5 text-slate-400" />
                      <p className="font-bold text-slate-700 text-xs">Click to attach EFT slip, ATM slip or WhatsApp POP</p>
                      <span className="text-[10px] text-slate-400">JPG, PNG, PDF supported</span>
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
        {/* CONTRACT VALUE & STATEMENT PDF MODAL (Printable PDF View) */}
        {/* ========================================================= */}
        {isContractPdfModalOpen && (
          <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
              {/* Header Bar */}
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="font-black text-sm text-white">Master Contract & Ledger Statement (PDF)</h3>
                    <p className="text-[10px] text-slate-400">Printable official contract valuation and audit statement</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsContractPdfModalOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable PDF Document Body */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans space-y-6" id="printable-contract-statement">
                {/* Brand Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
                  <div>
                    <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                      DYNAMIC RENTAL (PTY) LTD
                    </div>
                    <p className="text-xs text-slate-600 font-medium">Commercial Fleet Solutions & Rent-to-Own Financing</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      304 Tungsten Rd, Strijdom Park, Randburg, Gauteng, 2194<br />
                      Tel / WhatsApp: +27 82 000 1234 • Email: finance@dynamicrental.co.za
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 bg-slate-900 text-cyan-300 rounded-lg text-xs font-mono font-black uppercase">
                      Official Statement
                    </span>
                    <div className="text-xs font-bold text-slate-700 mt-2">
                      Ref: <strong className="font-mono text-slate-900">{driver.refNumber || `DRV-${driver.id.slice(0, 6)}`}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Generated: {new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                {/* Contract Parties & Vehicle Profile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Driver Details */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                      Rider / Customer Details
                    </span>
                    <div className="text-sm font-black text-slate-900">{driver.fullName}</div>
                    <div>ID / Passport: <strong className="font-mono text-slate-800">{driver.idOrPassportNumber || 'Verified on file'}</strong></div>
                    <div>Phone: <strong className="text-slate-800">{driver.phone}</strong></div>
                    <div>Delivery Platform: <strong className="text-slate-800">{driver.primaryPlatform || 'Checkers Sixty60'}</strong></div>
                    <div>Address: <span className="text-slate-700">{driver.address || `${driver.suburb}, ${driver.city}`}</span></div>
                  </div>

                  {/* Motorbike Details */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wider block">
                      Assigned Motorbike Asset
                    </span>
                    <div className="text-sm font-black text-slate-900">
                      {assignedVehicle ? `${assignedVehicle.make} ${assignedVehicle.model}` : (driver.assignedBikeName || 'Bajaj Boxer 150 HD')}
                    </div>
                    <div>Registration Plate: <strong className="font-mono text-slate-900">{driver.assignedBikeVinOrPlate || driver.assignedVehiclePlate || 'Assigned'}</strong></div>
                    <div>VIN: <strong className="font-mono text-slate-800">{assignedVehicle?.vin || 'MD2A24BY8PW091244'}</strong></div>
                    <div>Engine Number: <strong className="font-mono text-slate-800">{assignedVehicle?.engineNumber || 'DHX-98241'}</strong></div>
                    <div>Current Odometer: <strong className="text-slate-800">{assignedVehicle?.odometerKm || 4500} KM</strong></div>
                  </div>
                </div>

                {/* Contract Starting Point & Ending Point */}
                <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
                      Rent-to-Own Contract Timeline & Valuation
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active Lease
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Contract Start Point</span>
                      <strong className="text-sm sm:text-base font-black text-white block mt-0.5">
                        {contractStartDate.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </strong>
                      <span className="text-[10px] text-slate-400">Commencement Date</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Contract End Point</span>
                      <strong className="text-sm sm:text-base font-black text-cyan-300 block mt-0.5">
                        {contractEndDate.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </strong>
                      <span className="text-[10px] text-slate-400">Full Ownership Maturity</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Contract Duration</span>
                      <strong className="text-sm sm:text-base font-black text-white block mt-0.5">
                        {termMonths} Months ({totalWeeks} Weeks)
                      </strong>
                      <span className="text-[10px] text-slate-400">Fixed Term</span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Total Contract Value</span>
                      <strong className="text-base sm:text-lg font-black text-emerald-400 font-mono block mt-0.5">
                        R{totalContractValue.toLocaleString()}
                      </strong>
                      <span className="text-[10px] text-slate-400">R{weeklyRate} x {totalWeeks} Weeks</span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Breakdown Table */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3">
                    Financial Balance & Settlement Status
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Weekly Rental Rate</span>
                      <strong className="text-sm font-black text-slate-900 font-mono">R{weeklyRate} / week</strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Settled to Date</span>
                      <strong className="text-sm font-black text-emerald-700 font-mono">R{totalPaid.toLocaleString()}</strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Rental Arrears Due</span>
                      <strong className={`text-sm font-black font-mono ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                        {balanceDue > 0 ? `R${balanceDue.toFixed(2)}` : 'R0.00 (Current)'}
                      </strong>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Repairs / Workshop Debt</span>
                      <strong className={`text-sm font-black font-mono ${outstandingRepairsBalance > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                        {outstandingRepairsBalance > 0 ? `R${outstandingRepairsBalance.toFixed(2)}` : 'R0.00'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Itemized Payment Schedule Ledger */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Verified Transaction & Settlement History
                  </h4>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Description / Note</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Allocation</th>
                        <th className="py-2.5 px-3 font-mono">Amount (ZAR)</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {transactions.slice(0, 15).map((tx) => (
                        <tr key={tx.id}>
                          <td className="py-2 px-3 font-mono">
                            {new Date(tx.transactionDate).toLocaleDateString('en-ZA')}
                          </td>
                          <td className="py-2 px-3 font-medium">
                            {tx.notes || (tx.weekNumber ? `Week #${tx.weekNumber} Rental` : 'Payment')}
                          </td>
                          <td className="py-2 px-3 capitalize text-[11px]">
                            {tx.paymentMethod.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 px-3 capitalize text-[11px]">
                            {tx.allocation.replace(/_/g, ' ')}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-800">
                            R{tx.amountZar.toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            ✓ {tx.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {transactions.length > 15 && (
                    <p className="text-[10px] text-slate-400 italic text-center">
                      Showing latest 15 records of {transactions.length} total logged transactions.
                    </p>
                  )}
                </div>

                {/* Signatures & Legal Confirmation */}
                <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <div className="border-b border-slate-400 pb-12" />
                    <div className="pt-1 font-bold text-slate-900">Authorized Officer: Dynamic Rental</div>
                    <div className="text-[10px] text-slate-500">Randburg Operations Hub</div>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 pb-12" />
                    <div className="pt-1 font-bold text-slate-900">Courier / Rider: {driver.fullName}</div>
                    <div className="text-[10px] text-slate-500">Signature of Acknowledgment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* LIGHTBOX PREVIEW MODAL */}
        {/* ========================================================= */}
        {activeDocPreview && (
          <div className="fixed inset-0 z-80 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
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
