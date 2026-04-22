export interface Attendance {
  id: string;
  userName: string;
  userRole: string;
  userNik: string | null;
  recordedByName: string;
  recordedByRole: string;
  isSelfAttendance: boolean;
  recordedAt: string;
  userPerusahaanNama?: string | null;
  confidence: number | null;
  capturedImageUrl: string | null;
  type: "IN" | "OUT";
  latitude: number | null;
  longitude: number | null;
  projectId: string | null;
  projectName: string | null;
  message?: string;
}

export interface AttendanceHistoryParams {
  limit?: number;
  page?: number;
  cursor?: string;
  search?: string;
  type?: "IN" | "OUT" | "";
  sortOrder?: "desc" | "asc";
  startDate?: string;
  endDate?: string;
  role?: string;
  perusahaanId?: string;
  projectId?: string;
}

export interface PaginationMeta {
  nextCursor?: string | null;
  hasNextPage?: boolean;
  total?: number;
  lastPage?: number;
  page?: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}
