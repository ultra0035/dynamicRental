import React, { useState } from 'react';
import { Github, Copy, Check, ExternalLink, X, Terminal, BookOpen, Sparkles } from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const steps = [
    {
      title: '1. Create a new GitHub repository',
      instruction: 'Go to github.com/new and create a repository named "dynamic-rental-bikes" (or any name).',
      code: '',
      link: 'https://github.com/new',
    },
    {
      title: '2. Initialize Git & Add Remote',
      instruction: 'Open your terminal in the downloaded project folder and run:',
      code: `git init
git add .
git commit -m "feat: Dynamic Rental Randburg rent-to-own bike platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dynamic-rental-bikes.git
git push -u origin main`,
    },
    {
      title: '3. Add Supabase Environment Variables (Optional for Cloud)',
      instruction: 'If deploying to Vercel / Netlify / Cloud Run, add these environment variables in project settings:',
      code: `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Push to GitHub Guide</h2>
            <p className="text-xs text-slate-500">
              Complete instructions to export and publish your codebase to GitHub.
            </p>
          </div>
        </div>

        <div className="space-y-5 text-xs text-slate-700">
          {/* Method 1: Built-in Export */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-blue-900 font-bold block mb-0.5">Quick Export Option:</strong>
              <p className="text-slate-700 leading-relaxed">
                You can also export your repository directly via the Google AI Studio top-right settings menu by choosing <strong>"Export to GitHub"</strong> or <strong>"Download ZIP"</strong>.
              </p>
            </div>
          </div>

          {/* Terminal Steps */}
          {steps.map((step, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 font-bold text-sm">{step.title}</strong>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <span>Open GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <p className="text-slate-600">{step.instruction}</p>
              {step.code && (
                <div className="relative mt-2">
                  <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                    {step.code}
                  </pre>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(step.code, idx)}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Commands</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
