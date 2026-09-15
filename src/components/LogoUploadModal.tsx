import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Check, 
  RotateCcw, 
  Sparkles,
  Link2,
  Trash2
} from 'lucide-react';

interface LogoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string;
  onSaveLogo: (url: string) => void;
}

export const LogoUploadModal: React.FC<LogoUploadModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onSaveLogo,
}) => {
  const [logoInput, setLogoInput] = useState<string>(currentLogoUrl);
  const [urlInput, setUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setLogoInput(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setLogoInput(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleSave = () => {
    onSaveLogo(logoInput);
    onClose();
  };

  const handleResetToDefault = () => {
    setLogoInput('');
    onSaveLogo('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="logo-modal">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Insert / Customize Logo</h2>
            <p className="text-xs text-slate-400">
              Upload your custom logo or use the official Dynamic Rental vector branding.
            </p>
          </div>
        </div>

        {/* Current Preview */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-300 block mb-2">
            Current Logo Preview (in Black Header)
          </label>
          <div className="p-4 rounded-2xl bg-black border border-slate-800 flex items-center justify-center min-h-[90px]">
            {logoInput ? (
              <img
                src={logoInput}
                alt="Custom Logo Preview"
                className="max-h-16 max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="text-center text-xs text-slate-400">
                <span className="text-cyan-400 font-bold block mb-1">Using Official Dynamic Rental Vector Logo</span>
                (White DR with Cyan Waves & Dynamic Rental typography)
              </div>
            )}
          </div>
        </div>

        {/* Upload File Section */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Option 1: Upload Logo File (PNG, SVG, JPG)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.svg"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 rounded-xl border border-dashed border-slate-600 hover:border-cyan-400 bg-slate-800/60 hover:bg-slate-800 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-all"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">Choose logo image from your device</span>
            </button>
          </div>

          {/* Option 2: Image URL */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Option 2: Paste Image URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs font-semibold text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default Logo</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save & Use Logo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
