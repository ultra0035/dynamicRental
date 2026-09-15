import React from 'react';
import { RiderApplication } from '../types';
import { COMPANY_DETAILS } from '../data/bikes';
import { X, Printer, ShieldCheck, MapPin, Phone, Download } from 'lucide-react';

interface ContractModalProps {
  application: RiderApplication;
  onClose: () => void;
}

export const ContractModal: React.FC<ContractModalProps> = ({ application, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const todayStr = new Date().toLocaleDateString('en-ZA', { dateStyle: 'long' });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="contract-modal">
      <div className="bg-white border border-slate-300 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Rent-to-Own Motorbike Agreement Summary
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Agreement</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Contract Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 text-xs sm:text-sm bg-white font-sans" id="printable-contract-content">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h1 className="text-xl font-black text-slate-900">{COMPANY_DETAILS.legalName}</h1>
              <p className="text-xs text-blue-600 font-bold">{COMPANY_DETAILS.tagline}</p>
              <p className="text-xs text-slate-500 mt-1">{COMPANY_DETAILS.address}</p>
              <p className="text-xs text-slate-500">Tel / WhatsApp: {COMPANY_DETAILS.phoneDisplay}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 font-medium">Agreement Reference:</div>
              <div className="text-base font-black text-blue-700 font-mono">{application.refNumber}</div>
              <div className="text-[11px] text-slate-500">Date: {todayStr}</div>
            </div>
          </div>

          {/* Section 1: Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">LESSOR (Dealership):</span>
              <div className="font-bold text-slate-900">{COMPANY_DETAILS.name}</div>
              <div className="text-xs text-slate-600">304 Tungsten Rd, Strijdom Park, Randburg</div>
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">LESSEE (Rider):</span>
              <div className="font-bold text-slate-900">{application.fullName}</div>
              <div className="text-xs text-slate-600">ID / Passport: {application.idOrPassportNumber}</div>
              <div className="text-xs text-slate-600">Phone: {application.phone}</div>
              <div className="text-xs text-slate-600">Address: {application.address}, {application.suburb}</div>
            </div>
          </div>

          {/* Section 2: Vehicle & Terms Schedule */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Schedule of Motorbike & Payments</h4>
            <table className="w-full border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs">
              <tbody>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <td className="p-2.5 font-semibold text-slate-600 w-1/3">Motorbike Model:</td>
                  <td className="p-2.5 font-bold text-slate-900">{application.bikeName} ({application.bikeCondition.toUpperCase()})</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-semibold text-slate-600">Weekly Installment:</td>
                  <td className="p-2.5 font-black text-blue-600 font-mono">R{application.weeklyRate} per week</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <td className="p-2.5 font-semibold text-slate-600">Contract Deposit (Non-refundable):</td>
                  <td className="p-2.5 font-black text-amber-800 font-mono">R{application.depositAmount} (Due upon signing)</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2.5 font-semibold text-slate-600">Term Duration:</td>
                  <td className="p-2.5 font-bold text-slate-900">{application.termMonths} Months to 100% Full Ownership</td>
                </tr>
                <tr className="border-b border-slate-200 bg-slate-50/70">
                  <td className="p-2.5 font-semibold text-slate-600">Assigned Plate / VIN:</td>
                  <td className="p-2.5 font-mono text-slate-700">{application.assignedBikeVinOrPlate || 'Pending Handover Allocation'}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-600">Handover Showroom:</td>
                  <td className="p-2.5 text-slate-700">304 Tungsten Road, Strijdom Park, Randburg</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Summary Terms & Conditions */}
          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider">Key Contract Terms:</h4>
            <p>1. <strong>Weekly Payment Obligation:</strong> The Lessee agrees to pay R{application.weeklyRate} weekly via debit order/instant EFT.</p>
            <p>2. <strong>Ownership Transfer:</strong> Upon completing all {application.termMonths} monthly cycles ({application.termMonths * 4.33} weekly installments), legal ownership and registration papers will be signed over to the Lessee with zero balloon payment.</p>
            <p>3. <strong>Tracking & Security:</strong> The motorbike is equipped with an active GPS tracking system and anti-theft immobilizer.</p>
            <p>4. <strong>Deposit Policy:</strong> The deposit of R{application.depositAmount} is non-refundable and covers administrative registration, vetting, and initial vehicle preparation.</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500">For Lessee (Rider):</span>
              {application.signatureDataUrl ? (
                <div className="h-20 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center">
                  <img src={application.signatureDataUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <div className="h-20 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400">
                  Signed on File
                </div>
              )}
              <div className="text-xs text-slate-900 font-bold">{application.fullName}</div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-500">For Dynamic Rental (Lessor):</span>
              <div className="h-20 bg-slate-50 rounded-xl border border-slate-200 p-2 flex items-center justify-center font-serif text-blue-700 italic text-lg font-bold">
                Dynamic Rental Mgr
              </div>
              <div className="text-xs text-slate-900 font-bold">Authorized Dealership Officer</div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
