import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type StudentAnalyticsData } from '../api/analytics.api';

export const useStudentAnalytics = () => {
  return useQuery({
    queryKey: ['analytics', 'me'],
    queryFn: async () => {
      const response = await analyticsApi.getStudentAnalytics();
      return response.data as StudentAnalyticsData;
    },
  });
};
