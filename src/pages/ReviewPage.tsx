import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useUploadStore } from '../stores/useUploadStore';
import { useToastStore } from '../stores/useToastStore';
import { ImageViewer } from '../components/review/ImageViewer';
import { ExtractedFieldCard } from '../components/review/ExtractedFieldCard';
import { ReviewActions } from '../components/review/ReviewActions';
import { ReviewQueue } from '../components/review/ReviewQueue';
import { fieldDefinitions } from '../config/fields';
import { appendToSheet } from '../services/api';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const {
    getPendingReviews,
    approveUpload,
    removeUpload,
    updateExtractedField,
    syncWithDatabase,
    demoMode,
  } = useUploadStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const pendingReviews = getPendingReviews();

  useEffect(() => {
    syncWithDatabase();
  }, [syncWithDatabase]);

  const activeUpload = pendingReviews[activeIndex];

  const doApprove = useCallback(async () => {
    if (!activeUpload) return;

    setIsProcessing(true);
    setApproveError(null);

    try {
      let sheetRowNumber: number | null = null;

      if (demoMode) {
        sheetRowNumber = Math.floor(Math.random() * 900) + 100;
      } else {
        const fieldData: Record<string, string> = {};
        activeUpload.extractedData?.fields.forEach((f) => {
          fieldData[f.field_name] = f.extracted_value ?? '';
        });

        const result = await appendToSheet(
          fieldData,
          activeUpload.submittedBy,
          activeUpload.id,
          activeUpload.fileName
        );

        sheetRowNumber = result.data?.rowNumber ?? null;
      }

      await approveUpload(activeUpload.id, sheetRowNumber);
      addToast('Record saved to sheet', 'success');

      if (activeIndex < pendingReviews.length - 1) {
        setActiveIndex(activeIndex);
      } else if (pendingReviews.length > 1) {
        setActiveIndex(Math.max(0, activeIndex - 1));
      } else {
        setActiveIndex(0);
      }

      await syncWithDatabase();
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Failed to save record. Please try again.';

      if (msg === 'offline') {
        setApproveError("You're offline. Please reconnect and try again.");
        addToast("You're offline. Please reconnect and try again.", 'error');
      } else {
        setApproveError(msg);
        addToast(msg, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [activeUpload, activeIndex, pendingReviews.length, approveUpload, addToast, syncWithDatabase, demoMode]);

  const handleApprove = useCallback(() => {
    setApproveError(null);
    doApprove();
  }, [doApprove]);

  const handleRetry = useCallback(() => {
    setApproveError(null);
    doApprove();
  }, [doApprove]);

  const handleReupload = async () => {
    if (!activeUpload) return;

    setIsProcessing(true);
    setApproveError(null);
    try {
      await removeUpload(activeUpload.id);
      addToast('Upload removed', 'success');

      if (pendingReviews.length > 1) {
        setActiveIndex(Math.max(0, activeIndex - 1));
        await syncWithDatabase();
      } else {
        navigate('/');
      }
    } catch (error) {
      addToast('Failed to remove upload', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (fieldName: string, newValue: string) => {
    if (!activeUpload) return;
    updateExtractedField(activeUpload.id, fieldName, newValue);
  };

  const handleSelectUpload = (id: string) => {
    const index = pendingReviews.findIndex((u) => u.id === id);
    if (index !== -1) {
      setActiveIndex(index);
      setApproveError(null);
    }
  };

  const handleDeleteUpload = async (id: string) => {
    try {
      const deletingIndex = pendingReviews.findIndex((u) => u.id === id);
      await removeUpload(id);
      addToast('Item removed from queue', 'success');

      if (pendingReviews.length <= 1) {
        navigate('/');
        return;
      }

      await syncWithDatabase();

      if (id === activeUpload?.id) {
        setActiveIndex(Math.max(0, deletingIndex - 1));
      } else if (deletingIndex < activeIndex) {
        setActiveIndex(activeIndex - 1);
      }

      setApproveError(null);
    } catch {
      addToast('Failed to remove item', 'error');
    }
  };

  if (pendingReviews.length === 0) {
    return (
      <div className="h-[calc(100vh-56px)] lg:h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">All caught up!</h2>
          <p className="text-sm text-slate-500 mb-6">No forms waiting for review</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Upload New Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px-80px)] lg:h-screen flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Review Queue</h1>
        <div className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
          {pendingReviews.length} pending
        </div>
      </div>

      {pendingReviews.length > 1 && (
        <ReviewQueue
          pendingUploads={pendingReviews}
          activeUploadId={activeUpload?.id || ''}
          onSelectUpload={handleSelectUpload}
          onDeleteUpload={handleDeleteUpload}
        />
      )}

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="h-[50vh] lg:h-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200">
          <ImageViewer
            imageUrl={activeUpload?.thumbnailUrl || null}
            alt={activeUpload?.fileName}
          />
        </div>

        <div className="flex-1 flex flex-col lg:w-1/2">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="bg-white rounded-2xl shadow-lg p-4 space-y-3">
              {fieldDefinitions.map((field) => {
                const extractedField = activeUpload?.extractedData?.fields.find(
                  (f) => f.field_name === field.name
                );

                return (
                  <ExtractedFieldCard
                    key={field.name}
                    label={field.label}
                    fieldName={field.name}
                    value={extractedField?.extracted_value || null}
                    confidence={extractedField?.confidence || null}
                    onChange={handleFieldChange}
                  />
                );
              })}

              <p className="text-xs text-slate-400 mt-4">
                Tap any field to edit. Low-confidence fields are highlighted.
              </p>
            </div>
          </div>

          {approveError && (
            <div className="mx-4 mb-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{approveError}</p>
            </div>
          )}

          <div className="p-4 bg-white border-t border-slate-200 shadow-lg">
            <ReviewActions
              onReupload={handleReupload}
              onApprove={handleApprove}
              onRetry={handleRetry}
              isProcessing={isProcessing}
              hasError={!!approveError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
