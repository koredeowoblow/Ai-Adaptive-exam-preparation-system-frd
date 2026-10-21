import * as React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';
import { FormattedMathText } from '../../../shared/components/FormattedMathText';

interface MarkdownContentProps {
  normalizedMarkdown: string;
  mathStore: Map<string, string>;
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
    <div className="my-3 rounded-xl border border-border bg-surface-1 overflow-hidden shadow-xs max-w-full">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-1.5 border-b border-border bg-surface-2/60 text-xs text-text-secondary font-mono">
        <span className="font-semibold uppercase tracking-wider text-xs">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-surface-0 hover:text-text-primary text-text-secondary transition-colors text-xs font-sans focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 cursor-pointer"
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

/**
 * Traverses rendered React children and replaces any protected math tokens
 * (MATHINLINE...Z / MATHDISPLAY...Z) with FormattedMathText KaTeX components.
 */
function renderWithMath(children: React.ReactNode, mathStore: Map<string, string>): React.ReactNode {
  if (mathStore.size === 0) return children;

  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      const parts = child.split(/(MATH(?:DISPLAY|INLINE)\d+Z)/g);
      if (parts.length === 1) return child;
      return parts.map((part, idx) => {
        const formula = mathStore.get(part);
        if (formula !== undefined) {
          return <FormattedMathText key={idx} text={formula} />;
        }
        return part;
      });
    }

    if (React.isValidElement(child) && (child.props as Record<string, unknown>)?.children) {
      return React.cloneElement(
        child as React.ReactElement<{ children?: React.ReactNode }>,
        {},
        renderWithMath((child.props as { children?: React.ReactNode }).children, mathStore)
      );
    }

    return child;
  });
}

