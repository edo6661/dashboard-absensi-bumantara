import { useQuery } from "@tanstack/react-query";
import { attendanceService } from "../services/attendance.service";
import type { AttendanceHistoryParams } from "../types/models/attendance";

export const useAttendanceHistory = (params: AttendanceHistoryParams) => {
  return useQuery({
    queryKey: ["attendance-history", params],
    queryFn: () => attendanceService.getHistory(params),

    staleTime: 1000 * 60 * 1,
  });
};
