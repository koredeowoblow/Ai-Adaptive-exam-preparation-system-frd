import * as React from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Layers } from 'lucide-react';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';
import { DiagramUploader } from './DiagramUploader';
import type { QuestionSubPart } from '../../../types/question.types';

export interface SubPartEditorProps {
  subParts: QuestionSubPart[];
  onChange: (subParts: QuestionSubPart[]) => void;
  showMathPreview?: boolean;
}

export const SubPartEditor: React.FC<SubPartEditorProps> = ({
  subParts = [],
  onChange,
  showMathPreview = true,
}) => {
  // Helper to suggest the next label
  const getNextLabel = (index: number): string => {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    if (index < letters.length) {
      return `1(${letters[index]})`;
    }
    return `1(part_${index + 1})`;
  };

  const handleAddSubPart = (labelSuffix?: string) => {
    const newIndex = subParts.length;
    let label = getNextLabel(newIndex);

    if (labelSuffix) {
      // e.g., user clicked "Add (i) sub-part"
      const parentLabel = subParts[subParts.length - 1]?.label || '1(a)';
      label = `${parentLabel}(i)`;
    }

    const newSubPart: QuestionSubPart = {
      id: `part_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      label,
      prompt: '',
      maxMarks: 5,
      modelAnswer: '',
      rubric: [
        { point: 'Definition / derivation step', weight: 3 },
        { point: 'Correct final result with units/justification', weight: 2 },
      ],
      order: newIndex,
    };

    onChange([...subParts, newSubPart]);
  };

  const handleUpdateSubPart = (index: number, updates: Partial<QuestionSubPart>) => {
    const next = [...subParts];
    next[index] = { ...next[index], ...updates };
    onChange(next);
  };

  const handleRemoveSubPart = (index: number) => {
    const next = subParts.filter((_, i) => i !== index).map((sp, i) => ({ ...sp, order: i }));
    onChange(next);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subParts.length) return;
    const next = [...subParts];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    onChange(next.map((sp, i) => ({ ...sp, order: i })));
  };

  const handleAddRubricCriterion = (subPartIndex: number) => {
    const sp = subParts[subPartIndex];
    const newRubric = [...(sp.rubric || []), { point: '', weight: 1 }];
    handleUpdateSubPart(subPartIndex, { rubric: newRubric });
  };

  const handleUpdateRubricCriterion = (
    subPartIndex: number,
    criterionIndex: number,
    point: string,
    weight: number
  ) => {
    const sp = subParts[subPartIndex];
    const newRubric = [...(sp.rubric || [])];
    newRubric[criterionIndex] = { point, weight };
    handleUpdateSubPart(subPartIndex, { rubric: newRubric });
  };

  const handleRemoveRubricCriterion = (subPartIndex: number, criterionIndex: number) => {
    const sp = subParts[subPartIndex];
    const newRubric = (sp.rubric || []).filter((_, i) => i !== criterionIndex);
    handleUpdateSubPart(subPartIndex, { rubric: newRubric });
  };

  const totalMarks = subParts.reduce((sum, sp) => sum + (Number(sp.maxMarks) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-16)' }}>
      {/* Header & Total Marks Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-12) var(--space-16)',
          borderRadius: 'var(--radius-md, 8px)',
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--color-primary, #8b5cf6)" />
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Sub-Questions Hierarchy (1a, 1b, 1b(i)...)
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {subParts.length} sub-parts configured • Total Marks: <strong>{totalMarks} marks</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => handleAddSubPart()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              background: 'var(--color-primary, #8b5cf6)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Plus size={14} /> Add Sub-Part (e.g. {getNextLabel(subParts.length)})
          </button>
        </div>
      </div>

      {subParts.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-24)',
            textAlign: 'center',
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md, 8px)',
            background: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.01))',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            No sub-parts added yet. Click below to add <strong>Question 1(a)</strong>.
          </p>
          <button
            type="button"
            onClick={() => handleAddSubPart()}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            + Add First Sub-Part: 1(a)
          </button>
        </div>
      ) : (
        subParts.map((sp, index) => {
          const subTotalRubric = (sp.rubric || []).reduce((acc, r) => acc + (Number(r.weight) || 0), 0);

          return (
            <div
              key={sp.id || index}
              style={{
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg, 10px)',
                background: 'var(--color-surface)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-xs, 0 1px 3px rgba(0,0,0,0.05))',
              }}
            >
              {/* Sub-Part Header Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.03))',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: 'var(--color-primary, #8b5cf6)',
                    }}
                  >
                    Part {index + 1}
                  </span>

                  {/* Label Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Label:</label>
                    <input
                      type="text"
                      value={sp.label}
                      onChange={(e) => handleUpdateSubPart(index, { label: e.target.value })}
                      placeholder="e.g. 1(a), 1(b)(i)"
                      style={{
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        width: '90px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>

                  {/* Max Marks Input */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Marks:</label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={sp.maxMarks || 1}
                      onChange={(e) => handleUpdateSubPart(index, { maxMarks: parseFloat(e.target.value) || 1 })}
                      style={{
                        padding: '3px 8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        width: '65px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Move & Delete Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    title="Move Up"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: index === 0 ? 'var(--color-text-disabled, #ccc)' : 'var(--color-text-secondary)',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      padding: 4,
                    }}
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    disabled={index === subParts.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    title="Move Down"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color:
                        index === subParts.length - 1
                          ? 'var(--color-text-disabled, #ccc)'
                          : 'var(--color-text-secondary)',
                      cursor: index === subParts.length - 1 ? 'not-allowed' : 'pointer',
                      padding: 4,
                    }}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubPart(index)}
                    title="Remove Sub-part"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--color-danger, #ef4444)',
                      cursor: 'pointer',
                      padding: 4,
                      marginLeft: 6,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Sub-Part Content Fields */}
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Sub-part Prompt */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Sub-Part Prompt *
                  </label>
                  <textarea
                    rows={2}
                    value={sp.prompt}
                    onChange={(e) => handleUpdateSubPart(index, { prompt: e.target.value })}
                    placeholder={`e.g. State three key differences and derive the transfer function H(z)...`}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                  {showMathPreview && sp.prompt.trim() && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'var(--color-bg-subtle, rgba(0,0,0,0.02))',
                        border: '1px solid var(--color-border)',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                        Preview:
                      </span>{' '}
                      <FormattedMathText text={sp.prompt} />
                    </div>
                  )}
                </div>

                {/* Sub-Part Specific Diagram (Optional) */}
                <DiagramUploader
                  label="Sub-Part Specific Diagram (Optional)"
                  helperText="Only upload if this sub-question introduces its own diagram or graph"
                  value={sp.diagramUrl}
                  caption={sp.diagramCaption}
                  onChange={(url, caption) => handleUpdateSubPart(index, { diagramUrl: url, diagramCaption: caption })}
                />

                {/* Sub-Part Model Answer */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                    Model Answer (Expected Solution) *
                  </label>
                  <textarea
                    rows={3}
                    value={sp.modelAnswer}
                    onChange={(e) => handleUpdateSubPart(index, { modelAnswer: e.target.value })}
                    placeholder="Enter the complete expected solution, derivations, or explanation for this sub-part..."
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                  {showMathPreview && sp.modelAnswer.trim() && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        background: 'rgba(139, 92, 246, 0.05)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        fontSize: '13px',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary, #8b5cf6)' }}>
                        Model Answer Preview:
                      </span>{' '}
                      <FormattedMathText text={sp.modelAnswer} />
                    </div>
                  )}
                </div>

                {/* Rubric Criteria Builder */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-subtle, rgba(0, 0, 0, 0.02))',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Rubric Criteria & Marks Weight</span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
                        (Sum: {subTotalRubric} pts)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddRubricCriterion(index)}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                        background: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Plus size={12} /> Add Criterion
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(sp.rubric || []).map((crit, cIdx) => (
                      <div key={cIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={crit.point}
                          onChange={(e) =>
                            handleUpdateRubricCriterion(index, cIdx, e.target.value, crit.weight)
                          }
                          placeholder="e.g. Correct formula stated; or accurate step 1 derivation"
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '12px',
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>pts:</span>
                          <input
                            type="number"
                            min={0.5}
                            step={0.5}
                            value={crit.weight}
                            onChange={(e) =>
                              handleUpdateRubricCriterion(
                                index,
                                cIdx,
                                crit.point,
                                parseFloat(e.target.value) || 1
                              )
                            }
                            style={{
                              width: '55px',
                              padding: '4px 6px',
                              fontSize: '12px',
                              borderRadius: '4px',
                              border: '1px solid var(--color-border)',
                              textAlign: 'center',
                            }}
                          />
                        </div>
                        {(sp.rubric || []).length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRubricCriterion(index, cIdx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-danger, #ef4444)',
                              cursor: 'pointer',
                              padding: 2,
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
