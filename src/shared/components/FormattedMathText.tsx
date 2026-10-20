import * as React from 'react';

export interface FormattedMathTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: 'span' | 'div' | 'p' | 'h2' | 'h3';
}

const MathRenderer = React.lazy(() => import('./MathRenderer'));

/**
 * Normalizes alternative standard LaTeX delimiters \(...\) and \[...\] to $...$ and $$...$$
 */
export function normalizeDelimiters(input: string): string {
  if (!input) return '';
  if (!input.includes('\\(') && !input.includes('\\[') && !input.includes('\\)') && !input.includes('\\]')) {
    return input;
  }
  return input
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, inner) => `$$${inner}$$`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, inner) => `$${inner}$`);
}

/**
 * Strips math delimiters and commands for plain-text contexts (such as document titles or tooltips)
 */
export function stripMathDelimiters(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\\[([\s\S]+?)\\\]/g, '$1')
    .replace(/\\\(([\s\S]+?)\\\)/g, '$1')
    .replace(/\$\$[\s\S]+?\$\$/g, (m) => m.slice(2, -2).trim())
    .replace(/\$[^\$]+?\$/g, (m) => m.slice(1, -1).trim())
    .replace(/\\[a-zA-Z]+(\{[^{}]*\})*/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Regex to capture explicit display math $$...$$ and inline math $...$
const DELIMITER_REGEX = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;

// Regex to detect bare LaTeX commands in text without $ delimiters
const BARE_MATH_REGEX = /(\\ce\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\(?:frac|sqrt)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\(?:sqrt)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\[a-zA-Z]+(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*|\b[a-zA-Z0-9]\^\{[^{}]+\}|\b[a-zA-Z0-9]\^[0-9a-zA-Z\-+]+\b|\b[a-zA-Z0-9]_\{[^{}]+\}|\b[a-zA-Z0-9]_[0-9a-zA-Z]\b)/g;

/**
 * Main FormattedMathText component:
 * Typesets mathematical, physical, and chemical notations using KaTeX with mhchem via lazy loading.
 * Supports $...$ (inline), $$...$$ (display), bare LaTeX formulas, and plain text.
 */
export const FormattedMathText: React.FC<FormattedMathTextProps> = ({
  text,
  className = '',
  style,
  as: Component = 'span',
}) => {
  if (!text) return null;

  // Convert \(...\) to $...$ and \[...\] to $$...$$ before delimiter parsing
  const normalizedText = normalizeDelimiters(text);

  // 1. Check for explicit $ or $$ delimiters
  if (DELIMITER_REGEX.test(normalizedText)) {
    DELIMITER_REGEX.lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = DELIMITER_REGEX.exec(normalizedText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`txt-${lastIndex}`} className="whitespace-pre-wrap">
            {normalizedText.slice(lastIndex, match.index)}
          </span>
        );
      }
      const raw = match[0];
      const isDisplay = raw.startsWith('$$');
      const formula = isDisplay ? raw.slice(2, -2) : raw.slice(1, -1);

      parts.push(
        <React.Suspense
          key={`math-${match.index}`}
          fallback={<span className="whitespace-pre-wrap select-text">{formula}</span>}
        >
          <MathRenderer formula={formula} isDisplay={isDisplay} />
        </React.Suspense>
      );
      lastIndex = DELIMITER_REGEX.lastIndex;
    }

    if (lastIndex < normalizedText.length) {
      parts.push(
        <span key="txt-end" className="whitespace-pre-wrap">
          {normalizedText.slice(lastIndex)}
        </span>
      );
    }

    return (
      <Component className={className} style={style}>
        {parts}
      </Component>
    );
  }

  const trimmed = normalizedText.trim();

  // 2. If entire string starts with backslash, treat the entire string as LaTeX math
  if (trimmed.startsWith('\\')) {
    return (
      <Component className={className} style={style}>
        <React.Suspense fallback={<span className="whitespace-pre-wrap select-text">{trimmed}</span>}>
          <MathRenderer formula={trimmed} isDisplay={false} />
        </React.Suspense>
      </Component>
    );
  }

  // 3. If string contains bare LaTeX commands/equations without $ delimiters
  if (BARE_MATH_REGEX.test(normalizedText)) {
    BARE_MATH_REGEX.lastIndex = 0;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = BARE_MATH_REGEX.exec(normalizedText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={`txt-${lastIndex}`} className="whitespace-pre-wrap">
            {normalizedText.slice(lastIndex, match.index)}
          </span>
        );
      }
      const formula = match[0];
      parts.push(
        <React.Suspense
          key={`math-${match.index}`}
          fallback={<span className="whitespace-pre-wrap select-text">{formula}</span>}
        >
          <MathRenderer formula={formula} isDisplay={false} />
        </React.Suspense>
      );
      lastIndex = BARE_MATH_REGEX.lastIndex;
    }

    if (lastIndex < normalizedText.length) {
      parts.push(
        <span key="txt-end" className="whitespace-pre-wrap">
          {normalizedText.slice(lastIndex)}
        </span>
      );
    }

    return (
      <Component className={className} style={style}>
        {parts}
      </Component>
    );
  }

  // 4. Pure plain text fallback
  return (
    <Component className={className} style={style}>
      <span className="whitespace-pre-wrap">{text}</span>
    </Component>
  );
};
