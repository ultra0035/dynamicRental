import React from 'react';
import { MessageSquare } from 'lucide-react';
import { COMPANY_DETAILS } from '../data/bikes';

export const WhatsAppFloatingButton: React.FC = () => {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      <a
        href={COMPANY_DETAILS.whatsappDirectUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg shadow-emerald-600/30 font-black text-xs sm:text-sm transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-emerald-400"
        id="floating-whatsapp-btn"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5 fill-white" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-ping" />
        </div>
        <div className="flex flex-col text-left leading-tight">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-100">
            WhatsApp Dynamic Rental
          </span>
          <span className="font-mono text-xs text-white">{COMPANY_DETAILS.phoneDisplay}</span>
        </div>
      </a>
    </div>
  );
};
