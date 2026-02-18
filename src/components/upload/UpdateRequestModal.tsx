import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useUploadStore, type Upload } from '../../stores/useUploadStore';
import { useToastStore } from '../../stores/useToastStore';
import { fieldDefinitions } from '../../config/fields';

interface UpdateRequestModalProps {
  upload: Upload;
  onClose: () => void;
}

const MAX_CHARS = 500;

export default function UpdateRequestModal({ upload, onClose }: UpdateRequestModalProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { submitUpdateRequest } = useUploadStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (visible) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError('Please describe what needs to be changed.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await submitUpdateRequest(upload.id, description.trim(), upload.submittedBy);
      addToast('Update request submitted — an admin will review it', 'success');
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit request. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center transition-all duration-300 ${
        visible ? 'bg-black/40' : 'bg-transparent'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full lg:max-w-lg bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl transition-transform duration-300 ${
          visible ? 'translate-y-0' : 'translate-y-full lg:translate-y-8 lg:opacity-0'
        }`}
      >
        <div className="flex justify-center pt-3 pb-1 lg:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Request Correction</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Original Record
            </p>
            {fieldDefinitions.map((field) => {
              const extracted = upload.extractedData?.fields.find(
                (f) => f.field_name === field.name
              );
              return (
                <div key={field.name} className="flex items-start justify-between gap-3 py-1">
                  <span className="text-sm text-slate-500 shrink-0">{field.label}</span>
                  <span className="text-sm font-medium text-slate-800 text-right truncate max-w-[60%]">
                    {extracted?.extracted_value || <span className="text-slate-400 italic">Not captured</span>}
                  </span>
                </div>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Describe what needs to be changed
            </label>
            <textarea
              ref={textareaRef}
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setDescription(e.target.value);
                  setError(null);
                }
              }}
              placeholder="e.g., Worker ID should be EMP-4522 instead of EMP-4521"
              rows={4}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 transition"
            />
            <div className="flex items-center justify-between mt-1">
              {error ? (
                <p className="text-xs text-red-500">{error}</p>
              ) : (
                <span />
              )}
              <p
                className={`text-xs ml-auto ${
                  description.length >= MAX_CHARS
                    ? 'text-red-500 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {description.length} / {MAX_CHARS}
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-6 pt-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="w-full h-12 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
