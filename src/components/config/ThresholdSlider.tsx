import { useAppStore } from '../../stores/useAppStore';

interface Props {
  onSaved: () => void;
}

export default function ThresholdSlider({ onSaved }: Props) {
  const { confidenceThreshold, setConfidenceThreshold } = useAppStore();
  const pct = Math.round(confidenceThreshold * 100);

  const color =
    pct >= 85 ? 'text-green-600' : pct >= 70 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Confidence Threshold</label>
          <span className={`text-sm font-bold ${color}`}>{pct}%</span>
        </div>
        <input
          type="range"
          min={50}
          max={95}
          step={5}
          value={pct}
          onChange={(e) => {
            setConfidenceThreshold(parseInt(e.target.value) / 100);
            onSaved();
          }}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>50%</span>
          <span>95%</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Fields below this confidence level will be flagged for manual review.
        </p>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
        <p className="text-xs font-medium text-slate-500 mb-0.5">AI Model</p>
        <p className="text-sm text-slate-700 font-medium">Claude Sonnet 4</p>
        <p className="text-xs text-slate-400 font-mono">claude-sonnet-4-20250514</p>
        <p className="text-xs text-slate-400 mt-1">Model is configured server-side on the Cloudflare Worker.</p>
      </div>
    </div>
  );
}
