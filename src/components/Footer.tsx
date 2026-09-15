import React from 'react';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Clock, 
  ExternalLink,
  Sparkles,
  Lock,
  Github,
  ArrowUp,
  Globe
} from 'lucide-react';

interface FooterProps {
  onOpenAdminLogin: () => void;
  onOpenGitHubModal?: () => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ 
  onOpenAdminLogin,
  onOpenGitHubModal,
  isAdminLoggedIn = false,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full flex flex-col" id="app-footer">
      {/* Main Teal/Cyan Blue Footer Strip Matching dynamicrental.info Screenshot 2 */}
      <div className="bg-[#4e8e95] text-slate-950 py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-5">
          {/* Facebook Icon in Solid Circle */}
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-slate-950 hover:bg-slate-800 text-white flex items-center justify-center transition-transform hover:scale-110 shadow-md"
            aria-label="Dynamic Rental Facebook"
          >
            <svg
              className="w-5 h-5 fill-current"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>

          {/* Business Title */}
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
              Dynamic Rental
            </h3>
            <p className="text-sm font-semibold text-slate-900 mt-2 max-w-xl">
              304 Tungsten Road, Strydompark, Johannesburg, 2169, South Africa
            </p>
          </div>

          {/* Telephone */}
          <div>
            <a
              href={`tel:${COMPANY_DETAILS.phone}`}
              className="text-lg sm:text-xl font-black text-slate-950 hover:text-white transition-colors font-mono"
            >
              071 054 2015
            </a>
          </div>

          {/* Copyright Notice Matching Screenshot */}
          <div className="pt-2 text-xs font-semibold text-slate-900/90">
            Copyright © {new Date().getFullYear()} Dynamic Rental - All Rights Reserved.
          </div>
        </div>
      </div>

      {/* Secondary Bottom Staff & Deployment Bar (Deep Slate Black) */}
      <div className="bg-slate-950 text-slate-400 py-4 px-4 sm:px-6 border-t border-slate-900 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Rent-to-Own Platform · Randburg Showroom Hub</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Admin Portal Toggle */}
            <button
              type="button"
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-colors"
              id="footer-admin-btn"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAdminLoggedIn ? 'Staff Portal (Active)' : 'Staff Admin Login'}</span>
            </button>

            {/* Vercel / GitHub Export helper */}
            {onOpenGitHubModal && (
              <button
                type="button"
                onClick={onOpenGitHubModal}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-colors"
                id="footer-deploy-btn"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Deploy to Vercel</span>
              </button>
            )}

            {/* Back to Top */}
            <button
              type="button"
              onClick={scrollToTop}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              title="Scroll to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
