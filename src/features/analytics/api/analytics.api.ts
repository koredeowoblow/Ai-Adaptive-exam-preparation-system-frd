import { apiClient } from '../../../shared/api-client/client';

export interface AnalyticsSummary {
  averageScore: number;
  averageElo: number;
  topicsMastered: number;
  currentStreak: number;
}

export interface PerformanceTrend {
  sessionId: string;
  date: string;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
}

export interface TrendData {
  value: number;
  isPositive: boolean;
}

export interface SubjectPerformance {
  name: string;
  avg: number;
  attempts?: number;
  masteryPercentage?: number;
  nextTopic?: string;
  topicBreakdown?: { name: string; score: number }[];
  questionTypeBreakdown?: { type: string; score: number }[];
  difficultyDistribution?: { level: string; percentage: number }[];
  comparativeBadge?: string;
}

export interface TopicToRevisit {
  topicId: string;
  topicName: string;
  elo: number;
  reason: string;
  masteryScore?: number;
  lastAttempted?: string;
  recommendedAction?: 'Practice' | 'Review' | 'Challenge';
  accuracyTrend?: number[];
  estimatedTime?: string;
}

export interface StudentAnalyticsData {
  summary: AnalyticsSummary;
  performanceTrend: PerformanceTrend[];
  trend: TrendData | null;
  subjectPerformance: SubjectPerformance[];
  topicsToRevisit: TopicToRevisit[];
  insights: string[];
}

export interface DetailedStudentAnalyticsData extends StudentAnalyticsData {
  student?: {
    _id: string;
    name: string;
    email: string;
    level?: string;
    department?: { _id: string; name: string };
    enrolledCourses?: { _id: string; title: string; code: string }[];
    isOnboarded: boolean;
    createdAt?: string;
  };
  summary: AnalyticsSummary & {
    averageEloLevel?: string;
    longestStreak?: number;
    totalSessions?: number;
    totalQuestionsAnswered?: number;
    totalCorrectAnswers?: number;
    overallAccuracy?: number;
    examReadinessScore?: number;
    examReadinessLevel?: string;
    averageTrustScore?: number;
  };
  topicMasteryList?: {
    topicId: string;
    topicName: string;
    courseName: string;
    eloRating: number;
    masteryScore: number;
    level: string;
    questionsAttempted: number;
    questionsCorrect: number;
    accuracy: number;
    lastAttemptedAt?: string;
  }[];
  strengths?: {
    topicId: string;
    topicName: string;
    elo: number;
    accuracy?: number;
    level?: string;
  }[];
  recentSessions?: {
    sessionId: string;
    courseTitle: string;
    courseCode?: string;
    score: number;
    trustScore: number;
    status: string;
    questionsAnswered: number;
    correctAnswers: number;
    startedAt?: string;
    endedAt?: string;
    durationMinutes?: number;
  }[];
  integritySummary?: {
    totalLogs: number;
    avgTrustScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    recentEvents: {
      eventType: string;
      severity: string;
      timestamp: string;
    }[];
  };
}

export interface DetailedCourseAnalyticsData {
  course: {
    _id: string;
    code: string;
    title: string;
    description: string;
    level: number;
    department?: { _id: string; name: string } | null;
    createdAt?: string;
  };
  summary: {
    totalStudents: number;
    activeSessions: number;
    completedSessions: number;
    totalSessions: number;
    averageScore: number;
    passRate: number;
    overallAccuracy: number;
    averageMastery: number;
    averageEloRating: number;
    examReadinessScore: number;
    questionBankCount: number;
  };
  cohortLevels: {
    level: string;
    studentCount: number;
    sessionsCount: number;
    averageScore: number;
    passRate: number;
    examReadinessScore: number;
  }[];
  topics: {
    topicId: string;
    name: string;
    order: number;
    questionCount: number;
    studentAttempts: number;
    accuracy: number;
    masteryScore: number;
    eloRating: number;
    difficultyTier: string;
    status: 'HEALTHY' | 'NEEDS_REVIEW' | 'CRITICAL';
  }[];
  questionBankHealth: {
    totalQuestions: number;
    multipleChoice: number;
    theory: number;
  };
  enrolledStudents: {
    studentId: string;
    name: string;
    email: string;
    level: string;
    averageScore: number;
    eloRating: number;
    sessionsCount: number;
    isOnboarded: boolean;
  }[];
  recentSessions: {
    sessionId: string;
    studentName: string;
    studentEmail: string;
    studentLevel: string;
    score: number;
    questionsAnswered: number;
    correctAnswers: number;
    trustScore: number;
    status: string;
    endedAt?: string;
    durationMinutes: number;
  }[];
  insights: string[];
}

