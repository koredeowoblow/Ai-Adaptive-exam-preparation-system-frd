import { createLazyFileRoute } from '@tanstack/react-router';
import { StudentDashboard } from '../features/dashboard/components/StudentDashboard';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { useAuth } from '../features/auth/hooks/useAuth';

export const Route = createLazyFileRoute('/dashboard')({
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user } = useAuth();
  const { studentId } = Route.useRouteContext();
  return (
    <AppLayout userName={user?.name || "Student"}>
      <StudentDashboard studentId={studentId} />
    </AppLayout>
  );
}
