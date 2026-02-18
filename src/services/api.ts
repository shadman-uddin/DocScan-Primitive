const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export interface ExtractionRequest {
  image: string;
  mimeType: string;
  fieldDefinitions: Array<{ name: string; label: string; type: string }>;
}

export interface ExtractionResponse {
  success: boolean;
  data?: {
    fields: Array<{
      field_name: string;
      extracted_value: string | null;
      confidence: number;
    }>;
    processingTime: number;
    model: string;
  };
  error?: string;
}

export interface SheetAppendResponse {
  success: boolean;
  data?: { rowNumber: number | null; sheetUrl: string };
  error?: string;
}

export interface SheetRecordsResponse {
  success: boolean;
  data?: { headers: string[]; rows: string[][]; totalRows: number };
  error?: string;
}

export interface UpdateRequestResponse {
  success: boolean;
  data?: { requestId: number | null };
  error?: string;
}

export interface UpdateRequestsResponse {
  success: boolean;
  data?: {
    requests: Array<{
      row: number;
      timestamp: string;
      originalRow: number | null;
      requestedBy: string;
      description: string;
      status: string;
    }>;
  };
  error?: string;
}

export async function extractFromImage(
  base64Image: string,
  mimeType: string,
  fieldDefinitions: Array<{ name: string; label: string; type: string }>
): Promise<ExtractionResponse> {
  const response = await fetch(`${API_BASE}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, mimeType, fieldDefinitions }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function appendToSheet(
  data: Record<string, string>,
  submittedBy: string,
  uploadId: string,
  fileName?: string
): Promise<SheetAppendResponse> {
  if (!navigator.onLine) {
    throw new Error('offline');
  }

  const response = await fetch(`${API_BASE}/api/sheets/append`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, submittedBy, uploadId, fileName }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function fetchRecords(): Promise<SheetRecordsResponse> {
  if (!navigator.onLine) {
    throw new Error('offline');
  }

  const response = await fetch(`${API_BASE}/api/sheets/records`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function submitUpdateRequest(
  originalRowNumber: number,
  requestedBy: string,
  description: string
): Promise<UpdateRequestResponse> {
  if (!navigator.onLine) {
    throw new Error('offline');
  }

  const response = await fetch(`${API_BASE}/api/sheets/update-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalRowNumber, requestedBy, description }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `API error: ${response.status}`);
  }

  return response.json();
}

export interface HealthResponse {
  success?: boolean;
  status?: string;
  hasAnthropicKey: boolean;
  hasSheetId: boolean;
  hasServiceAccount: boolean;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchUpdateRequests(): Promise<UpdateRequestsResponse> {
  if (!navigator.onLine) {
    throw new Error('offline');
  }

  const response = await fetch(`${API_BASE}/api/sheets/update-requests`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { error?: string }).error || `API error: ${response.status}`);
  }

  return response.json();
}
