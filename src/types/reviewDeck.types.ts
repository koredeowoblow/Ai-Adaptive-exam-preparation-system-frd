export type LeitnerBox = 1 | 2 | 3 | 4 | 5;
export type ReviewRating = 'again' | 'good' | 'easy';

export interface ReviewQuestionOption {
  id: string;
  text: string;
}

export interface ReviewQuestion {
  _id: string;
  questionText?: string;
  text?: string;
  type: 'MULTIPLE_CHOICE' | 'THEORY';
  options?: ReviewQuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  explanationSource?: 'manual' | 'ai';
  difficulty?: number;
  tags?: string[];
  imageUrl?: string;
  diagramUrl?: string;
}

export interface ReviewCard {
  _id: string;
  studentId: string;
  questionId: ReviewQuestion;
  courseId: {
    _id: string;
    title: string;
    code: string;
  };
  topicId: {
    _id: string;
    name: string;
  };
  box: LeitnerBox;
  intervalDays: number;
  consecutiveCorrect: number;
  totalReviews: number;
  totalLapses: number;
  lastReviewedAt?: string;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDeckSummary {
  totalCards: number;
  dueToday: number;
  boxes: {
    box1: number;
    box2: number;
    box3: number;
    box4: number;
    box5: number;
  };
  retentionRate: number;
}

export interface ReviewDeckSummaryResponse {
  statusCode: number;
  message: string;
  data: ReviewDeckSummary;
}

export interface DueCardsResponse {
  statusCode: number;
  message: string;
  data: ReviewCard[];
}

export interface SubmitReviewResponse {
  statusCode: number;
  message: string;
  data: ReviewCard;
}
