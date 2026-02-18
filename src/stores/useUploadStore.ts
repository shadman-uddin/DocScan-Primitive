import { create } from "zustand";
import {
  getAllUploads,
  insertUpload as dbInsertUpload,
  updateUpload as dbUpdateUpload,
  deleteUpload as dbDeleteUpload,
  getTodayStats as dbGetTodayStats,
} from "../services/database";
import { submitUpdateRequest as apiSubmitUpdateRequest } from "../services/api";
import type { DatabaseUpload, UploadInsert } from "../types/database";

export interface ExtractedField {
  field_name: string;
  extracted_value: string | null;
  confidence: number;
}

export interface Upload {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  status: "pending_review" | "approved" | "rejected";
  uploadedAt: string;
  submittedBy: string;
  extractedData: {
    fields: ExtractedField[];
    processingTime?: number;
    model?: string;
  } | null;
  sheetRowNumber?: number | null;
}

export interface UpdateRequest {
  uploadId: string;
  description: string;
  status: "pending" | "submitted" | "error";
  submittedAt: string;
  requestId?: number | null;
}

interface UploadState {
  uploads: Upload[];
  currentFile: File | null;
  isUploading: boolean;
  uploadProgress: number;
  isLoading: boolean;
  demoMode: boolean;
  updateRequests: UpdateRequest[];
  addUpload: (upload: UploadInsert) => Promise<Upload>;
  removeUpload: (id: string) => Promise<void>;
  updateUploadStatus: (id: string, status: Upload["status"]) => void;
  setCurrentFile: (file: File | null) => void;
  setUploading: (uploading: boolean) => void;
  setProgress: (progress: number) => void;
  getRecentUploads: (count: number) => Upload[];
  getTodayStats: () => Promise<{ total: number; pending: number; approved: number }>;
  syncWithDatabase: () => Promise<void>;
  getPendingReviews: () => Upload[];
  approveUpload: (id: string, sheetRowNumber?: number | null) => Promise<void>;
  rejectUpload: (id: string) => Promise<void>;
  updateExtractedField: (uploadId: string, fieldName: string, newValue: string) => void;
  setDemoMode: (enabled: boolean) => void;
  submitUpdateRequest: (uploadId: string, description: string, requestedBy?: string) => Promise<void>;
  getUpdateRequestForUpload: (uploadId: string) => UpdateRequest | undefined;
}

function convertDatabaseToUpload(dbUpload: DatabaseUpload): Upload {
  return {
    id: dbUpload.id,
    fileName: dbUpload.file_name,
    fileType: dbUpload.file_type,
    fileSize: dbUpload.file_size,
    fileUrl: dbUpload.file_url,
    thumbnailUrl: dbUpload.thumbnail_url,
    status: dbUpload.status,
    uploadedAt: dbUpload.uploaded_at,
    submittedBy: dbUpload.submitted_by,
    extractedData: dbUpload.extracted_data,
  };
}

