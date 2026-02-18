import { FileText, X } from "lucide-react";
import { formatFileSize } from "../../utils/formatters";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-3 mt-4">
      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <FileText className="h-6 w-6 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
          {file.name}
        </p>
        <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
          {formatFileSize(file.size)}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="p-1.5 rounded-full hover:bg-slate-200 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
}
