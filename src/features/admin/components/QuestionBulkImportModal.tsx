import * as React from 'react';
import { Modal } from '../../../shared/components/Modal';
import { Button } from '../../../shared/components/Button';
import { Select } from '../../../shared/components/Select';
import {
  Code,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileSpreadsheet,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import type { Topic } from '../../../types/topic.types';
import type { CreateQuestionDTO } from '../../../types';

export interface QuestionBulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
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
  selectedTopicId,
  onImport,
  isImporting,
}) => {
  const [activeTab, setActiveTab] = React.useState<'json' | 'csv'>('json');
  const fallbackTopicId = selectedTopicId || topics[0]?._id || '';
  const [rawText, setRawText] = React.useState<string>('');
  const [parsedRows, setParsedRows] = React.useState<ParsedQuestionItem[] | null>(null);
  const [parseGlobalError, setParseGlobalError] = React.useState<string | null>(null);

  const handleReset = () => {
    setParsedRows(null);
    setParseGlobalError(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const loadSampleJson = () => {
    const topic = fallbackTopicId || topics[0]?._id || '64f1a2b3c4d5e6f7a8b9c0d1';
    const sample = [
      {
        topicId: topic,
        type: 'MULTIPLE_CHOICE',
        questionText: 'What is the primary time complexity of binary search on a sorted array?',
        options: [
          { id: 'A', text: 'O(1)' },
          { id: 'B', text: 'O(log n)' },
          { id: 'C', text: 'O(n)' },
          { id: 'D', text: 'O(n log n)' },
        ],
        correctAnswer: 'B',
        difficulty: 4,
        explanation: 'Binary search halves the search space each step, giving logarithmic runtime.',
      },
      {
        topicId: topic,
        type: 'THEORY',
        questionText: 'Explain the difference between supervised and unsupervised learning, providing one example of each.',
        modelAnswer: 'Supervised learning trains on labeled datasets where inputs map to known targets (e.g., credit card fraud classification). Unsupervised learning uncovers latent structures or clusters without ground-truth labels (e.g., customer market segmentation via k-means).',
        rubric: [
          { point: 'Accurate definition of supervised vs unsupervised data labels', weight: 0.5 },
          { point: 'Valid real-world application examples provided for both paradigms', weight: 0.5 },
        ],
        difficulty: 5,
        explanation: 'Ground-truth supervision is the defining distinction between these two machine learning paradigms.',
      },
      {
        topicId: topic,
        type: 'MULTIPLE_CHOICE',
        questionText: 'Which data structure follows a First-In, First-Out (FIFO) queuing order?',
        options: [
          { id: 'A', text: 'Stack' },
          { id: 'B', text: 'Queue' },
          { id: 'C', text: 'Heap' },
          { id: 'D', text: 'Binary Tree' },
        ],
        correctAnswer: 'B',
        difficulty: 2,
        explanation: 'Queues maintain FIFO ordering where elements exit in order of arrival.',
      },
    ];
    setRawText(JSON.stringify(sample, null, 2));
    setParseGlobalError(null);
    setParsedRows(null);
  };

  const loadSampleCsv = () => {
    const sample = `questionText,type,optionA,optionB,optionC,optionD,correctAnswer,modelAnswer,difficulty,explanation
What is the primary time complexity of binary search on a sorted array?,MULTIPLE_CHOICE,O(1),O(log n),O(n),O(n log n),B,,4,Binary search halves the search space each step.
Explain the difference between supervised and unsupervised learning.,THEORY,,,,,,Supervised learning uses labeled pairs while unsupervised discovers unlabeled patterns.,5,Labeled ground truth is the key differentiator.
Which data structure operates on a First-In First-Out basis?,MULTIPLE_CHOICE,Stack,Queue,Heap,Binary Tree,B,,2,Queues maintain FIFO ordering.`;
    setRawText(sample);
    setParseGlobalError(null);
    setParsedRows(null);
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

  const handleValidate = () => {
    setParseGlobalError(null);
    setParsedRows(null);

    if (!rawText.trim()) {
      setParseGlobalError('Please enter questions data to validate.');
      return;
    }

    try {
      const validated: ParsedQuestionItem[] = [];

      if (activeTab === 'json') {
        let jsonArray: any[];
        try {
          jsonArray = JSON.parse(rawText);
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
          if (!topic) errors.push('Missing topicId');

          const text = item.questionText?.trim() || '';
          if (text.length < 5) errors.push('Question text must be at least 5 chars');

          const isTheory = item.type === 'THEORY' || (!item.options && Boolean(item.modelAnswer));
          const questionType: 'MULTIPLE_CHOICE' | 'THEORY' = isTheory ? 'THEORY' : 'MULTIPLE_CHOICE';

          let options = item.options;
          let correctAnswer = (item.correctAnswer || '').trim();
          let modelAnswer = item.modelAnswer?.trim() || '';
          let rubric = item.rubric;

          if (isTheory) {
            if (!modelAnswer || modelAnswer.length < 5) {
              errors.push('Theory questions must provide a modelAnswer (at least 5 chars)');
            }
          } else {
            if (!Array.isArray(options) || options.length < 2) {
              errors.push('Multiple Choice must have at least 2 options');
            }
            if (!correctAnswer) {
              errors.push('Missing correctAnswer');
            } else if (Array.isArray(options)) {
              const hasMatch = options.some((opt: any) => opt.id === correctAnswer);
              if (!hasMatch) errors.push(`Correct key "${correctAnswer}" is not in options`);
            }
          }

          const difficulty = Number(item.difficulty) || 5;
          if (difficulty < 1 || difficulty > 10) errors.push('Difficulty must be 1-10');

          const explanation = (item.explanation || 'No explanation provided.').trim();

          validated.push({
            rowIndex: index + 1,
            data: {
              type: questionType,
              topicId: topic,
              questionText: text,
              options: isTheory ? [] : options || [],
              correctAnswer: isTheory ? undefined : correctAnswer,
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
        const rows = parseCsvRows(rawText);
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

        // Look for option columns: optiona, optionb, optionc, optiond, optione, optionf
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
          if (text.length < 5) errors.push('Question prompt must be at least 5 chars');

          const topic = (topicIndex !== -1 ? rowValues[topicIndex] : '') || fallbackTopicId;
          if (!topic) errors.push('Missing topic');

          const rawType = typeIndex !== -1 ? (rowValues[typeIndex] || '').toUpperCase() : '';
          const modelAnswer = modelAnswerIndex !== -1 ? (rowValues[modelAnswerIndex] || '').trim() : '';
          const isTheory = rawType === 'THEORY' || Boolean(modelAnswer && rawType !== 'MULTIPLE_CHOICE');
          const questionType: 'MULTIPLE_CHOICE' | 'THEORY' = isTheory ? 'THEORY' : 'MULTIPLE_CHOICE';

          const options: { id: string; text: string }[] = [];
          const correctAnswer = (correctIndex !== -1 ? rowValues[correctIndex] || '' : '').trim();

          if (isTheory) {
            if (!modelAnswer || modelAnswer.length < 5) {
              errors.push('Theory questions require a modelAnswer of at least 5 chars');
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
              errors.push('Missing correctAnswer');
            } else if (options.length > 0 && !options.some((o) => o.id.toUpperCase() === correctAnswer.toUpperCase())) {
              errors.push(`Key "${correctAnswer}" not found among options`);
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
      setParseGlobalError(err.message || 'Validation failed. Check format.');
    }
  };

  const validItems = parsedRows?.filter((r) => r.isValid) || [];
  const invalidItems = parsedRows?.filter((r) => !r.isValid) || [];

  const handleConfirmImport = () => {
    if (validItems.length === 0) return;
    const questionsToImport = validItems.map((v) => v.data as CreateQuestionDTO);
    onImport(questionsToImport);
  };

  const topicOptions = topics.map((t) => ({
    value: t._id,
    label: t.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Item Bank Questions"
      description="Import multiple questions simultaneously from structured JSON or CSV with automated schema validation."
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Step 1: Input / Config (when not reviewing preview) */}
        {!parsedRows && (
          <>
            {/* Fallback topic selection */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <Select
                  label="Fallback Topic (applied when topic is omitted per row)"
                  options={topicOptions}
                  value={fallbackTopicId}
                  onChange={(e) => setFallbackTopicId(e.target.value)}
                />
              </div>

              {/* Format Tabs */}
              <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--color-surface-raised)', padding: '3px', borderRadius: 'var(--radius-md)' }}>
                <button
                  type="button"
                  onClick={() => { setActiveTab('json'); setRawText(''); setParseGlobalError(null); }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeTab === 'json' ? 'var(--color-surface)' : 'transparent',
                    color: activeTab === 'json' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'json' ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  <Code size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} /> JSON Array
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('csv'); setRawText(''); setParseGlobalError(null); }}
                  style={{
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: activeTab === 'csv' ? 'var(--color-surface)' : 'transparent',
                    color: activeTab === 'csv' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    boxShadow: activeTab === 'csv' ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  <FileSpreadsheet size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} /> CSV Format
                </button>
              </div>
            </div>

            {/* Input textarea */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  {activeTab === 'json' ? 'Questions JSON Array' : 'Comma-Separated Values (CSV)'}
                </label>
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <UploadCloud size={13} /> Load Sample Template
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
                    : 'questionText,optionA,optionB,optionC,optionD,correctAnswer,difficulty,explanation\nWhat is...?,optA,optB,optC,optD,A,5,Reason...'
                }
                rows={12}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '0.8125rem',
                  lineHeight: 1.5,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-surface-raised)',
                  color: 'var(--color-text)',
                  resize: 'vertical',
                }}
              />
            </div>

            {parseGlobalError && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--color-danger)',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{parseGlobalError}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="button" variant="accent" onClick={handleValidate} disabled={!rawText.trim()}>
                Inspect & Validate Data <ArrowRight size={14} style={{ marginLeft: 4 }} />
              </Button>
            </div>
          </>
        )}

        {/* Step 2: PREVIEW STEP (showing row-by-row validation) */}
        {parsedRows && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Summary header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-raised)',
                border: '1px solid var(--color-border)',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
                  Validated {parsedRows.length} Questions
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
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
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'rgba(239, 68, 68, 0.12)',
                      color: 'var(--color-danger, #ef4444)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <AlertCircle size={13} /> {invalidItems.length} Issues Found (will be skipped)
                  </span>
                )}
              </div>

              <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw size={13} style={{ marginRight: 4 }} /> Edit Input
              </Button>
            </div>

            {/* Preview table */}
            <div
              style={{
                maxHeight: '340px',
                overflowY: 'auto',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-background-soft)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '0.625rem 0.75rem', width: '45px' }}>#</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '85px' }}>Status</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '80px' }}>Type</th>
                    <th style={{ padding: '0.625rem 0.75rem' }}>Prompt</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '130px' }}>Key / Answer</th>
                    <th style={{ padding: '0.625rem 0.75rem', width: '70px' }}>Diff.</th>
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
                              letterSpacing: '0.04em',
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
                              letterSpacing: '0.04em',
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
                          {row.data.questionText || <span style={{ color: 'var(--color-text-muted)' }}>(empty)</span>}
                        </div>
                        {!row.isValid && (
                          <div style={{ color: 'var(--color-danger)', fontSize: '0.72rem', marginTop: 2 }}>
                            {row.errors.join(' · ')}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem' }}>
                        {row.data.type === 'THEORY' ? (
                          <div>
                            <span style={{ fontWeight: 600, color: '#8b5cf6', fontSize: '0.75rem' }}>
                              📝 Model Ans
                            </span>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6875rem', marginTop: 2 }}>
                              {row.data.rubric?.length ? `${row.data.rubric.length} rubric pts` : 'No rubric'}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                              {row.data.correctAnswer ? `Key ${row.data.correctAnswer}` : 'No key'}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)', marginLeft: 4 }}>
                              ({row.data.options?.length || 0} opts)
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-muted)' }}>
                        {row.data.difficulty || 5}/10
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
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
                Import {validItems.length} Valid Question{validItems.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
