import React, { useState } from 'react';
import { ShieldCheck, Lock, X, ArrowRight, AlertCircle, KeyRound } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Default Dealership Access PIN: 2026 or 1234 or admin
    if (pin === '2026' || pin === '1234' || pin.toLowerCase() === 'admin') {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('Incorrect staff PIN code. Default PIN is 2026');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Dealership Staff Login</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access underwriting pipeline, upload new bikes, and manage stock inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Enter Staff PIN / Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter PIN (e.g. 2026)"
                autoFocus
                className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 rounded-2xl px-4 py-3.5 text-center text-lg font-mono tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal placeholder:text-sm focus:outline-none"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 mt-2 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100 text-slate-600 text-xs">
            <span className="font-semibold text-blue-800">Quick Staff Demo:</span> PIN is <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded text-blue-700">2026</code>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span>Unlock Admin Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
