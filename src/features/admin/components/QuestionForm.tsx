import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import { CheckCircle2, Plus, Trash2, Eye, EyeOff, Sparkles, BookOpen, CheckSquare, Layers } from 'lucide-react';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import { MathToolbar } from '../../../shared/components/MathToolbar';
import { DiagramUploader } from './DiagramUploader';
import { SubPartEditor } from './SubPartEditor';
import { DiagramViewer } from '../../../shared/components/DiagramViewer';
import type { MathSymbolItem } from '../../../shared/constants/mathSymbols';
import {
  insertSymbolIntoInputOrTextarea,
  insertTemplateIntoInputOrTextarea,
} from '../../../shared/utils/mathInsert';
import type { CreateQuestionDTO } from '../../../types';
import type { Topic } from '../../../types/topic.types';
import type { Course } from '../../../types/course.types';
import type { QuestionSubPart } from '../../../types/question.types';

const optionSchema = z.object({
  id: z.string().min(1, 'Option ID is required'),
  text: z.string().min(1, 'Option text is required'),
});

const rubricSchema = z.object({
  point: z.string().min(1, 'Rubric criterion cannot be empty'),
  weight: z.number().positive('Weight must be greater than 0'),
});

const subPartSchema = z.object({
  id: z.string(),
  label: z.string().min(1, 'Label is required'),
  prompt: z.string().min(1, 'Prompt is required'),
  maxMarks: z.number().optional(),
  modelAnswer: z.string().min(1, 'Model answer is required'),
  rubric: z.array(rubricSchema).min(1, 'At least 1 rubric criterion required'),
  diagramUrl: z.string().optional(),
  diagramCaption: z.string().optional(),
  order: z.number().optional(),
});

