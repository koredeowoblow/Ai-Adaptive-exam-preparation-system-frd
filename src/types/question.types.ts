export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  _id: string;
  type: 'MULTIPLE_CHOICE' | 'THEORY';
  topicId: string | { _id: string; name: string };
  questionText: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  difficulty?: number;
  eloRating: number;
  explanation: string;
  explanationSource?: 'manual' | 'ai';
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionDTO {
  type?: 'MULTIPLE_CHOICE' | 'THEORY';
  topicId: string;
  questionText: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  difficulty?: number;
  eloRating?: number;
  explanation: string;
  explanationSource?: 'manual' | 'ai';
}

export interface UpdateQuestionDTO {
  type?: 'MULTIPLE_CHOICE' | 'THEORY';
  questionText?: string;
  options?: QuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  difficulty?: number;
  eloRating?: number;
  explanation?: string;
  explanationSource?: 'manual' | 'ai';
}
