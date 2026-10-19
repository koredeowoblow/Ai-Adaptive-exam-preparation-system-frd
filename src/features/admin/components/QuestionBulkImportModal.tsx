import * as React from 'react';
import { Dialog as Modal } from '../../../shared/components/Dialog';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import {
  Code,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  RotateCcw,
  Download,
  X,
  Eye,
} from 'lucide-react';
import type { Topic } from '../../../types/topic.types';
import type { Course } from '../../../types/course.types';
import type { CreateQuestionDTO } from '../../../types';

export interface QuestionBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  courses?: Course[];
  selectedTopicId?: string;
  onImport: (questions: CreateQuestionDTO[]) => void;
  isImporting: boolean;
}

interface ParsedQuestionItem {
  rowIndex: number;
  data: Partial<CreateQuestionDTO>;
  isValid: boolean;
  errors: string[];
}

export const QuestionBulkImportModal: React.FC<QuestionBulkImportModalProps> = ({
  isOpen,
  onClose,
  topics,
  courses,
  selectedTopicId,
  onImport,
  isImporting,
}) => {
  const [inputMode, setInputMode] = React.useState<'upload' | 'manual'>('upload');
  const [activeTab, setActiveTab] = React.useState<'json' | 'csv'>('json');
  const [selectedCourseFilter, setSelectedCourseFilter] = React.useState<string>('');
  const [fallbackTopicId, setFallbackTopicId] = React.useState<string>(selectedTopicId || topics[0]?._id || '');
  const [rawText, setRawText] = React.useState<string>('');
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [uploadedFileSize, setUploadedFileSize] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [parsedRows, setParsedRows] = React.useState<ParsedQuestionItem[] | null>(null);
  const [parseGlobalError, setParseGlobalError] = React.useState<string | null>(null);
  const [inspectingRow, setInspectingRow] = React.useState<ParsedQuestionItem | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (selectedTopicId) {
      setFallbackTopicId(selectedTopicId);
      const matchTopic = topics.find((t) => t._id === selectedTopicId);
      if (matchTopic?.courseId) {
        setSelectedCourseFilter(matchTopic.courseId);
      }
    } else if (topics[0]?._id && !fallbackTopicId) {
      setFallbackTopicId(topics[0]._id);
    }
  }, [selectedTopicId, topics, fallbackTopicId]);

  const handleReset = () => {
    setParsedRows(null);
    setParseGlobalError(null);
    setUploadedFileName(null);
    setUploadedFileSize(null);
    setInspectingRow(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Filter topics by selected course
  const filteredTopics = React.useMemo(() => {
    if (!selectedCourseFilter) return topics;
    return topics.filter((t) => t.courseId === selectedCourseFilter);
  }, [topics, selectedCourseFilter]);

  // Keep fallback topic valid when course filter changes
  React.useEffect(() => {
    if (filteredTopics.length > 0 && !filteredTopics.some((t) => t._id === fallbackTopicId)) {
      setFallbackTopicId(filteredTopics[0]._id);
    }
  }, [filteredTopics, fallbackTopicId]);

  const topicOptions = React.useMemo(() => {
    return filteredTopics.map((t) => {
      const parentCourse = courses?.find((c) => c._id === t.courseId);
      const label = parentCourse?.code ? `[${parentCourse.code}] ${t.name}` : t.name;
      return {
        value: t._id,
        label,
      };
    });
  }, [filteredTopics, courses]);

  const courseOptions = React.useMemo(() => {
    if (!courses || courses.length === 0) return [];
    return [
      { value: '', label: 'All Courses (All Topics)' },
      ...courses.map((c) => ({
        value: c._id,
        label: `${c.code ? `[${c.code}] ` : ''}${c.title}`,
      })),
    ];
  }, [courses]);

  // Sample data generators
  const getSampleJson = () => {
    const topic = fallbackTopicId || topics[0]?._id || '64f1a2b3c4d5e6f7a8b9c0d1';
    return [
      {
        topicId: topic,
        type: 'MULTIPLE_CHOICE',
        questionText: 'What is the primary time complexity of binary search on a sorted array of $n$ elements?',
        options: [
          { id: 'A', text: '$O(1)$' },
          { id: 'B', text: '$O(\\log n)$' },
          { id: 'C', text: '$O(n)$' },
          { id: 'D', text: '$O(n \\log n)$' },
        ],
        correctAnswer: 'B',
        difficulty: 4,
        explanation: 'Binary search halves the search space each step, giving $O(\\log n)$ logarithmic runtime.',
      },
      {
        topicId: topic,
        type: 'THEORY',
        questionText: 'Explain the fundamental difference between supervised and unsupervised learning, providing one real-world application of each.',
        modelAnswer: 'Supervised learning trains models on labeled datasets with input-output pairs $(x_i, y_i)$ (e.g., credit card fraud detection). Unsupervised learning identifies latent structures or clusters without ground-truth labels (e.g., customer segmentation via k-means clustering).',
        rubric: [
          { point: 'Accurate definition of supervised learning with labeled data examples', weight: 0.5 },
          { point: 'Accurate definition of unsupervised learning with cluster/pattern discovery examples', weight: 0.5 },
        ],
        difficulty: 5,
        explanation: 'Ground-truth supervision is the defining distinction between these two learning paradigms.',
      },
      {
        topicId: topic,
        type: 'MULTIPLE_CHOICE',
        questionText: 'Which mathematical constant is defined as the limit $\\lim_{n \\to \\infty} \\left(1 + \\frac{1}{n}\\right)^n$?',
        options: [
          { id: 'A', text: '$\\pi$' },
          { id: 'B', text: '$e$' },
          { id: 'C', text: '$\\phi$' },
          { id: 'D', text: '$\\sqrt{2}$' },
        ],
        correctAnswer: 'B',
        difficulty: 3,
        explanation: "Euler's number $e \\approx 2.71828$ is defined by this compound limit.",
      },
    ];
  };

  const getSampleCsv = () => {
    return `questionText,type,optionA,optionB,optionC,optionD,correctAnswer,modelAnswer,difficulty,explanation
"What is the primary time complexity of binary search on a sorted array of $n$ elements?",MULTIPLE_CHOICE,"$O(1)","$O(\\log n)","$O(n)","$O(n \\log n)",B,,4,"Binary search halves the search space each step, giving logarithmic runtime."
"Explain the fundamental difference between supervised and unsupervised learning.",THEORY,,,,,,Supervised learning uses labeled pairs $(x,y)$ while unsupervised discovers latent clusters without labels.,5,Labeled ground truth is the key differentiator.
"Which mathematical constant is defined as the limit $\\lim_{n \\to \\infty} (1 + 1/n)^n$?",MULTIPLE_CHOICE,"$\\pi$","$e$","$\\phi$","$\\sqrt{2}$",B,,3,"Euler's number $e \\approx 2.71828$ is defined by this fundamental limit."`;
  };

  const loadSampleJson = () => {
    setRawText(JSON.stringify(getSampleJson(), null, 2));
    setUploadedFileName('sample_questions.json');
    setUploadedFileSize('1.2 KB');
    setParseGlobalError(null);
    setParsedRows(null);
  };

  const loadSampleCsv = () => {
    setRawText(getSampleCsv());
    setUploadedFileName('sample_questions.csv');
    setUploadedFileSize('0.8 KB');
    setParseGlobalError(null);
    setParsedRows(null);
  };

  // Download template files directly
  const downloadTemplate = (format: 'json' | 'csv') => {
    const isJson = format === 'json';
    const content = isJson ? JSON.stringify(getSampleJson(), null, 2) : getSampleCsv();
    const mimeType = isJson ? 'application/json' : 'text/csv';
    const fileName = isJson ? 'questions_template.json' : 'questions_template.csv';

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // File selection and drag-drop handlers
  const handleFile = (file: File) => {
    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.txt');

    if (!isJson && !isCsv) {
      setParseGlobalError('Unsupported file type. Please upload a .json or .csv file.');
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(1)} KB`;

    setUploadedFileName(file.name);
    setUploadedFileSize(sizeFormatted);
    setActiveTab(isJson ? 'json' : 'csv');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || '';
      setRawText(text);
      setParseGlobalError(null);
      // Run validation automatically upon loading
      validateData(text, isJson ? 'json' : 'csv');
    };
    reader.onerror = () => {
      setParseGlobalError('Failed to read file. Please verify permissions and try again.');
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const parseCsvRows = (text: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        currentRow.push(cur.trim());
        cur = '';
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && text[i + 1] === '\n') {
          i++;
        }
        currentRow.push(cur.trim());
        cur = '';
        if (currentRow.some((val) => val.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
      } else {
        cur += c;
      }
    }
    if (cur.length > 0 || currentRow.length > 0) {
      currentRow.push(cur.trim());
      if (currentRow.some((val) => val.length > 0)) {
        rows.push(currentRow);
      }
    }
    return rows;
  };

  const validateData = (content: string, format: 'json' | 'csv') => {
    setParseGlobalError(null);
    setParsedRows(null);

    if (!content.trim()) {
      setParseGlobalError('Please select or paste questions data to validate.');
      return;
    }

    try {
      const validated: ParsedQuestionItem[] = [];

      if (format === 'json') {
        let jsonArray: any[];
        try {
          jsonArray = JSON.parse(content);
        } catch (e: any) {
          setParseGlobalError(`JSON Syntax Error: ${e.message}`);
          return;
        }

        if (!Array.isArray(jsonArray) || jsonArray.length === 0) {
          setParseGlobalError('Input must be a non-empty JSON array of questions.');
          return;
        }

        jsonArray.forEach((item, index) => {
          const errors: string[] = [];
          const topic = item.topicId || fallbackTopicId;
          if (!topic) errors.push('Missing topicId (please set fallback topic)');

          const text = item.questionText?.trim() || '';
          if (text.length < 5) errors.push('Question text must be at least 5 characters');

          const isTheory = item.type === 'THEORY' || (!item.options && Boolean(item.modelAnswer));
          const questionType: 'MULTIPLE_CHOICE' | 'THEORY' = isTheory ? 'THEORY' : 'MULTIPLE_CHOICE';

          let options = item.options;
          let correctAnswer = (item.correctAnswer || '').trim();
          let modelAnswer = item.modelAnswer?.trim() || '';
          let rubric = item.rubric;

          if (isTheory) {
            if (!modelAnswer || modelAnswer.length < 5) {
              errors.push('Theory questions must provide a modelAnswer (at least 5 characters)');
            }
          } else {
            if (!Array.isArray(options) || options.length < 2) {
              errors.push('Multiple Choice must have at least 2 options');
            }
            if (!correctAnswer) {
              errors.push('Missing correctAnswer key (e.g. A, B, C)');
            } else if (Array.isArray(options)) {
              const hasMatch = options.some((opt: any) => String(opt.id).toUpperCase() === correctAnswer.toUpperCase());
              if (!hasMatch) errors.push(`Correct key "${correctAnswer}" is not among options`);
            }
          }

          const difficulty = Number(item.difficulty) || 5;
          if (difficulty < 1 || difficulty > 10) errors.push('Difficulty must be between 1 and 10');

          const explanation = (item.explanation || 'Imported question.').trim();

          validated.push({
            rowIndex: index + 1,
            data: {
              type: questionType,
              topicId: topic,
              questionText: text,
              options: isTheory ? [] : options || [],
              correctAnswer: isTheory ? undefined : correctAnswer.toUpperCase(),
              modelAnswer: isTheory ? modelAnswer : undefined,
              rubric: isTheory && Array.isArray(rubric) ? rubric : undefined,
              difficulty,
              explanation,
              eloRating: Number(item.eloRating) || 1200,
            },
            isValid: errors.length === 0,
            errors,
          });
        });
      } else {
        // CSV Parsing
        const rows = parseCsvRows(content);
        if (rows.length < 2) {
          setParseGlobalError('CSV must include a header row and at least 1 question row.');
          return;
        }

        const headers = rows[0].map((h) => h.toLowerCase());
        const qIndex = headers.indexOf('questiontext');
        const typeIndex = headers.indexOf('type');
        const correctIndex = headers.indexOf('correctanswer');
        const modelAnswerIndex = headers.indexOf('modelanswer');
        const diffIndex = headers.indexOf('difficulty');
        const expIndex = headers.indexOf('explanation');
        const topicIndex = headers.indexOf('topicid');

        const optA = headers.indexOf('optiona');
        const optB = headers.indexOf('optionb');
        const optC = headers.indexOf('optionc');
        const optD = headers.indexOf('optiond');
        const optE = headers.indexOf('optione');
        const optF = headers.indexOf('optionf');

        if (qIndex === -1) {
          setParseGlobalError('CSV headers must include at least "questionText".');
          return;
        }

        for (let i = 1; i < rows.length; i++) {
          const rowValues = rows[i];
          const errors: string[] = [];

          const text = rowValues[qIndex] || '';
          if (text.length < 5) errors.push('Question prompt must be at least 5 characters');

          const topic = (topicIndex !== -1 ? rowValues[topicIndex] : '') || fallbackTopicId;
          if (!topic) errors.push('Missing topicId');

          const rawType = typeIndex !== -1 ? (rowValues[typeIndex] || '').toUpperCase() : '';
          const modelAnswer = modelAnswerIndex !== -1 ? (rowValues[modelAnswerIndex] || '').trim() : '';
          const isTheory = rawType === 'THEORY' || Boolean(modelAnswer && rawType !== 'MULTIPLE_CHOICE');
          const questionType: 'MULTIPLE_CHOICE' | 'THEORY' = isTheory ? 'THEORY' : 'MULTIPLE_CHOICE';

          const options: { id: string; text: string }[] = [];
          const correctAnswer = (correctIndex !== -1 ? rowValues[correctIndex] || '' : '').trim();

          if (isTheory) {
            if (!modelAnswer || modelAnswer.length < 5) {
              errors.push('Theory questions require a modelAnswer of at least 5 characters');
            }
          } else {
            if (optA !== -1 && rowValues[optA]) options.push({ id: 'A', text: rowValues[optA] });
            if (optB !== -1 && rowValues[optB]) options.push({ id: 'B', text: rowValues[optB] });
            if (optC !== -1 && rowValues[optC]) options.push({ id: 'C', text: rowValues[optC] });
            if (optD !== -1 && rowValues[optD]) options.push({ id: 'D', text: rowValues[optD] });
            if (optE !== -1 && rowValues[optE]) options.push({ id: 'E', text: rowValues[optE] });
            if (optF !== -1 && rowValues[optF]) options.push({ id: 'F', text: rowValues[optF] });

            if (options.length < 2) errors.push('Must provide at least 2 options (optionA, optionB)');

            if (!correctAnswer) {
              errors.push('Missing correctAnswer key (e.g. A, B)');
            } else if (options.length > 0 && !options.some((o) => o.id.toUpperCase() === correctAnswer.toUpperCase())) {
              errors.push(`Correct key "${correctAnswer}" not found among options`);
            }
          }

          const difficulty = diffIndex !== -1 ? Number(rowValues[diffIndex]) || 5 : 5;
          const explanation = expIndex !== -1 && rowValues[expIndex] ? rowValues[expIndex] : 'Imported question.';

          validated.push({
            rowIndex: i,
            data: {
              type: questionType,
              topicId: topic,
              questionText: text,
              options: isTheory ? [] : options,
              correctAnswer: isTheory ? undefined : correctAnswer.toUpperCase(),
              modelAnswer: isTheory ? modelAnswer : undefined,
              difficulty,
              explanation,
              eloRating: 1200,
            },
            isValid: errors.length === 0,
            errors,
          });
        }
      }

      setParsedRows(validated);
    } catch (err: any) {
      setParseGlobalError(err.message || 'Validation failed. Please verify the format.');
    }
  };

  const validItems = parsedRows?.filter((r) => r.isValid) || [];
  const invalidItems = parsedRows?.filter((r) => !r.isValid) || [];

  const handleConfirmImport = () => {
    if (validItems.length === 0) return;
    const questionsToImport = validItems.map((v) => v.data as CreateQuestionDTO);
    onImport(questionsToImport);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload & Import Questions"
      description="Batch upload assessment items from JSON or CSV files with automated schema validation and formula previews."
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Step 1: Input & Configuration */}
        {!parsedRows && (
          <>
            {/* Fallback Topic & Course Selection Bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: courses && courses.length > 0 ? '1fr 1fr' : '1fr',
                gap: '1rem',
                backgroundColor: 'var(--color-surface-0, #f8fafc)',
                padding: 'var(--space-16)',
                borderRadius: 'var(--radius-lg, 12px)',
                border: '1px solid var(--color-border)',
              }}
            >
              {courses && courses.length > 0 && (
                <Select
                  label="Filter by Academic Course"
                  options={courseOptions}
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                />
              )}
              <Select
                label="Fallback Topic (assigned when row topic is empty)"
                options={topicOptions}
                value={fallbackTopicId}
                onChange={(e) => setFallbackTopicId(e.target.value)}
              />
            </div>

            {/* Input Mode Selector & Template Download Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  backgroundColor: 'var(--color-surface-1, #f1f5f9)',
                  padding: '3px',
                  borderRadius: 'var(--radius-md, 8px)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  style={{
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: 'none',
                    backgroundColor: inputMode === 'upload' ? 'var(--color-surface)' : 'transparent',
                    color: inputMode === 'upload' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    boxShadow: inputMode === 'upload' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <UploadCloud size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('manual')}
                  style={{
                    padding: '0.375rem 0.875rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm, 6px)',
                    border: 'none',
                    backgroundColor: inputMode === 'manual' ? 'var(--color-surface)' : 'transparent',
                    color: inputMode === 'manual' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    boxShadow: inputMode === 'manual' ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Code size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px' }} />
                  Direct Code Editor
                </button>
              </div>

              {/* Template Download Actions */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                  Need templates?
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('json')}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  <Download size={12} style={{ marginRight: 4 }} /> JSON Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate('csv')}
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                >
                  <Download size={12} style={{ marginRight: 4 }} /> CSV Template
                </Button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileInputChange}
              style={{ display: 'none' }}
            />

            {/* MODE 1: FILE DRAG & DROP ZONE */}
            {inputMode === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {!uploadedFileName ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${isDragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-lg, 12px)',
                      padding: 'var(--space-32) var(--space-20)',
                      textAlign: 'center',
                      backgroundColor: isDragging ? 'var(--color-primary-light)' : 'var(--color-surface-0, #f8fafc)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 'var(--space-12)',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <UploadCloud size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text)' }}>
                        Drag & Drop your question file here
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                        Supports <strong>.json</strong> arrays and <strong>.csv</strong> spreadsheets with mathematical notation
                      </p>
                    </div>
                    <Button type="button" variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                      Browse Local Files
                    </Button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-16)',
                      borderRadius: 'var(--radius-lg, 12px)',
                      border: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-surface)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-12)' }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--radius-md, 8px)',
                          backgroundColor: activeTab === 'json' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(34, 197, 94, 0.12)',
                          color: activeTab === 'json' ? '#3b82f6' : '#22c55e',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {activeTab === 'json' ? <Code size={22} /> : <FileSpreadsheet size={22} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>
                          {uploadedFileName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                          {uploadedFileSize} · Format: {activeTab.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Change File
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={handleReset}>
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: DIRECT MANUAL TEXT EDITOR */}
            {inputMode === 'manual' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('json'); setRawText(''); setParseGlobalError(null); }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: activeTab === 'json' ? 'var(--color-primary-light)' : 'transparent',
                        color: activeTab === 'json' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveTab('csv'); setRawText(''); setParseGlobalError(null); }}
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: activeTab === 'csv' ? 'var(--color-primary-light)' : 'transparent',
                        color: activeTab === 'csv' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                      }}
                    >
                      CSV
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={activeTab === 'json' ? loadSampleJson : loadSampleCsv}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Load Sample Template
                  </button>
                </div>

                <textarea
                  value={rawText}
                  onChange={(e) => {
                    setRawText(e.target.value);
                    setParseGlobalError(null);
                  }}
                  placeholder={
                    activeTab === 'json'
                      ? '[ { "questionText": "...", "options": [{"id": "A", "text": "..."}], "correctAnswer": "A", "difficulty": 5, "explanation": "..." } ]'
                      : 'questionText,type,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation\n"What is $x$?",MULTIPLE_CHOICE,"$1$","$2$","$3$","$4$",A,5,"Reason..."'
                  }
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '0.8125rem',
                    lineHeight: 1.5,
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface-1, #f8fafc)',
                    color: 'var(--color-text)',
                    resize: 'vertical',
                  }}
                />
              </div>
            )}

            {parseGlobalError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger, #ef4444)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{parseGlobalError}</span>
              </div>
            )}

            {/* Validation Trigger Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="accent"
                onClick={() => validateData(rawText, activeTab)}
                disabled={!rawText.trim()}
              >
                Validate & Inspect Data <ArrowRight size={14} style={{ marginLeft: 6 }} />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: VALIDATION PREVIEW & INSPECTION TABLE */}
        {parsedRows && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header Status Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md, 8px)',
                backgroundColor: 'var(--color-surface-1, #f8fafc)',
                border: '1px solid var(--color-border)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  Validated {parsedRows.length} Total Questions
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm, 6px)',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    color: 'var(--color-success, #22c55e)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CheckCircle2 size={13} /> {validItems.length} Ready to Import
                </span>
                {invalidItems.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm, 6px)',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: 'var(--color-danger, #ef4444)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <AlertCircle size={13} /> {invalidItems.length} Issues Found
                  </span>
                )}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw size={13} style={{ marginRight: 4 }} /> Edit / Re-upload
              </Button>
            </div>

            {/* Validation Table */}
            <div
              style={{
                maxHeight: '360px',
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md, 8px)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-background-soft)', zIndex: 2 }}>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.625rem 0.75rem', width: '45px' }}>#</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '85px' }}>Status</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '80px' }}>Type</th>
                    <th style={{ padding: '0.625rem 0.75rem' }}>Question Prompt (Formatted)</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '140px' }}>Answer Key</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '70px' }}>Diff.</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '60px', textAlign: 'center' }}>Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowIndex}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        backgroundColor: row.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.04)',
                      }}
                    >
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {row.rowIndex}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {row.isValid ? (
                          <span style={{ color: 'var(--color-success, #22c55e)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '0.75rem' }}>
                            <CheckCircle2 size={13} /> Valid
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-danger, #ef4444)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '0.75rem' }} title={row.errors.join('; ')}>
                            <AlertCircle size={13} /> Error
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {row.data.type === 'THEORY' ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: 'rgba(139, 92, 246, 0.12)',
                              color: '#8b5cf6',
                              border: '1px solid rgba(139, 92, 246, 0.25)',
                            }}
                          >
                            Theory
                          </span>
                        ) : (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: '#3b82f6',
                              border: '1px solid rgba(59, 130, 246, 0.2)',
                            }}
                          >
                            MCQ
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        <div style={{ color: 'var(--color-text)', fontWeight: 500 }}>
                          {row.data.questionText ? (
                            <FormattedMathText text={row.data.questionText} />
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)' }}>(empty prompt)</span>
                          )}
                        </div>
                        {!row.isValid && (
                          <div style={{ color: 'var(--color-danger)', fontSize: '0.75rem', marginTop: 4, fontWeight: 500 }}>
                            {row.errors.join(' · ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {row.data.type === 'THEORY' ? (
                          <div>
                            <span style={{ fontWeight: 600, color: '#8b5cf6', fontSize: '0.75rem' }}>
                              Model Answer
                            </span>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem', marginTop: 2 }}>
                              {row.data.rubric?.length ? `${row.data.rubric.length} rubric items` : 'Default rubric'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              {row.data.correctAnswer ? `Key: ${row.data.correctAnswer}` : 'No key'}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)', marginLeft: 4, fontSize: '0.75rem' }}>
                              ({row.data.options?.length || 0} options)
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>
                        {row.data.difficulty || 5}/10
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setInspectingRow(row)}
                          title="Inspect question details"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-primary)',
                            cursor: 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                          }}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                {invalidItems.length > 0
                  ? `${invalidItems.length} question(s) with errors will be skipped automatically.`
                  : 'All questions validated cleanly.'}
              </span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button type="button" variant="secondary" onClick={handleReset} disabled={isImporting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="accent"
                  onClick={handleConfirmImport}
                  disabled={isImporting || validItems.length === 0}
                  isLoading={isImporting}
                >
                  Import {validItems.length} Question{validItems.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Question Inspector Popover / Modal */}
        {inspectingRow && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99999,
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-20)',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 580,
                backgroundColor: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xl, 16px)',
                padding: 'var(--space-24)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-16)',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
                  Question #{inspectingRow.rowIndex} Preview
                </h4>
                <button
                  type="button"
                  onClick={() => setInspectingRow(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  Prompt
                </span>
                <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: '8px', backgroundColor: 'var(--color-surface-1)', color: 'var(--color-text)', fontSize: '0.875rem' }}>
                  <FormattedMathText text={inspectingRow.data.questionText || ''} />
                </div>
              </div>

              {inspectingRow.data.type === 'MULTIPLE_CHOICE' && inspectingRow.data.options && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Options
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 4 }}>
                    {inspectingRow.data.options.map((opt) => {
                      const isCorrect = String(opt.id).toUpperCase() === String(inspectingRow.data.correctAnswer).toUpperCase();
                      return (
                        <div
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.12)' : 'var(--color-surface-1)',
                            border: `1px solid ${isCorrect ? 'var(--color-success, #22c55e)' : 'var(--color-border)'}`,
                            fontSize: '0.8125rem',
                          }}
                        >
                          <strong style={{ color: isCorrect ? 'var(--color-success, #22c55e)' : 'var(--color-text)' }}>
                            {opt.id}.
                          </strong>
                          <span style={{ flex: 1, color: 'var(--color-text)' }}>
                            <FormattedMathText text={opt.text} />
                          </span>
                          {isCorrect && (
                            <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-success, #22c55e)' }}>
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {inspectingRow.data.type === 'THEORY' && inspectingRow.data.modelAnswer && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Model Answer
                  </span>
                  <div style={{ marginTop: 4, padding: '10px 12px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.25)', fontSize: '0.8125rem', color: 'var(--color-text)' }}>
                    <FormattedMathText text={inspectingRow.data.modelAnswer} />
                  </div>
                </div>
              )}

              {inspectingRow.data.explanation && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Explanation
                  </span>
                  <div style={{ marginTop: 4, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                    <FormattedMathText text={inspectingRow.data.explanation} />
                  </div>
                </div>
              )}

              <Button type="button" variant="primary" onClick={() => setInspectingRow(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
