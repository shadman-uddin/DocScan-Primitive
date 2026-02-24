import { RefreshCw, Check, Loader2, RotateCcw } from 'lucide-react';

interface ReviewActionsProps {
  onReupload: () => void;
  onApprove: () => void;
  onRetry?: () => void;
  isProcessing?: boolean;
  hasError?: boolean;
}

export function ReviewActions({
  onReupload,
  onApprove,
  onRetry,
  isProcessing = false,
  hasError = false,
}: ReviewActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onReupload}
        disabled={isProcessing}
        className="flex-[0.4] flex items-center justify-center gap-2 h-12 px-4 bg-white border-2 border-slate-600 text-slate-600 rounded-xl font-medium hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className="w-5 h-5" />
        <span>Re-upload</span>
      </button>

      {hasError && onRetry ? (
        <button
          onClick={onRetry}
          disabled={isProcessing}
          className="flex-[0.6] flex items-center justify-center gap-2 h-12 px-4 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Retry</span>
        </button>
      ) : (
        <button
          onClick={onApprove}
          disabled={isProcessing}
          className="flex-[0.6] flex items-center justify-center gap-2 h-12 px-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Approve & Save</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
