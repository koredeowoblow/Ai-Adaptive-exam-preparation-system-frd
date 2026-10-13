export interface SampleOption {
  id: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export type DifficultyLevel = 'Easy' | 'Medium' | 'Harder';

export interface SampleQuestion {
  id: string;
  courseCode: string;
  courseTitle: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: SampleOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export const SAMPLE_QUESTIONS: SampleQuestion[] = [
  {
    id: 'sample_mth101_limit',
    courseCode: 'MTH 101',
    courseTitle: 'Elementary Mathematics I',
    difficulty: 'Easy',
    questionText: 'What is the limit of (sin x) / x as x approaches 0?',
    options: [
      { id: 'A', text: '0' },
      { id: 'B', text: '1' },
      { id: 'C', text: 'Infinity' },
      { id: 'D', text: 'Undefined' },
    ],
    correctAnswer: 'B',
    explanation:
      "By standard trigonometric limits and L'Hôpital's rule, the derivative of sin(x) is cos(x) and the derivative of x is 1. As x approaches 0, cos(0)/1 evaluates to 1.",
  },
  {
    id: 'sample_phy101_charge',
    courseCode: 'PHY 101',
    courseTitle: 'General Physics I',
    difficulty: 'Easy',
    questionText: 'What is the SI unit of electric charge?',
    options: [
      { id: 'A', text: 'Ampere' },
      { id: 'B', text: 'Volt' },
      { id: 'C', text: 'Coulomb' },
      { id: 'D', text: 'Ohm' },
    ],
    correctAnswer: 'C',
    explanation:
      'Electric charge is measured in coulombs (C), defined as the charge transported by a constant current of one ampere in one second.',
  },
  {
    id: 'sample_csc101_index',
    courseCode: 'CSC 101',
    courseTitle: 'Introduction to Computer Science',
    difficulty: 'Easy',
    questionText: 'In Python, which zero-based index accesses the second element of a list?',
    options: [
      { id: 'A', text: '0' },
      { id: 'B', text: '1' },
      { id: 'C', text: '2' },
      { id: 'D', text: '-1' },
    ],
    correctAnswer: 'B',
    explanation:
      'Python sequences use zero-based indexing where the first element is at index 0 and the second element is at index 1.',
  },
  {
    id: 'sample_mth102_det',
    courseCode: 'MTH 102',
    courseTitle: 'Elementary Mathematics II',
    difficulty: 'Medium',
    questionText: 'What is the determinant of the 2x2 matrix with row 1 [3, 2] and row 2 [1, 4]?',
    options: [
      { id: 'A', text: '10' },
      { id: 'B', text: '14' },
      { id: 'C', text: '6' },
      { id: 'D', text: '-2' },
    ],
    correctAnswer: 'A',
    explanation:
      'The determinant of a 2x2 matrix [[a, b], [c, d]] is computed as ad - bc. Here, (3 × 4) - (2 × 1) = 12 - 2 = 10.',
  },
  {
    id: 'sample_mth101_exp',
    courseCode: 'MTH 101',
    courseTitle: 'Elementary Mathematics I',
    difficulty: 'Medium',
    questionText: 'What is the derivative of f(x) = e^(3x) with respect to x?',
    options: [
      { id: 'A', text: 'e^(3x)' },
      { id: 'B', text: '3e^(3x)' },
      { id: 'C', text: '3e^(2x)' },
      { id: 'D', text: '(1/3)e^(3x)' },
    ],
    correctAnswer: 'B',
    explanation:
      'Applying the chain rule, the derivative of e^u with respect to x is e^u × (du/dx). Differentiating the exponent 3x gives 3, yielding 3e^(3x).',
  },
  {
    id: 'sample_phy101_force',
    courseCode: 'PHY 101',
    courseTitle: 'General Physics I',
    difficulty: 'Medium',
    questionText: 'A body of mass 4 kg accelerates at 3 m/s². What net force acts on the body?',
    options: [
      { id: 'A', text: '7 N' },
      { id: 'B', text: '1.33 N' },
      { id: 'C', text: '12 N' },
      { id: 'D', text: '24 N' },
    ],
    correctAnswer: 'C',
    explanation:
      "According to Newton's second law, net force is the product of mass and acceleration (F = ma). Multiplying 4 kg by 3 m/s² yields 12 newtons.",
  },
  {
    id: 'sample_mth201_orthogonal',
    courseCode: 'MTH 201',
    courseTitle: 'Mathematical Methods I',
    difficulty: 'Harder',
    questionText: 'If vectors u = [2, -1, 3] and v = [1, 4, k] are orthogonal, what is the value of k?',
    options: [
      { id: 'A', text: '2/3' },
      { id: 'B', text: '-2/3' },
      { id: 'C', text: '2' },
      { id: 'D', text: '-2' },
    ],
    correctAnswer: 'A',
    explanation:
      'Orthogonal vectors have a dot product of zero: (2)(1) + (-1)(4) + (3)(k) = 0. Simplifying gives -2 + 3k = 0, which resolves to k = 2/3.',
  },
  {
    id: 'sample_csc201_bst',
    courseCode: 'CSC 201',
    courseTitle: 'Data Structures and Algorithms',
    difficulty: 'Harder',
    questionText: 'What is the average time complexity of searching in a balanced Binary Search Tree with n nodes?',
    options: [
      { id: 'A', text: 'O(1)' },
      { id: 'B', text: 'O(n)' },
      { id: 'C', text: 'O(log n)' },
      { id: 'D', text: 'O(n log n)' },
    ],
    correctAnswer: 'C',
    explanation:
      'Each comparison in a balanced binary search tree cuts the remaining search space in half. The height and search cost are therefore O(log n).',
  },
];
