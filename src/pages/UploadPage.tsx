import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Clock, CheckCircle, X } from "lucide-react";
import { useUploadStore } from "../stores/useUploadStore";
import { useToastStore } from "../stores/useToastStore";
import { processAndExtract, generateMockExtraction } from "../services/extraction";
import { uploadFileToStorage } from "../services/storage";
import {
  generatePdfThumbnail,
  generateImageThumbnail,
  isPdfFile,
  isImageFile
} from "../utils/pdfThumbnail";
import { fieldDefinitions } from "../config/fields";
import StatsCard from "../components/upload/StatsCard";
import UploadButton, { ACCEPTED_TYPES, MAX_SIZE } from "../components/upload/UploadButton";
import FilePreview from "../components/upload/FilePreview";
import UploadProgress from "../components/upload/UploadProgress";
import RecentUploads from "../components/upload/RecentUploads";
import Button from "../components/ui/Button";

export default function UploadPage() {
  const navigate = useNavigate();
  const uploads = useUploadStore((s) => s.uploads);
  const {
    currentFile,
    isUploading,
    uploadProgress,
    setCurrentFile,
    setUploading,
    setProgress,
    addUpload,
    demoMode,
    setDemoMode,
    syncWithDatabase,
  } = useUploadStore();
  const { addToast } = useToastStore();

  const [fileError, setFileError] = useState<string | null>(null);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    syncWithDatabase();
  }, [syncWithDatabase]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayUploads = uploads.filter(
      (u) => u.uploadedAt.split("T")[0] === today
    );
    return {
      total: todayUploads.length,
      pending: todayUploads.filter((u) => u.status === "pending_review").length,
      approved: todayUploads.filter((u) => u.status === "approved").length,
      rejected: todayUploads.filter((u) => u.status === "rejected").length,
    };
  }, [uploads]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      setFileError(null);

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setFileError("File type not supported");
        return;
      }
      if (file.size > MAX_SIZE) {
        setFileError("File exceeds 10MB limit");
        return;
      }

      setCurrentFile(file);
    },
    [setCurrentFile]
  );

  const handleRemove = useCallback(() => {
    setCurrentFile(null);
    setFileError(null);
  }, [setCurrentFile]);

  const handleSubmit = useCallback(async () => {
    if (!currentFile) return;

    setUploading(true);
    setProgress(0);
    setFileError(null);

    let progress = 0;
    intervalRef.current = setInterval(() => {
      if (progress < 60) {
        progress += 3;
      } else if (progress < 90) {
        progress += 1;
      }
      setProgress(Math.min(progress, 90));
    }, 100);

    try {
      let thumbnailUrl: string;

      if (isPdfFile(currentFile)) {
        thumbnailUrl = await generatePdfThumbnail(currentFile);
      } else if (isImageFile(currentFile)) {
        thumbnailUrl = await generateImageThumbnail(currentFile);
      } else {
        throw new Error('Unsupported file type');
      }

      let extractionResult;

      try {
        extractionResult = await processAndExtract(currentFile, fieldDefinitions);

        if (!extractionResult.success) {
          throw new Error(extractionResult.error || 'Extraction failed');
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('API extraction failed:', msg, error);
        extractionResult = generateMockExtraction(fieldDefinitions);
        setDemoMode(true);
      }

      if (intervalRef.current) clearInterval(intervalRef.current);
      setProgress(95);

      const uploadData = {
        file_name: currentFile.name,
        file_type: currentFile.type,
        file_size: currentFile.size,
        thumbnail_url: thumbnailUrl,
        status: 'pending_review' as const,
        uploaded_at: new Date().toISOString(),
        submitted_by: 'Field Operator',
        extracted_data: extractionResult.data || null,
      };

      const upload = await addUpload(uploadData);

      let fileUrl: string | null = null;
      try {
        fileUrl = await uploadFileToStorage(currentFile, upload.id);
        await syncWithDatabase();
      } catch (storageError) {
        console.warn('Failed to upload to storage, continuing without file URL:', storageError);
      }

      setProgress(100);

      setCurrentFile(null);
      setUploading(false);
      setProgress(0);

      setTimeout(() => {
        navigate('/review');
      }, 300);
    } catch (error) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      console.error('Upload error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process upload';
      setFileError(errorMessage);
      addToast(errorMessage, 'error');

      setUploading(false);
      setProgress(0);
    }
  }, [
    currentFile,
    setUploading,
    setProgress,
    addUpload,
    setCurrentFile,
    navigate,
    addToast,
    setDemoMode,
    syncWithDatabase,
  ]);

  return (
    <div className="px-4 py-4 lg:px-8">
      {demoMode && showDemoBanner && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-sm text-amber-700 font-medium mb-1">
                Demo Mode — Worker Connection Failed
              </p>
              <p className="text-xs text-amber-600">
                Using simulated AI extraction. Check that the worker URL is correct and accessible.
              </p>
            </div>
            <button
              onClick={() => setShowDemoBanner(false)}
              className="text-amber-600 hover:text-amber-800 flex-shrink-0"
              aria-label="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="lg:max-w-5xl lg:mx-auto">
        <div className="flex gap-3 mb-4">
          <StatsCard
            label="Today's Uploads"
            value={stats.total}
            icon={Upload}
          />
          <StatsCard
            label="Pending Review"
            value={stats.pending}
            icon={Clock}
            valueColor={stats.pending > 0 ? "#f59e0b" : undefined}
          />
          <StatsCard
            label="Approved"
            value={stats.approved}
            icon={CheckCircle}
            valueColor="#16a34a"
          />
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6">
          <div>
            <div className="bg-[var(--color-card-bg)] rounded-xl shadow-md p-6 mb-4">
              <h2
                className="text-lg font-semibold mb-1"
                style={{ color: "var(--color-text-primary)" }}
              >
                Scan or Upload Form
              </h2>
              <p
                className="text-sm mb-5"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Take a photo of a handwritten form or upload a file
              </p>

              <UploadButton onFileSelect={handleFileSelect} />

              {fileError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 text-center mb-2">
                    {fileError}
                  </p>
                  <Button
                    fullWidth
                    variant="outline"
                    className="h-10 rounded-lg text-sm"
                    onClick={() => {
                      setFileError(null);
                      if (currentFile) {
                        handleSubmit();
                      }
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {currentFile && !isUploading && !fileError && (
                <>
                  <FilePreview file={currentFile} onRemove={handleRemove} />
                  <Button
                    fullWidth
                    className="mt-4 h-12 rounded-xl text-sm"
                    onClick={handleSubmit}
                  >
                    Submit for Processing
                  </Button>
                </>
              )}

              {isUploading && <UploadProgress progress={uploadProgress} />}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-base font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Recent Uploads
              </h3>
              <button
                className="text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                View All
              </button>
            </div>
            <RecentUploads />
          </div>
        </div>
      </div>
    </div>
  );
}
