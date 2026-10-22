import { Bot } from 'lucide-react';

export function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start my-2 max-w-lg mr-auto">
      <div 
        className="w-8 h-8 rounded-lg bg-primary-light text-primary flex items-center justify-center shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <Bot size={16} />
      </div>
      <div className="rounded-2xl rounded-tl-xs px-4 py-3 bg-surface-0 border border-border flex items-center gap-1.5 shadow-xs">
        <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-text-muted/60 animate-bounce" />
        <span className="sr-only">AI Tutor is thinking...</span>
      </div>
    </div>
  );
}
