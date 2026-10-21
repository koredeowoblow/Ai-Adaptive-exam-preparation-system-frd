export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionSubPart {
  id: string; // e.g. "a", "b_i", "b_ii"
  label: string; // e.g. "1(a)", "1(b)(i)", "(a)"
  prompt: string;
  maxMarks?: number;
  modelAnswer: string;
  rubric: { point: string; weight: number }[];
  diagramUrl?: string;
  diagramCaption?: string;
  order?: number;
}

export interface Question {
  _id: string;
  type: 'MULTIPLE_CHOICE' | 'THEORY';
  topicId: string | { _id: string; name: string };
  questionText: string;
  diagramUrl?: string;
  diagramCaption?: string;
  hasSubParts?: boolean;
  subParts?: QuestionSubPart[];
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
  diagramUrl?: string;
  diagramCaption?: string;
  hasSubParts?: boolean;
  subParts?: QuestionSubPart[];
  options?: QuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  difficulty?: number;
  eloRating?: number;
  explanation?: string;
  explanationSource?: 'manual' | 'ai';
}

export interface UpdateQuestionDTO {
  type?: 'MULTIPLE_CHOICE' | 'THEORY';
  questionText?: string;
  diagramUrl?: string;
  diagramCaption?: string;
  hasSubParts?: boolean;
  subParts?: QuestionSubPart[];
  options?: QuestionOption[];
  correctAnswer?: string;
  modelAnswer?: string;
  rubric?: { point: string; weight: number }[];
  difficulty?: number;
  eloRating?: number;
  explanation?: string;
  explanationSource?: 'manual' | 'ai';
}
