import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '../features/auth/utils/authGuard';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const adminUser = await requireAuth(context, {
      allowedRoles: ['admin', 'superAdmin'],
    });
    return { adminUser };
  },
});
