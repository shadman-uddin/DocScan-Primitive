export interface ExtractedField {
  field_name: string;
  extracted_value: string | null;
  confidence: number;
}

export interface ExtractedRow {
  row_index: number;
  fields: ExtractedField[];
}

export interface DatabaseUpload {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string | null;
  thumbnail_url: string | null;
  status: 'pending_review' | 'approved' | 'rejected';
  uploaded_at: string;
  submitted_by: string;
  extracted_data: {
    headerFields: ExtractedField[];
    rows: ExtractedRow[];
    totalWorkers: number;
    processingTime?: number;
    model?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface UploadInsert {
  file_name: string;
  file_type: string;
  file_size: number;
  file_url?: string | null;
  thumbnail_url?: string | null;
  status?: 'pending_review' | 'approved' | 'rejected';
  uploaded_at?: string;
  submitted_by?: string;
  extracted_data?: DatabaseUpload['extracted_data'];
}

export interface UploadUpdate {
  file_name?: string;
  file_type?: string;
  file_size?: number;
  file_url?: string | null;
  thumbnail_url?: string | null;
  status?: 'pending_review' | 'approved' | 'rejected';
  submitted_by?: string;
  extracted_data?: DatabaseUpload['extracted_data'];
}
