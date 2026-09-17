import React, { useState } from 'react';
import { 
  Driver, 
  RentalAgreement, 
  YocoTransaction, 
  PaymentAllocation, 
  YocoPaymentMethod, 
  Vehicle 
} from '../../types';
import { YocoSettings, executeYocoPayment, saveYocoSettings } from '../../lib/fleetStore';
import { 
  CreditCard, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  Copy, 
  Check, 
  Send, 
  Download, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  Settings, 
  AlertTriangle, 
  ArrowUpRight, 
  RefreshCw, 
  Zap,
  Printer,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type FinancialSubTab = 'yoco_hub' | 'agreements' | 'sales_agreements' | 'rental_options' | 'bank_reconciliation';

interface FleetFinancialsViewProps {
  drivers: Driver[];
  agreements: RentalAgreement[];
  transactions: YocoTransaction[];
  vehicles: Vehicle[];
  yocoSettings: YocoSettings;
  onUpdateDriver: (driver: Driver) => void;
  onAddTransaction: (tx: YocoTransaction) => void;
  onUpdateYocoSettings: (settings: YocoSettings) => void;
  initialSelectedDriverForPayment?: Driver | null;
  activeSubTab?: FinancialSubTab;
}

export const FleetFinancialsView: React.FC<FleetFinancialsViewProps> = ({
  drivers,
  agreements,
  transactions,
  vehicles,
  yocoSettings,
  onUpdateDriver,
  onAddTransaction,
  onUpdateYocoSettings,
  initialSelectedDriverForPayment,
  activeSubTab,
}) => {
  const [subTab, setSubTab] = useState<FinancialSubTab>(activeSubTab || 'yoco_hub');

  React.useEffect(() => {
    if (activeSubTab) {
      setSubTab(activeSubTab);
    }
  }, [activeSubTab]);

  // Selected driver for Yoco Terminal / Payment link
  const [selectedDriverId, setSelectedDriverId] = useState<string>(
    initialSelectedDriverForPayment?.id || drivers[0]?.id || ''
  );
  const [paymentAmount, setPaymentAmount] = useState<number>(
    initialSelectedDriverForPayment?.weeklyRate || 750
  );
  const [allocation, setAllocation] = useState<PaymentAllocation>('weekly_rental');
  const [paymentMethod, setPaymentMethod] = useState<YocoPaymentMethod>('yoco_card_terminal');

  // Sandbox Test Card Details
  const [cardNumber, setCardNumber] = useState<string>('4000 0000 0000 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [cardHolder, setCardHolder] = useState<string>('SANDBOX TEST CARD');

  // Terminal Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);
  const [isCopiedLink, setIsCopiedLink] = useState<boolean>(false);

  // Settings Modal State
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [settingsForm, setSettingsForm] = useState<YocoSettings>(yocoSettings);

  // Contract Preview Modal
  const [previewAgreement, setPreviewAgreement] = useState<RentalAgreement | null>(null);

  // Transactions Search & Filter
  const [txSearchQuery, setTxSearchQuery] = useState<string>('');
  const [txFilterAllocation, setTxFilterAllocation] = useState<string>('all');

  const selectedDriver = drivers.find((d) => d.id === selectedDriverId) || drivers[0] || null;

  // Sandbox Preset Cards
  const fillTestCard = (type: 'success' | '3ds' | 'declined') => {
    if (type === 'success') {
      setCardNumber('4000 0000 0000 4242');
      setCardHolder('TEST DRIVER (APPROVED)');
    } else if (type === '3ds') {
      setCardNumber('4000 0000 0000 5555');
      setCardHolder('TEST 3DS SECURE CARD');
    } else {
      setCardNumber('4000 0000 0000 0002');
      setCardHolder('TEST INSUFFICIENT FUNDS');
    }
  };

  // Generate Payment Link
  const generatedPaymentLink = selectedDriver
    ? `https://pay.yoco.com/dynamic-rental/pay?driverId=${selectedDriver.id}&ref=${selectedDriver.refNumber}&amount=${paymentAmount}&alloc=${allocation}`
    : 'https://pay.yoco.com/dynamic-rental/pay';

  // Copy Link Handler
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedPaymentLink);
    setIsCopiedLink(true);
    setTimeout(() => setIsCopiedLink(false), 2500);
  };

  // Send WhatsApp Link
  const handleSendWhatsAppLink = () => {
    if (!selectedDriver) return;
    const text = `Good day ${selectedDriver.fullName}! 🏍️
    
This is your *Dynamic Rental* weekly installment payment link.

💰 *Amount Due:* R${paymentAmount.toFixed(2)}
📋 *Purpose:* ${allocation === 'weekly_rental' ? 'Weekly Motorcycle Rent' : allocation.replace(/_/g, ' ')}
🏍️ *Assigned Bike:* ${selectedDriver.assignedBikeVinOrPlate || ''}

👉 *Tap here to pay securely with any SA Bank Card (Visa/Mastercard):*
${generatedPaymentLink}

Once paid, your account balance will automatically update instantly. Thank you!`;

    window.open(`https://wa.me/${selectedDriver.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Process Card Charge (Sandbox or Live)
  const handleProcessCharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver) return;

    setIsProcessing(true);
    setPaymentSuccessMessage(null);

    setTimeout(() => {
      setIsProcessing(false);

      if (cardNumber.includes('0002')) {
        alert('❌ Payment Declined: Insufficient funds on Sandbox test card. Please try card 4000...4242');
        return;
      }

      // Execute payment in store
      const { transaction, updatedDriver } = executeYocoPayment(
        {
          driver: selectedDriver,
          amountZar: Number(paymentAmount),
          paymentMethod,
          allocation,
          cardLast4: cardNumber.slice(-4),
          cardBrand: cardNumber.startsWith('4') ? 'Visa (Sandbox)' : 'Mastercard (Sandbox)',
          notes: `Settled via Yoco ${yocoSettings.mode.toUpperCase()}`,
        },
        yocoSettings
      );

      onUpdateDriver(updatedDriver);
      onAddTransaction(transaction);

      setPaymentSuccessMessage(
        `✅ R${paymentAmount.toFixed(2)} successfully collected via Yoco! Charge ID: ${transaction.yocoChargeId}. Driver balance updated.`
      );

      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      // Auto-send WhatsApp Receipt if enabled
      if (yocoSettings.autoSendWhatsAppReceipt) {
        setTimeout(() => {
          sendWhatsAppReceipt(transaction, updatedDriver);
        }, 1200);
      }
    }, 1200);
  };

  // Send WhatsApp Receipt
  const sendWhatsAppReceipt = (tx: YocoTransaction, driver?: Driver) => {
    const d = driver || drivers.find((drv) => drv.id === tx.driverId);
    if (!d) return;

    const receiptText = `*OFFICIAL PAYMENT RECEIPT - DYNAMIC RENTAL* 🧾
----------------------------------------
*Receipt No:* ${tx.id}
*Yoco Charge ID:* ${tx.yocoChargeId}
*Date:* ${new Date(tx.transactionDate).toLocaleString('en-ZA')}
*Courier:* ${tx.driverName} (${d.refNumber})
*Assigned Bike:* ${d.assignedBikeVinOrPlate || 'Fleet Asset'}

💵 *Amount Paid:* R${tx.amountZar.toFixed(2)}
💳 *Payment Channel:* Yoco Gateway (${tx.cardBrand} •••• ${tx.cardLast4})
🏷️ *Allocation:* ${tx.allocation.replace(/_/g, ' ').toUpperCase()}
📊 *Remaining Balance Due:* ${d.balanceDue <= 0 ? 'R0.00 (Fully Settled)' : `R${d.balanceDue.toFixed(2)}`}

📍 *Randburg Showroom:* 304 Tungsten Rd, Strijdom Park
Thank you for riding with Dynamic Rental!`;

    window.open(`https://wa.me/${d.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(receiptText)}`, '_blank');
  };

  // Financial Metrics
  const totalVolumeZar = transactions.reduce((sum, tx) => sum + tx.amountZar, 0);
  const totalFeesZar = transactions.reduce((sum, tx) => sum + (tx.yocoFeeZar || 0), 0);
  const netSettlementZar = totalVolumeZar - totalFeesZar;

  // Filtered Transactions
  const filteredTxs = transactions.filter((tx) => {
    const q = txSearchQuery.toLowerCase().trim();
    const matchesQ =
      !q ||
      tx.driverName.toLowerCase().includes(q) ||
      tx.yocoChargeId.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q);

    const matchesAlloc = txFilterAllocation === 'all' || tx.allocation === txFilterAllocation;
    return matchesQ && matchesAlloc;
  });

  // Dynamic Header based on active subtab
  const getHeaderInfo = () => {
    switch (subTab) {
      case 'rental_options':
        return {
          tag: 'Pricing & Terms',
          title: 'Rental Pricing Options & Packages',
          desc: 'Commercial weekly installment rates, required security deposits, and term duration matrices.',
        };
      case 'agreements':
        return {
          tag: 'Legal Contracts',
          title: 'Rental Agreements Register',
          desc: 'Active Rent-to-Own commercial vehicle agreements, signed contracts, and weekly payment schedules.',
        };
      case 'sales_agreements':
        return {
          tag: 'Direct Sales',
          title: 'Sales Agreements & Commercial Purchase',
          desc: 'Outright motorcycle purchase contracts, buyout terms, and title transfer documentation.',
        };
      case 'bank_reconciliation':
        return {
          tag: 'Bank Audit',
          title: 'Bank Account Reconciliation',
          desc: 'Import bank statement CSVs, auto-match EFT driver payments, and audit ledger balances.',
        };
      default:
        return {
          tag: 'Payment Gateway',
          title: 'Paystack & Yoco Payment Collections',
          desc: 'Real-time card processing, WhatsApp payment links, automated driver balance updates, and transaction logs.',
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
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
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

          <div className="flex items-center gap-2">
            {/* Mode Badge & Settings Trigger */}
            <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
              yocoSettings.mode === 'sandbox'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${yocoSettings.mode === 'sandbox' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span className="uppercase font-black">{yocoSettings.mode} Mode</span>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(true)}
                className="p-1 hover:bg-slate-200/60 rounded text-slate-600"
                title="Configure Yoco API Keys"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Financial Overview KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Inflow (ZAR)</span>
            <span className="text-lg font-black text-slate-900">R{totalVolumeZar.toLocaleString()}</span>
          </div>
          <div className="bg-cyan-50/60 p-3 rounded-xl border border-cyan-200/80">
            <span className="text-[10px] font-bold uppercase text-cyan-700 block">Net Payout (After Fees)</span>
            <span className="text-lg font-black text-cyan-900">R{netSettlementZar.toFixed(2)}</span>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">Yoco Merchant Fees (2.95%)</span>
            <span className="text-lg font-black text-amber-900">R{totalFeesZar.toFixed(2)}</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80">
            <span className="text-[10px] font-bold uppercase text-emerald-700 block">Reconciliation Rate</span>
            <span className="text-lg font-black text-emerald-900">100% Auto-Matched</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 1: YOCO PAYMENT HUB & TERMINAL */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'yoco_hub' && (
        <div className="space-y-6">
          {/* Top Row: Terminal Simulator & Payment Link Generator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Live Interactive Yoco Terminal / Sandbox Charge */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center font-black">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Yoco Card Terminal & Sandbox</h3>
                      <span className="text-[11px] text-slate-500">Collect Card Payments or Simulate Webhooks</span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                    {yocoSettings.mode}
                  </span>
                </div>

                {/* Form Controls */}
                <form onSubmit={handleProcessCharge} className="mt-4 space-y-3.5">
                  {/* Driver Selector */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Select Active Driver</label>
                    <select
                      value={selectedDriverId}
                      onChange={(e) => {
                        setSelectedDriverId(e.target.value);
                        const match = drivers.find((d) => d.id === e.target.value);
                        if (match) {
                          setPaymentAmount(match.weeklyRate || 750);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-cyan-500"
                    >
                      {drivers.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.fullName} ({d.refNumber}) - R{d.weeklyRate}/wk • Balance: {d.balanceDue > 0 ? `R${d.balanceDue} Due` : 'R0.00'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Allocation & Amount */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Payment Purpose</label>
                      <select
                        value={allocation}
                        onChange={(e) => setAllocation(e.target.value as PaymentAllocation)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold"
                      >
                        <option value="weekly_rental">Weekly Motorcycle Rent</option>
                        <option value="deposit">Deposit (Security)</option>
                        <option value="traffic_fine">AARTO Traffic Fine</option>
                        <option value="repair_deductible">Workshop Repair</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Amount (ZAR)</label>
                      <input
                        type="number"
                        min={10}
                        required
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-black text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Sandbox Card Inputs */}
                  <div className="p-3.5 bg-slate-900 text-white rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-cyan-400 font-bold uppercase">Yoco Sandbox Card Tap</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => fillTestCard('success')}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[10px] font-bold"
                        >
                          Pass Card
                        </button>
                        <button
                          type="button"
                          onClick={() => fillTestCard('declined')}
                          className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-bold"
                        >
                          Decline Card
                        </button>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 font-mono text-xs text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300"
                      />
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300 text-center"
                      />
                    </div>
                  </div>

                  {paymentSuccessMessage && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                      {paymentSuccessMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing Yoco Card Charge...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Charge R{paymentAmount.toFixed(2)} via Yoco Gateway</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Card 2: Yoco Automated WhatsApp Payment Link Generator */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">Yoco WhatsApp Payment Link Generator</h3>
                      <span className="text-[11px] text-slate-500">1-Click Dispatch to Courier WhatsApp</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-4 text-xs">
                  <p className="text-slate-600 leading-relaxed">
                    Generate an instant, mobile-optimized Yoco payment URL linked to driver{' '}
                    <strong className="text-slate-900">{selectedDriver?.fullName}</strong> ({selectedDriver?.refNumber}).
                    Couriers can pay using Apple Pay, Google Pay, Visa, Mastercard, or Capitec Pay.
                  </p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 break-all">
                    {generatedPaymentLink}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      {isCopiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      <span>{isCopiedLink ? 'Copied Link!' : 'Copy Link'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSendWhatsAppLink}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>Send WhatsApp Link</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span>Webhook: Auto-sync on successful payment</span>
                <span className="font-bold text-slate-700">Fee: {yocoSettings.merchantFeePercent}%</span>
              </div>
            </div>
          </div>

          {/* Bottom Table: Yoco Transaction & Settlement Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transaction by driver name, charge ID, ref..."
                  value={txSearchQuery}
                  onChange={(e) => setTxSearchQuery(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:bg-white"
                />
              </div>

              <select
                value={txFilterAllocation}
                onChange={(e) => setTxFilterAllocation(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
              >
                <option value="all">All Allocations</option>
                <option value="weekly_rental">Weekly Rent</option>
                <option value="deposit">Deposit</option>
                <option value="traffic_fine">Traffic Fine</option>
                <option value="repair_deductible">Repair</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Yoco Charge ID & Date</th>
                    <th className="py-3 px-4">Courier Profile</th>
                    <th className="py-3 px-4">Purpose & Allocation</th>
                    <th className="py-3 px-4">Gross (ZAR)</th>
                    <th className="py-3 px-4">Fee (2.95%)</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Card & Channel</th>
                    <th className="py-3 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredTxs.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-slate-900 block">{tx.yocoChargeId}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(tx.transactionDate).toLocaleString('en-ZA')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{tx.driverName}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-800">
                          {tx.allocation.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">R{tx.amountZar.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-amber-700 font-semibold">-R{tx.yocoFeeZar?.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-emerald-700 font-black">R{tx.netAmountZar?.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-600">
                        {tx.cardBrand} •••• {tx.cardLast4}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => sendWhatsAppReceipt(tx)}
                          title="Send Official WhatsApp Receipt"
                          className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>Receipt</span>
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
      {/* SUBTAB 2: RENTAL & SALES AGREEMENTS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'agreements' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Active Rent-to-Own Legal Contracts & Schedules
              </h3>
              <p className="text-xs text-slate-500">
                Binding contracts under South African law with NATIS motorcycle ownership transfer upon final weekly payment completion.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreements.map((agr) => {
              const progressPct = Math.min(100, Math.round((agr.totalPaidZar / agr.totalContractValueZar) * 100));

              return (
                <div
                  key={agr.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          {agr.agreementNumber}
                        </span>
                        <span className="text-xs text-slate-500">{agr.driverName}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                        {agr.agreementType.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Assigned Vehicle</span>
                        <span className="font-bold text-slate-900">{agr.vehiclePlate}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Weekly Rate</span>
                        <span className="font-bold text-slate-900">R{agr.weeklyRateZar}/week</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Contract Term</span>
                        <span className="font-bold text-slate-900">{agr.termMonths} Months</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Paid</span>
                        <span className="font-bold text-emerald-700">R{agr.totalPaidZar.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress Bar towards Full Ownership */}
                    <div className="mt-4 space-y-1 text-xs">
                      <div className="flex justify-between text-[11px] font-bold">
                        <span>Ownership Payoff Progress</span>
                        <span className="text-cyan-700">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-cyan-500 h-full" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span className="text-[10px] text-slate-400 block pt-0.5">
                        Remaining: R{agr.remainingBalanceZar.toLocaleString()} • End Date: {agr.expectedEndDate}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Terms: {agr.termsVersion}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewAgreement(agr)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View & Print Contract</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 3: RENTAL OPTIONS MATRIX */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'rental_options' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rent to Own Option */}
            <div className="bg-white rounded-2xl border-2 border-cyan-500 p-6 shadow-md relative">
              <span className="absolute top-4 right-4 px-3 py-1 bg-cyan-500 text-slate-950 font-black text-[10px] uppercase rounded-full">
                Most Popular
              </span>
              <h3 className="text-lg font-black text-slate-900">Rent-to-Own Commercial Model</h3>
              <p className="text-xs text-slate-500 mt-1">
                Driver pays weekly installments and takes 100% legal ownership upon term completion.
              </p>

              <div className="mt-5 space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Brand New Bikes (Boxer 150 / Big Boy)</span>
                  <span className="font-bold text-slate-900">R750/week (15-18 Months)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Pre-Owned Fleet Bikes</span>
                  <span className="font-bold text-slate-900">R650/week (20 Months)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Initial Non-Refundable Deposit</span>
                  <span className="font-bold text-slate-900">R650 (Used) / R1,000 (New)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Included Equipment</span>
                  <span className="font-bold text-slate-900">65L Box, Bracket, Phone Charger</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Ownership Transfer</span>
                  <span className="font-bold text-emerald-700">Official NATIS Blue Papers Issued</span>
                </div>
              </div>
            </div>

            {/* Commercial Short-Term Option */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-lg font-black text-slate-900">Short-Term Commercial Rental</h3>
              <p className="text-xs text-slate-500 mt-1">
                Flexible weekly hire for peak delivery periods, trial couriers, or temporary bike substitution.
              </p>

              <div className="mt-5 space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Weekly Hire Rate</span>
                  <span className="font-bold text-slate-900">R850/week (No minimum term)</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Refundable Security Deposit</span>
                  <span className="font-bold text-slate-900">R1,500</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Maintenance</span>
                  <span className="font-bold text-emerald-700">100% Covered by Dynamic Rental</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-600">Cancellation Notice</span>
                  <span className="font-bold text-slate-900">7 Days written notice</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 4: SALES AGREEMENTS & NATIS TITLE TRANSFERS */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'sales_agreements' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Sales & NATIS Ownership Transfer Agreements
              </h3>
              <p className="text-xs text-slate-500">
                Official title deeds, bill of sale certificates, and Department of Transport NATIS Blue Paper records upon final rent-to-own completion.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                Active Sales Pipeline: {agreements.length} Contracts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agreements.map((agr) => {
              const isFullyPaid = agr.remainingBalanceZar <= 0 || agr.status === 'completed';
              return (
                <div key={agr.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          DEED-SA-{agr.agreementNumber.replace('RTO-', '')}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">{agr.driverName}</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isFullyPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isFullyPaid ? 'Title Transferred (NATIS)' : 'In Amortization'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle Reg / Plate</span>
                        <span className="font-mono font-black text-slate-900">{agr.vehiclePlate}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Valuation</span>
                        <span className="font-black text-slate-900">R{agr.totalContractValueZar.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Paid To Date</span>
                        <span className="font-black text-emerald-700">R{agr.totalPaidZar.toLocaleString()}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Balance to Transfer</span>
                        <span className={`font-black ${agr.remainingBalanceZar > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {agr.remainingBalanceZar > 0 ? `R${agr.remainingBalanceZar.toLocaleString()}` : 'R0.00 (Ready for NATIS)'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                      <div className="font-bold text-slate-800 mb-1">Ownership Transfer Conditions:</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>Valid South African Traffic Register Number / ID</li>
                        <li>R0.00 Outstanding balance on Yoco & Bank ledger</li>
                        <li>Certificate of Roadworthiness (Roadworthy test included)</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">VIN: ZA-EXP-{agr.vehiclePlate.replace(/\s+/g, '')}</span>
                    <button
                      type="button"
                      onClick={() => setPreviewAgreement(agr)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Sales Bill of Sale</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUBTAB 5: BANK ACCOUNT RECONCILIATION & DIRECT LEDGER */}
      {/* ------------------------------------------------------------- */}
      {subTab === 'bank_reconciliation' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Automated Bank Account Reconciliation Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Direct EFT feeds from FNB, Standard Bank, Nedbank & Capitec matching deposits to driver reference codes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-black">
                Bank Feed: LIVE (FNB Business 6289••••••)
              </span>
            </div>
          </div>

          {/* Bank Feed Transactions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Electronic Fund Transfers (EFTs)</span>
              <span className="text-xs text-emerald-700 font-bold">100% Transactions Matched to Driver Profiles</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Statement Date</th>
                    <th className="py-3 px-4">Bank Description / Ref</th>
                    <th className="py-3 px-4">Originating Bank</th>
                    <th className="py-3 px-4">Matched Courier</th>
                    <th className="py-3 px-4">Amount Deposited</th>
                    <th className="py-3 px-4 text-right">Recon Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {drivers.slice(0, 5).map((d, idx) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        2026-09-{16 - idx} 08:3{idx}:12
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        EFT-DEP {d.refNumber} {d.fullName.split(' ')[0]}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-600">
                        {idx % 3 === 0 ? 'Capitec Bank' : idx % 2 === 0 ? 'FNB App Pay' : 'Standard Bank'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {d.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">
                        +R{d.weeklyRate.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Matched</span>
                        </span>
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
      {/* MODAL: YOCO CONFIGURATION SETTINGS */}
      {/* ------------------------------------------------------------- */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-900" />
                <h3 className="font-black text-slate-900 text-base">Yoco Gateway Settings</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Operating Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, mode: 'sandbox' })}
                    className={`py-2 rounded-lg font-black text-xs border ${
                      settingsForm.mode === 'sandbox'
                        ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Sandbox (Test Mode)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, mode: 'live' })}
                    className={`py-2 rounded-lg font-black text-xs border ${
                      settingsForm.mode === 'live'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Live (Production)
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Sandbox Public Key</label>
                <input
                  type="text"
                  value={settingsForm.sandboxPublicKey}
                  onChange={(e) => setSettingsForm({ ...settingsForm, sandboxPublicKey: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Live Public Key (pk_live_...)</label>
                <input
                  type="text"
                  placeholder="pk_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={settingsForm.livePublicKey}
                  onChange={(e) => setSettingsForm({ ...settingsForm, livePublicKey: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoSendReceipt"
                  checked={settingsForm.autoSendWhatsAppReceipt}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoSendWhatsAppReceipt: e.target.checked })}
                  className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="autoSendReceipt" className="font-bold text-slate-800">
                  Automatically prompt WhatsApp Payment Receipt on charge
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateYocoSettings(settingsForm);
                    saveYocoSettings(settingsForm);
                    setIsSettingsModalOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: VIEW & PRINT CONTRACT */}
      {/* ------------------------------------------------------------- */}
      {previewAgreement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-black text-slate-900 text-lg uppercase tracking-tight">
                  Dynamic Rental Rent-to-Own Master Agreement
                </h3>
                <span className="text-xs font-mono text-cyan-700 font-bold">
                  Contract Ref: {previewAgreement.agreementNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAgreement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs text-slate-700 leading-relaxed max-h-96 overflow-y-auto pr-2">
              <p>
                This Commercial Rent-to-Own Motorcycle Agreement is entered between <strong>Dynamic Rental (Pty) Ltd</strong>, situated at 304 Tungsten Rd, Strijdom Park, Randburg, and the Driver <strong>{previewAgreement.driverName}</strong>.
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Motorcycle Asset Plate:</span>
                  <span className="font-mono font-bold text-slate-900">{previewAgreement.vehiclePlate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Weekly Installment:</span>
                  <span className="font-bold text-slate-900">R{previewAgreement.weeklyRateZar}.00 / week</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Contract Term:</span>
                  <span className="font-bold text-slate-900">{previewAgreement.termMonths} Months</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">Total Contract Value:</span>
                  <span className="font-bold text-slate-900">R{previewAgreement.totalContractValueZar.toLocaleString()}.00</span>
                </div>
              </div>

              <h4 className="font-bold text-slate-900 text-sm pt-2">Key Covenants & Conditions:</h4>
              <ul className="list-disc pl-5 space-y-1">
                <li>Installments are due every Monday morning via Yoco gateway or instant debit order.</li>
                <li>Motorcycle must remain inside the authorized Gauteng geofence territory.</li>
                <li>Mandatory servicing at 5,000 KM intervals at 304 Tungsten Rd workshop.</li>
                <li>Upon 100% completion of weekly payments, NATIS title papers will be transferred to the driver.</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md"
              >
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Print Official PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewAgreement(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
