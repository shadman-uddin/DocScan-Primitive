import { useState, useEffect, useRef } from 'react';
import { Palette, List, Brain, Sheet, BarChart2, AlertTriangle, Lock, CheckCircle } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import BrandingEditor from '../components/config/BrandingEditor';
import FieldEditor from '../components/config/FieldEditor';
import ThresholdSlider from '../components/config/ThresholdSlider';
import ApiKeyInput from '../components/config/ApiKeyInput';
import SheetConnection from '../components/config/SheetConnection';
import KpiToggle from '../components/config/KpiToggle';

const PASSPHRASE = import.meta.env.VITE_ADMIN_PASSPHRASE || 'admin';
const SESSION_KEY = 'admin_authed';

function PassphraseGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function attempt() {
    if (value === PASSPHRASE) {
      sessionStorage.setItem(SESSION_KEY, '1');
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setValue('');
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock size={20} className="text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Admin Access</h2>
        <p className="text-sm text-slate-500 mb-6">Enter the admin passphrase to continue.</p>
        <div className={shake ? 'animate-shake' : ''}>
          <input
            ref={inputRef}
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === 'Enter' && attempt()}
            placeholder="Passphrase"
            className={`w-full border rounded-lg px-4 py-2.5 text-sm text-center mb-2 focus:outline-none focus:ring-2 ${
              error ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500/20'
            }`}
          />
          {error && <p className="text-xs text-red-500 mb-3">Incorrect passphrase. Try again.</p>}
        </div>
        <button
          onClick={attempt}
          className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function SavedIndicator({ visible }: { visible: boolean }) {
  return (
    <span
      className={`flex items-center gap-1 text-xs text-green-600 font-medium transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <CheckCircle size={12} />
      Saved
    </span>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  children: React.ReactNode;
  saved?: boolean;
}

function Section({ icon, title, desc, children, saved }: SectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-500">{icon}</div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
          </div>
        </div>
        <SavedIndicator visible={!!saved} />
      </div>
      {children}
    </div>
  );
}

export default function ConfigPage() {
  const { theme, resetConfig } = useAppStore();
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(SESSION_KEY));
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function markSaved(section: string) {
    setSavedSection(section);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedSection(null), 1500);
  }

  useEffect(() => {
    return () => { if (savedTimer.current) clearTimeout(savedTimer.current); };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      {!authed && <PassphraseGate onUnlock={() => setAuthed(true)} />}

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
        <div className="mb-2">
          <h1 className="text-xl font-bold text-slate-900">Admin Configuration</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Settings save automatically. Changes take effect immediately.
          </p>
        </div>

        <Section
          icon={<Palette size={16} />}
          title="App Branding"
          desc="Customize the app name, logo, and colors"
          saved={savedSection === 'branding'}
        >
          <BrandingEditor onSaved={() => markSaved('branding')} />
        </Section>

        <Section
          icon={<List size={16} />}
          title="Form Field Definitions"
          desc="Define which fields are extracted from uploaded documents"
          saved={savedSection === 'fields'}
        >
          <FieldEditor onSaved={() => markSaved('fields')} />
        </Section>

        <Section
          icon={<Brain size={16} />}
          title="AI Configuration"
          desc="Extraction threshold and API connection status"
          saved={savedSection === 'ai'}
        >
          <div className="space-y-6">
            <ThresholdSlider onSaved={() => markSaved('ai')} />
            <div className="border-t border-slate-100 pt-4">
              <ApiKeyInput />
            </div>
          </div>
        </Section>

        <Section
          icon={<Sheet size={16} />}
          title="Google Sheets Connection"
          desc="Configure which sheet receives extracted data"
          saved={savedSection === 'sheets'}
        >
          <SheetConnection onSaved={() => markSaved('sheets')} />
        </Section>

        <Section
          icon={<BarChart2 size={16} />}
          title="Dashboard KPIs"
          desc="Choose which panels appear on the dashboard"
          saved={savedSection === 'kpis'}
        >
          <KpiToggle onSaved={() => markSaved('kpis')} />
        </Section>

        <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-red-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-50 rounded-lg text-red-500">
              <AlertTriangle size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Danger Zone</h2>
              <p className="text-xs text-slate-400 mt-0.5">Irreversible actions</p>
            </div>
          </div>

          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              Reset All Configuration
            </button>
          ) : (
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 space-y-3">
              <p className="text-sm text-red-800 font-medium">
                This will reset all configuration to defaults. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { resetConfig(); setShowReset(false); }}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}
