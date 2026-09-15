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
  PhoneCall
} from 'lucide-react';

interface BikeCatalogProps {
  bikes: Bike[];
  onSelectBikeForApplication: (bikeId: string, condition: BikeCondition, termMonths: number) => void;
}

export const BikeCatalog: React.FC<BikeCatalogProps> = ({ 
  bikes,
  onSelectBikeForApplication 
}) => {
  const [selectedCondition, setSelectedCondition] = useState<BikeCondition>('new');
  const [selectedBikeForCalc, setSelectedBikeForCalc] = useState<string>(bikes[0]?.id || 'bajaj-boxer-150');
  const [estWeeklyGross, setEstWeeklyGross] = useState<number>(4500);

  const activeCalcBike = bikes.find((b) => b.id === selectedBikeForCalc) || bikes[0];
  const isElectric = activeCalcBike?.category === 'electric';
  const bikeWeeklyCost = selectedCondition === 'new' ? 750 : 650;
  const bikeDeposit = selectedCondition === 'new' ? 1000 : 650;
  const estFuelCost = isElectric ? 120 : 380; // electricity swap vs petrol per week
  const netWeeklyEarnings = Math.max(0, estWeeklyGross - bikeWeeklyCost - estFuelCost);
  const netMonthlyEarnings = netWeeklyEarnings * 4.33;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-10" id="bike-catalog-section">
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <Coins className="w-3.5 h-3.5" />
            <span>TRANSPARENT RENT-TO-OWN FLEET</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Rent Today. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Own Tomorrow.</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl font-normal">
            Choose your motorbike, apply online in under 2 minutes, and start delivering for Checkers Sixty60, Uber Eats, Takealot, or Mr D in Randburg.
          </p>
        </div>

        {/* Global Condition Toggle */}
        <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 self-start md:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setSelectedCondition('new')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              selectedCondition === 'new'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Brand New (R750/wk)</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCondition('used')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              selectedCondition === 'used'
                ? 'bg-cyan-700 text-white shadow-md shadow-cyan-600/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pre-Owned (R650/wk)</span>
          </button>
        </div>
      </div>

      {/* Official WhatsApp Pricing Reference Highlight Box */}
      <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 rounded-2xl border border-blue-200/80 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shadow-sm">
        <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Weekly Payments</div>
            <div className="text-base font-black text-slate-900">R750 <span className="text-xs font-normal text-slate-500">New</span> | R650 <span className="text-xs font-normal text-slate-500">Used</span></div>
            <p className="text-[11px] text-blue-700 font-medium">Payable weekly while you earn</p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-amber-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Contract Deposit</div>
            <div className="text-base font-black text-slate-900">R1,000 <span className="text-xs font-normal text-slate-500">New</span> | R650 <span className="text-xs font-normal text-slate-500">Used</span></div>
            <p className="text-[11px] text-amber-700 font-medium">Payable at contract signing</p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-emerald-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Ownership Terms</div>
            <div className="text-base font-black text-slate-900">15, 18 or 20 Months</div>
            <p className="text-[11px] text-emerald-700 font-medium">100% full bike ownership transfer</p>
          </div>
        </div>

        <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-cyan-100 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Randburg Showroom</div>
            <div className="text-xs font-bold text-slate-900 leading-snug">304 Tungsten Rd, Strijdom Park</div>
            <p className="text-[11px] text-cyan-700 font-medium">Same-day pickup after approval</p>
          </div>
        </div>
      </div>

      {/* Bike Fleet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="bike-grid">
        {bikes.map((bike) => {
          const isSelected = selectedBikeForCalc === bike.id;
          const isComing = bike.isComingSoon;
          const weeklyRate = selectedCondition === 'new' 
            ? (bike.pricing?.new?.weeklyPayment || 750) 
            : (bike.pricing?.used?.weeklyPayment || 650);
          const depositRate = selectedCondition === 'new' 
            ? (bike.pricing?.new?.deposit || 1000) 
            : (bike.pricing?.used?.deposit || 650);
          const termLabel = bike.category === 'electric' 
            ? '20 Months' 
            : selectedCondition === 'new' 
              ? '15 or 18 Months' 
              : '20 Months';

          return (
            <div
              key={bike.id}
              id={`bike-card-${bike.id}`}
              className={`rounded-2xl border transition-all flex flex-col overflow-hidden relative group bg-white ${
                isSelected
                  ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                  : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              {/* Image Container with Badge */}
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={bike.image}
                  alt={bike.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Top Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-blue-700 shadow-sm border border-blue-100">
                    {bike.brand}
                  </span>
                  {bike.badge && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase shadow-sm ${
                      isComing 
                        ? 'bg-amber-400 text-slate-950 font-black' 
                        : 'bg-emerald-500 text-white font-bold'
                    }`}>
                      {bike.badge}
                    </span>
                  )}
                </div>

                {/* Fuel / Power Tag */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 backdrop-blur-md text-slate-900 border border-slate-200 shadow-sm">
                  {bike.category === 'electric' ? (
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>{bike.engineCapacity}</span>
                </div>
              </div>

              {/* Content Body */}
              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    {bike.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{bike.subtitle}</p>

                  {/* Pricing Box */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-medium text-slate-600">Weekly Rent-to-Own:</span>
                      <span className="text-lg font-black text-blue-600">
                        R{weeklyRate}<span className="text-xs font-normal text-slate-500">/wk</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                      <span className="text-slate-500">Deposit at Signing:</span>
                      <span className="font-bold text-amber-700 font-mono">R{depositRate}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Term to Ownership:</span>
                      <span className="font-semibold text-slate-700">{termLabel}</span>
                    </div>
                  </div>

                  {/* Bullet Highlights */}
                  <div className="mt-4 flex flex-col gap-2">
                    {bike.keyFeatures.slice(0, 3).map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBikeForCalc(bike.id)}
                    className={`w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Viewing in Calculator' : 'Calculate Profit'}</span>
                  </button>

                  {isComing ? (
                    <button
                      type="button"
                      onClick={() => onSelectBikeForApplication(bike.id, selectedCondition, 18)}
                      className="w-full py-2.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Join Priority Waitlist</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const defaultTerm = bike.category === 'electric' 
                          ? 20 
                          : selectedCondition === 'new' ? 18 : 20;
                        onSelectBikeForApplication(bike.id, selectedCondition, defaultTerm);
                      }}
                      className="w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Apply For This Bike</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Delivery Courier Earnings & Profit Calculator */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl relative overflow-hidden" id="roi-calculator">
        <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider mb-2">
          <Calculator className="w-4 h-4" />
          <span>Rider Cashflow & Take-Home Profit Estimator</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
          Calculate Your Weekly Take-Home Earnings in Randburg
        </h2>
        <p className="text-slate-600 text-sm max-w-2xl mb-8">
          See how much you take home after weekly rent-to-own installments and operating expenses while delivering on Checkers Sixty60, Uber Eats, Takealot or Mr D.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            {/* Bike Selection in Calc */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-2 block">
                1. Select Motorbike Model:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {bikes.filter(b => !b.isComingSoon).map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBikeForCalc(b.id)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      selectedBikeForCalc === b.id
                        ? 'bg-blue-50 border-blue-500 text-blue-900 font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black truncate">{b.name}</div>
                    <div className="text-[11px] text-blue-600 font-mono mt-0.5">
                      {b.category === 'electric' ? 'Electric' : 'Petrol 150cc'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 mb-2 block">
                2. Bike Condition:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedCondition('new')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                    selectedCondition === 'new'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Brand New</div>
                    <div className="text-[11px] text-slate-500">15 or 18 Mo. Term</div>
                  </div>
                  <span className="text-sm font-black text-blue-600">R750/wk</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCondition('used')}
                  className={`p-3 rounded-xl border text-left flex items-center justify-between ${
                    selectedCondition === 'used'
                      ? 'bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">Pre-Owned (Used)</div>
                    <div className="text-[11px] text-slate-500">20 Mo. Term</div>
                  </div>
                  <span className="text-sm font-black text-cyan-700">R650/wk</span>
                </button>
              </div>
            </div>

            {/* Gross Weekly Revenue Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700">
                  3. Expected Weekly Delivery Gross Pay:
                </label>
                <span className="text-base font-black text-blue-600 font-mono">
                  R{estWeeklyGross.toLocaleString()} / week
                </span>
              </div>
              <input
                type="range"
                min="2000"
                max="8000"
                step="250"
                value={estWeeklyGross}
                onChange={(e) => setEstWeeklyGross(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono font-medium">
                <span>R2,000 (Part time)</span>
                <span>R4,500 (Avg Courier)</span>
                <span>R8,000 (High Volume)</span>
              </div>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="lg:col-span-6 bg-slate-50 rounded-2xl border border-blue-200 p-6 flex flex-col justify-between gap-6 shadow-sm">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase">Weekly Breakdown</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                  {activeCalcBike?.name} ({selectedCondition.toUpperCase()})
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex justify-between text-slate-700">
                  <span>Gross Delivery Earnings:</span>
                  <span className="font-bold text-slate-900 font-mono">+R{estWeeklyGross.toLocaleString()}</span>
                </div>

                <div className="flex justify-between text-rose-600">
                  <span>Bike Rent-to-Own Installment:</span>
                  <span className="font-bold font-mono">-R{bikeWeeklyCost}</span>
                </div>

                <div className="flex justify-between text-amber-700">
                  <span>Estimated {isElectric ? 'Battery Charging / Swap' : 'Petrol (11L Tank)'}:</span>
                  <span className="font-bold font-mono">-R{estFuelCost}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Tracker & Anti-Theft GPS:</span>
                  <span className="font-bold text-emerald-600 font-mono">INCLUDED</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>Deposit Due at Signing:</span>
                  <span className="font-bold text-amber-800 font-mono">R{bikeDeposit}</span>
                </div>
              </div>

              {/* Net Total Box */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md">
                <div className="text-xs font-semibold text-emerald-100 mb-1">
                  Estimated Net Take-Home In Your Pocket:
                </div>
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black font-mono">
                      R{Math.round(netWeeklyEarnings).toLocaleString()}
                    </span>
                    <span className="text-xs font-medium text-emerald-100 ml-1">/ week</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-emerald-100">Monthly Approx:</div>
                    <div className="text-sm font-black font-mono">
                      ~R{Math.round(netMonthlyEarnings).toLocaleString()}/mo
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const term = activeCalcBike?.category === 'electric' 
                  ? 20 
                  : selectedCondition === 'new' ? 18 : 20;
                onSelectBikeForApplication(activeCalcBike.id, selectedCondition, term);
              }}
              className="w-full py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Apply for {activeCalcBike?.name} Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
