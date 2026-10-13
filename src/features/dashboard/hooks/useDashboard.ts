import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
import { queryKeys } from "../../../shared/queryKeys";

export const useStudentDashboard = (studentId: string) => {
  return useQuery({
    queryKey: queryKeys.dashboard.student(studentId),
    queryFn: async () => {
      const response = await dashboardApi.getStudentDashboard();
      return response.data;
    },
    enabled: !!studentId,
  });
};
