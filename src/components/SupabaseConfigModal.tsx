import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Trash2, 
  Copy, 
  Check, 
  Key, 
  Globe, 
  Server, 
  Layers, 
  Table, 
  ExternalLink 
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  clearAllLocalFleetCache,
  isSupabaseConnected 
} from '../lib/supabase';
import { SUPABASE_SQL_SCHEMA } from '../db/schemaSql';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRefreshed?: () => void;
}

export function SupabaseConfigModal({
  isOpen,
  onClose,
  onDataRefreshed,
}: SupabaseConfigModalProps) {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    tableCounts?: Record<string, number>;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setTestResult(null);
      setSaveSuccess(false);
      setCacheCleared(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseConfig(url, anonKey);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    if (onDataRefreshed) {
      onDataRefreshed();
    }
  };

  const handleTest = async () => {
    saveSupabaseConfig(url, anonKey);
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.success && onDataRefreshed) {
        onDataRefreshed();
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to connect to Supabase database',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Clear all local storage cache? The app will only read directly from your live database.')) {
      clearAllLocalFleetCache();
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
      if (onDataRefreshed) {
        onDataRefreshed();
      }
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const isConnected = isSupabaseConnected();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Supabase Database Connection
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                  isConnected 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {isConnected ? 'Connected' : 'Standalone / Not Configured'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Direct PostgreSQL connection for live applications, vehicles, drivers, inventory, and telemetry.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Credentials Inputs */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Supabase Project URL
              </label>
              <input
                type="url"
                placeholder="https://xyzcompany.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Found in your Supabase Dashboard under <strong>Project Settings → API</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                Supabase Anon / Public Key (or Service Role Key)
              </label>
              <textarea
                rows={3}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Found under <strong>Project Settings → API → Project API Keys</strong> (anon key).
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              onClick={handleTest}
              disabled={isTesting || !url || !anonKey}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              {isTesting ? 'Testing Connection...' : 'Test Connection & Read Database'}
            </button>

            <button
              onClick={handleSave}
              disabled={!url || !anonKey}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              Save Credentials
            </button>

            <button
              onClick={handleClearCache}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ml-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Local Storage Cache
            </button>
          </div>

          {/* Alerts / Feedback */}
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              Credentials saved. Database sync enabled.
            </div>
          )}

          {cacheCleared && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-rose-600 shrink-0" />
              Local storage cache cleared. Fresh data loaded from database.
            </div>
          )}

          {testResult && (
            <div
              className={`p-4 rounded-xl border ${
                testResult.success
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/80 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs mb-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                {testResult.message}
              </div>

              {testResult.tableCounts && (
                <div className="mt-3 pt-3 border-t border-emerald-200/80">
                  <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-slate-500" />
                    Live Database Tables & Row Counts:
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(testResult.tableCounts).map(([tableName, count]) => (
                      <div
                        key={tableName}
                        className="bg-white/90 px-2.5 py-1.5 rounded-lg border border-emerald-200/60 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono text-[11px] text-slate-600 truncate">{tableName}</span>
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                          {count} rows
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SQL Schema Copy Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                Supabase SQL Editor Schema (11 Tables & Policies)
              </span>
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied SQL!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy SQL
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              If you haven't run the table creation script yet in Supabase, copy this SQL and run it in the Supabase <strong>SQL Editor</strong> to create all tables with Row Level Security enabled.
            </p>
            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[10px] font-mono overflow-x-auto max-h-32 border border-slate-800">
              {SUPABASE_SQL_SCHEMA.slice(0, 500)}...
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
