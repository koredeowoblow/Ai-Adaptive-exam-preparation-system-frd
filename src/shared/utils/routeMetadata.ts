import { useLocation } from '@tanstack/react-router';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export interface RouteMeta {
  title: string;
  breadcrumbs: BreadcrumbItem[];
}

/**
 * Maps pathname patterns to page title and breadcrumbs.
 * Allows nested pages to display hierarchy without hardcoding in individual views.
 */
export function getRouteMetadata(pathname: string): RouteMeta {
  // Normalize trailing slash
  const path = pathname.replace(/\/$/, '') || '/';

  // Exact or prefix matches
  if (path === '/' || path === '/dashboard') {
    return { title: 'Dashboard', breadcrumbs: [] };
  }

  if (path === '/exam-prep') {
    return { title: 'Practice', breadcrumbs: [] };
  }

  if (path === '/courses') {
    return { title: 'Courses', breadcrumbs: [] };
  }

  if (path.startsWith('/courses/')) {
    const courseId = path.split('/courses/')[1];
    return {
      title: 'Course Overview',
      breadcrumbs: [
        { label: 'Courses', to: '/courses' },
        { label: courseId ? `Course ${courseId.slice(0, 8)}` : 'Course' },
      ],
    };
  }

  if (path === '/ai-chat') {
    return { title: 'AI Tutor', breadcrumbs: [] };
  }

  if (path === '/practice/history') {
    return {
      title: 'History',
      breadcrumbs: [
        { label: 'Practice', to: '/exam-prep' },
        { label: 'History' },
      ],
    };
  }

  if (path.startsWith('/practice_/') || path.startsWith('/practice/')) {
    return {
      title: 'Session Review',
      breadcrumbs: [
        { label: 'Practice', to: '/exam-prep' },
        { label: 'Review' },
      ],
    };
  }

  if (path.startsWith('/exam/')) {
    return {
      title: 'Active Session',
      breadcrumbs: [
        { label: 'Practice', to: '/exam-prep' },
        { label: 'Exam' },
      ],
    };
  }

  if (path === '/analytics') {
    return { title: 'Analytics', breadcrumbs: [] };
  }

  if (path === '/achievements') {
    return { title: 'Achievements', breadcrumbs: [] };
  }

  if (path === '/leaderboard') {
    return { title: 'Leaderboard', breadcrumbs: [] };
  }

  if (path === '/study-planner') {
    return { title: 'Study Planner', breadcrumbs: [] };
  }

  if (path === '/profile') {
    return { title: 'Profile', breadcrumbs: [] };
  }

  if (path === '/admin') {
    return { title: 'Admin Overview', breadcrumbs: [] };
  }

  if (path === '/admin/users') {
    return {
      title: 'Users',
      breadcrumbs: [
        { label: 'Admin', to: '/admin' },
        { label: 'Users' },
      ],
    };
  }

  if (path.startsWith('/admin/users')) {
    return {
      title: 'User Details',
      breadcrumbs: [
        { label: 'Admin', to: '/admin' },
        { label: 'Users', to: '/admin/users' },
        { label: 'User' },
      ],
    };
  }

  if (path.startsWith('/admin/courses')) {
    return {
      title: 'Courses Management',
      breadcrumbs: [
        { label: 'Admin', to: '/admin' },
        { label: 'Courses' },
      ],
    };
  }

  if (path.startsWith('/admin/topics')) {
    return {
      title: 'Topics Management',
      breadcrumbs: [
        { label: 'Admin', to: '/admin' },
        { label: 'Topics' },
      ],
    };
  }

  if (path.startsWith('/admin/questions')) {
    return {
      title: 'Question Bank',
      breadcrumbs: [
        { label: 'Admin', to: '/admin' },
        { label: 'Questions' },
      ],
    };
  }

  if (path.startsWith('/admin/sessions')) {
    return {
      title: 'Sessions Integrity',
      breadcrumbs: [
        { label: 'Admin', to: '/admin' },
        { label: 'Sessions' },
      ],
    };
  }

  if (path.startsWith('/admin/integrity')) {
    return {
      title: 'Integrity Logs',
      breadcrumbs: [
        { label: 'Admin', to: '/admin' },
        { label: 'Integrity' },
      ],
    };
  }

  if (path.startsWith('/dev/components')) {
    return {
      title: 'Component Gallery',
      breadcrumbs: [
        { label: 'Dev' },
        { label: 'Components' },
      ],
    };
  }

  // Fallback title from path segment
  const segments = path.split('/').filter(Boolean);
  const rawTitle = segments[segments.length - 1] || 'Dashboard';
  const formattedTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).replace(/-/g, ' ');

  return {
    title: formattedTitle,
    breadcrumbs: [],
  };
}

/**
 * Hook to retrieve the current route title and breadcrumb trail.
 */
export function useRouteMetadata(): RouteMeta {
  const location = useLocation();
  return getRouteMetadata(location.pathname);
}
