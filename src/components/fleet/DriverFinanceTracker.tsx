import React, { useState, useEffect, useRef } from 'react';
import { Driver, Vehicle, RentalAgreement, YocoTransaction, YocoPaymentMethod, PaymentAllocation } from '../../types';
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
  Sparkles
} from 'lucide-react';
import { compressImageFile } from '../../lib/imageUtils';
import { saveTransaction, fetchTransactions, saveDriver } from '../../lib/supabase';

interface DriverFinanceTrackerProps {
  driver: Driver;
  agreements?: RentalAgreement[];
  assignedVehicle?: Vehicle;
  onUpdateDriver: (updated: Driver) => void;
  onOpenYocoPayment: (driver: Driver) => void;
  onViewDocPreview?: (preview: { title: string; url: string }) => void;
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

export const DriverFinanceTracker: React.FC<DriverFinanceTrackerProps> = ({
  driver,
  agreements = [],
  assignedVehicle,
  onUpdateDriver,
  onOpenYocoPayment,
  onViewDocPreview,
}) => {
  // Transactions state for this driver
  const [transactions, setTransactions] = useState<YocoTransaction[]>([]);
  const [isLoadingTx, setIsLoadingTx] = useState<boolean>(true);

  // Selected week for detail popover / inspection
  const [selectedWeek, setSelectedWeek] = useState<WeekScheduleItem | null>(null);

  // Manual Payment (POP) Logger Modal / Form State
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

  // Base contract start date (fallback to reasonable baseline if missing)
  const contractStartDate = React.useMemo(() => {
    if (driver.contractStartDate) return new Date(driver.contractStartDate);
    // Fallback: estimate based on total paid or default to 3 months ago
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

    // Calculate total weeks fully paid based on cumulative paid amount if explicit weekNumber is not in legacy transactions
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

      // Current Day of week: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      const todayDayOfWeek = today.getDay();
      const isInPayWindow = isCurrentWeek && todayDayOfWeek >= 2 && todayDayOfWeek <= 4;

      // Find explicit transactions matching this weekNumber or date range
      const matching = transactions.filter((t) => {
        if (t.weekNumber === w) return true;
        if (t.status !== 'successful') return false;
        const txDate = new Date(t.transactionDate);
        return txDate >= wStart && txDate <= wEnd && t.allocation === 'weekly_rental';
      });

      const txPaidSum = matching.reduce((sum, t) => sum + (t.status === 'successful' ? t.amountZar : 0), 0);

      // Determine amount paid for this week:
      // Either direct matching transactions or allocated from cumulative pool
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
        // PDF or document reader
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
        targetWeek: popTargetWeek,
        fileName: popFileName || null,
        capturedAt: new Date().toISOString(),
      },
    };

    // Calculate updated driver balances
    const newTotalPaid = (driver.totalPaid || 0) + Number(popAmount);
    const newBalanceDue = Math.max(0, (driver.balanceDue || 0) - Number(popAmount));
    
    // Calculate improved payment score
    const newPaymentScore = Math.min(100, Math.max(60, Math.round(((paidWeeksCount + 1) / Math.max(1, paidWeeksCount + overdueWeeksCount)) * 100)));

    const updatedDriver: Driver = {
      ...driver,
      totalPaid: newTotalPaid,
      balanceDue: newBalanceDue,
      paymentScore: newPaymentScore,
    };

    try {
      // 1. Save Transaction to local storage & Supabase
      await saveTransaction(newTx);

      // 2. Save Driver updates
      await saveDriver(updatedDriver);

      // 3. Update local state
      setTransactions((prev) => [newTx, ...prev]);
      onUpdateDriver(updatedDriver);

      setPopSuccessMessage(`Successfully logged R${popAmount} for Week ${popTargetWeek}! Proof captured.`);

      // Reset form fields after 1.5 seconds
      setTimeout(() => {
        setIsLogPaymentOpen(false);
        setPopSuccessMessage(null);
        setPopFileUrl('');
        setPopFileName('');
        setPopReference('');
      }, 1400);
    } catch (err) {
      console.error('Error logging manual payment:', err);
    } finally {
      setIsSubmittingPop(false);
    }
  };

