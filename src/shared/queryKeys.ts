// Hierarchical Query Keys as defined by architecture rules

export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  departments: {
    all: () => ['departments'] as const,
    courses: (departmentId: string) => ['departments', departmentId, 'courses'] as const,
  },
  courses: {
    all: () => ['courses'] as const,
    detail: (courseId: string) => ['courses', courseId] as const,
  },
  topics: {
    all: (courseId: string) => ['topics', { courseId }] as const,
    detail: (topicId: string) => ['topics', topicId] as const,
  },
  dashboard: {
    student: (studentId: string) => ['dashboard', studentId] as const,
  },
  practice: {
    session: (sessionId: string) => ['practice-sessions', sessionId] as const,
  },

  rbac: {
    roles: () => ['rbac', 'roles'] as const,
    role: (roleId: string) => ['rbac', 'roles', roleId] as const,
    permissions: () => ['rbac', 'permissions'] as const,
  }
};
