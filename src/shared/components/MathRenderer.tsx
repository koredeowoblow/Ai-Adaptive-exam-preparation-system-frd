import katex from 'katex';
import 'katex/contrib/mhchem';
import 'katex/dist/katex.min.css';

export interface MathRendererProps {
  formula: string;
  isDisplay: boolean;
  className?: string;
}

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

const CE_SPLIT_REGEX = /(\\ce\{(?:[^{}]|\{[^{}]*\})*\})/g;

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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderKatexHtml(rawMath: string, displayMode: boolean): string {
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
    return escapeHtml(rawMath);
  }
}

export default function MathRenderer({ formula, isDisplay, className = '' }: MathRendererProps) {
  const html = renderKatexHtml(formula, isDisplay);

  if (isDisplay) {
    return (
      <div
        className={`my-3 text-center overflow-x-auto py-1 select-text ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`inline-block px-0.5 select-text ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
