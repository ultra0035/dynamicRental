import React from 'react';
import { ActiveTab } from '../types';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  Bike, 
  Search, 
  MapPin, 
  PhoneCall, 
  MessageSquare,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  pendingCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm" id="app-header">
      {/* Top Banner Notice - Dynamic Rental Blue Touch */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 text-white px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
              ⚡ 2-MIN FAST-TRACK
            </span>
            <span className="font-semibold text-white/95">Rent-to-own delivery bikes in Randburg & JHB · Ride Today, Own Tomorrow!</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <a 
              href={COMPANY_DETAILS.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">304 Tungsten Rd, Strijdom Park</span>
              <span className="sm:hidden">Randburg</span>
            </a>
            <span className="text-white/40">|</span>
            <a
              href={COMPANY_DETAILS.whatsappDirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-cyan-100 hover:text-white font-mono transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{COMPANY_DETAILS.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('apply')}
          className="flex items-center gap-3 cursor-pointer group"
          id="brand-logo-btn"
        >
          {/* Stylized Dynamic Rental Logo Icon */}
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all">
            <div className="flex flex-col items-center justify-center leading-none">
              <span className="text-white font-black text-lg tracking-tighter font-mono">D</span>
              <span className="text-cyan-300 font-extrabold text-xs tracking-wider -mt-1 font-mono">R</span>
            </div>
            {/* Speed dot */}
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-cyan-400 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-blue-700 rounded-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                DYNAMIC RENTAL
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                RANDBURG
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Ride Today. Own Tomorrow. 🏍️
            </p>
          </div>
        </div>

        {/* Action Tabs: Bikes and Pricing, Apply Now, Track Status */}
        <nav className="flex items-center gap-2 sm:gap-3" id="main-nav-tabs">
          <button
            type="button"
            id="nav-tab-fleet"
            onClick={() => setActiveTab('fleet')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'fleet'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 border border-transparent'
            }`}
          >
            <Bike className="w-4 h-4 text-blue-600" />
            <span>Bikes & Pricing</span>
          </button>

          <button
            type="button"
            id="nav-tab-status"
            onClick={() => setActiveTab('status')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'status'
                ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs'
                : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 border border-transparent'
            }`}
          >
            <Search className="w-4 h-4 text-amber-500" />
            <span>Track Status</span>
          </button>

          {/* Primary Apply Now Button */}
          <button
            type="button"
            id="nav-tab-apply"
            onClick={() => setActiveTab('apply')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all shadow-md ${
              activeTab === 'apply'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-blue-500/25 ring-2 ring-blue-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-blue-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-200" />
            <span>Apply Now</span>
            <span className="hidden sm:inline text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono text-white">
              &lt;2min
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
