import * as React from 'react';
import { Copy, Check } from 'lucide-react';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';

interface ChatMessageRendererProps {
  content: string;
}

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = React.memo(({ language, code }) => {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      // Ignore clipboard write failure
    }
  }, [code]);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className="my-3 rounded-xl border border-border bg-surface-1 overflow-hidden shadow-xs">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-border bg-surface-2/60 text-xs text-text-secondary font-mono">
        <span className="font-semibold uppercase tracking-wider text-[11px]">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-surface-0 hover:text-text-primary text-text-secondary transition-colors text-xs font-sans focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {copied ? (
            <>
              <Check size={13} className="text-success shrink-0" aria-hidden="true" />
              <span className="text-success font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} className="shrink-0" aria-hidden="true" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-3.5 overflow-x-auto text-xs sm:text-sm font-mono text-text-primary leading-relaxed scrollbar-none select-text">
        <code>{code}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';

export const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = React.memo(({ content }) => {
  // Split on triple backtick code blocks
  const segments = React.useMemo(() => {
    if (!content) return [];
    const parts: { type: 'code' | 'text'; language?: string; value: string }[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.slice(lastIndex, match.index),
        });
      }
      parts.push({
        type: 'code',
        language: match[1]?.trim() || 'text',
        value: match[2],
      });
      lastIndex = codeBlockRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex),
      });
    }

    return parts;
  }, [content]);

  if (!content) return null;

  return (
    <div className="space-y-2 text-sm sm:text-[0.9375rem] leading-relaxed break-words">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <CodeBlock
              key={`code-${idx}`}
              language={seg.language || 'text'}
              code={seg.value}
            />
          );
        }

        // Render text segments, splitting into paragraphs and lists
        const lines = seg.value.split('\n');
        return (
          <div key={`text-${idx}`} className="space-y-2">
            {lines.map((line, lineIdx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={`empty-${lineIdx}`} className="h-1" />;
              }

              // Heading 1-3
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={`h3-${lineIdx}`} className="font-bold text-text-primary text-sm pt-1">
                    <FormattedMathText text={trimmed.slice(4)} />
                  </h4>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={`h2-${lineIdx}`} className="font-bold text-text-primary text-base pt-1">
                    <FormattedMathText text={trimmed.slice(3)} />
                  </h3>
                );
              }
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={`h1-${lineIdx}`} className="font-bold text-text-primary text-lg pt-1">
                    <FormattedMathText text={trimmed.slice(2)} />
                  </h2>
                );
              }

              // Bullet points
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                return (
                  <div key={`bullet-${lineIdx}`} className="flex items-start gap-2 pl-2">
                    <span className="text-primary select-none mt-1 leading-none text-xs" aria-hidden="true">•</span>
                    <span className="flex-1">
                      <FormattedMathText text={trimmed.slice(2)} />
                    </span>
                  </div>
                );
              }

              // Numbered list
              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numMatch) {
                return (
                  <div key={`num-${lineIdx}`} className="flex items-start gap-2 pl-2">
                    <span className="text-text-secondary select-none font-semibold text-xs tabular-nums mt-0.5" aria-hidden="true">
                      {numMatch[1]}.
                    </span>
                    <span className="flex-1">
                      <FormattedMathText text={numMatch[2]} />
                    </span>
                  </div>
                );
              }

              // Regular paragraph
              return (
                <p key={`p-${lineIdx}`} className="my-1">
                  <FormattedMathText text={line} />
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
});

ChatMessageRenderer.displayName = 'ChatMessageRenderer';
