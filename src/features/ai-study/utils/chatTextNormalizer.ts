/**
 * Chat Text Normalizer
 *
 * Normalizes tutor responses before markdown rendering:
 * 1. Normalizes line endings (\r\n -> \n, \r -> \n) and trims.
 * 2. Converts literal escaped sequences (e.g. literal `\n` or `\``) outside code blocks only.
 * 3. Collapses 3+ blank lines into 2.
 * 4. Repairs unclosed code fences at the end of the text.
 * 5. Protects math segments ($...$ and $$...$$) from markdown processing so underscores
 *    and asterisks inside equations are not mangled into italics or bold.
 */

export interface NormalizedChatOutput {
  normalizedMarkdown: string;
  mathStore: Map<string, string>;
}

/**
 * Checks if the number of code fence delimiters (``` or ~~~) is odd.
 * If odd, the last code block was left unclosed (e.g. during partial generation).
 */
export function repairUnclosedFences(text: string): string {
  const lines = text.split('\n');
  let openFence: string | null = null;

  for (const line of lines) {
    const trimmed = line.trimStart();
    const match = trimmed.match(/^(`{3,}|~{3,})/);
    if (match) {
      const fenceMarker = match[1][0]; // '`' or '~'
      if (!openFence) {
        openFence = fenceMarker;
      } else if (openFence === fenceMarker) {
        openFence = null;
      }
    }
  }

  if (openFence) {
    const closingFence = `${openFence}${openFence}${openFence}`;
    return text.endsWith('\n') ? `${text}${closingFence}\n` : `${text}\n${closingFence}\n`;
  }
  return text;
}

/**
 * Main normalization pipeline.
 */
export function normalizeChatText(rawText: string): NormalizedChatOutput {
  const mathStore = new Map<string, string>();
  if (!rawText) {
    return { normalizedMarkdown: '', mathStore };
  }

  // 1. Normalize line endings and trim
  let text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // 2. Separate closed code blocks so we can safely convert literal escaped sequences
  // (like `\n` or `\``) strictly outside of code blocks.
  const codeBlockSplitter = /(```[\s\S]*?```|~~~[\s\S]*?~~~)/g;
  const segments = text.split(codeBlockSplitter);

  const processedSegments = segments.map((seg, idx) => {
    const isCodeBlock = idx % 2 === 1;
    if (isCodeBlock) {
      // Inside code block: preserve verbatim, do NOT convert escaped sequences
      return seg;
    }
    // Outside code block:
    // Convert literal \n to actual newline and \` to `
    return seg
      .replace(/\\n/g, '\n')
      .replace(/\\`/g, '`');
  });

  text = processedSegments.join('');

  // 3. Collapse 3+ blank lines into 2 (i.e. 4+ newlines -> 3 newlines)
  text = text.replace(/(?:[ \t]*\n){4,}/g, '\n\n\n');

  // 4. Repair unclosed code fences at the end
  text = repairUnclosedFences(text);

  // 5. Tokenize to protect math from markdown processing:
  // Match fenced code, inline code, display math, and inline math.
  const tokenRegex = /(```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]+`|\$\$[\s\S]+?\$\$|\$(?!\s)[^\$\n]+?(?<!\s)\$)/g;

  let mathIndex = 0;
  const parts: string[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith('```') || token.startsWith('~~~')) {
      // Fenced code block: preserve verbatim
      parts.push(token);
    } else if (token.startsWith('`')) {
      // Inline code: preserve verbatim
      parts.push(token);
    } else if (token.startsWith('$$')) {
      // Display math: protect from markdown parser
      const tokenKey = `MATHDISPLAY${mathIndex++}Z`;
      mathStore.set(tokenKey, token);
      parts.push(tokenKey);
    } else if (token.startsWith('$')) {
      // Inline math: protect from markdown parser
      const tokenKey = `MATHINLINE${mathIndex++}Z`;
      mathStore.set(tokenKey, token);
      parts.push(tokenKey);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  const finalNormalized = parts.join('');

  return {
    normalizedMarkdown: finalNormalized,
    mathStore,
  };
}
