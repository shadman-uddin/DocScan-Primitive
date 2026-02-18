import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { fetchHealth } from '../../services/api';

export default function ApiKeyInput() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [details, setDetails] = useState({ hasAnthropicKey: false, hasSheetId: false, hasServiceAccount: false });

  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setDetails(h);
        setStatus(h.hasAnthropicKey ? 'ok' : 'missing');
      })
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-slate-700">API Key Status</p>
        {status === 'loading' && <Loader size={14} className="animate-spin text-slate-400" />}
      </div>

      {status !== 'loading' && (
        <div className="space-y-2">
          {[
            { key: 'hasAnthropicKey', label: 'Anthropic API Key' },
            { key: 'hasSheetId', label: 'Google Sheet ID' },
            { key: 'hasServiceAccount', label: 'Google Service Account' },
          ].map(({ key, label }) => {
            const configured = details[key as keyof typeof details];
            return (
              <div key={key} className="flex items-center gap-2">
                {configured ? (
                  <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                ) : (
                  <XCircle size={15} className="text-red-400 flex-shrink-0" />
                )}
                <span className="text-sm text-slate-700">{label}</span>
                <span
                  className={`ml-auto text-xs font-medium ${
                    configured ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {configured ? 'Configured' : 'Not configured'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {status === 'error' && (
        <p className="text-xs text-slate-400">
          Could not reach the Worker. Deploy the Cloudflare Worker and set VITE_API_URL to enable this check.
        </p>
      )}

      {status === 'missing' && (
        <p className="text-xs text-slate-500 mt-1">
          Set secrets on your Cloudflare Worker: ANTHROPIC_API_KEY, GOOGLE_SHEET_ID, and GOOGLE_SERVICE_ACCOUNT_JSON.
        </p>
      )}
    </div>
  );
}
