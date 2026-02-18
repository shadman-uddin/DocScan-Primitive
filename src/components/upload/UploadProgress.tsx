interface UploadProgressProps {
  progress: number;
}

export default function UploadProgress({ progress }: UploadProgressProps) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--color-text-secondary)" }}>Processing...</span>
        <span className="font-medium" style={{ color: "var(--color-primary)" }}>
          {Math.round(progress)}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: "var(--color-primary)",
          }}
        />
      </div>
    </div>
  );
}