const schema = z
  .object({
    type: z.enum(['MULTIPLE_CHOICE', 'THEORY']),
    questionText: z.string().min(5, 'Question prompt must be at least 5 characters'),
    topicId: z.string().min(1, 'Topic is required'),
    diagramUrl: z.string().optional(),
    diagramCaption: z.string().optional(),
    hasSubParts: z.boolean().default(false),
    subParts: z.array(subPartSchema).optional(),
    options: z.array(optionSchema).optional(),
    correctAnswer: z.string().optional(),
    modelAnswer: z.string().optional(),
    rubric: z.array(rubricSchema).optional(),
    difficulty: z.number().int().min(1, 'Difficulty must be at least 1').max(10, 'Difficulty cannot exceed 10'),
    explanation: z.string().optional(),
    eloRating: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'THEORY') {
      if (data.hasSubParts) {
        if (!data.subParts || data.subParts.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Multi-part questions must have at least one sub-part (e.g. 1a)',
            path: ['subParts'],
          });
        }
      } else {
        if (!data.modelAnswer || data.modelAnswer.trim().length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Model answer must be at least 5 characters for theory questions',
            path: ['modelAnswer'],
          });
        }
      }
    } else {
      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least 2 options are required for multiple choice',
          path: ['options'],
        });
      } else if (data.options.length > 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Maximum 6 options allowed',
          path: ['options'],
        });
      }
      if (!data.correctAnswer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select a correct answer',
          path: ['correctAnswer'],
        });
      } else if (data.options) {
        const optionIds = data.options.map((opt) => opt.id);
        if (!optionIds.includes(data.correctAnswer)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Correct answer must map to one of the defined options',
            path: ['correctAnswer'],
          });
        }
      }
      if (!data.explanation || data.explanation.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Answer explanation must be at least 5 characters',
          path: ['explanation'],
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

export interface QuestionFormProps {
  topics: Topic[];
  courses?: Course[];
  initialData?: Partial<FormData>;
  onSubmit: (data: CreateQuestionDTO) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

const DEFAULT_OPTION_IDS = ['A', 'B', 'C', 'D', 'E', 'F'];

export type AdminFocusedTarget =
  | { field: 'questionText'; element: HTMLTextAreaElement }
  | { field: 'modelAnswer'; element: HTMLTextAreaElement }
  | { field: 'rubric'; index: number; element: HTMLInputElement }
  | { field: 'options'; index: number; element: HTMLInputElement }
  | { field: 'explanation'; element: HTMLTextAreaElement };

export const QuestionForm: React.FC<QuestionFormProps> = ({
  topics,
  courses,
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  const [showLivePreview, setShowLivePreview] = React.useState(true);
  const [showMathPreview, setShowMathPreview] = React.useState(true);
  const [lastFocusedTarget, setLastFocusedTarget] = React.useState<AdminFocusedTarget | null>(null);

  const questionTextRef = React.useRef<HTMLTextAreaElement | null>(null);
  const modelAnswerRef = React.useRef<HTMLTextAreaElement | null>(null);
  const rubricInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  const optionInputsRef = React.useRef<(HTMLInputElement | null)[]>([]);
  const explanationRef = React.useRef<HTMLTextAreaElement | null>(null);

  const [showOptionPreviews, setShowOptionPreviews] = React.useState<Record<number, boolean>>({});
  const [showExplanationPreview, setShowExplanationPreview] = React.useState(true);

  const toggleOptionPreview = React.useCallback((idx: number) => {
    setShowOptionPreviews((prev) => ({
      ...prev,
      [idx]: prev[idx] !== undefined ? !prev[idx] : false,
    }));
  }, []);

  const getTopicCourseId = React.useCallback((topic?: Topic): string => {
    if (!topic || !topic.courseId) return '';
    return typeof topic.courseId === 'object' && topic.courseId !== null
      ? (topic.courseId as any)._id
      : String(topic.courseId);
  }, []);

  const getInitialCourseId = React.useCallback(() => {
    if (initialData?.topicId) {
      const matchTopic = topics.find((t) => t._id === initialData.topicId);
      if (matchTopic) return getTopicCourseId(matchTopic);
    }
    if (courses && courses.length > 0) {
      return courses[0]._id;
    }
    if (topics.length > 0) {
      return getTopicCourseId(topics[0]);
    }
    return '';
  }, [initialData, topics, courses, getTopicCourseId]);

  const [selectedCourseId, setSelectedCourseId] = React.useState<string>(getInitialCourseId);

  React.useEffect(() => {
    if (initialData?.topicId) {
      const matchTopic = topics.find((t) => t._id === initialData.topicId);
      if (matchTopic) {
        setSelectedCourseId(getTopicCourseId(matchTopic));
      }
    }
  }, [initialData?.topicId, topics, getTopicCourseId]);

  const availableTopics = React.useMemo(() => {
    if (!selectedCourseId) return topics;
    const filtered = topics.filter((t) => getTopicCourseId(t) === selectedCourseId);
    return filtered.length > 0 ? filtered : topics;
  }, [topics, selectedCourseId, getTopicCourseId]);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      type: initialData?.type || 'MULTIPLE_CHOICE',
      topicId: availableTopics[0]?._id || topics[0]?._id || '',
      difficulty: 5,
      eloRating: 1200,
      options: [
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ],
      correctAnswer: 'A',
      modelAnswer: '',
      rubric: [
        { point: 'Accurate definition & core explanation', weight: 5 },
        { point: 'Key properties and mathematical formulation', weight: 5 },
      ],
      explanation: '',
      ...initialData,
    },
  });

  React.useEffect(() => {
    if (initialData) {
      reset({
        type: initialData.type || 'MULTIPLE_CHOICE',
        difficulty: 5,
        eloRating: 1200,
        modelAnswer: '',
        rubric: [
          { point: 'Accurate definition & core explanation', weight: 5 },
          { point: 'Key properties and mathematical formulation', weight: 5 },
        ],
        ...initialData,
      });
      setLastFocusedTarget(null);
    } else {
      reset({
        type: 'MULTIPLE_CHOICE',
        topicId: availableTopics[0]?._id || topics[0]?._id || '',
        difficulty: 5,
        eloRating: 1200,
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' },
        ],
        correctAnswer: 'A',
        modelAnswer: '',
        rubric: [
          { point: 'Accurate definition & core explanation', weight: 5 },
          { point: 'Key properties and mathematical formulation', weight: 5 },
        ],
        explanation: '',
      });
      setLastFocusedTarget(null);
    }
  }, [initialData, reset, availableTopics, topics]);


  const { fields, append, remove } = useFieldArray({
    control,
    name: 'options',
  });

  const {
    fields: rubricFields,
    append: appendRubric,
    remove: removeRubric,
  } = useFieldArray({
    control,
    name: 'rubric',
  });

  const watchedValues = useWatch({
    control,
  });

  const currentType = watchedValues.type || 'MULTIPLE_CHOICE';
  const currentHasSubParts = Boolean(watchedValues.hasSubParts);
  const currentSubParts = (watchedValues.subParts as QuestionSubPart[]) || [];
  const currentDiagramUrl = watchedValues.diagramUrl || '';
  const currentDiagramCaption = watchedValues.diagramCaption || '';
  const currentOptions = watchedValues.options || fields;
  const currentCorrectAnswer = watchedValues.correctAnswer || 'A';
  const currentModelAnswer = watchedValues.modelAnswer || '';
  const currentRubric = watchedValues.rubric || rubricFields;
  const currentDifficulty = watchedValues.difficulty ?? 5;
  const currentQuestionText = watchedValues.questionText || '';
  const currentExplanation = watchedValues.explanation || '';
  const currentTopicId = watchedValues.topicId || '';
  const selectedTopic = topics.find((t) => t._id === currentTopicId);

  const isTargetValid = React.useCallback(
    (target: AdminFocusedTarget | null): target is AdminFocusedTarget => {
      if (!target) return false;

      if (target.field === 'questionText') {
        return true;
      }

      if (target.field === 'modelAnswer') {
        return currentType === 'THEORY';
      }

      if (target.field === 'rubric') {
        if (currentType !== 'THEORY') return false;
        const idx = target.index;
        const isWithinBounds = idx >= 0 && idx < rubricFields.length;
        const hasWatchedCriterion =
          Array.isArray(watchedValues.rubric) &&
          idx < watchedValues.rubric.length &&
          watchedValues.rubric[idx] !== undefined;
        return isWithinBounds && hasWatchedCriterion;
      }

      if (target.field === 'options') {
        if (currentType !== 'MULTIPLE_CHOICE') return false;
        const idx = target.index;
        const isWithinBounds = idx >= 0 && idx < fields.length;
        const hasWatchedOption =
          Array.isArray(watchedValues.options) &&
          idx < watchedValues.options.length &&
          watchedValues.options[idx] !== undefined;
        return isWithinBounds && hasWatchedOption;
      }

      if (target.field === 'explanation') {
        return true;
      }

      return false;
    },
    [currentType, rubricFields.length, fields.length, watchedValues.rubric, watchedValues.options]
  );


  const activeTargetLabel = React.useMemo(() => {
    if (!lastFocusedTarget || !isTargetValid(lastFocusedTarget)) {
      return 'None (Click a field to focus)';
    }
    if (lastFocusedTarget.field === 'questionText') {
      return 'Question Prompt';
    }
    if (lastFocusedTarget.field === 'modelAnswer') {
      return 'Model Answer';
    }
    if (lastFocusedTarget.field === 'rubric') {
      return `Rubric Criterion #${lastFocusedTarget.index + 1}`;
    }
    if (lastFocusedTarget.field === 'options') {
      const optId = currentOptions[lastFocusedTarget.index]?.id || `#${lastFocusedTarget.index + 1}`;
      return `Option ${optId}`;
    }
    if (lastFocusedTarget.field === 'explanation') {
      return 'Explanation';
    }
    return 'None (Click a field to focus)';
  }, [lastFocusedTarget, isTargetValid, currentOptions]);

  const handleAdminInsertSymbol = React.useCallback(
    (symbol: MathSymbolItem) => {
      // Must do nothing if there is no valid target - prevents ghost rows and invalid paths
      if (!isTargetValid(lastFocusedTarget)) {
        return;
      }

      const target = lastFocusedTarget;

      if (target.field === 'questionText') {
        const el = target.element || questionTextRef.current;
        const currentVal = watchedValues.questionText || '';
        insertSymbolIntoInputOrTextarea(el, currentVal, symbol, (newVal) => {
          setValue('questionText', newVal, { shouldValidate: true, shouldDirty: true });
        });
        return;
      }

      if (target.field === 'modelAnswer') {
        const el = target.element || modelAnswerRef.current;
        const currentVal = watchedValues.modelAnswer || '';
        insertSymbolIntoInputOrTextarea(el, currentVal, symbol, (newVal) => {
          setValue('modelAnswer', newVal, { shouldValidate: true, shouldDirty: true });
        });
        return;
      }

      if (target.field === 'rubric') {
        const index = target.index;
        const el = target.element || rubricInputsRef.current[index] || null;
        const currentVal = watchedValues.rubric?.[index]?.point || '';
        insertSymbolIntoInputOrTextarea(el, currentVal, symbol, (newVal) => {
          setValue(`rubric.${index}.point`, newVal, { shouldValidate: true, shouldDirty: true });
        });
        return;
      }

      if (target.field === 'options') {
        const index = target.index;
        const el = target.element || optionInputsRef.current[index] || null;
        const currentVal = watchedValues.options?.[index]?.text || '';
        insertSymbolIntoInputOrTextarea(el, currentVal, symbol, (newVal) => {
          setValue(`options.${index}.text`, newVal, { shouldValidate: true, shouldDirty: true });
        });
        return;
      }

      if (target.field === 'explanation') {
        const el = target.element || explanationRef.current;
        const currentVal = watchedValues.explanation || '';
        insertSymbolIntoInputOrTextarea(el, currentVal, symbol, (newVal) => {
          setValue('explanation', newVal, { shouldValidate: true, shouldDirty: true });
        });
        return;
      }
    },
    [lastFocusedTarget, isTargetValid, watchedValues.questionText, watchedValues.modelAnswer, watchedValues.rubric, watchedValues.options, watchedValues.explanation, setValue]
  );

  const handleAdminInsertTemplate = React.useCallback(() => {
    // Must do nothing if there is no valid target - prevents ghost rows and invalid paths
    if (!isTargetValid(lastFocusedTarget)) {
      return;
    }

    const target = lastFocusedTarget;

    if (target.field === 'questionText') {
      const el = target.element || questionTextRef.current;
      const currentVal = watchedValues.questionText || '';
      insertTemplateIntoInputOrTextarea(el, currentVal, (newVal) => {
        setValue('questionText', newVal, { shouldValidate: true, shouldDirty: true });
      });
      return;
    }

    if (target.field === 'modelAnswer') {
      const el = target.element || modelAnswerRef.current;
      const currentVal = watchedValues.modelAnswer || '';
      insertTemplateIntoInputOrTextarea(el, currentVal, (newVal) => {
        setValue('modelAnswer', newVal, { shouldValidate: true, shouldDirty: true });
      });
      return;
    }

    if (target.field === 'rubric') {
      const index = target.index;
      const el = target.element || rubricInputsRef.current[index] || null;
      const currentVal = watchedValues.rubric?.[index]?.point || '';
      insertTemplateIntoInputOrTextarea(el, currentVal, (newVal) => {
        setValue(`rubric.${index}.point`, newVal, { shouldValidate: true, shouldDirty: true });
      });
      return;
    }

    if (target.field === 'options') {
      const index = target.index;
      const el = target.element || optionInputsRef.current[index] || null;
      const currentVal = watchedValues.options?.[index]?.text || '';
      insertTemplateIntoInputOrTextarea(el, currentVal, (newVal) => {
        setValue(`options.${index}.text`, newVal, { shouldValidate: true, shouldDirty: true });
      });
      return;
    }

    if (target.field === 'explanation') {
      const el = target.element || explanationRef.current;
      const currentVal = watchedValues.explanation || '';
      insertTemplateIntoInputOrTextarea(el, currentVal, (newVal) => {
        setValue('explanation', newVal, { shouldValidate: true, shouldDirty: true });
      });
      return;
    }
  }, [lastFocusedTarget, isTargetValid, watchedValues.questionText, watchedValues.modelAnswer, watchedValues.rubric, watchedValues.options, watchedValues.explanation, setValue]);


  const submitHandler = (data: FormData) => {
    if (data.type === 'THEORY') {
      onSubmit({
        type: 'THEORY',
        questionText: data.questionText,
        topicId: data.topicId,
        difficulty: data.difficulty,
        diagramUrl: data.diagramUrl,
        diagramCaption: data.diagramCaption,
        hasSubParts: data.hasSubParts,
        subParts: data.hasSubParts ? data.subParts : undefined,
        modelAnswer: !data.hasSubParts ? (data.modelAnswer || '') : undefined,
        rubric: !data.hasSubParts ? (data.rubric && data.rubric.length > 0 ? data.rubric : [{ point: 'Comprehensive explanation & core concepts', weight: 10 }]) : undefined,
        explanation: data.explanation || data.modelAnswer || '',
        eloRating: data.eloRating,
        explanationSource: 'manual',
      });
    } else {
      onSubmit({
        type: 'MULTIPLE_CHOICE',
        questionText: data.questionText,
        topicId: data.topicId,
        difficulty: data.difficulty,
        diagramUrl: data.diagramUrl,
        diagramCaption: data.diagramCaption,
        hasSubParts: false,
        options: data.options || [],
        correctAnswer: data.correctAnswer || 'A',
        explanation: data.explanation || '',
        eloRating: data.eloRating,
        explanationSource: 'manual',
      });
    }
  };

  const handleAddOption = () => {
    if (fields.length >= 6) return;
    const nextId = DEFAULT_OPTION_IDS[fields.length] || `opt${fields.length + 1}`;
    append({ id: nextId, text: '' });
  };

  const handleRemoveOption = (index: number) => {
    if (fields.length <= 2) return;
    const removedId = currentOptions[index]?.id;
    remove(index);
    setLastFocusedTarget(null);
    if (removedId === currentCorrectAnswer) {
      const remaining = currentOptions.filter((_, idx) => idx !== index);
      if (remaining[0]?.id) {
        setValue('correctAnswer', remaining[0].id, { shouldValidate: true });
      }
    }
  };

  const prevTypeRef = React.useRef(currentType);
  React.useEffect(() => {
    if (prevTypeRef.current !== currentType) {
      prevTypeRef.current = currentType;
      setLastFocusedTarget(null);
    }
  }, [currentType]);

  const prevCorrectRef = React.useRef(currentCorrectAnswer);
  React.useEffect(() => {
    if (prevCorrectRef.current !== currentCorrectAnswer) {
      prevCorrectRef.current = currentCorrectAnswer;
      setLastFocusedTarget(null);
    }
  }, [currentCorrectAnswer]);

  const handleAddRubricCriterion = () => {
    appendRubric({ point: '', weight: 5 });
  };

  const getDifficultyLabel = (diff: number) => {
    if (diff <= 3) return { text: 'Easy', color: 'var(--color-success, #22c55e)' };
    if (diff <= 7) return { text: 'Medium', color: 'var(--color-warning, #eab308)' };
    return { text: 'Hard', color: 'var(--color-danger, #ef4444)' };
  };

  const diffMeta = getDifficultyLabel(currentDifficulty);

  const courseMap = React.useMemo(() => {
    const map = new Map<string, Course>();
    courses?.forEach((c) => map.set(c._id, c));
    return map;
  }, [courses]);

  const selectedCourseObj = courseMap.get(selectedCourseId);

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCourseId = e.target.value;
    setSelectedCourseId(newCourseId);
    const matchingTopics = topics.filter((t) => getTopicCourseId(t) === newCourseId);
    if (matchingTopics.length > 0) {
      setValue('topicId', matchingTopics[0]._id, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('topicId', '', { shouldValidate: true, shouldDirty: true });
    }
  };

  const totalRubricScore = React.useMemo(() => {
    return (currentRubric || []).reduce((acc, curr) => acc + (Number(curr?.weight) || 0), 0);
  }, [currentRubric]);

  return (
    <form onSubmit={handleSubmit(submitHandler as any)} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Question Type Segmented Switcher */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '0.375rem',
          }}
        >
          Question Format / Type *
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            padding: '4px',
            backgroundColor: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setValue('type', 'MULTIPLE_CHOICE', { shouldValidate: true, shouldDirty: true });
              setLastFocusedTarget(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: currentType === 'MULTIPLE_CHOICE' ? 'var(--color-surface)' : 'transparent',
              color: currentType === 'MULTIPLE_CHOICE' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontWeight: currentType === 'MULTIPLE_CHOICE' ? 700 : 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: currentType === 'MULTIPLE_CHOICE' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckSquare size={16} />
            <span>Multiple Choice (MCQ)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setValue('type', 'THEORY', { shouldValidate: true, shouldDirty: true });
              setLastFocusedTarget(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: currentType === 'THEORY' ? 'var(--color-surface)' : 'transparent',
              color: currentType === 'THEORY' ? '#8b5cf6' : 'var(--color-text-muted)',
              fontWeight: currentType === 'THEORY' ? 700 : 500,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              boxShadow: currentType === 'THEORY' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={16} />
            <span>Theory / Free Response</span>
          </button>
        </div>
      </div>

      {/* Course and Subsequent Topic Selection */}
      {courses && courses.length > 0 && (
        <Select
          label="Course"
          value={selectedCourseId}
          onChange={handleCourseChange}
          options={courses.map((c) => ({
            value: c._id,
            label: c.code ? `[${c.code}] ${c.title}` : c.title,
          }))}
        />
      )}

      {/* Subsequent Topic Selection (Filtered by Course) */}
      <Select
        label="Topic *"
        options={availableTopics.map((t) => ({
          value: t._id,
          label: t.name,
        }))}
        {...register('topicId')}
        error={errors.topicId?.message}
      />

      {/* Formula & Symbol Helper Toolbar with dynamic target detection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Active Toolbar Target:{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{activeTargetLabel}</strong>
          </span>
        </div>
        <MathToolbar
          onInsertSymbol={handleAdminInsertSymbol}
          onInsertTemplate={handleAdminInsertTemplate}
          showPreview={showMathPreview}
          onTogglePreview={() => setShowMathPreview((prev) => !prev)}
        />
      </div>

      {/* Question Text */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 500,
            color: 'var(--color-text)',
            marginBottom: '0.375rem',
          }}
        >
          Question Prompt *
        </label>
        {(() => {
          const qTextReg = register('questionText');
          return (
            <textarea
              rows={3}
              placeholder={
                currentType === 'THEORY'
                  ? 'e.g. Explain the difference between eigenvalues and eigenvectors, and discuss their significance in matrix transformations.'
                  : "e.g. Which algorithmic paradigm does Dijkstra's shortest path algorithm use?"
              }
              {...qTextReg}
              ref={(e) => {
                qTextReg.ref(e);
                questionTextRef.current = e;
              }}
              onFocus={(e) => {
                setLastFocusedTarget({ field: 'questionText', element: e.currentTarget });
              }}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: errors.questionText ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          );
        })()}
        {errors.questionText?.message && (
          <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            {errors.questionText.message}
          </span>
        )}
        {showMathPreview && currentQuestionText.trim() && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-background-soft)',
              border: '1px solid var(--color-border)',
              fontSize: '0.875rem',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Question Prompt Math Preview
            </div>
            <div style={{ color: 'var(--color-text)', lineHeight: 1.5 }}>
              <FormattedMathText text={currentQuestionText} />
            </div>
          </div>
        )}
      </div>

      {/* Main Diagram / Figure Uploader */}
      <DiagramUploader
        value={currentDiagramUrl}
        caption={currentDiagramCaption}
        onChange={(url, caption) => {
          setValue('diagramUrl', url, { shouldDirty: true });
          setValue('diagramCaption', caption, { shouldDirty: true });
        }}
      />

      {/* MCQ OPTIONS BUILDER (Only for MULTIPLE_CHOICE) */}
      {currentType === 'MULTIPLE_CHOICE' && (
        <div
          style={{
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            backgroundColor: 'var(--color-background-soft)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                Multiple-Choice Options (2–6)
              </h4>
              <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Click radio to designate the correct answer key.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              disabled={fields.length >= 6}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
            >
              <Plus size={14} style={{ marginRight: '0.25rem' }} /> Add Option
            </Button>
          </div>

          {errors.options?.message && (
            <div
              style={{
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--color-danger)',
                fontSize: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              {errors.options.message}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fields.map((field, index) => {
              const optId = currentOptions[index]?.id || `opt${index + 1}`;
              const isCorrect = currentCorrectAnswer === optId;
              const optText = currentOptions[index]?.text || '';
              const optTextReg = register(`options.${index}.text`);
              const isPreviewOpen = showOptionPreviews[index] ?? true;

              return (
                <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.375rem 0.5rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'var(--color-surface)',
                      border: isCorrect ? '1px solid rgba(34, 197, 94, 0.35)' : '1px solid var(--color-border)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <label
                      title={`Mark ${optId} as correct`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        padding: '0.25rem',
                      }}
                    >
                      <input
                        type="radio"
                        value={optId}
                        checked={isCorrect}
                        onChange={() => {
                          setValue('correctAnswer', optId, { shouldValidate: true });
                          setLastFocusedTarget(null);
                        }}
                        style={{
                          cursor: 'pointer',
                          accentColor: 'var(--color-success, #22c55e)',
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      maxLength={4}
                      placeholder="Key"
                      {...register(`options.${index}.id`)}
                      style={{
                        width: '42px',
                        textAlign: 'center',
                        padding: '0.375rem 0.25rem',
                        fontWeight: 700,
                        fontSize: '0.8125rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-background-soft)',
                        color: isCorrect ? 'var(--color-success, #22c55e)' : 'var(--color-text)',
                      }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <input
                        type="text"
                        placeholder={`Option ${optId} text...`}
                        {...optTextReg}
                        ref={(e) => {
                          optTextReg.ref(e);
                          optionInputsRef.current[index] = e;
                        }}
                        onFocus={(e) => {
                          setLastFocusedTarget({ field: 'options', index, element: e.currentTarget });
                        }}
                        style={{
                          width: '100%',
                          padding: '0.375rem 0.625rem',
                          fontSize: '0.8125rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleOptionPreview(index)}
                      title={isPreviewOpen ? `Hide math preview for ${optId}` : `Show math preview for ${optId}`}
                      style={{
                        border: 'none',
                        background: 'none',
                        color: isPreviewOpen && optText.trim() ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isPreviewOpen ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>

                    {fields.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        title="Remove option"
                        style={{
                          border: 'none',
                          background: 'none',
                          color: 'var(--color-text-muted)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {showMathPreview && isPreviewOpen && optText.trim() && (
                    <div
                      style={{
                        marginLeft: '1.5rem',
                        padding: '0.3125rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-background-soft)',
                        border: '1px solid var(--color-border)',
                        fontSize: '0.75rem',
                        color: 'var(--color-text)',
                      }}
                    >
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.375rem' }}>
                        Preview {optId}:
                      </span>
                      <FormattedMathText text={optText} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {errors.correctAnswer?.message && (
            <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.5rem', display: 'block' }}>
              {errors.correctAnswer.message}
            </span>
          )}
        </div>
      )}

      {/* THEORY MODEL ANSWER & RUBRIC BUILDER (Only for THEORY) */}
      {currentType === 'THEORY' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Mode Selector for Theory: Single Prompt vs University Sub-Parts */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px',
              borderRadius: '8px',
              background: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.03))',
              border: '1px solid var(--color-border)',
            }}
          >
            <button
              type="button"
              onClick={() => setValue('hasSubParts', false, { shouldDirty: true })}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: !currentHasSubParts ? 'var(--color-surface, #fff)' : 'transparent',
                color: !currentHasSubParts ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: !currentHasSubParts ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Standard Single Prompt
            </button>
            <button
              type="button"
              onClick={() => {
                setValue('hasSubParts', true, { shouldDirty: true });
                if (!currentSubParts || currentSubParts.length === 0) {
                  setValue(
                    'subParts',
                    [
                      {
                        id: `part_${Date.now()}_a`,
                        label: '1(a)',
                        prompt: '',
                        maxMarks: 5,
                        modelAnswer: '',
                        rubric: [{ point: 'Core explanation & definition', weight: 5 }],
                        order: 0,
                      },
                    ],
                    { shouldDirty: true }
                  );
                }
              }}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: currentHasSubParts ? 'var(--color-surface, #fff)' : 'transparent',
                color: currentHasSubParts ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: currentHasSubParts ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Layers size={14} />
              University Multi-Part (1a, 1b...)
            </button>
          </div>

          {currentHasSubParts ? (
            /* Multi-Part Sub-Questions Editor */
            <div>
              <SubPartEditor
                subParts={currentSubParts}
                onChange={(sp) => setValue('subParts', sp, { shouldDirty: true })}
                showMathPreview={showMathPreview}
              />
              {errors.subParts?.message && (
                <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.375rem', display: 'block' }}>
                  {errors.subParts.message as string}
                </span>
              )}
            </div>
          ) : (
            /* Single-Part Model Answer & Rubric */
            <>
              {/* Model Answer Textarea */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                    Model Answer (Ideal Response) *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>
                    Used for AI & Instructor Grading
                  </span>
                </div>
            {(() => {
              const modelAnswerReg = register('modelAnswer');
              return (
                <textarea
                  rows={4}
                  placeholder="Provide a comprehensive model answer covering the key definitions, expected proofs/calculations, and conceptual clarity..."
                  {...modelAnswerReg}
                  ref={(e) => {
                    modelAnswerReg.ref(e);
                    modelAnswerRef.current = e;
                  }}
                  onFocus={(e) => {
                    setLastFocusedTarget({ field: 'modelAnswer', element: e.currentTarget });
                  }}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: errors.modelAnswer ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              );
            })()}
            {errors.modelAnswer?.message && (
              <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.modelAnswer.message}
              </span>
            )}
            {showMathPreview && currentModelAnswer.trim() && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-background-soft)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.875rem',
                }}
              >
                <div
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.25rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Model Answer Math Preview
                </div>
                <div style={{ color: 'var(--color-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  <FormattedMathText text={currentModelAnswer} />
                </div>
              </div>
            )}
          </div>

          {/* Rubric Points Editor */}
          <div
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              backgroundColor: 'var(--color-background-soft)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  Grading Rubric Criteria
                </h4>
                <p style={{ margin: '0.125rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Define specific marks allocated per concept (Total: {totalRubricScore} pts)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRubricCriterion}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                <Plus size={14} style={{ marginRight: '0.25rem' }} /> Add Criterion
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {rubricFields.map((field, index) => {
                const rubricPointReg = register(`rubric.${index}.point`);
                const pointText = currentRubric?.[index]?.point || '';

                return (
                  <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.375rem 0.5rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          color: '#8b5cf6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </span>

                      <input
                        type="text"
                        placeholder="e.g. Correct statement of Cayley-Hamilton theorem"
                        {...rubricPointReg}
                        ref={(e) => {
                          rubricPointReg.ref(e);
                          rubricInputsRef.current[index] = e;
                        }}
                        onFocus={(e) => {
                          setLastFocusedTarget({ field: 'rubric', index, element: e.currentTarget });
                        }}
                        style={{
                          flex: 1,
                          padding: '0.375rem 0.625rem',
                          fontSize: '0.8125rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: 'var(--color-surface)',
                          color: 'var(--color-text)',
                        }}
                      />

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          placeholder="Marks"
                          {...register(`rubric.${index}.weight`, { valueAsNumber: true })}
                          style={{
                            width: '56px',
                            padding: '0.375rem 0.375rem',
                            textAlign: 'center',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-primary)',
                          }}
                        />
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>pts</span>
                      </div>

                      {rubricFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            removeRubric(index);
                            setLastFocusedTarget(null);
                          }}
                          title="Remove criterion"
                          style={{
                            border: 'none',
                            background: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {showMathPreview && pointText.trim() && (
                      <div
                        style={{
                          marginLeft: '2rem',
                          padding: '0.3125rem 0.5rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-background-soft)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.75rem',
                          color: 'var(--color-text)',
                        }}
                      >
                        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', marginRight: '0.375rem' }}>
                          Preview:
                        </span>
                        <FormattedMathText text={pointText} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* Answer Explanation (Required for MCQ, Optional for Theory) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
          <label
            style={{
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text)',
            }}
          >
            {currentType === 'THEORY' ? 'Additional Notes / Explanation (Optional)' : 'Answer Explanation *'}
          </label>
          {showMathPreview && currentExplanation.trim() && (
            <button
              type="button"
              onClick={() => setShowExplanationPreview((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: showExplanationPreview ? 'var(--color-primary)' : 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: '0.75rem',
                padding: '0.125rem 0.25rem',
              }}
            >
              {showExplanationPreview ? <EyeOff size={13} /> : <Eye size={13} />}
              <span>{showExplanationPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
          )}
        </div>
        {(() => {
          const expReg = register('explanation');
          return (
            <textarea
              rows={3}
              placeholder={
                currentType === 'THEORY'
                  ? 'Provide any extra pedagogical notes, common misconceptions, or reference formulas...'
                  : 'Explain why the selected option is correct and why other choices are invalid...'
              }
              {...expReg}
              ref={(e) => {
                expReg.ref(e);
                explanationRef.current = e;
              }}
              onFocus={(e) => {
                setLastFocusedTarget({ field: 'explanation', element: e.currentTarget });
              }}
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                border: errors.explanation ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text)',
                fontSize: '0.875rem',
                lineHeight: 1.5,
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          );
        })()}
        {errors.explanation?.message && (
          <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
            {errors.explanation.message}
          </span>
        )}
        {showMathPreview && showExplanationPreview && currentExplanation.trim() && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.625rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-background-soft)',
              border: '1px solid var(--color-border)',
              fontSize: '0.875rem',
            }}
          >
            <div
              style={{
                fontSize: '0.6875rem',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Explanation Math Preview
            </div>
            <div style={{ color: 'var(--color-text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
              <FormattedMathText text={currentExplanation} />
            </div>
          </div>
        )}
      </div>

      {/* Difficulty & Elo Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1rem',
          padding: '1rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-background-soft)',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text)' }}>
              Difficulty (1–10)
            </label>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: diffMeta.color,
                padding: '0.125rem 0.375rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              {currentDifficulty}/10 · {diffMeta.text}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            {...register('difficulty', { valueAsNumber: true })}
            style={{ width: '100%', cursor: 'pointer', accentColor: diffMeta.color }}
          />
          {errors.difficulty?.message && (
            <span style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
              {errors.difficulty.message}
            </span>
          )}
        </div>

        <div>
          <Input
            label="Initial Difficulty Rating (Elo)"
            type="number"
            min={400}
            max={3000}
            placeholder="1200"
            {...register('eloRating', { valueAsNumber: true })}
            error={errors.eloRating?.message}
          />
        </div>
      </div>

      {/* Live Preview Toggle & Card */}
      <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => setShowLivePreview(!showLivePreview)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.625rem 0.875rem',
            backgroundColor: 'var(--color-surface-raised)',
            border: 'none',
            borderBottom: showLivePreview ? '1px solid var(--color-border)' : 'none',
            color: 'var(--color-text)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={14} color="var(--color-primary)" />
            <span>Live Student Preview ({currentType === 'THEORY' ? 'Theory' : 'MCQ'})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
            {showLivePreview ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showLivePreview ? 'Collapse' : 'Expand'}</span>
          </div>
        </button>

        {showLivePreview && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: currentType === 'THEORY' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(59, 130, 246, 0.1)',
                  border: currentType === 'THEORY' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                  color: currentType === 'THEORY' ? '#8b5cf6' : '#3b82f6',
                }}
              >
                {currentType === 'THEORY' ? 'Theory' : 'MCQ'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-background-soft)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-muted)',
                }}
              >
                {selectedCourseObj ? `${selectedCourseObj.code || selectedCourseObj.title} · ` : ''}
                {selectedTopic?.name || 'Selected Topic'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.125rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-background-soft)',
                  border: '1px solid var(--color-border)',
                  color: diffMeta.color,
                }}
              >
                Diff: {currentDifficulty}/10
              </span>
            </div>

            <div style={{ margin: '0 0 0.875rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', lineHeight: 1.4 }}>
              {currentQuestionText.trim() ? (
                <FormattedMathText text={currentQuestionText} />
              ) : (
                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Question prompt preview...</span>
              )}
            </div>

            {currentDiagramUrl && (
              <DiagramViewer url={currentDiagramUrl} caption={currentDiagramCaption} maxHeight={220} />
            )}

            {currentType === 'THEORY' ? (
              currentHasSubParts ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  {currentSubParts.length === 0 ? (
                    <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg-subtle, rgba(0,0,0,0.02))', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      No sub-parts added yet.
                    </div>
                  ) : (
                    currentSubParts.map((sp, idx) => (
                      <div
                        key={sp.id || idx}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'rgba(139, 92, 246, 0.04)',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary, #8b5cf6)' }}>
                            {sp.label || `Part ${idx + 1}`}
                          </span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                            [{sp.maxMarks || 1} marks]
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                          <FormattedMathText text={sp.prompt || 'Sub-part prompt...'} />
                        </div>
                        {sp.diagramUrl && (
                          <DiagramViewer url={sp.diagramUrl} caption={sp.diagramCaption} maxHeight={160} />
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <strong>Expected:</strong> <FormattedMathText text={sp.modelAnswer || 'Model solution...'} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '0.875rem' }}>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(139, 92, 246, 0.05)',
                      border: '1px dashed rgba(139, 92, 246, 0.3)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#8b5cf6', display: 'block', marginBottom: '0.25rem' }}>
                      Model Answer:
                    </span>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                      {currentModelAnswer.trim() ? (
                        <FormattedMathText text={currentModelAnswer} />
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Model answer preview...</span>
                      )}
                    </div>
                  </div>

                  {currentRubric && currentRubric.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      <span style={{ fontWeight: 600 }}>Rubric Criteria ({totalRubricScore} pts):</span>{' '}
                      {currentRubric.map((r, i) => (
                        <span key={i}>
                          {i > 0 && ', '}
                          {r.point ? <FormattedMathText text={r.point} /> : 'Criterion'} ({r.weight || 0} pts)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '0.875rem' }}>
                {currentOptions.map((opt, i) => {
                  const isCorrect = currentCorrectAnswer === opt.id;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'var(--color-background-soft)',
                        border: isCorrect ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--color-border)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: isCorrect ? 'var(--color-success, #22c55e)' : 'var(--color-border)',
                          color: isCorrect ? '#fff' : 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {opt.id}
                      </span>
                      <span style={{ flex: 1, color: 'var(--color-text)', fontWeight: isCorrect ? 600 : 400 }}>
                        {opt.text || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Option text...</span>}
                      </span>
                      {isCorrect && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-success, #22c55e)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CheckCircle2 size={12} /> Key
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {currentExplanation.trim() && (
              <div
                style={{
                  padding: '0.625rem 0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--color-background-soft)',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>Explanation: </span>
                {currentExplanation}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Action Buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            if (isDirty && !window.confirm('You have unsaved changes. Discard?')) return;
            onCancel();
          }}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          {initialData?.questionText ? 'Update Question' : 'Create Question'}
        </Button>
      </div>
    </form>
  );
};
