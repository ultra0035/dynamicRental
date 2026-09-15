import React, { useState } from 'react';
import { RiderApplication, ApplicationStatus } from '../types';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  MapPin, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  Phone, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StatusTrackerProps {
  applications: RiderApplication[];
  initialSearchQuery?: string;
  onApplyNew: () => void;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  applications,
  initialSearchQuery = '',
  onApplyNew,
}) => {
  const [query, setQuery] = useState<string>(initialSearchQuery);
  const [searched, setSearched] = useState<boolean>(Boolean(initialSearchQuery));

  const cleanQuery = query.trim().toLowerCase();
  const matchedApp = applications.find(
    (app) =>
      app.refNumber.toLowerCase() === cleanQuery ||
      app.phone.replace(/\s+/g, '').includes(cleanQuery.replace(/\s+/g, '')) ||
      app.idOrPassportNumber.toLowerCase() === cleanQuery
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'approved_for_collection':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved · Ready for Bike Collection
          </span>
        );
      case 'docs_verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Documents Verified
          </span>
        );
      case 'needs_more_info':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            Action Required · Missing Document / TRN
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shadow-xs">
            <XCircle className="w-3.5 h-3.5" />
            Application Declined
          </span>
        );
      case 'contract_signed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-xs">
            <FileText className="w-3.5 h-3.5" />
            Active Rent-to-Own Contract
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-300 shadow-xs animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            Under Verification Review
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8" id="status-tracker-page">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-3">
          <Search className="w-3.5 h-3.5" />
          <span>LIVE APPLICATION TRACKER</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Track Your Application Status
        </h1>
        <p className="text-slate-600 text-sm mt-1 font-normal">
          Enter your Reference Number (e.g. <strong>DR-9482-JHB</strong>) or contact phone number to check your verification and bike collection schedule.
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full" id="search-status-form">
        <div className="relative flex items-center shadow-md rounded-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Reference Number (e.g. DR-9482-JHB) or Phone"
            className="w-full bg-white border-2 border-slate-200 focus:border-blue-500 rounded-2xl pl-12 pr-32 py-4 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
          <button
            type="submit"
            className="absolute right-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow transition-all"
          >
            Check Status
          </button>
        </div>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-3 text-xs text-slate-500">
          <span>Try quick sample:</span>
          {applications.slice(0, 3).map((app) => (
            <button
              key={app.id}
              type="button"
              onClick={() => {
                setQuery(app.refNumber);
                setSearched(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 font-mono text-[11px] shadow-xs"
            >
              {app.refNumber} ({app.fullName.split(' ')[0]})
            </button>
          ))}
        </div>
      </form>

      {/* Results View */}
      {searched && (
        <div className="mt-4">
          {matchedApp ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl flex flex-col gap-6" id="matched-app-result">
              {/* Top Details Card */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-black text-slate-900">{matchedApp.fullName}</span>
                    <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                      {matchedApp.refNumber}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Applied on: {new Date(matchedApp.createdAt).toLocaleDateString('en-ZA', { dateStyle: 'long' })} · Delivery Platform: {matchedApp.primaryPlatform}
                  </div>
                </div>

                <div>
                  {getStatusBadge(matchedApp.status)}
                </div>
              </div>

              {/* Lease Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Motorbike Model:</span>
                  <span className="font-bold text-slate-900 text-sm">{matchedApp.bikeName}</span>
                  <span className="text-[10px] text-blue-600 block font-bold uppercase">{matchedApp.bikeCondition}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Weekly Payment:</span>
                  <span className="font-black text-blue-600 text-base font-mono">R{matchedApp.weeklyRate}/wk</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Contract Deposit:</span>
                  <span className="font-black text-amber-800 text-base font-mono">R{matchedApp.depositAmount}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Term Duration:</span>
                  <span className="font-bold text-slate-900 text-sm">{matchedApp.termMonths} Months</span>
                </div>
              </div>

              {/* Action Required Alert for missing docs / TRN */}
              {matchedApp.status === 'needs_more_info' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-900 uppercase">Attention Needed: Traffic Register (TRN)</h4>
                      <p className="text-xs text-slate-700 mt-0.5">
                        Your application requires an official Traffic Register (TRN) certificate for foreign license verification. Please WhatsApp it to our team.
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/27710542015?text=${encodeURIComponent(`Hi Dynamic Rental, I am sending my TRN document for Ref ${matchedApp.refNumber} (${matchedApp.fullName}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send TRN on WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Approved Collection Notice Box */}
              {matchedApp.status === 'approved_for_collection' && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">
                        🎉 Approved! Bike Ready for Handover & Contract Signing
                      </h4>
                      <p className="text-xs text-slate-700 mt-1">
                        Please visit our Randburg showroom to sign your physical rent-to-own contract and collect your bike.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
                    <div>
                      <strong className="text-emerald-800 block mb-1">What to Bring:</strong>
                      <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                        <li>R{matchedApp.depositAmount} Deposit (Cash / Instant EFT)</li>
                        <li>Original Smart ID / Passport & TRN</li>
                        <li>Original Driver's License</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-emerald-800 block mb-1">Collection Location:</strong>
                      <div className="text-slate-700">
                        {COMPANY_DETAILS.address}<br />
                        <span className="text-slate-500">{COMPANY_DETAILS.hours}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={COMPANY_DETAILS.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Get Directions on Google Maps</span>
                    </a>

                    <a
                      href={`https://wa.me/27710542015?text=${encodeURIComponent(`Hi Dynamic Rental, I am coming to collect my bike for Ref: ${matchedApp.refNumber} (${matchedApp.fullName}).`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-emerald-700 border border-emerald-300 flex items-center gap-1.5 shadow-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Confirm Collection Time on WhatsApp</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Application Timeline */}
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-4">
                  Application Verification Progress
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {matchedApp.timeline.map((item, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center shadow-xs">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      </div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>{item.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(item.timestamp).toLocaleString('en-ZA', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center flex flex-col items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">No Application Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  We could not find an application matching <strong className="text-slate-800 font-mono">{query}</strong>. Please check your reference number or submit a fresh 2-minute application.
                </p>
              </div>
              <button
                type="button"
                onClick={onApplyNew}
                className="px-6 py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-2"
              >
                <span>Apply for a Bike Online (&lt;2 Mins)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
