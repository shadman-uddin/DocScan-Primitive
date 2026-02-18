import { useState, useEffect } from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';
import { AlertCircle } from 'lucide-react';

interface ExtractedFieldCardProps {
  label: string;
  fieldName: string;
  value: string | null;
  confidence: number | null;
  onChange: (fieldName: string, newValue: string) => void;
}

export function ExtractedFieldCard({
  label,
  fieldName,
  value,
  confidence,
  onChange,
}: ExtractedFieldCardProps) {
  const [localValue, setLocalValue] = useState(value ?? '');

  useEffect(() => {
    setLocalValue(value ?? '');
  }, [value, fieldName]);

  const isUnreadable = value === null && localValue === '';
  const isLowConfidence = confidence !== null && confidence < 0.70;

  const cardBackgroundClass = isUnreadable
    ? 'bg-red-50'
    : isLowConfidence
    ? 'bg-amber-50'
    : 'bg-white';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalValue(e.target.value);
    onChange(fieldName, e.target.value);
  }

  return (
    <div className={`p-4 rounded-lg ${cardBackgroundClass} transition-colors`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <label
          htmlFor={fieldName}
          className="text-xs font-medium text-slate-600 uppercase tracking-wide"
        >
          {label}
        </label>
        <ConfidenceBadge confidence={confidence} isUnreadable={value === null && localValue === ''} />
      </div>

      <input
        type="text"
        id={fieldName}
        value={localValue}
        onChange={handleChange}
        className="w-full border-b-2 border-slate-300 focus:border-blue-600 bg-transparent text-base py-2 outline-none transition-colors"
        placeholder={value === null ? 'Enter value manually' : ''}
      />

      {isLowConfidence && !isUnreadable && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-amber-600">
          <AlertCircle className="w-3 h-3" />
          <span>Please verify</span>
        </div>
      )}
    </div>
  );
}
