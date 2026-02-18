import { create } from 'zustand';
import { fetchRecords, fetchUpdateRequests } from '../services/api';

export interface DashboardRecord {
  timestamp: string;
  submittedBy: string;
  status: string;
  [key: string]: string;
}

export interface DashboardUpdateRequest {
  row: number;
  timestamp: string;
  originalRow: number | null;
  requestedBy: string;
  description: string;
  status: string;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface UserCount {
  user: string;
  count: number;
}

export interface ConfidencePoint {
  date: string;
  avgConfidence: number;
}

export interface DashboardStats {
  totalRecords: number;
  todayCount: number;
  approvedCount: number;
  rejectedCount: number;
  approvalRate: number;
  submissionsByDay: DailyCount[];
  submissionsByUser: UserCount[];
  approvalBreakdown: { name: string; value: number }[];
  confidenceTrend: ConfidencePoint[];
}

function generateMockData(): DashboardRecord[] {
  const names = ['Carlos M.', 'James T.', 'Aisha R.', 'Derek L.', 'Priya S.'];
  const foremen = ['Rodriguez', 'Okafor', 'Chen', 'Williams'];
  const records: DashboardRecord[] = [];

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const base = isWeekend ? 5 : 18;
    const count = Math.max(0, base + Math.floor(Math.random() * 8) - 4);

    for (let j = 0; j < count; j++) {
      const name = names[Math.floor(Math.random() * names.length)];
      const foreman = foremen[Math.floor(Math.random() * foremen.length)];
      const confidence = 0.7 + Math.random() * 0.3;
      const approved = Math.random() > 0.06;
      records.push({
        timestamp: new Date(d.getTime() + j * 60000 * 15).toISOString(),
        worker_name: name,
        worker_id: `W${1000 + Math.floor(Math.random() * 999)}`,
        foreman,
        entry_date: d.toISOString().split('T')[0],
        submittedBy: name,
        status: approved ? 'Approved' : 'Rejected',
        _confidence: confidence.toFixed(2),
      });
    }
  }
  return records;
}

function parseRecordsFromSheet(
  headers: string[],
  rows: string[][]
): DashboardRecord[] {
  return rows.map((row) => {
    const record: DashboardRecord = { timestamp: '', submittedBy: '', status: '' };
    headers.forEach((h, idx) => {
      record[h.toLowerCase().replace(/\s+/g, '_')] = row[idx] ?? '';
    });
    if (!record.timestamp) record.timestamp = row[0] ?? '';
    if (!record.submittedby && row.length > 1) record.submittedBy = row[row.length - 2] ?? '';
    if (!record.status && row.length > 0) record.status = row[row.length - 1] ?? '';
    return record;
  });
}

interface DateRange {
  start: string | null;
  end: string | null;
}

interface DashboardState {
  records: DashboardRecord[];
  updateRequests: DashboardUpdateRequest[];
  isLoading: boolean;
  lastFetched: Date | null;
  error: string | null;
  dateRange: DateRange;
  searchQuery: string;
  demoMode: boolean;

  fetchDashboardData: () => Promise<void>;
  setDateRange: (start: string | null, end: string | null) => void;
  setSearchQuery: (q: string) => void;
  getFilteredRecords: () => DashboardRecord[];
  getStats: () => DashboardStats;
}

export const useDashboardStore = create<DashboardState>()((set, get) => ({
  records: [],
  updateRequests: [],
  isLoading: false,
  lastFetched: null,
  error: null,
  dateRange: { start: null, end: null },
  searchQuery: '',
  demoMode: false,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [recordsResp, requestsResp] = await Promise.all([
        fetchRecords(),
        fetchUpdateRequests(),
      ]);

      let records: DashboardRecord[] = [];
      if (recordsResp.success && recordsResp.data) {
        records = parseRecordsFromSheet(
          recordsResp.data.headers,
          recordsResp.data.rows
        );
      }

      let updateRequests: DashboardUpdateRequest[] = [];
      if (requestsResp.success && requestsResp.data) {
        updateRequests = requestsResp.data.requests;
      }

      set({
        records,
        updateRequests,
        isLoading: false,
        lastFetched: new Date(),
        demoMode: false,
      });
    } catch {
      const mockRecords = generateMockData();
      set({
        records: mockRecords,
        updateRequests: [],
        isLoading: false,
        lastFetched: new Date(),
        error: null,
        demoMode: true,
      });
    }
  },

  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  getFilteredRecords: () => {
    const { records, dateRange, searchQuery } = get();
    let filtered = records;

    if (dateRange.start) {
      filtered = filtered.filter(
        (r) => r.timestamp >= dateRange.start!
      );
    }
    if (dateRange.end) {
      const endDay = dateRange.end + 'T23:59:59';
      filtered = filtered.filter((r) => r.timestamp <= endDay);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((r) =>
        Object.values(r).some((v) =>
          String(v).toLowerCase().includes(q)
        )
      );
    }

    return filtered;
  },

  getStats: () => {
    const filtered = get().getFilteredRecords();
    const today = new Date().toISOString().split('T')[0];

    const totalRecords = filtered.length;
    const todayCount = filtered.filter(
      (r) => r.timestamp.startsWith(today)
    ).length;
    const approvedCount = filtered.filter(
      (r) => r.status?.toLowerCase() === 'approved'
    ).length;
    const rejectedCount = filtered.filter(
      (r) => r.status?.toLowerCase() === 'rejected'
    ).length;
    const approvalRate =
      totalRecords > 0 ? Math.round((approvedCount / totalRecords) * 100) : 0;

    const dayMap: Record<string, number> = {};
    filtered.forEach((r) => {
      const day = r.timestamp.split('T')[0];
      dayMap[day] = (dayMap[day] ?? 0) + 1;
    });

    const now = new Date();
    const submissionsByDay: DailyCount[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split('T')[0];
      return { date: key, count: dayMap[key] ?? 0 };
    });

    const userMap: Record<string, number> = {};
    filtered.forEach((r) => {
      const u = r.submittedBy || r.submittedby || 'Unknown';
      userMap[u] = (userMap[u] ?? 0) + 1;
    });
    const submissionsByUser: UserCount[] = Object.entries(userMap)
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const approvalBreakdown = [
      { name: 'Approved', value: approvedCount },
      { name: 'Rejected', value: rejectedCount || totalRecords - approvedCount },
    ];

    const confDayMap: Record<string, { sum: number; count: number }> = {};
    filtered.forEach((r) => {
      const day = r.timestamp.split('T')[0];
      const conf = parseFloat(r._confidence ?? '0.85');
      if (!confDayMap[day]) confDayMap[day] = { sum: 0, count: 0 };
      confDayMap[day].sum += isNaN(conf) ? 0.85 : conf;
      confDayMap[day].count += 1;
    });
    const confidenceTrend: ConfidencePoint[] = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const key = d.toISOString().split('T')[0];
      const entry = confDayMap[key];
      return {
        date: key,
        avgConfidence: entry
          ? Math.round((entry.sum / entry.count) * 100)
          : 0,
      };
    });

    return {
      totalRecords,
      todayCount,
      approvedCount,
      rejectedCount,
      approvalRate,
      submissionsByDay,
      submissionsByUser,
      approvalBreakdown,
      confidenceTrend,
    };
  },
}));
