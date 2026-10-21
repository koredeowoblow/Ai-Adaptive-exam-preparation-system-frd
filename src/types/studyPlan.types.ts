export type StudyTaskType = 'STUDY' | 'PRACTICE' | 'REVISION' | 'EXAM_PREP';
export type StudyWeekStatus = 'NOT_STARTED' | 'GENERATING' | 'READY';
export type StudyPlanStatus = 'active' | 'archived';

export interface StudyPlanTask {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    code: string;
    level?: number;
  } | string;
  topicId?: {
    _id: string;
    name: string;
  } | string | null;
  title: string;
  description?: string;
  type: StudyTaskType;
  durationMinutes: number;
  completedAt: string | null;
}

export interface StudyPlanDay {
  date: string; // YYYY-MM-DD
  dayName: string; // Monday, Tuesday, etc.
  tasks: StudyPlanTask[];
}

export interface StudyPlanWeek {
  weekNumber: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: StudyWeekStatus;
  generatingStartedAt: string | null;
  summary: string;
  days: StudyPlanDay[];
}

export interface StudyPlan {
  _id: string;
  studentId: string;
  status: StudyPlanStatus;
  archivedReason?: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalWeeks: number;
  skeletonVersion: number;
  examDatesSnapshot: Record<string, string>;
  completionPercentage: number;
  totalTasks: number;
  completedTasks: number;
  stale?: boolean;
  weeks: StudyPlanWeek[];
  createdAt: string;
  updatedAt: string;
}

export interface StudyPlanResponse {
  success: boolean;
  message?: string;
  data: StudyPlan;
}

export interface StudyPlanListResponse {
  success: boolean;
  message?: string;
  data: StudyPlan[];
}

export interface TaskToggleResponse {
  success: boolean;
  message?: string;
  data: {
    task: StudyPlanTask;
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
  };
}
