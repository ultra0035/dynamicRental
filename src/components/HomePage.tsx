import React, { useState } from 'react';
import { Bike, BikeCondition } from '../types';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  Check, 
  Sparkles, 
  Fuel, 
  Zap, 
  Shield, 
  Clock, 
  ArrowRight, 
  DollarSign, 
  Calculator, 
  Coins,
  CheckCircle2,
  PhoneCall,
  Image as ImageIcon,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface HomePageProps {
  bikes: Bike[];
  heroImageUrl: string;
  onOpenHeroModal?: () => void;
  onSelectBikeForApplication: (bikeId: string, condition: BikeCondition, termMonths: number) => void;
  onApplyNow: () => void;
  onLearnMore: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  bikes,
  heroImageUrl,
  onSelectBikeForApplication,
  onApplyNow,
  onLearnMore,
}) => {
  const [selectedCondition, setSelectedCondition] = useState<BikeCondition>('new');
  const [selectedBikeForCalc, setSelectedBikeForCalc] = useState<string>(bikes[0]?.id || 'bajaj-boxer-150');
  const [estWeeklyGross, setEstWeeklyGross] = useState<number>(4500);

  const activeCalcBike = bikes.find((b) => b.id === selectedBikeForCalc) || bikes[0];
  const isElectric = activeCalcBike?.category === 'electric';
  const bikeWeeklyCost = selectedCondition === 'new' ? 750 : 650;
  const bikeDeposit = selectedCondition === 'new' ? 1000 : 650;
  const estFuelCost = isElectric ? 120 : 380;
  const netWeeklyEarnings = Math.max(0, estWeeklyGross - bikeWeeklyCost - estFuelCost);
  const netMonthlyEarnings = netWeeklyEarnings * 4.33;

  return (
    <div className="flex flex-col gap-12 sm:gap-16 pb-12" id="home-bike-pricing-page">
      {/* 1. HERO SECTION (With Customizable Image) */}
      <section className="relative bg-black text-white overflow-hidden border-b border-slate-800" id="hero-section">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 flex flex-col items-start gap-5 z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>DYNAMIC RENTAL · RANDBURG, JOHANNESBURG</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.08] font-sans">
                RIDE TODAY. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                  OWN TOMORROW.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Rent-to-own delivery motorbikes with transparent weekly payments for Sixty60, Uber Eats, Takealot & Mr D couriers. <strong>No credit bureau checks. Deposit payable on collection.</strong>
              </p>

              {/* Quick Pricing Highlights Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg pt-1">
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 backdrop-blur-xs">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Brand New Bikes</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">R750<span className="text-xs text-slate-400 font-normal">/wk</span></span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">R1,000 deposit</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 backdrop-blur-xs">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Pre-Owned Stock</span>
                  <span className="text-lg font-black text-white font-mono">R650<span className="text-xs text-slate-400 font-normal">/wk</span></span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">R650 deposit</span>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 backdrop-blur-xs flex flex-col justify-center">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Fast Approval</span>
                  <span className="text-base font-black text-emerald-400">&lt; 24 Hours</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">2-Min Digital Form</span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onApplyNow}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>-- APPLY NOW &lt;2MIN --</span>
                </button>

                <a
                  href="#fleet-catalog-section"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 flex items-center justify-center gap-2 transition-colors"
                >
                  <span>View Fleet & Pricing</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </a>

                <a
                  href={`tel:${COMPANY_DETAILS.phone}`}
                  className="text-xs text-slate-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 px-3 py-2 transition-colors"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Call: {COMPANY_DETAILS.phoneDisplay}</span>
                </a>
              </div>
            </div>

            {/* Right Column: Hero Image with Interactive "Insert / Change Image" Control */}
            <div className="lg:col-span-5 relative group">
              <div className="relative rounded-3xl overflow-hidden border border-slate-700 bg-slate-900 shadow-2xl shadow-cyan-950/40">
                {/* Hero Image */}
                <div className="aspect-4/3 w-full overflow-hidden bg-slate-950">
                  <img
                    src={heroImageUrl}
                    alt="Dynamic Rental Delivery Motorbike"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                {/* Image Footer Info */}
                <div className="absolute bottom-0 inset-x-0 p-5 flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Johannesburg Fleet Ready
                    </span>
                    <span className="text-base font-black text-white">
                      Bajaj Boxer 150 HD &amp; Big Boy Delivery
                    </span>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Fitted with heavy-duty carrier for insulated delivery boxes
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating Trust Badge */}
              <div className="absolute -bottom-4 -left-4 bg-slate-900/95 border border-cyan-500/40 rounded-2xl px-4 py-2.5 shadow-xl backdrop-blur-md hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Deposit on Collection</div>
                  <div className="text-[10px] text-slate-400">304 Tungsten Rd, Strydompark</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BIKE & PRICING CATALOG SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 w-full flex flex-col gap-10" id="fleet-catalog-section">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 mb-2">
              <Coins className="w-3.5 h-3.5 text-cyan-600" />
              <span>TRANSPARENT RENT-TO-OWN FLEET</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Motorbikes & Weekly Pricing
            </h2>
            <p className="text-slate-600 text-xs sm:text-sm mt-1 max-w-2xl font-normal">
              Choose Brand New or Pre-Owned. Every bike is fully serviced, fitted for delivery boxes, and available on rent-to-own terms.
            </p>
          </div>

          {/* Condition Switcher */}
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedCondition('new')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                selectedCondition === 'new'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Brand New (R750/wk)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedCondition('used')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                selectedCondition === 'used'
                  ? 'bg-cyan-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pre-Owned (R650/wk)</span>
            </button>
          </div>
        </div>

        {/* Fleet Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {bikes.map((bike) => {
            const pricing = selectedCondition === 'new' ? bike.pricing.new : bike.pricing.used;
            const termDisplay = selectedCondition === 'new' 
              ? `${bike.pricing.new.termMonthsOptions?.join(' or ')} Months`
              : `${bike.pricing.used.termMonths} Months`;

            return (
              <div
                key={bike.id}
                className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
                  bike.isAvailable ? 'border-slate-200 hover:border-cyan-400' : 'border-slate-200 opacity-80'
                }`}
              >
                <div>
                  {/* Bike Image Container */}
                  <div className="relative aspect-16/10 bg-slate-900 overflow-hidden group">
                    <img
                      src={bike.image}
                      alt={bike.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    {bike.badge && (
                      <span className="absolute top-3 left-3 px-3 py-1 text-[11px] font-bold rounded-full bg-slate-900/90 text-cyan-300 border border-slate-700 backdrop-blur-xs">
                        {bike.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 text-[10px] font-extrabold uppercase rounded-lg bg-black/80 text-white backdrop-blur-xs font-mono">
                      {bike.fuelType}
                    </span>
                  </div>

                  {/* Bike Details */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-xs font-bold text-cyan-700 uppercase tracking-wider">{bike.brand}</div>
                      <h3 className="text-xl font-black text-slate-900 mt-0.5">{bike.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{bike.subtitle}</p>
                    </div>

                    {/* Pricing Box */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Weekly Rental</span>
                        <div className="text-2xl font-black text-slate-900 font-mono">
                          R{pricing.weeklyPayment}
                          <span className="text-xs font-normal text-slate-500"> /week</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Term & Deposit</span>
                        <div className="text-xs font-bold text-slate-800">{termDisplay}</div>
                        <span className="text-[11px] font-semibold text-emerald-700">R{pricing.deposit} Deposit</span>
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {bike.keyFeatures.slice(0, 3).map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-6 pt-0">
                  <button
                    type="button"
                    onClick={() => {
                      const term = selectedCondition === 'new' ? (bike.pricing.new.termMonthsOptions[0] || 18) : bike.pricing.used.termMonths;
                      onSelectBikeForApplication(bike.id, selectedCondition, term);
                    }}
                    className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
                      bike.isAvailable
                        ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-cyan-500/10'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{bike.isAvailable ? 'Apply For This Bike' : 'Coming Soon'}</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. EARNINGS CALCULATOR & PROFIT SIMULATOR */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Calculator className="w-3.5 h-3.5 text-cyan-400" />
              <span>COURIER PROFIT ESTIMATOR</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              How Much Will You Take Home?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Calculate your weekly and monthly net profit after rent-to-own deductions and fuel while delivering on Sixty60, Uber Eats, Takealot, or Mr D.
            </p>

            {/* Slider */}
            <div className="pt-2">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-400 font-medium">Estimated Weekly Gross Orders:</span>
                <span className="text-cyan-300 font-bold font-mono text-sm">R{estWeeklyGross.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="8000"
                step="250"
                value={estWeeklyGross}
                onChange={(e) => setEstWeeklyGross(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>R2,000/wk (Part-time)</span>
                <span>R5,000/wk (Average)</span>
                <span>R8,000/wk (Top Earner)</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-800/80 rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Weekly Gross</span>
                <span className="text-base font-bold text-white font-mono">R{estWeeklyGross}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Bike Rent-To-Own</span>
                <span className="text-base font-bold text-rose-400 font-mono">-R{bikeWeeklyCost}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-cyan-300 uppercase block">Estimated Net Take-Home Profit</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  R{netWeeklyEarnings.toLocaleString()}
                  <span className="text-xs font-normal text-slate-300"> /week</span>
                </span>
                <span className="text-xs text-cyan-200 block mt-0.5">
                  (~R{Math.round(netMonthlyEarnings).toLocaleString()} /month in your pocket)
                </span>
              </div>
              <button
                type="button"
                onClick={onApplyNow}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-colors shadow-md flex items-center gap-1"
              >
                <span>Apply</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
