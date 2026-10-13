import { createFileRoute } from '@tanstack/react-router';
import { requireAuth } from '../features/auth/utils/authGuard';

export const Route = createFileRoute('/ai-chat')({
  beforeLoad: async ({ context }) => {
    return requireAuth(context, {
      allowedRoles: ['student'],
      requireOnboarded: true,
    });
  },
});
