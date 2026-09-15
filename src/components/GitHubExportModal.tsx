import React, { useState } from 'react';
import { 
  Github, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Terminal, 
  Sparkles, 
  Globe, 
  Layers, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubExportModal: React.FC<GitHubExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'vercel' | 'github'>('vercel');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const vercelSteps = [
    {
      title: 'Method 1: Deploy via GitHub + Vercel Dashboard (Recommended)',
      description: 'Connect your GitHub repository to Vercel for automatic live deploys whenever you push changes.',
      steps: [
        'Push your code to GitHub (see the "Push to GitHub" tab).',
        'Go to vercel.com/new and sign in with GitHub.',
        'Import your dynamic-rental-bikes repository.',
        'Leave Framework Preset as "Vite" (Vercel detects this automatically).',
        'Click "Deploy". Your website will be live at a free .vercel.app domain within 45 seconds!',
      ],
      link: 'https://vercel.com/new',
      linkText: 'Open Vercel New Project',
    },
    {
      title: 'Method 2: 1-Command Instant Deploy with Vercel CLI',
      description: 'Deploy directly from your terminal without opening a browser:',
      command: `npx vercel`,
      subCommand: `npx vercel --prod`,
    },
  ];

  const githubSteps = [
    {
      title: '1. Create a new GitHub repository',
      instruction: 'Visit github.com/new and create a repository (e.g., "dynamic-rental-bikes").',
      code: '',
      link: 'https://github.com/new',
    },
    {
      title: '2. Terminal Git Commands',
      instruction: 'Run these commands inside your project root folder:',
      code: `git init
git add .
git commit -m "feat: Dynamic Rental Randburg rent-to-own bike platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/dynamic-rental-bikes.git
git push -u origin main`,
    },
    {
      title: '3. Optional Supabase Environment Variables on Vercel',
      instruction: 'If you connect Supabase for live multi-device synchronization, add these in Vercel Project Settings > Environment Variables:',
      code: `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" id="deployment-modal">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          id="close-deploy-modal-btn"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-md">
            {activeTab === 'vercel' ? (
              <Globe className="w-6 h-6 text-white" />
            ) : (
              <Github className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Deploy & Publish Website</h2>
            <p className="text-xs text-slate-500">
              Step-by-step instructions to host Dynamic Rental on Vercel and GitHub.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('vercel')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'vercel'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="tab-select-vercel"
          >
            <Globe className="w-4 h-4 text-blue-600" />
            <span>Deploy to Vercel (Fastest)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('github')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'github'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            id="tab-select-github"
          >
            <Github className="w-4 h-4 text-slate-900" />
            <span>Push to GitHub</span>
          </button>
        </div>

        {/* Tab 1: VERCEL DEPLOYMENT */}
        {activeTab === 'vercel' && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Vercel Ready Badge */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950 font-bold block mb-0.5">
                  100% Vercel & SPA Ready!
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  Your project includes <code className="bg-white px-1.5 py-0.5 rounded font-mono font-bold text-emerald-800">vercel.json</code> configured with single-page application (SPA) rewrites and optimized Vite build scripts.
                </p>
              </div>
            </div>

            {/* Method 1: Web dashboard */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <strong className="text-slate-900 font-bold text-sm">
                  Option A: 1-Click Import from GitHub
                </strong>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 text-[11px]"
                >
                  <span>Open vercel.com/new</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
                {vercelSteps[0].steps?.map((s, idx) => (
                  <li key={idx} className="leading-relaxed">{s}</li>
                ))}
              </ol>
            </div>

            {/* Method 2: CLI */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <strong className="text-slate-900 font-bold text-sm block">
                Option B: Deploy via Terminal (Vercel CLI)
              </strong>
              <p className="text-slate-600">Run this command in your project directory:</p>
              
              <div className="relative mt-2">
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {vercelSteps[1].command}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vercelSteps[1].command || '', 99)}
                  className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-700"
                >
                  {copiedIndex === 99 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative mt-2">
                <p className="text-[11px] text-slate-500 mb-1">To deploy directly to production:</p>
                <pre className="bg-slate-900 text-cyan-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {vercelSteps[1].subCommand}
                </pre>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vercelSteps[1].subCommand || '', 100)}
                  className="absolute top-7 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-700"
                >
                  {copiedIndex === 100 ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: GITHUB STEPS */}
        {activeTab === 'github' && (
          <div className="space-y-4 text-xs text-slate-700">
            {/* AI Studio Export */}
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-relaxed">
                You can also export your codebase directly from the top-right AI Studio settings menu by selecting <strong>"Export to GitHub"</strong> or <strong>"Download ZIP"</strong>.
              </p>
            </div>

            {githubSteps.map((step, idx) => (
              <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 font-bold">{step.title}</strong>
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
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-700"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Vite + React 19 + Tailwind ready</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
