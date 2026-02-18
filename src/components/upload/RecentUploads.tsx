import { useMemo, useState } from "react";
import { FileText, FileSearch, Pencil } from "lucide-react";
import { useUploadStore, type Upload } from "../../stores/useUploadStore";
import StatusBadge from "./StatusBadge";
import UpdateRequestModal from "./UpdateRequestModal";
import { formatRelativeTime } from "../../utils/formatters";

export default function RecentUploads() {
  const allUploads = useUploadStore((s) => s.uploads);
  const getUpdateRequestForUpload = useUploadStore((s) => s.getUpdateRequestForUpload);

  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);

  const uploads = useMemo(() => {
    return [...allUploads]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(0, 5);
  }, [allUploads]);

  if (uploads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileSearch className="h-16 w-16 text-slate-300 mb-3" />
        <p className="text-base font-medium text-slate-500">No uploads yet</p>
        <p className="text-sm text-slate-400 mt-1">
          Scan or upload your first form to get started
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {uploads.map((upload) => {
          const updateReq = getUpdateRequestForUpload(upload.id);
          const hasUpdateRequest = updateReq?.status === "submitted" || updateReq?.status === "pending";

          return (
            <div
              key={upload.id}
              className="bg-[var(--color-card-bg)] rounded-lg shadow-sm p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {upload.fileName}
                </p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {upload.extractedData ? (
                    <>
                      {upload.extractedData.headerFields?.find((f) => f.field_name === "foreman_name")?.extracted_value || "N/A"} |{" "}
                      {upload.extractedData.headerFields?.find((f) => f.field_name === "date")?.extracted_value || "N/A"} |{" "}
                      {upload.extractedData.totalWorkers || 0} workers
                    </>
                  ) : (
                    formatRelativeTime(upload.uploadedAt)
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {hasUpdateRequest ? (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full whitespace-nowrap">
                    Update Requested
                  </span>
                ) : upload.status === "approved" ? (
                  <button
                    onClick={() => setSelectedUpload(upload)}
                    className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                ) : null}

                <StatusBadge status={upload.status} />
              </div>
            </div>
          );
        })}
      </div>

      {selectedUpload && (
        <UpdateRequestModal
          upload={selectedUpload}
          onClose={() => setSelectedUpload(null)}
        />
      )}
    </>
  );
}