export const MarkdownContent: React.FC<MarkdownContentProps> = React.memo(
  ({ normalizedMarkdown, mathStore }) => {
    const components = React.useMemo(() => {
      return {
        // Headings mapped down: h1 -> h3, h2 -> h4, h3 -> h5, h4..h6 -> h6
        h1: ({ children }: { children?: React.ReactNode }) => (
          <h3 className="text-base font-bold text-text-primary tracking-[-0.005em] mt-3 mb-1.5 first:mt-0">
            {renderWithMath(children, mathStore)}
          </h3>
        ),
        h2: ({ children }: { children?: React.ReactNode }) => (
          <h4 className="text-sm font-bold text-text-primary tracking-[-0.005em] mt-2.5 mb-1 first:mt-0">
            {renderWithMath(children, mathStore)}
          </h4>
        ),
        h3: ({ children }: { children?: React.ReactNode }) => (
          <h5 className="text-sm font-semibold text-text-primary mt-2 mb-1 first:mt-0">
            {renderWithMath(children, mathStore)}
          </h5>
        ),
        h4: ({ children }: { children?: React.ReactNode }) => (
          <h6 className="text-xs font-semibold text-text-primary uppercase tracking-wider mt-2 mb-1 first:mt-0">
            {renderWithMath(children, mathStore)}
          </h6>
        ),
        h5: ({ children }: { children?: React.ReactNode }) => (
          <h6 className="text-xs font-semibold text-text-primary uppercase tracking-wider mt-2 mb-1 first:mt-0">
            {renderWithMath(children, mathStore)}
          </h6>
        ),
        h6: ({ children }: { children?: React.ReactNode }) => (
          <h6 className="text-xs font-semibold text-text-primary uppercase tracking-wider mt-2 mb-1 first:mt-0">
            {renderWithMath(children, mathStore)}
          </h6>
        ),

        // Text blocks
        p: ({ children }: { children?: React.ReactNode }) => (
          <p className="leading-relaxed my-1.5 first:mt-0 last:mb-0 break-words">
            {renderWithMath(children, mathStore)}
          </p>
        ),
        strong: ({ children }: { children?: React.ReactNode }) => (
          <strong className="font-semibold text-text-primary">
            {renderWithMath(children, mathStore)}
          </strong>
        ),
        em: ({ children }: { children?: React.ReactNode }) => (
          <em className="italic">{renderWithMath(children, mathStore)}</em>
        ),

        // Lists
        ul: ({ children }: { children?: React.ReactNode }) => (
          <ul className="list-disc list-outside pl-5 space-y-1 my-2 first:mt-0 last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }: { children?: React.ReactNode }) => (
          <ol className="list-decimal list-outside pl-5 space-y-1 my-2 first:mt-0 last:mb-0 tabular-nums">
            {children}
          </ol>
        ),
        li: ({ children }: { children?: React.ReactNode }) => (
          <li className="leading-relaxed pl-0.5">
            {renderWithMath(children, mathStore)}
          </li>
        ),

        // Blockquotes
        blockquote: ({ children }: { children?: React.ReactNode }) => (
          <blockquote className="border-l-4 border-primary/40 pl-3.5 my-2 text-text-secondary italic first:mt-0 last:mb-0">
            {renderWithMath(children, mathStore)}
          </blockquote>
        ),

        // Tables wrapped inside overflow-x-auto container
        table: ({ children }: { children?: React.ReactNode }) => (
          <div className="overflow-x-auto my-3 border border-border rounded-xl max-w-full shadow-xs">
            <table className="min-w-full divide-y divide-border text-xs sm:text-sm text-left">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }: { children?: React.ReactNode }) => (
          <thead className="bg-surface-1 text-text-secondary font-semibold">
            {children}
          </thead>
        ),
        tbody: ({ children }: { children?: React.ReactNode }) => (
          <tbody className="divide-y divide-border bg-surface-0">
            {children}
          </tbody>
        ),
        tr: ({ children }: { children?: React.ReactNode }) => (
          <tr className="hover:bg-surface-1/50 transition-colors">
            {children}
          </tr>
        ),
        th: ({ children }: { children?: React.ReactNode }) => (
          <th className="px-3.5 py-2 font-semibold text-text-primary">
            {renderWithMath(children, mathStore)}
          </th>
        ),
        td: ({ children }: { children?: React.ReactNode }) => (
          <td className="px-3.5 py-2 text-text-primary">
            {renderWithMath(children, mathStore)}
          </td>
        ),

        // Separator
        hr: () => <hr className="my-3 border-border" />,

        // Code: block vs inline
        pre: ({ children }: { children?: React.ReactNode }) => {
          if (React.isValidElement(children)) {
            const codeProps = children.props as { className?: string; children?: React.ReactNode };
            const className = codeProps.className || '';
            const match = /language-([a-zA-Z0-9_\-+]+)/.exec(className);
            const language = match ? match[1] : '';
            const rawCode =
              typeof codeProps.children === 'string'
                ? codeProps.children
                : Array.isArray(codeProps.children)
                ? codeProps.children.join('')
                : String(codeProps.children || '');
            const code = rawCode.replace(/\n$/, '');
            return <CodeBlock language={language} code={code} />;
          }
          return <pre className="p-3.5 overflow-x-auto font-mono text-xs">{children}</pre>;
        },
        code: ({ children }: { children?: React.ReactNode }) => {
          return (
            <code className="px-1.5 py-0.5 rounded-md bg-surface-1 text-primary font-mono text-xs border border-border/50 break-words select-text">
              {children}
            </code>
          );
        },

        // Links: only http, https, and mailto. Everything else renders as plain text.
        a: ({ href, children }: { href?: string; children?: React.ReactNode }) => {
          if (!href) return <span>{renderWithMath(children, mathStore)}</span>;
          const isSafe = /^(https?:|mailto:)/i.test(href.trim());
          if (!isSafe) {
            return <span className="text-text-primary">{renderWithMath(children, mathStore)}</span>;
          }
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium inline-flex items-center gap-0.5 break-all focus:outline-none focus:ring-1 focus:ring-primary rounded"
            >
              {renderWithMath(children, mathStore)}
            </a>
          );
        },

        // Images: do not render them; show alt or placeholder text instead
        img: ({ alt, src }: { alt?: string; src?: string }) => {
          return (
            <span className="text-text-secondary text-xs italic">
              [Image: {alt || src || 'image'}]
            </span>
          );
        },
      };
    }, [mathStore]);

    return (
      <div className="text-sm leading-relaxed text-text-primary max-w-[760px] w-full break-words">
        <Markdown remarkPlugins={[remarkGfm]} components={components}>
          {normalizedMarkdown}
        </Markdown>
      </div>
    );
  }
);

MarkdownContent.displayName = 'MarkdownContent';

export default MarkdownContent;
