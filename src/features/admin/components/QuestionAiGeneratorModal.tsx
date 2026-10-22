import * as React from 'react';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { Button } from '../../../shared/components/Button';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import { apiClient } from '../../../shared/api-client/client';
import { toast } from 'sonner';
import type { Course } from '../../../types/course.types';
import type { Topic } from '../../../types/topic.types';

export interface QuestionAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  topics: Topic[];
  onQuestionsSaved: () => void;
}

export const QuestionAiGeneratorModal: React.FC<QuestionAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  courses,
  topics,
  onQuestionsSaved,
}) => {
  const [selectedCourseId, setSelectedCourseId] = React.useState('');
  const [selectedTopicId, setSelectedTopicId] = React.useState('');
  const [questionType, setQuestionType] = React.useState<'MULTIPLE_CHOICE' | 'THEORY' | 'BOTH'>('MULTIPLE_CHOICE');
  const [difficulty, setDifficulty] = React.useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [count, setCount] = React.useState(3);
  const [notesText, setNotesText] = React.useState('');

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generatedQuestions, setGeneratedQuestions] = React.useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = React.useState<Set<number>>(new Set());
  const [isSaving, setIsSaving] = React.useState(false);

  // Filter topics based on course
  const filteredTopics = React.useMemo(() => {
    if (!selectedCourseId) return topics;
    return topics.filter((t) => {
      const cId = typeof t.courseId === 'object' && t.courseId !== null ? (t.courseId as any)._id : t.courseId;
      return cId === selectedCourseId;
    });
  }, [topics, selectedCourseId]);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!notesText.trim()) {
      toast.error('Please paste syllabus notes or lecture text to generate questions from.');
      return;
    }
    if (!selectedTopicId) {
      toast.error('Please select a target topic.');
      return;
    }

    const topicObj = topics.find((t) => t._id === selectedTopicId);
    const courseObj = courses.find((c) => c._id === selectedCourseId);

    setIsGenerating(true);
    setGeneratedQuestions([]);
    setSelectedIndices(new Set());

    try {
      const res: any = await apiClient.post('/questions/ai-generate', {
        notesText,
        topicId: selectedTopicId,
        topicName: topicObj?.name || 'General',
        courseCode: courseObj?.code || 'Course',
        questionType,
        difficulty,
        count,
      });

      const list = res.data?.data || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setGeneratedQuestions(list);
        // Select all by default
        setSelectedIndices(new Set(list.map((_, i) => i)));
        toast.success(`Generated ${list.length} candidate questions!`);
      } else {
        toast.error('AI was unable to extract questions. Try pasting more detailed notes.');
      }
    } catch (err: any) {
      console.error('Failed to generate questions:', err);
      toast.error(err.response?.data?.message || 'Question generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelectIndex = (i: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const handleSaveSelected = async () => {
    const toSave = generatedQuestions.filter((_, i) => selectedIndices.has(i));
    if (toSave.length === 0) {
      toast.error('No questions selected to save.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.post('/questions/bulk', { questions: toSave });
      toast.success(`Successfully saved ${toSave.length} questions to Question Bank!`);
      onQuestionsSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to bulk save questions:', err);
      toast.error(err.response?.data?.message || 'Failed to save questions.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI Question Generator"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,23,42,0.85)] animate-in fade-in duration-200"
    >
      <div className="w-full max-w-4xl max-h-[90vh] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">AI Question Generator</h2>
              <p className="text-xs text-muted-foreground">
                Synthesize high-quality multiple choice & multi-part exam questions from syllabus notes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Settings Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/30 border border-border">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Target Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  setSelectedTopicId('');
                }}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-input bg-background text-foreground"
              >
                <option value="">Select course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.code ? `${c.code} · ${c.title}` : c.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Target Topic</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-input bg-background text-foreground"
              >
                <option value="">Select topic...</option>
                {filteredTopics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Question Format</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as any)}
                className="w-full text-xs py-2 px-2.5 rounded-lg border border-input bg-background text-foreground"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice (MCQ)</option>
                <option value="THEORY">Theory (Multi-Part)</option>
                <option value="BOTH">Mixed (Both)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Difficulty & Quantity</label>
              <div className="flex gap-2">
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="flex-1 text-xs py-2 px-2 rounded-lg border border-input bg-background text-foreground"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
                <select
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value, 10))}
                  className="w-16 text-xs py-2 px-2 rounded-lg border border-input bg-background text-foreground font-semibold"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notes Input Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-foreground">
                Paste Syllabus Content / Course Notes
              </label>
              <span className="text-[11px] text-muted-foreground">
                {notesText.length} characters (up to 4,000)
              </span>
            </div>
            <textarea
              rows={5}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Paste lecture excerpts, definitions, formulas, or syllabus learning objectives here... The AI will formulate university-level examination questions matching this content."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
            />
          </div>

          {/* Action to Generate */}
          <div className="flex justify-end">
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating || !notesText.trim() || !selectedTopicId}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Formulating Questions with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate {count} Questions
                </>
              )}
            </Button>
          </div>

          {/* Generated Questions Preview Section */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Generated Candidate Questions</h3>
                  <p className="text-xs text-muted-foreground">
                    Select which items you want to commit to the question bank.
                  </p>
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  {selectedIndices.size} of {generatedQuestions.length} selected
                </div>
              </div>

              <div className="space-y-3">
                {generatedQuestions.map((q, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectIndex(idx)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'border-primary/50 bg-primary/5 shadow-xs'
                          : 'border-border bg-card/50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-1 rounded border-input text-primary focus:ring-primary h-4 w-4"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-muted text-foreground uppercase">
                              {q.type}
                            </span>
                            {q.difficulty && (
                              <span className="text-[10px] font-semibold text-muted-foreground">
                                Level {q.difficulty} / 10
                              </span>
                            )}
                          </div>

                          <div className="text-sm font-medium text-foreground leading-relaxed">
                            <FormattedMathText text={q.questionText} />
                          </div>

                          {/* Options if MCQ */}
                          {q.type === 'MULTIPLE_CHOICE' && Array.isArray(q.options) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt: any) => (
                                <div
                                  key={opt.id}
                                  className={`text-xs p-2 rounded-lg border ${
                                    opt.id === q.correctAnswer
                                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                                      : 'border-border bg-background text-foreground'
                                  }`}
                                >
                                  <span className="font-bold mr-1.5">{opt.id}:</span>
                                  <span>{opt.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Subparts if Multi-part theory */}
                          {q.type === 'THEORY' && Array.isArray(q.subParts) && (
                            <div className="space-y-2 pt-1">
                              {q.subParts.map((sp: any, spIdx: number) => (
                                <div
                                  key={sp.id || spIdx}
                                  className="text-xs p-2.5 rounded-lg border border-border bg-background space-y-1"
                                >
                                  <div className="flex items-center justify-between font-semibold text-primary">
                                    <span>{sp.label || `Part ${spIdx + 1}`}</span>
                                    <span>[{sp.maxMarks || 2} marks]</span>
                                  </div>
                                  <div className="text-foreground">
                                    <FormattedMathText text={sp.prompt} />
                                  </div>
                                  {sp.modelAnswer && (
                                    <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                                      <span className="font-semibold text-foreground">Model Answer: </span>
                                      {sp.modelAnswer}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-card">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveSelected}
            disabled={isSaving || selectedIndices.size === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Questions...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" /> Save {selectedIndices.size} Selected Questions
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
