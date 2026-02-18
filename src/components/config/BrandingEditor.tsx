import { useRef } from 'react';
import { useAppStore } from '../../stores/useAppStore';

interface Props {
  onSaved: () => void;
}

export default function BrandingEditor({ onSaved }: Props) {
  const { appName, theme, setAppName, setTheme } = useAppStore();
  const logoRef = useRef<HTMLInputElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setTheme({ logoUrl: b64 });
      onSaved();
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">App Name</label>
        <input
          type="text"
          value={appName}
          onChange={(e) => { setAppName(e.target.value); onSaved(); }}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          placeholder="DocScan"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo</label>
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden"
            onClick={() => logoRef.current?.click()}
          >
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400 text-center px-1">No logo</span>
            )}
          </div>
          <div className="space-y-1">
            <button
              onClick={() => logoRef.current?.click()}
              className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Upload PNG/SVG
            </button>
            {theme.logoUrl && (
              <button
                onClick={() => { setTheme({ logoUrl: null }); onSaved(); }}
                className="block text-xs text-slate-400 hover:text-red-500"
              >
                Remove logo
              </button>
            )}
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/png,image/svg+xml"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => { setTheme({ primaryColor: e.target.value }); onSaved(); }}
              className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
            />
            <input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => { setTheme({ primaryColor: e.target.value }); onSaved(); }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              maxLength={7}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Accent Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={theme.accentColor}
              onChange={(e) => { setTheme({ accentColor: e.target.value }); onSaved(); }}
              className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 p-0.5"
            />
            <input
              type="text"
              value={theme.accentColor}
              onChange={(e) => { setTheme({ accentColor: e.target.value }); onSaved(); }}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              maxLength={7}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Preview</label>
        <div
          className="rounded-lg p-3 flex items-center gap-2"
          style={{ backgroundColor: theme.primaryColor }}
        >
          {theme.logoUrl && (
            <img src={theme.logoUrl} alt="logo" className="h-6 w-6 object-contain" />
          )}
          <span className="text-white text-sm font-semibold">{appName}</span>
          <span
            className="ml-auto px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: theme.accentColor, color: '#fff' }}
          >
            Action
          </span>
        </div>
      </div>
    </div>
  );
}
