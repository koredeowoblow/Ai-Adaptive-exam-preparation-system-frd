import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '../shared/components/layout/AppLayout';
import { ExamWizard } from '../features/exam-prep/components/ExamWizard';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { useAuth } from '../features/auth/hooks/useAuth';

export const Route = createFileRoute('/exam-prep')({
  component: ExamPrepRoute,
});

function ExamPrepRoute() {
  useDocumentTitle('Practice EduAdapt');
  const { user } = useAuth();

  return (
    <AppLayout userName={user?.name || "Student"}>
      <div className="page-container page-catalog">
        {/* 2-Step Wizard */}
        <ExamWizard />
      </div>
    </AppLayout>
  );
}
