import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { Upload } from '../../stores/useUploadStore';

interface ReviewQueueProps {
  pendingUploads: Upload[];
  activeUploadId: string;
  onSelectUpload: (id: string) => void;
  onDeleteUpload: (id: string) => void;
}

export function ReviewQueue({
  pendingUploads,
  activeUploadId,
  onSelectUpload,
  onDeleteUpload,
}: ReviewQueueProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (pendingUploads.length <= 1) {
    return null;
  }

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
    onDeleteUpload(id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(null);
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide">
      <div className="flex gap-2 p-2">
        {pendingUploads.map((upload, index) => {
          const isActive = upload.id === activeUploadId;
          const isConfirming = confirmDeleteId === upload.id;

          return (
            <div
              key={upload.id}
              onClick={() => {
                if (!isConfirming) onSelectUpload(upload.id);
              }}
              className={`
                flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all cursor-pointer
                ${
                  isActive
                    ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-600 ring-opacity-30'
                    : 'border-slate-300 bg-white hover:border-slate-400'
                }
              `}
            >
              {isConfirming ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-red-600">Delete?</span>
                  <button
                    onClick={(e) => handleConfirmDelete(e, upload.id)}
                    className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs font-medium rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Yes
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    No
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-sm font-medium whitespace-nowrap">
                    {index + 1}. {upload.fileName}
                  </span>
                  <button
                    onClick={(e) => handleDeleteClick(e, upload.id)}
                    className={`
                      p-0.5 rounded transition-colors flex-shrink-0
                      ${isActive ? 'text-blue-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}
                    `}
                    title="Delete from queue"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
