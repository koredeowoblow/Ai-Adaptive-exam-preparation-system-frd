import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, type UpdateProfilePayload } from '../api/student.api';
import { toast } from 'sonner';

export const useStudentProfile = () =>
  useQuery({
    queryKey: ['student', 'profile'],
    queryFn: async () => {
      const res = await studentApi.getProfile();
      return res.data;
    },
  });

export const useEnrolledCourses = () =>
  useQuery({
    queryKey: ['student', 'enrolled-courses'],
    queryFn: async () => {
      const res = await studentApi.getEnrolledCourses();
      return res.data;
    },
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfilePayload) => studentApi.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to update profile');
    },
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => studentApi.enrollCourse(courseId),
    onSuccess: () => {
      toast.success('Enrolled in course successfully!');
      queryClient.invalidateQueries({ queryKey: ['student', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['student', 'enrolled-courses'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to enroll in course');
    },
  });
};
