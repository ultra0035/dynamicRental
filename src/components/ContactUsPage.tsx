import React, { useState } from 'react';
import { COMPANY_DETAILS } from '../data/bikes';
import { 
  MapPin, 
  Phone, 
  Clock, 
  MessageSquare, 
  Navigation, 
  Send, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface ContactUsPageProps {
  onApplyNow: () => void;
}

export const ContactUsPage: React.FC<ContactUsPageProps> = ({ onApplyNow }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    
    // Construct WhatsApp URL
    const text = encodeURIComponent(
      `Hi Dynamic Rental! My name is ${name} (${phone}). ${message ? `Message: ${message}` : 'I would like to inquire about rent-to-own delivery bikes.'}`
    );
    window.open(`https://wa.me/27710542015?text=${text}`, '_blank');
    setIsSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-10" id="contact-us-page">
      {/* Top Header Matching Screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Contact Text & Details */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
              CONTACT US
            </h1>
            <p className="text-xs sm:text-sm font-bold tracking-widest text-slate-500 uppercase mt-4">
              BETTER YET, SEE US IN PERSON!
            </p>
            <p className="text-base sm:text-lg text-slate-800 mt-3 leading-relaxed">
              We love our customers, so feel free to visit during normal business hours.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                DYNAMIC RENTAL
              </span>
              <p className="text-base font-bold text-slate-900 mt-1">
                304 Tungsten Road, Strydompark, Johannesburg, 2169, South Africa
              </p>
              <span className="text-xs text-slate-500">
                (Just off Malibongwe Drive, Strydompark Commercial Hub)
              </span>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                TELEPHONE & WHATSAPP
              </span>
              <a
                href={`tel:${COMPANY_DETAILS.phone}`}
                className="text-2xl sm:text-3xl font-black text-slate-950 hover:text-cyan-600 transition-colors font-mono tracking-tight block mt-1"
              >
                071 054 2015
              </a>
            </div>

            {/* Hours Dropdown / Summary matching screenshot */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                HOURS
              </span>
              <button
                type="button"
                onClick={() => setHoursExpanded(!hoursExpanded)}
                className="flex items-center gap-2 text-xl font-bold text-slate-900 hover:text-cyan-700 transition-colors"
              >
                <span>Open today</span>
                <span className="text-cyan-600 font-mono">09:00 – 16:00</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${hoursExpanded ? 'rotate-180' : ''}`} />
              </button>

              {hoursExpanded && (
                <div className="mt-3 p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs space-y-1.5 font-medium animate-fadeIn">
                  <div className="flex justify-between py-0.5">
                    <span>Monday – Friday:</span>
                    <span className="font-bold text-slate-900 font-mono">08:00 – 17:00</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span>Saturday:</span>
                    <span className="font-bold text-slate-900 font-mono">08:30 – 13:00</span>
                  </div>
                  <div className="flex justify-between py-0.5 text-slate-400">
                    <span>Sunday & Public Holidays:</span>
                    <span className="font-mono">Closed</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 pt-3">
              <a
                href={COMPANY_DETAILS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 transition-all shadow-sm"
              >
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Get Directions (Google Maps)</span>
              </a>

              <a
                href={COMPANY_DETAILS.whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Styled Map View */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl overflow-hidden border border-slate-300 bg-slate-100 shadow-xl min-h-[420px] flex flex-col">
            {/* Top map controls */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
              <a
                href={COMPANY_DETAILS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-900/95 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-lg backdrop-blur-xs border border-slate-700 transition-all uppercase tracking-wider"
              >
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span>GET DIRECTIONS</span>
              </a>
            </div>

            {/* Embedded Google Map iframe */}
            <iframe
              title="Dynamic Rental Strydompark Map"
              src="https://maps.google.com/maps?q=304+Tungsten+Road+Strydompark+Johannesburg+2169&t=&z=14&ie=UTF8&iwloc=&output=embed"
              className="w-full h-[450px] border-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />

            {/* Bottom Map Info Strip */}
            <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="font-bold">Dynamic Rental Strydompark Showroom</span>
                <span className="text-slate-400 hidden sm:inline">· 304 Tungsten Rd, Strijdom Park</span>
              </div>
              <button
                type="button"
                onClick={onApplyNow}
                className="px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-[11px] transition-colors"
              >
                Apply Online Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Message Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm max-w-3xl mx-auto w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INSTANT INQUIRY</span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Send Us a Quick Message</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Have questions about deposit, terms, or document requirements? Send us a note.
          </p>
        </div>

        {isSent ? (
          <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            <h3 className="text-base font-bold text-emerald-950">Inquiry Prepared & Sent!</h3>
            <p className="text-xs text-slate-600 max-w-md">
              Thank you {name}. Our Randburg team will respond to your WhatsApp/call at {phone} promptly.
            </p>
            <button
              type="button"
              onClick={() => setIsSent(false)}
              className="mt-2 text-xs font-bold text-emerald-700 underline"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sipho Ndlovu"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Phone / WhatsApp Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 071 234 5678"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-cyan-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Your Question or Inquiry
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about bike models, weekly terms, pre-owned stock, or requirements..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-cyan-500 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-black text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Send Message to Dynamic Rental Team</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
