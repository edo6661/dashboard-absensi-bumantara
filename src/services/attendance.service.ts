import api from "../lib/axios";
import type { ApiResponse } from "../types/api_response";
import type {
  Attendance,
  AttendanceHistoryParams,
  CursorPaginatedData,
} from "../types/models/attendance";
export const attendanceService = {
  getHistory: async (params: AttendanceHistoryParams) => {
    const apiParams = { ...params };

    if (apiParams.startDate) {
      apiParams.startDate = new Date(
        `${apiParams.startDate}T00:00:00`,
      ).toISOString();
    }

    if (apiParams.endDate) {
      apiParams.endDate = new Date(
        `${apiParams.endDate}T23:59:59`,
      ).toISOString();
    }

    const { data } = await api.get<
      ApiResponse<CursorPaginatedData<Attendance>>
    >("/attendance/history", { params: apiParams });
    return data.data;
  },
};
