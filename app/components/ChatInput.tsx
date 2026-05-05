import { useRef, useEffect } from "react";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && value.trim()) onSubmit();
    }
  };

  return (
    <div className="border-t border-terminal-border bg-terminal-surface px-4 py-3">
      <div className="flex items-end gap-3 max-w-3xl mx-auto">
        <span className="text-terminal-green font-semibold pb-2.5 select-none">
          &gt;
        </span>
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={isLoading ? "Waiting for response..." : "Type a message...  (Shift+Enter for newline)"}
          className="flex-1 resize-none bg-transparent text-terminal-text placeholder-terminal-muted text-sm
            focus:outline-none leading-relaxed max-h-40 overflow-y-auto
            disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          className="shrink-0 px-3 py-1.5 mb-1 rounded border border-terminal-green text-terminal-green
            text-xs font-semibold hover:bg-terminal-green hover:text-terminal-bg
            transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isLoading ? "..." : "SEND"}
        </button>
      </div>
    </div>
  );
}
