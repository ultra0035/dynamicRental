import React from 'react';
import { COMPANY_DETAILS } from '../data/bikes';
import { ActiveTab } from '../types';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Github, 
  Lock, 
  Bike,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface FooterProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAdminLogin: () => void;
  onOpenGitHubModal: () => void;
  isAdminLoggedIn: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdminLogin,
  onOpenGitHubModal,
  isAdminLoggedIn,
}) => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 px-4 sm:px-6 text-xs text-slate-600 mt-auto" id="app-footer">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
        {/* Brand & Address Column */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-md">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              DR
            </div>
            <span className="text-slate-900 font-black text-base tracking-tight">DYNAMIC RENTAL</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              RANDBURG
            </span>
          </div>

          <p className="text-slate-600 mt-2 text-xs leading-relaxed">
            The leading rent-to-own motorbike platform for delivery couriers in Randburg & Greater Johannesburg. Apply in under 2 minutes, verify docs, and ride away to earn.
          </p>

          <div className="mt-3 flex flex-col gap-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>{COMPANY_DETAILS.address}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>{COMPANY_DETAILS.phoneDisplay} (Mon–Sat)</span>
            </span>
          </div>
        </div>

        {/* Quick Rider Links */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">Rider Navigation</h4>
          <button
            type="button"
            onClick={() => {
              setActiveTab('apply');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-blue-600 transition-colors ${activeTab === 'apply' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
          >
            Apply for Bike (&lt;2 Mins)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('fleet');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-blue-600 transition-colors ${activeTab === 'fleet' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
          >
            Bikes & Pricing (Boxer / Big Boy / Electric)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('status');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-blue-600 transition-colors ${activeTab === 'status' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
          >
            Track Application Status
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('location');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`hover:text-blue-600 transition-colors ${activeTab === 'location' ? 'text-blue-600 font-bold' : 'text-slate-600'}`}
          >
            Showroom Directions
          </button>
        </div>

        {/* Dealership Admin & Tools Column */}
        <div className="flex flex-col items-center md:items-start gap-2.5">
          <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-1">Staff & Management</h4>
          
          {/* Admin Portal Login Button */}
          <button
            type="button"
            onClick={onOpenAdminLogin}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-2 transition-all shadow-xs"
            id="footer-admin-login-btn"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isAdminLoggedIn ? 'Staff Portal (Unlocked)' : 'Admin Portal Login'}</span>
          </button>

          {/* Vercel & GitHub Deploy Helper */}
          <button
            type="button"
            onClick={onOpenGitHubModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 flex items-center gap-2 transition-all shadow-xs"
            id="footer-github-btn"
          >
            <Github className="w-3.5 h-3.5" />
            <span>Deploy to Vercel / GitHub</span>
          </button>

          <a
            href={COMPANY_DETAILS.whatsappDirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-700 font-semibold hover:text-emerald-800 transition-colors pt-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Direct WhatsApp Helpline</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto text-center mt-10 pt-6 border-t border-slate-100 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>© {new Date().getFullYear()} {COMPANY_DETAILS.legalName}. All rights reserved. Randburg, Gauteng, South Africa.</span>
        <span className="text-slate-400">Boxer 150 · Big Boy Velocity · GreenWay Electric · Hero Dawn</span>
      </div>
    </footer>
  );
};
