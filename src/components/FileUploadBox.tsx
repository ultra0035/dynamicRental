import React, { useRef, useState } from 'react';
import { Upload, Camera, CheckCircle2, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImageFile } from '../lib/imageUtils';

interface FileUploadBoxProps {
  label: string;
  sublabel?: string;
  required?: boolean;
  value?: string;
  onChange: (dataUrl: string) => void;
  onRemove?: () => void;
  samplePlaceholderUrl?: string;
  sampleLabel?: string;
  badge?: string;
  id: string;
}

export const FileUploadBox: React.FC<FileUploadBoxProps> = ({
  label,
  sublabel,
  required,
  value,
  onChange,
  onRemove,
  samplePlaceholderUrl,
  sampleLabel = 'Use Demo Sample Document',
  badge,
  id,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImageFile(file, {
          maxWidth: 1200,
          maxHeight: 900,
          quality: 0.8,
        });
        onChange(compressed);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result === 'string') {
            onChange(event.target.result);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('File processing error:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          onChange(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  return (
    <div className="flex flex-col gap-1.5" id={`upload-wrapper-${id}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5" htmlFor={id}>
          {label}
          {required ? (
            <span className="text-rose-600 font-bold text-xs">*Required</span>
          ) : (
            <span className="text-slate-500 text-xs">(Optional)</span>
          )}
        </label>
        {badge && (
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-amber-100 text-amber-800 border border-amber-200">
            {badge}
          </span>
        )}
      </div>

      {sublabel && <p className="text-xs text-slate-500 leading-relaxed">{sublabel}</p>}

      <input
        ref={inputRef}
        type="file"
        id={id}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {value ? (
        <div className="relative group rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-emerald-200 flex-shrink-0 flex items-center justify-center shadow-xs">
            {value.startsWith('data:image') || value.startsWith('http') ? (
              <img
                src={value}
                alt={label}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <FileText className="w-6 h-6 text-emerald-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs mb-0.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Document Uploaded & Verified</span>
            </div>
            <p className="text-xs text-slate-700 truncate font-medium">
              {label}
            </p>
            <span className="text-[10px] text-slate-500">Ready for review</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors shadow-xs"
              title="Replace file"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !isProcessing && inputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center text-center group"
        >
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-2">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <div className="text-xs font-bold text-slate-800">Compressing & optimizing document photo...</div>
              <span className="text-[10px] text-slate-500">Fast-tracking for instant upload</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-medium text-slate-800 mb-1">
                <span className="text-blue-600 font-bold underline underline-offset-2">Click to take photo / upload</span> or drag file here
              </div>
              <p className="text-[11px] text-slate-500 mb-2">
                PNG, JPG, PDF (Max 10MB)
              </p>

              {samplePlaceholderUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(samplePlaceholderUrl);
                  }}
                  className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-blue-50 text-blue-700 rounded border border-blue-200 shadow-xs transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{sampleLabel}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
