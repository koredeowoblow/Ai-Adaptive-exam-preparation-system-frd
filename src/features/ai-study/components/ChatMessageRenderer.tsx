import * as React from 'react';
import { normalizeChatText } from '../utils/chatTextNormalizer';

interface ChatMessageRendererProps {
  content: string;
}

// Lazy-load MarkdownContent so react-markdown and remark-gfm are only loaded in the chat bundle chunk
const MarkdownContent = React.lazy(() => import('./MarkdownContent'));

export const ChatMessageRenderer: React.FC<ChatMessageRendererProps> = React.memo(({ content }) => {
  const { normalizedMarkdown, mathStore } = React.useMemo(() => {
    return normalizeChatText(content);
  }, [content]);

  if (!content || !content.trim()) return null;

  return (
    <React.Suspense
      fallback={
        <div className="text-sm leading-relaxed text-text-primary whitespace-pre-wrap break-words max-w-[760px]">
          {content}
        </div>
      }
    >
      <MarkdownContent
        normalizedMarkdown={normalizedMarkdown}
        mathStore={mathStore}
      />
    </React.Suspense>
  );
});

ChatMessageRenderer.displayName = 'ChatMessageRenderer';

export default ChatMessageRenderer;