  // Helper date formatter
  const formatDateRange = (start: Date, end: Date) => {
    return `${start.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const formatShortDate = (d: Date) => {
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  };

  // Filtered transactions for the ledger
  const filteredTransactions = transactions.filter((t) => {
    if (txFilterAllocation === 'all') return true;
    return t.allocation === txFilterAllocation;
  });

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. CONTRACT FINANCIAL HEALTH & PROGRESS BANNER */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <DollarSign className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Rent-to-Own Financials & Weekly Collection</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Active Term
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contract Term: <strong className="text-slate-800 font-bold">{termMonths} Months ({totalWeeks} Weeks)</strong> • Pay Day: <strong className="text-emerald-700 font-bold">Tuesday to Thursday</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsLogPaymentOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Manual Payment (POP)</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenYocoPayment(driver)}
              className="px-4 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Yoco Gateway</span>
            </button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Weekly Rent Rate</span>
            <strong className="text-emerald-700 font-mono text-xl mt-1 block font-black">
              R{weeklyRate.toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block flex items-center gap-1">
              <Clock className="w-3 h-3 text-emerald-600" />
              Pay Day: Tue – Thu
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Weeks Settled</span>
            <strong className="text-slate-900 font-mono text-xl mt-1 block font-black">
              {paidWeeksCount} / {totalWeeks}
            </strong>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
              {remainingWeeksCount} weeks to bike ownership
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Paid / Contract</span>
            <strong className="text-slate-900 font-mono text-xl mt-1 block font-black">
              R{totalPaid.toLocaleString()}
            </strong>
            <span className="text-[10px] text-slate-500 font-semibold mt-0.5 block">
              of R{totalContractValue.toLocaleString()} total
            </span>
          </div>

          <div className={`p-4 rounded-2xl border ${balanceDue > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Account Ledger</span>
            <strong className={`font-mono text-xl mt-1 block font-black ${balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {balanceDue > 0 ? `Overdue: R${balanceDue.toLocaleString()}` : 'Paid Up to Date'}
            </strong>
            <span className="text-[10px] text-slate-600 font-semibold mt-0.5 block">
              {overdueWeeksCount > 0 ? `${overdueWeeksCount} missed weekly payments` : 'On-Time Score: ' + (driver.paymentScore || 100) + '%'}
            </span>
          </div>
        </div>

        {/* Term Ownership Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Motorcycle Rent-to-Own Progress:</span>
              <strong className="text-slate-900 font-mono">{percentComplete}% Complete</strong>
            </span>
            <span className="font-mono font-bold text-slate-600 text-[11px]">
              {paidWeeksCount} of {totalWeeks} Weeks Settled
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GITHUB-STYLE WEEKLY PAYMENT CALENDAR & HEATMAP */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Weekly Payment Schedule Heatmap (All {totalWeeks} Weeks)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any week tile to inspect collection status, Tuesday–Thursday due window, and attached Proof of Payment.
            </p>
          </div>

          {/* Heatmap Legend */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600 flex-wrap bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-600 inline-block shadow-2xs" />
              <span>Paid Full (R{weeklyRate})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-500 inline-block animate-pulse" />
              <span>Pay Window (Tue–Thu)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600 inline-block shadow-2xs" />
              <span>Missed / Overdue</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block" />
              <span>Upcoming</span>
            </span>
          </div>
        </div>

        {/* Notice for Rent Collection Period */}
        <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-950">
          <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <strong className="font-bold">Official Dynamic Fleet Pay Day Window: Tuesday to Thursday.</strong>{' '}
            <span className="text-emerald-800">
              Active rent collection opens every Tuesday morning and closes Thursday evening. All payments recorded via EFT, Cash, or WhatsApp POP are reconciled here.
            </span>
          </div>
        </div>

        {/* GitHub-like Calendar Matrix */}
        <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-slate-100 shadow-inner space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span className="font-bold flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contract Timeline: Week 1 to Week {totalWeeks}</span>
            </span>
            <span className="font-mono text-[11px]">
              Current Active: <strong className="text-white">Week {currentWeekItem.weekNumber}</strong> ({formatDateRange(currentWeekItem.startDate, currentWeekItem.endDate)})
            </span>
          </div>

          {/* Contribution Tiles Grid */}
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-13 lg:grid-cols-13 gap-2">
            {scheduleWeeks.map((item) => {
              const isSelected = selectedWeek?.weekNumber === item.weekNumber;
              let bgClass = 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500';
              let badgeIndicator = null;

              if (item.status === 'paid') {
                bgClass = 'bg-emerald-500 hover:bg-emerald-400 border-emerald-400 text-slate-950 font-black shadow-xs';
                badgeIndicator = <Check className="w-2.5 h-2.5 text-emerald-950" />;
              } else if (item.status === 'in_window') {
                bgClass = 'bg-amber-400 hover:bg-amber-300 border-amber-300 text-amber-950 font-black animate-pulse shadow-md';
                badgeIndicator = <Clock className="w-2.5 h-2.5 text-amber-950" />;
              } else if (item.status === 'overdue') {
                bgClass = 'bg-rose-500 hover:bg-rose-400 border-rose-400 text-white font-black shadow-xs';
                badgeIndicator = <AlertTriangle className="w-2.5 h-2.5 text-white" />;
              } else if (item.status === 'partial') {
                bgClass = 'bg-amber-500/80 hover:bg-amber-400 border-amber-400 text-white font-black';
              }

              return (
                <button
                  key={item.weekNumber}
                  type="button"
                  onClick={() => setSelectedWeek(item)}
                  title={`Week ${item.weekNumber} (${formatDateRange(item.startDate, item.endDate)}) - Status: ${item.status.toUpperCase()} - Amount: R${item.amountPaid}/R${item.amountDue}`}
                  className={`relative p-2 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[48px] ${bgClass} ${
                    isSelected ? 'ring-2 ring-cyan-400 scale-105 z-10' : ''
                  }`}
                >
                  <span className="text-[10px] tracking-tight block">W{item.weekNumber}</span>
                  <div className="mt-0.5">{badgeIndicator}</div>
                </button>
              );
            })}
          </div>

          {/* Bottom helper info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
            <span>Grid represents weekly cycles throughout the entire {termMonths}-month rent-to-own agreement</span>
            <span className="text-cyan-300 font-bold">Select any square to inspect / log proof</span>
          </div>
        </div>

        {/* Selected Week Inspection Card (Popover / Drawer) */}
        {selectedWeek && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${
                  selectedWeek.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                  selectedWeek.status === 'in_window' ? 'bg-amber-100 text-amber-800' :
                  selectedWeek.status === 'overdue' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  W{selectedWeek.weekNumber}
                </div>
                <div>
                  <h5 className="font-black text-slate-900 text-sm">
                    Week {selectedWeek.weekNumber} Inspection Dossier
                  </h5>
                  <span className="text-slate-500 text-[11px]">
                    Cycle: {formatDateRange(selectedWeek.startDate, selectedWeek.endDate)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedWeek(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Official Pay Day Window</span>
                <strong className="text-slate-800 font-bold text-xs mt-0.5 block">
                  Tuesday {formatShortDate(selectedWeek.tuesdayDate)} – Thursday {formatShortDate(selectedWeek.thursdayDate)}
                </strong>
                <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                  Collection window active Tue–Thu
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Payment Status</span>
                <strong className={`font-mono text-sm mt-0.5 block font-black ${
                  selectedWeek.status === 'paid' ? 'text-emerald-700' :
                  selectedWeek.status === 'in_window' ? 'text-amber-600' :
                  selectedWeek.status === 'overdue' ? 'text-rose-600' : 'text-slate-600'
                }`}>
                  {selectedWeek.status === 'paid' ? '✅ Paid in Full (R' + selectedWeek.amountDue + ')' :
                   selectedWeek.status === 'in_window' ? '⏳ Due Now (Tue–Thu Window)' :
                   selectedWeek.status === 'overdue' ? '⚠️ Overdue / Missed (R' + selectedWeek.amountDue + ')' : 'Upcoming Week'}
                </strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Amount Settled: R{selectedWeek.amountPaid}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Quick Action</span>
                  <span className="text-[11px] text-slate-600 font-bold block mt-0.5">
                    {selectedWeek.status === 'paid' ? 'Payment Reconciled' : 'Log POP for Week ' + selectedWeek.weekNumber}
                  </span>
                </div>

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPopTargetWeek(selectedWeek.weekNumber);
                      setPopAmount(weeklyRate);
                      setIsLogPaymentOpen(true);
                    }}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{selectedWeek.status === 'paid' ? 'Log Additional POP' : 'Log Payment for Week ' + selectedWeek.weekNumber}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Attached Proof of Payment for this specific week (if any) */}
            {selectedWeek.matchingTransactions.length > 0 && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-700 block mb-2">
                  Attached Transactions & Proof of Payment for Week {selectedWeek.weekNumber}:
                </span>
                <div className="space-y-2">
                  {selectedWeek.matchingTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>R{tx.amountZar.toLocaleString()}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700">
                              {tx.paymentMethod.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            {new Date(tx.transactionDate).toLocaleDateString()} • {tx.notes || 'Weekly Rent'}
                          </span>
                        </div>
                      </div>

                      {tx.proofOfPaymentUrl && onViewDocPreview && (
                        <button
                          type="button"
                          onClick={() => onViewDocPreview({ title: `POP Receipt - Week ${selectedWeek.weekNumber} (${driver.fullName})`, url: tx.proofOfPaymentUrl! })}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View POP</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. MANUAL PAYMENT LOGGER & PROOF OF PAYMENT MODAL */}
      {/* ========================================================================= */}
      {isLogPaymentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 border border-slate-200 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">
                    Log Manual Payment & Capture POP
                  </h4>
                  <p className="text-xs text-slate-500">
                    Customer: <strong className="text-slate-800 font-bold">{driver.fullName}</strong> • Bike: <strong className="font-mono text-cyan-800">{driver.assignedBikeVinOrPlate || 'Unassigned'}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogPaymentOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success Notification */}
            {popSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-bold">{popSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmitManualPayment} className="space-y-4 text-xs">
              {/* Amount and Quick Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Payment Amount (ZAR) *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPopAmount(weeklyRate)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      R{weeklyRate} (1 Wk)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopAmount(weeklyRate * 2)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      R{weeklyRate * 2} (2 Wks)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopAmount(weeklyRate * 4)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold text-slate-700"
                    >
                      R{weeklyRate * 4} (4 Wks)
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 font-bold text-slate-400 text-sm">R</span>
                  <input
                    type="number"
                    required
                    min={1}
                    value={popAmount}
                    onChange={(e) => setPopAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-black font-mono text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Contract Week *</label>
                  <select
                    value={popTargetWeek}
                    onChange={(e) => setPopTargetWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    {scheduleWeeks.map((w) => (
                      <option key={w.weekNumber} value={w.weekNumber}>
                        Week {w.weekNumber} ({formatShortDate(w.startDate)} - {formatShortDate(w.endDate)}) {w.status === 'paid' ? '• (Already Paid)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={popDate}
                    onChange={(e) => setPopDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Payment Method / Channel</label>
                  <select
                    value={popMethod}
                    onChange={(e) => setPopMethod(e.target.value as YocoPaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="manual_eft">Manual EFT / Bank Transfer</option>
                    <option value="cash">Cash at Randburg Hub Counter</option>
                    <option value="card_pos">Card Swiped on Counter POS</option>
                    <option value="manual_pop">WhatsApp Receipt Screenshot</option>
                    <option value="instant_eft">Instant EFT</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Allocation Category</label>
                  <select
                    value={popAllocation}
                    onChange={(e) => setPopAllocation(e.target.value as PaymentAllocation)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold bg-white"
                  >
                    <option value="weekly_rental">Weekly Rent-to-Own Installment</option>
                    <option value="security_deposit">Security Deposit Settlement</option>
                    <option value="traffic_fine">AARTO Traffic Fine Settlement</option>
                    <option value="repair_deductible">Repair / Spare Part Deductible</option>
                    <option value="other">Advance / Other Allocation</option>
                  </select>
                </div>
              </div>

              {/* PROOF OF PAYMENT PICTURE UPLOAD */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Proof of Payment Picture / Receipt Slip *
                </label>
                
                {popFileUrl ? (
                  <div className="p-3 bg-slate-50 border border-emerald-300 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/5 shrink-0 border border-slate-200 flex items-center justify-center">
                        <img src={popFileUrl} alt="POP Preview" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">
                          {popFileName || 'Proof_of_payment.jpg'}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Picture successfully captured & compressed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onViewDocPreview && (
                        <button
                          type="button"
                          onClick={() => onViewDocPreview({ title: 'Proof of Payment Preview', url: popFileUrl })}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Preview full size"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setPopFileUrl('');
                          setPopFileName('');
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => popFileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 text-center cursor-pointer transition-colors space-y-2"
                  >
                    <input
                      ref={popFileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handlePopFileUpload}
                      className="hidden"
                    />
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-slate-800 font-bold block text-xs">
                        Click or Drag to Upload Proof of Payment
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Supports WhatsApp screenshot, bank slip, or camera photo (PNG, JPG, PDF)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bank Reference & Operator Notes */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bank Reference / Slip #</label>
                  <input
                    type="text"
                    placeholder="e.g. Capitec Ref #89342 / Cash Slip"
                    value={popReference}
                    onChange={(e) => setPopReference(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Captured By Staff</label>
                  <input
                    type="text"
                    value={popRecordedBy}
                    onChange={(e) => setPopRecordedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogPaymentOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingPop}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPop ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>Save & Reconcile Payment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PAYMENT HISTORY LEDGER WITH POP GALLERY */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Payment History & Proof of Payment (POP) Ledger</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 font-mono">
                {transactions.length} Records
              </span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete audit trail of all manual bank transfers, cash receipts, and Yoco gateway settlements.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={txFilterAllocation}
              onChange={(e) => setTxFilterAllocation(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
            >
              <option value="all">All Allocations</option>
              <option value="weekly_rental">Weekly Rental</option>
              <option value="security_deposit">Security Deposit</option>
              <option value="traffic_fine">Traffic Fines</option>
              <option value="repair_deductible">Repairs</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        {filteredTransactions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <strong className="text-slate-700 font-bold block">No manual payments or receipts logged yet</strong>
            <p className="max-w-md mx-auto text-slate-400">
              Click &quot;Log Manual Payment (POP)&quot; above to capture bank EFT slips, cash payments, or WhatsApp receipts.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Week #</th>
                  <th className="py-2.5 px-3">Amount (ZAR)</th>
                  <th className="py-2.5 px-3">Method & Allocation</th>
                  <th className="py-2.5 px-3">Reference / Notes</th>
                  <th className="py-2.5 px-3 text-right">Proof of Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {new Date(tx.transactionDate).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-3">
                      {tx.weekNumber ? (
                        <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Week {tx.weekNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-slate-900">
                      +R{tx.amountZar.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                          {tx.paymentMethod.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {tx.allocation.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                      {tx.notes || tx.yocoChargeId}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {tx.proofOfPaymentUrl ? (
                        <button
                          type="button"
                          onClick={() => onViewDocPreview && onViewDocPreview({
                            title: `Proof of Payment - ${driver.fullName} (R${tx.amountZar})`,
                            url: tx.proofOfPaymentUrl!
                          })}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 inline-flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          <span>View POP</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px] italic">No slip attached</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
