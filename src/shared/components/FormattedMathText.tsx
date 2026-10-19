import * as React from 'react';
import katex from 'katex';
import 'katex/contrib/mhchem';

export interface FormattedMathTextProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  as?: 'span' | 'div' | 'p' | 'h2' | 'h3';
}

/**
 * Normalizes non-LaTeX shorthand keystrokes (outside \ce{}) into KaTeX macros.
 * Note: Replacement order ensures <=> and <-> are never partially matched by => or <=.
 */
function normalizeShorthand(input: string): string {
  return input
    .replace(/<==>|<=>/g, '\\iff')
    .replace(/<-->|<->/g, '\\leftrightarrow')
    .replace(/-->|->/g, '\\to')
    .replace(/==>|=>/g, '\\implies')
    .replace(/<=/g, '\\le')
    .replace(/>=/g, '\\ge')
    .replace(/\+\/-/g, '\\pm')
    .replace(/!=/g, '\\ne')
    .replace(/~=/g, '\\approx');
}

// Captures \ce{...} segments (with optional 1-level nested braces)
const CE_SPLIT_REGEX = /(\\ce\{(?:[^{}]|\{[^{}]*\})*\})/g;

/**
 * Normalizes common non-LaTeX shorthand keystrokes into KaTeX-compatible macros,
 * while leaving the contents of \ce{...} untouched so mhchem can process its own
 * chemical reaction arrows (->, <=>, etc.).
 */
function normalizeMathAliases(input: string): string {
  const parts = input.split(CE_SPLIT_REGEX);
  return parts
    .map((part) => {
      if (part.startsWith('\\ce{') && part.endsWith('}')) {
        return part;
      }
      return normalizeShorthand(part);
    })
    .join('');
}


/**
 * Escapes sensitive HTML characters to prevent raw HTML/script injection
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

/**
 * Safely renders LaTeX into HTML using KaTeX with mhchem extension
 */
function renderKatexHtml(rawMath: string, displayMode: boolean): string {
  try {
    const math = normalizeMathAliases(rawMath.trim());
    return katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      trust: false,
      maxSize: 25,
      maxExpand: 500,
    });
  } catch {
    // Fallback: return escaped string so thrown errors never inject raw HTML
    return escapeHtml(rawMath);
  }
}

// Regex to capture explicit display math $$...$$ and inline math $...$
const DELIMITER_REGEX = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;

// Regex to detect bare LaTeX commands in text without $ delimiters:
// - Explicit LaTeX commands starting with \ (e.g. \ce{...}, \frac{...}{...}, \sqrt{...}, \alpha, \int, etc.)
// - Single-letter or single-digit base with ^ or _ (e.g. x^2, x^{n}, a_1, a_{ij})
// - Explicitly avoids matching multi-letter words (e.g. user_1, snake_case, Fe^{3+})
const BARE_MATH_REGEX = /(\\ce\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\(?:frac|sqrt)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\(?:sqrt)\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\[a-zA-Z]+(?:\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})*|\b[a-zA-Z0-9]\^\{[^{}]+\}|\b[a-zA-Z0-9]\^[0-9a-zA-Z\-+]+\b|\b[a-zA-Z0-9]_\{[^{}]+\}|\b[a-zA-Z0-9]_[0-9a-zA-Z]\b)/g;

/**
 * Main FormattedMathText component:
 * Typesets mathematical, physical, and chemical notations using KaTeX with mhchem.
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
      const html = renderKatexHtml(formula, isDisplay);

      if (isDisplay) {
        parts.push(
          <div
            key={`math-${match.index}`}
            className="my-3 text-center overflow-x-auto py-1 select-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      } else {
        parts.push(
          <span
            key={`math-${match.index}`}
            className="inline-block px-0.5 select-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }
      lastIndex = DELIMITER_REGEX.lastIndex;
    }

    if (lastIndex < normalizedText.length) {
      parts.push(
        <span key={`txt-end`} className="whitespace-pre-wrap">
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
    const html = renderKatexHtml(trimmed, false);
    return (
      <Component className={className} style={style}>
        <span
          className="inline-block px-0.5 select-text"
          dangerouslySetInnerHTML={{ __html: html }}
        />
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
      const html = renderKatexHtml(formula, false);
      parts.push(
        <span
          key={`math-${match.index}`}
          className="inline-block px-0.5 select-text"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
      lastIndex = BARE_MATH_REGEX.lastIndex;
    }

    if (lastIndex < normalizedText.length) {
      parts.push(
        <span key={`txt-end`} className="whitespace-pre-wrap">
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
