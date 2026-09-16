import React, { useState } from 'react';
import { ActiveTab } from '../types';
import { COMPANY_DETAILS } from '../data/bikes';
import { DynamicRentalLogo } from './DynamicRentalLogo';
import { 
  Sparkles, 
  Search, 
  Menu, 
  X,
  MapPin
} from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  customLogoUrl?: string;
  pendingCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  customLogoUrl,
  pendingCount = 0,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHome = activeTab === 'home' || activeTab === 'fleet';
  const isAbout = activeTab === 'about';
  const isContact = activeTab === 'contact' || activeTab === 'location';
  const isApply = activeTab === 'apply';
  const isStatus = activeTab === 'status';

  const handleNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-black border-b border-slate-800 shadow-xl" id="app-header">
      {/* Top Banner Notice (Strydompark Randburg Location & Fast Track) */}
      <div className="bg-slate-900 border-b border-slate-800/80 text-slate-300 px-4 py-1 text-[11px] font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              ⚡ 2-MIN APPLICATION
            </span>
            <span className="text-slate-300 text-xs hidden sm:inline">
              Johannesburg & Randburg Rent-to-Own Motorbikes · Ride Today, Own Tomorrow!
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href={COMPANY_DETAILS.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
            >
              <MapPin className="w-3 h-3 text-cyan-400" />
              <span className="hidden md:inline">304 Tungsten Rd, Strydompark</span>
              <span className="md:hidden">Strydompark</span>
            </a>
            <span className="text-slate-700">|</span>
            <button
              type="button"
              onClick={() => handleNavClick('status')}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
              <Search className="w-3 h-3 text-amber-400" />
              <span>Track Application</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar Matching dynamicrental.info Screenshot */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 cursor-pointer group shrink-0 py-0.5"
          id="brand-logo-btn"
        >
          <DynamicRentalLogo
            customLogoUrl={customLogoUrl}
            size="md"
          />
        </div>

        {/* Desktop Navigation Links: HOME, HOW DYNAMIC RENTAL WORKS (ABOUT), CONTACT US TODAY, -- APPLY NOW <2MIN -- */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2" id="main-nav-tabs">
          <button
            type="button"
            id="nav-tab-home"
            onClick={() => handleNavClick('home')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              isHome
                ? 'text-white bg-slate-900 border border-slate-700 shadow-xs ring-1 ring-cyan-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            HOME
          </button>

          <button
            type="button"
            id="nav-tab-about"
            onClick={() => handleNavClick('about')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              isAbout
                ? 'text-white bg-slate-900 border border-slate-700 shadow-xs ring-1 ring-cyan-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            HOW DYNAMIC RENTAL WORKS
          </button>

          <button
            type="button"
            id="nav-tab-contact"
            onClick={() => handleNavClick('contact')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
              isContact
                ? 'text-white bg-slate-900 border border-slate-700 shadow-xs ring-1 ring-cyan-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            CONTACT US TODAY
          </button>

          {/* Primary CTA: -- APPLY NOW <2MIN -- */}
          <button
            type="button"
            id="nav-tab-apply"
            onClick={() => handleNavClick('apply')}
            className={`ml-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5 ${
              isApply
                ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-300 shadow-cyan-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 hover:shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>-- APPLY NOW &lt;2MIN --</span>
          </button>
        </nav>

        {/* Mobile Menu Toggle Button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => handleNavClick('apply')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-black bg-cyan-400 text-slate-950 shadow-xs"
          >
            Apply &lt;2m
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-t border-slate-800 px-4 py-4 space-y-2 text-xs">
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase ${
              isHome ? 'bg-slate-900 text-cyan-400' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            HOME (Bikes & Pricing)
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('about')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase ${
              isAbout ? 'bg-slate-900 text-cyan-400' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            HOW DYNAMIC RENTAL WORKS
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('contact')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase ${
              isContact ? 'bg-slate-900 text-cyan-400' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            CONTACT US TODAY
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('status')}
            className={`w-full text-left px-4 py-3 rounded-xl font-bold uppercase ${
              isStatus ? 'bg-slate-900 text-cyan-400' : 'text-slate-300 hover:bg-slate-900'
            }`}
          >
            TRACK MY APPLICATION STATUS
          </button>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleNavClick('apply')}
              className="w-full py-3.5 rounded-xl font-black bg-cyan-400 text-slate-950 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>-- APPLY NOW &lt;2MIN --</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
