import React from 'react';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Bike, 
  Sparkles, 
  FileText, 
  MapPin, 
  Phone, 
  HelpCircle,
  ArrowRight,
  Zap,
  Users
} from 'lucide-react';

interface AboutPageProps {
  onApplyNow: () => void;
  onViewFleet: () => void;
  onContactUs: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({
  onApplyNow,
  onViewFleet,
  onContactUs,
}) => {
  const steps = [
    {
      num: '01',
      title: 'Choose Your Motorbike & Plan',
      description: 'Select from our fleet of Bajaj Boxer 150 HD, Big Boy Velocity 150, or Dynamic E-Delivery. Choose Brand New (R750/week, 15-18 month term) or Pre-Owned (R650/week, 20 month term).',
    },
    {
      num: '02',
      title: 'Complete 2-Minute Digital Application',
      description: 'Submit your personal details and upload photos of your ID/Passport, valid Work Permit/Asylum (if non-SA), Driving License, and Traffic Register (TRN).',
    },
    {
      num: '03',
      title: 'Fast Document Verification (Same Day)',
      description: 'Our Randburg team reviews your documents within hours. No credit bureau blacklist disqualification — we verify delivery capability, not bank credit scores.',
    },
    {
      num: '04',
      title: 'Pay Deposit on Collection & Ride Out',
      description: 'Once approved, visit 304 Tungsten Road, Strydompark. Sign your official lease agreement, pay your deposit (R1,000 new / R650 used), and ride away immediately to start earning on Sixty60, Uber Eats, Takealot, or Mr D!',
    },
    {
      num: '05',
      title: 'Pay Weekly & Take 100% Ownership',
      description: 'Make consistent weekly payments while working. Upon completing your agreement term, full legal ownership of the motorbike and logbook is transferred into your name.',
    },
  ];

  const faqs = [
    {
      q: 'Do I need a South African bank credit record to qualify?',
      a: 'No! We believe in empowering delivery couriers. We evaluate your active courier work, valid identification, license, and TRN rather than traditional bank credit bureau scores.',
    },
    {
      q: 'When is the deposit paid?',
      a: 'The deposit (R1,000 for Brand New or R650 for Pre-Owned) is ONLY payable when you visit our showroom in Strijdom Park to sign your contract and collect your bike.',
    },
    {
      q: 'Can foreign nationals and asylum permit holders apply?',
      a: 'Yes! We welcome foreign nationals. You will need your original valid Passport, valid Work Permit or Asylum document, Driving License, and an official South African Traffic Register Number (TRN) certificate.',
    },
    {
      q: 'Are the bikes fitted for delivery boxes?',
      a: 'Yes, all our fleet motorbikes (Bajaj Boxer and Big Boy Velocity) are commercial-grade delivery bikes fitted with reinforced rear carriers ready for standard Sixty60, Uber Eats, and Takealot cargo boxes.',
    },
    {
      q: 'Where is Dynamic Rental located for vehicle collection?',
      a: 'Our central Johannesburg hub is located at 304 Tungsten Road, Strijdom Park, Randburg (just off Malibongwe Drive). Open Monday to Friday 08:00 - 17:00 and Saturday 08:30 - 13:00.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-12" id="about-how-it-works-page">
      {/* Page Title */}
      <div className="text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-700 border border-cyan-500/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
          <span>ABOUT DYNAMIC RENTAL</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          How Dynamic Rental Works
        </h1>
        <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
          The straightforward, honest rent-to-own motorbike program designed for Johannesburg's hardest working delivery riders.
        </p>
      </div>

      {/* Value Pillars Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
              <Coins className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Transparent Weekly Rates</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              No hidden finance charges or balloon payments. Pay fixed rates (R750/wk new or R650/wk used) directly out of your weekly courier earnings.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-bold text-cyan-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Zero unexpected surprises</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Deposit On Collection</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Apply 100% free online. You only pay your deposit (R1,000 for New / R650 for Used) when you physically inspect and collect your bike at our Randburg showroom.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-bold text-cyan-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>100% risk-free application</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
              <Bike className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Guaranteed Ownership</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every weekly payment builds your equity. Complete your term (15-20 months) and the bike becomes 100% yours forever.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-bold text-cyan-400 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            <span>Full logbook transfer</span>
          </div>
        </div>
      </div>

      {/* Step by Step Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            5 Simple Steps from Application to Ownership
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Everything is streamlined for courier drivers in Johannesburg.
          </p>
        </div>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 p-5 rounded-2xl bg-slate-50 hover:bg-cyan-50/40 border border-slate-200 hover:border-cyan-200 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-cyan-400 flex items-center justify-center font-mono font-black text-base flex-shrink-0 shadow-sm">
                {step.num}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Requirements Box */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-3">
            <FileText className="w-3.5 h-3.5" />
            <span>DOCUMENT CHECKLIST</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            What You Need to Apply
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
            Have photos of these documents ready on your phone when starting your 2-minute application:
          </p>

          <div className="mt-6 space-y-3 text-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-white block font-bold">South African Citizens:</strong>
                <span className="text-slate-400">Smart ID Card (Front & Back) or Green ID Book + Valid Driving License.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-white block font-bold">Non-South African Nationals:</strong>
                <span className="text-slate-400">Valid Passport + Valid Work Permit / Asylum Document + Driver License + Traffic Register Number (TRN) certificate.</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-white block font-bold">Proof of Courier Work & Residence:</strong>
                <span className="text-slate-400">Screenshot of your active delivery app profile/earnings (Sixty60, Uber Eats, Mr D, Bolt) & proof of address.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/80 p-6 sm:p-8 rounded-2xl border border-slate-700 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-cyan-500/25">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Ready to Get Started?</h3>
            <p className="text-xs text-slate-300 mt-1">
              Takes less than 2 minutes on your smartphone or computer.
            </p>
          </div>
          <button
            type="button"
            onClick={onApplyNow}
            className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm bg-cyan-400 hover:bg-cyan-300 text-slate-950 transition-all shadow-md shadow-cyan-400/20 flex items-center justify-center gap-2"
          >
            <span>-- APPLY NOW &lt;2MIN --</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onViewFleet}
            className="text-xs text-slate-400 hover:text-white transition-colors underline underline-offset-2"
          >
            View Available Motorbikes & Rates
          </button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>GOT QUESTIONS?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">{faq.q}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