export const useUploadStore = create<UploadState>()((set, get) => ({
  uploads: [],
  currentFile: null,
  isUploading: false,
  uploadProgress: 0,
  isLoading: false,
  demoMode: false,
  updateRequests: [],

  syncWithDatabase: async () => {
    try {
      set({ isLoading: true });
      const dbUploads = await getAllUploads();
      const uploads = dbUploads.map(convertDatabaseToUpload);
      set({ uploads, isLoading: false });
    } catch (error) {
      console.error("Failed to sync with database:", error);
      set({ isLoading: false });
    }
  },

  addUpload: async (uploadData: UploadInsert) => {
    try {
      const dbUpload = await dbInsertUpload(uploadData);
      const upload = convertDatabaseToUpload(dbUpload);
      set((state) => ({ uploads: [upload, ...state.uploads] }));
      return upload;
    } catch (error) {
      console.error("Failed to add upload:", error);
      throw error;
    }
  },

  removeUpload: async (id: string) => {
    try {
      await dbDeleteUpload(id);
      set((state) => ({ uploads: state.uploads.filter((u) => u.id !== id) }));
    } catch (error) {
      console.error("Failed to remove upload:", error);
      throw error;
    }
  },

  updateUploadStatus: (id, status) =>
    set((state) => ({
      uploads: state.uploads.map((u) => (u.id === id ? { ...u, status } : u)),
    })),

  setCurrentFile: (file) => set({ currentFile: file }),
  setUploading: (uploading) => set({ isUploading: uploading }),
  setProgress: (progress) => set({ uploadProgress: progress }),

  getRecentUploads: (count) => {
    const sorted = [...get().uploads].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
    return sorted.slice(0, count);
  },

  getTodayStats: async () => {
    try {
      return await dbGetTodayStats();
    } catch (error) {
      console.error("Failed to get today stats:", error);
      return { total: 0, pending: 0, approved: 0 };
    }
  },

  getPendingReviews: () => {
    return get().uploads.filter((u) => u.status === "pending_review");
  },

  approveUpload: async (id: string, sheetRowNumber?: number | null) => {
    try {
      await dbUpdateUpload(id, { status: "approved" });
      set((state) => ({
        uploads: state.uploads.map((u) =>
          u.id === id
            ? { ...u, status: "approved" as const, sheetRowNumber: sheetRowNumber ?? u.sheetRowNumber }
            : u
        ),
      }));
    } catch (error) {
      console.error("Failed to approve upload:", error);
      throw error;
    }
  },

  rejectUpload: async (id: string) => {
    try {
      await dbUpdateUpload(id, { status: "rejected" });
      set((state) => ({
        uploads: state.uploads.map((u) =>
          u.id === id ? { ...u, status: "rejected" as const } : u
        ),
      }));
    } catch (error) {
      console.error("Failed to reject upload:", error);
      throw error;
    }
  },

  updateExtractedField: (uploadId: string, fieldName: string, newValue: string) => {
    set((state) => ({
      uploads: state.uploads.map((u) => {
        if (u.id !== uploadId) return u;

        const existingData = u.extractedData ?? { fields: [] };
        const fieldExists = existingData.fields.some((f) => f.field_name === fieldName);

        const updatedFields = fieldExists
          ? existingData.fields.map((f) =>
              f.field_name === fieldName ? { ...f, extracted_value: newValue } : f
            )
          : [...existingData.fields, { field_name: fieldName, extracted_value: newValue, confidence: 1 }];

        return {
          ...u,
          extractedData: {
            ...existingData,
            fields: updatedFields,
          },
        };
      }),
    }));

    const upload = get().uploads.find((u) => u.id === uploadId);
    if (upload?.extractedData) {
      dbUpdateUpload(uploadId, { extracted_data: upload.extractedData }).catch((error) =>
        console.error("Failed to update extracted field:", error)
      );
    }
  },

  setDemoMode: (enabled: boolean) => set({ demoMode: enabled }),

  submitUpdateRequest: async (uploadId: string, description: string, requestedBy = "Field Operator") => {
    const { demoMode, uploads } = get();
    const upload = uploads.find((u) => u.id === uploadId);

    const pendingEntry: UpdateRequest = {
      uploadId,
      description,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };

    set((state) => ({
      updateRequests: [
        ...state.updateRequests.filter((r) => r.uploadId !== uploadId),
        pendingEntry,
      ],
    }));

    if (demoMode || !upload?.sheetRowNumber) {
      set((state) => ({
        updateRequests: state.updateRequests.map((r) =>
          r.uploadId === uploadId ? { ...r, status: "submitted", requestId: null } : r
        ),
      }));
      return;
    }

    try {
      const result = await apiSubmitUpdateRequest(
        upload.sheetRowNumber,
        requestedBy,
        description
      );

      set((state) => ({
        updateRequests: state.updateRequests.map((r) =>
          r.uploadId === uploadId
            ? { ...r, status: "submitted", requestId: result.data?.requestId ?? null }
            : r
        ),
      }));
    } catch (error) {
      set((state) => ({
        updateRequests: state.updateRequests.map((r) =>
          r.uploadId === uploadId ? { ...r, status: "error" } : r
        ),
      }));
      throw error;
    }
  },

  getUpdateRequestForUpload: (uploadId: string) => {
    return get().updateRequests.find((r) => r.uploadId === uploadId);
  },
}));