export interface DetailedDepartmentAnalyticsData {
  department: {
    _id: string;
    name: string;
    description: string;
    createdAt?: string;
  };
  summary: {
    totalStudents: number;
    totalCourses: number;
    totalTopics: number;
    totalQuestions: number;
    totalSessions: number;
    averageScore: number;
    passRate: number;
    overallAccuracy: number;
    departmentReadinessScore: number;
  };
  levelBreakdown: {
    level: string;
    studentCount: number;
    activeCount: number;
    averageScore: number;
    passRate: number;
    examReadinessScore: number;
  }[];
  courses: {
    courseId: string;
    code: string;
    title: string;
    level: number;
    topicCount: number;
    enrolledStudents: number;
    averageScore: number;
    passRate: number;
    status: 'EXCELLENT' | 'AVERAGE' | 'NEEDS_ATTENTION';
  }[];
  topStudents: {
    studentId: string;
    name: string;
    email: string;
    level: string;
    averageScore: number;
    sessionsCount: number;
  }[];
  insights: string[];
}

export interface DetailedTopicAnalyticsData {
  topic: {
    _id: string;
    name: string;
    order: number;
    course?: {
      _id: string;
      code: string;
      title: string;
      department?: { _id: string; name: string } | null;
    } | null;
  };
  summary: {
    questionCount: number;
    totalAttempts: number;
    averageAccuracy: number;
    masteryScore: number;
    averageEloRating: number;
    masteredStudentsCount: number;
    atRiskStudentsCount: number;
    difficultyTier: string;
  };
  masteryTiers: {
    beginner: number;
    developing: number;
    competent: number;
    master: number;
  };
  questions: {
    questionId: string;
    type: string;
    questionText: string;
    optionsCount: number;
    difficulty: string;
    eloRating: number;
  }[];
  strugglingStudents: {
    studentId: string;
    name: string;
    email: string;
    level: string;
    masteryScore: number;
    eloRating: number;
  }[];
  insights: string[];
}

export interface CohortBenchmarkData {
  cohort: {
    departmentName: string;
    level: string;
    cohortLabel: string;
    totalStudents: number;
    cohortAverage: number;
    cohortMedian: number;
  };
  student: {
    id: string;
    name: string;
    averageScore: number;
    percentile: number;
    tier: string;
    tierColor: string;
  };
  radar: {
    key: string;
    label: string;
    studentScore: number;
    cohortScore: number;
    delta: number;
  }[];
  insights: {
    topStrength: {
      label: string;
      delta: number;
      score: number;
    };
    topGrowthArea: {
      label: string;
      delta: number;
      score: number;
    };
  };
  distribution: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    top10: number;
    max: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export const analyticsApi = {
  getStudentAnalytics: async (): Promise<ApiResponse<StudentAnalyticsData>> => {
    return apiClient.get('/analytics/me');
  },
  getCohortBenchmark: async (): Promise<ApiResponse<CohortBenchmarkData>> => {
    return apiClient.get('/analytics/cohort-benchmark');
  },
  getStudentAnalyticsById: async (studentId: string): Promise<ApiResponse<DetailedStudentAnalyticsData>> => {
    return apiClient.get(`/analytics/student/${studentId}`);
  },
  getCourseAnalyticsById: async (courseId: string): Promise<ApiResponse<DetailedCourseAnalyticsData>> => {
    return apiClient.get(`/analytics/course/${courseId}`);
  },
  getDepartmentAnalyticsById: async (deptId: string): Promise<ApiResponse<DetailedDepartmentAnalyticsData>> => {
    return apiClient.get(`/analytics/department/${deptId}`);
  },
  getTopicAnalyticsById: async (topicId: string): Promise<ApiResponse<DetailedTopicAnalyticsData>> => {
    return apiClient.get(`/analytics/topic/${topicId}`);
  },
};
