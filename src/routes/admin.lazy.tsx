import { createLazyFileRoute } from '@tanstack/react-router';
import { AdminLayout } from '../features/admin/components/AdminLayout';

export const Route = createLazyFileRoute('/admin')({
  component: AdminLayout,
});
