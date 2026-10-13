import type { Question } from './question.types';

export type QuestionTypeMix = 'MIXED' | 'OBJECTIVE_ONLY' | 'THEORY_ONLY';

export interface PracticeAnswer {
  submissionId: string;
  questionId: string;
  topicId: string;
  difficulty: number;
  selectedAnswer?: string;
  writtenAnswer?: string;
  correct?: boolean;
  gradingStatus: 'PENDING' | 'GRADED';
  score?: number;
  feedback?: string;
  timeTaken?: number;
  answeredAt: string;
  aiExplanation?: string;
  explanationStatus?: 'PENDING' | 'READY' | 'FAILED';
}

export type AntiCheatEventType = 'TAB_SWITCH' | 'PASTE_DETECTED' | 'FAST_ANSWER' | 'DEVTOOLS_DETECTED' | 'RIGHT_CLICK_BLOCKED';

export interface IAntiCheatEvent {
  type: AntiCheatEventType;
  questionId?: string;
  timestamp: string;
  metadata?: any;
}

export interface PracticeSession {
  _id: string;
  studentId: string;
  courseId: string | any;
  startedAt: string;
  endedAt?: string;
  status: 'active' | 'completed' | 'PENDING_GRADING' | 'FAILED';
  currentQuestionId?: string;
  questionsServed: PracticeAnswer[];
  totalQuestions: number;
  questionsAnswered: number;
  correctAnswers: number;
  score: number;
  trustScore?: number;
  antiCheatEvents?: IAntiCheatEvent[];
  lateSubmission?: boolean;
  questionTypeMix?: QuestionTypeMix;
  clampedMessage?: string;
}

export interface AdminExamSession extends Omit<PracticeSession, 'studentId' | 'courseId'> {
  studentId: {
    _id: string;
    name: string;
    email: string;
    level?: string;
  } | string;
  courseId: {
    _id: string;
    title: string;
    code?: string;
  } | string;
}

export interface StartSessionPayload {
  courseId: string;
  totalQuestions?: number;
  questionType?: QuestionTypeMix;
}

export interface StartSessionResponse {
  session: PracticeSession;
  nextQuestion: Question | null;
  aiInterventionRequired?: boolean;
  clampedMessage?: string;
}

export interface GetSessionResponse {
  session: PracticeSession;
  totalServed?: number;
  questionsSummary?: { correct?: boolean; type: string }[];
  nextQuestion?: Question | null;
}

export interface SubmitAnswerPayload {
  submissionId?: string; // Optional for batch
  questionId: string;
  selectedAnswer?: string;
  writtenAnswer?: string;
  timeTaken?: number;
}

export interface SubmitBatchAnswersPayload {
  answers: SubmitAnswerPayload[];
}

export interface SubmitAnswerResponse {
  session: PracticeSession;
  isCorrect?: boolean;
  gradingStatus: 'PENDING' | 'GRADED';
  explanation?: string;
  completed: boolean;
  nextQuestion?: Question;
  aiInterventionRequired?: boolean;
  message?: string; // e.g. for idempotency message
}

export interface PracticeSessionListResponse {
  sessions: PracticeSession[];
  limit: number;
  cursor?: string;
}

export interface LogAntiCheatEventPayload {
  events: {
    type: AntiCheatEventType;
    questionId?: string;
    timestamp: Date | string;
    metadata?: any;
  }[];
}
