import { useRef } from "react";
import { Camera, FolderOpen } from "lucide-react";
import Button from "../ui/Button";

interface UploadButtonProps {
  onFileSelect: (file: File) => void;
}

const ACCEPTED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/heif",
  "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024;

export default function UploadButton({ onFileSelect }: UploadButtonProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <Button
        fullWidth
        className="h-14 rounded-xl text-base gap-2"
        onClick={() => cameraRef.current?.click()}
      >
        <Camera className="h-5 w-5" />
        Scan Form
      </Button>
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      <Button
        variant="outline"
        fullWidth
        className="h-14 rounded-xl text-base gap-2"
        onClick={() => fileRef.current?.click()}
      >
        <FolderOpen className="h-5 w-5" />
        Upload File
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,application/pdf"
        onChange={handleFile}
        className="hidden"
      />

      <p className="text-center text-xs text-slate-400">
        Accepts JPG, PNG, HEIC, PDF — Max 10MB
      </p>
    </div>
  );
}

export { ACCEPTED_TYPES, MAX_SIZE };
