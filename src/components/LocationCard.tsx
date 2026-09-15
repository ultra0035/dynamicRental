import React from 'react';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  MapPin, 
  Phone, 
  Clock, 
  MessageSquare, 
  Navigation, 
  Bike,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface LocationCardProps {
  onApplyNow: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({ onApplyNow }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8" id="location-showroom-section">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>RANDBURG SHOWROOM & COLLECTION HUB</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Visit Dynamic Rental in Strijdom Park
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Collect your approved delivery motorbike, sign your lease agreement, or get assistance with your application in person.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Info Cards */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Main Address Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Dealership Address</h3>
                <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
                  {COMPANY_DETAILS.address}
                </p>
                <span className="inline-block mt-1 text-[11px] text-blue-600 font-semibold">
                  (Just off Malibongwe Drive · Strijdom Park Commercial Park)
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-wrap gap-2">
              <a
                href={COMPANY_DETAILS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Open in Google Maps</span>
              </a>

              <a
                href={COMPANY_DETAILS.whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Dealership</span>
              </a>
            </div>
          </div>

          {/* Business Hours Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-md flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Opening & Handover Hours</h3>
                <p className="text-xs text-slate-500">Walk-ins and scheduled collections welcome</p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between">
                <span>Monday – Friday:</span>
                <span className="font-bold text-slate-900 font-mono">08:00 – 17:00</span>
              </div>
              <div className="flex justify-between">
                <span>Saturday:</span>
                <span className="font-bold text-slate-900 font-mono">08:30 – 13:00</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sunday & Public Holidays:</span>
                <span className="font-mono font-medium">Closed</span>
              </div>
            </div>
          </div>

          {/* Quick Helpline */}
          <div className="p-5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
            <div>
              <div className="text-xs text-blue-700 font-bold uppercase">Direct Hotline & WhatsApp</div>
              <div className="text-lg font-black text-slate-900 font-mono">{COMPANY_DETAILS.phoneDisplay}</div>
            </div>
            <a
              href={`tel:${COMPANY_DETAILS.phone}`}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Now</span>
            </a>
          </div>
        </div>

        {/* Right: Handover Guide & Checklist */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col justify-between gap-6 shadow-md">
          <div>
            <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider mb-2">
              <Bike className="w-4 h-4" />
              <span>Collection Day Checklist</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              What to Bring on Handover Day
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              When your application is approved, visit 304 Tungsten Rd, Strijdom Park to collect your bike.
            </p>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </div>
                <div>
                  <strong className="text-slate-900 block font-bold">Deposit Payment:</strong>
                  <span className="text-slate-600">
                    R1,000 for Brand New bikes or R650 for Pre-Owned bikes. Payable via Instant EFT or Cash when signing the contract.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  <strong className="text-slate-900 block font-bold">Original Identity Documents:</strong>
                  <span className="text-slate-600">
                    Original Smart ID Card (South Africans) or Original Passport + Valid Work Permit/Asylum.
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </div>
                <div>
                  <strong className="text-slate-900 block font-bold">Driver License & TRN (if foreign):</strong>
                  <span className="text-slate-600">
                    Original driving license card and official Traffic Register (TRN) certificate for foreign license holders.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onApplyNow}
            className="w-full py-4 rounded-2xl font-black text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Online in Under 2 Mins</span>
          </button>
        </div>
      </div>
    </div>
  );
};
