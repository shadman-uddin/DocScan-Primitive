interface ConfidenceBadgeProps {
  confidence: number | null;
  isUnreadable?: boolean;
}

export function ConfidenceBadge({ confidence, isUnreadable }: ConfidenceBadgeProps) {
  if (isUnreadable || confidence === null) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-red-600 font-medium">Unreadable</span>
      </div>
    );
  }

  if (confidence >= 0.85) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-green-600 font-medium">High</span>
      </div>
    );
  }

  if (confidence >= 0.70) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-amber-600 font-medium">Medium</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div className="w-2 h-2 rounded-full bg-red-500" />
      <span className="text-red-600 font-medium">Low</span>
    </div>
  );
}
