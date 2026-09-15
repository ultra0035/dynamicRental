import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  X, 
  Check, 
  RotateCcw, 
  Link2,
  Sparkles
} from 'lucide-react';
import { PRESET_HERO_IMAGES, DEFAULT_HERO_IMAGE } from '../lib/customizationStore';

interface HeroImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHeroUrl: string;
  onSaveHeroImage: (url: string) => void;
}

export const HeroImageModal: React.FC<HeroImageModalProps> = ({
  isOpen,
  onClose,
  currentHeroUrl,
  onSaveHeroImage,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentHeroUrl || DEFAULT_HERO_IMAGE);
  const [urlInput, setUrlInput] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setSelectedUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setSelectedUrl(urlInput.trim());
      setUrlInput('');
    }
  };

  const handleSave = () => {
    onSaveHeroImage(selectedUrl);
    onClose();
  };

  const handleReset = () => {
    setSelectedUrl(DEFAULT_HERO_IMAGE);
    onSaveHeroImage(DEFAULT_HERO_IMAGE);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="hero-image-modal">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">Insert / Customize Hero Image</h2>
            <p className="text-xs text-slate-400">
              Upload your own delivery motorbike photo, paste an image link, or select from curated presets.
            </p>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-300 block mb-2">
            Live Hero Image Preview
          </label>
          <div className="relative rounded-2xl overflow-hidden h-44 sm:h-52 border border-slate-700 bg-slate-800">
            <img
              src={selectedUrl}
              alt="Hero Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
              <span className="text-xs font-bold text-white bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs border border-white/20">
                Preview active
              </span>
            </div>
          </div>
        </div>

        {/* Preset Gallery */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-300 block mb-2">
            Choose from Curated Delivery Motorbike Presets:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PRESET_HERO_IMAGES.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedUrl(preset.url)}
                className={`relative rounded-xl overflow-hidden h-20 border text-left transition-all group ${
                  selectedUrl === preset.url
                    ? 'border-cyan-400 ring-2 ring-cyan-400/50'
                    : 'border-slate-700 hover:border-slate-500 opacity-80 hover:opacity-100'
                }`}
              >
                <img
                  src={preset.url}
                  alt={preset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/50 p-1.5 flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-white line-clamp-1 leading-tight">
                    {preset.title}
                  </span>
                </div>
                {selectedUrl === preset.url && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-cyan-400 text-slate-950 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upload or Custom URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Upload from Device
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3 rounded-xl border border-dashed border-slate-600 hover:border-cyan-400 bg-slate-800 hover:bg-slate-750 text-xs text-slate-300 hover:text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Photo</span>
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Or Paste Image URL
            </label>
            <div className="flex gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://.../photo.jpg"
                className="flex-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                disabled={!urlInput.trim()}
                className="px-3 py-2.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-50 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
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
              <span>Save Hero Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
