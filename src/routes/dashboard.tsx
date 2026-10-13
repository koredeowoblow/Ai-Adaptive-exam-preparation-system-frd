import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "../features/auth/utils/authGuard";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ context }) => {
    const authData = await requireAuth(context, {
      allowedRoles: ['student'],
      requireOnboarded: true,
    });
    return { studentId: authData.id };
  },
});
