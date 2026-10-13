import { BookOpen, Laptop, Target, FileText, AlertCircle, Microscope, Activity, Stethoscope, BarChart2, Hash, Pencil, Type, Zap } from 'lucide-react';
import React from 'react';

export interface AITutorSuggestedPrompt {
  icon: React.ElementType;
  label: string;
  description: string;
  value: string;
}

export const COURSE_PROMPT_MAP: Record<string, AITutorSuggestedPrompt[]> = {
  CSC: [
    {
      icon: BookOpen,
      label: "Explain this CS concept",
      description: "Get a clear explanation of algorithms, data structures, or design patterns",
      value: "Explain this Computer Science concept:",
    },
    {
      icon: Laptop,
      label: "Walk me through this algorithm",
      description: "Step-by-step algorithm walkthrough with examples",
      value: "Walk me through this algorithm step-by-step:",
    },
    {
      icon: Target,
      label: "Quiz me on Data Structures",
      description: "Test your understanding with targeted questions",
      value: "Quiz me on Data Structures concepts:",
    },
    {
      icon: FileText,
      label: "Give me an exam-style coding question",
      description: "Practice with realistic exam problems",
      value: "Give me an exam-style coding question:",
    },
    {
      icon: AlertCircle,
      label: "Explain where my code went wrong",
      description: "Debug and understand coding errors",
      value: "Help me debug this code and explain the issue:",
    },
  ],
  BIO: [
    {
      icon: BookOpen,
      label: "Explain this biological concept",
      description: "Understand processes, systems, and organisms",
      value: "Explain this biological concept:",
    },
    {
      icon: Microscope,
      label: "Help me understand this pathway",
      description: "Break down biological pathways and processes",
      value: "Explain this biological pathway:",
    },
    {
      icon: Target,
      label: "Quiz me on this topic",
      description: "Test your knowledge with targeted questions",
      value: "Quiz me on this Biology topic:",
    },
    {
      icon: Stethoscope,
      label: "Give me an exam-style case study",
      description: "Practice with realistic medical/biology cases",
      value: "Give me an exam-style Biology case study:",
    },
    {
      icon: BarChart2,
      label: "Explain this diagram",
      description: "Interpret biological diagrams and structures",
      value: "Explain this biological diagram:",
    },
  ],
  MAT: [
    {
      icon: BookOpen,
      label: "Explain this theorem",
      description: "Understand mathematical concepts and proofs",
      value: "Explain this mathematical theorem:",
    },
    {
      icon: Hash,
      label: "Walk me through this problem step-by-step",
      description: "Solve problems with detailed explanations",
      value: "Walk me through this Math problem step-by-step:",
    },
    {
      icon: Target,
      label: "Quiz me on this topic",
      description: "Test your understanding with practice problems",
      value: "Quiz me on this Mathematics topic:",
    },
    {
      icon: Pencil,
      label: "Give me a practice problem",
      description: "Get targeted practice problems at your level",
      value: "Give me a practice problem on:",
    },
    {
      icon: AlertCircle,
      label: "Explain where I made an error",
      description: "Understand your mistakes with detailed feedback",
      value: "Explain where I made an error in this solution:",
    },
  ],
  ENG: [
    {
      icon: BookOpen,
      label: "Explain this literary concept",
      description: "Understand themes, motifs, and literary devices",
      value: "Explain this literary concept:",
    },
    {
      icon: FileText,
      label: "Help me analyze this text",
      description: "Break down passages and analyze their meaning",
      value: "Help me analyze this passage:",
    },
    {
      icon: Target,
      label: "Quiz me on this novel",
      description: "Test your understanding of the reading",
      value: "Quiz me on this text:",
    },
    {
      icon: Pencil,
      label: "Give me an essay prompt",
      description: "Practice writing with an exam-style prompt",
      value: "Give me an exam-style essay prompt:",
    },
    {
      icon: Type,
      label: "Review my thesis statement",
      description: "Get feedback on your writing",
      value: "Review my thesis statement and suggest improvements:",
    },
  ],
  PHY: [
    {
      icon: BookOpen,
      label: "Explain this physics concept",
      description: "Understand forces, motion, energy, and waves",
      value: "Explain this physics concept:",
    },
    {
      icon: Zap,
      label: "Walk me through this problem",
      description: "Solve physics problems with step-by-step guidance",
      value: "Walk me through this physics problem:",
    },
    {
      icon: Target,
      label: "Quiz me on this topic",
      description: "Test your physics knowledge",
      value: "Quiz me on this Physics topic:",
    },
    {
      icon: FileText,
      label: "Give me an exam-style question",
      description: "Practice with realistic exam problems",
      value: "Give me an exam-style Physics question:",
    },
    {
      icon: BarChart2,
      label: "Explain this diagram",
      description: "Interpret physics diagrams and graphs",
      value: "Explain this physics diagram:",
    },
  ],
  DEFAULT: [
    {
      icon: BookOpen,
      label: "Explain this concept",
      description: "Get a clear explanation of any topic",
      value: "Explain this concept:",
    },
    {
      icon: Target,
      label: "Help me understand this topic",
      description: "Break down difficult material",
      value: "Help me understand this topic:",
    },
    {
      icon: Activity,
      label: "Quiz me",
      description: "Test your knowledge",
      value: "Quiz me on this:",
    },
    {
      icon: Pencil,
      label: "Give me a practice question",
      description: "Practice with an exam-style question",
      value: "Give me a practice question on:",
    },
  ],
};

export const getPromptsForCourse = (courseCode?: string): AITutorSuggestedPrompt[] => {
  if (!courseCode) return COURSE_PROMPT_MAP.DEFAULT;
  const prefix = courseCode.substring(0, 3).toUpperCase();
  return COURSE_PROMPT_MAP[prefix] || COURSE_PROMPT_MAP.DEFAULT;
};
