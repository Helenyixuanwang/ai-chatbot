type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export default function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="shrink-0 w-7 h-7 rounded border border-terminal-border bg-terminal-surface flex items-center justify-center text-terminal-green text-xs font-semibold">
          AI
        </div>
      )}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded text-sm leading-relaxed whitespace-pre-wrap break-words
          ${isUser
            ? "bg-terminal-surface border border-terminal-amber text-terminal-amber"
            : `bg-terminal-surface border border-terminal-border text-terminal-text ${isStreaming ? "cursor-blink" : ""}`
          }`}
      >
        {message.content}
      </div>
      {isUser && (
        <div className="shrink-0 w-7 h-7 rounded border border-terminal-amber bg-terminal-surface flex items-center justify-center text-terminal-amber text-xs font-semibold">
          YOU
        </div>
      )}
    </div>
  );
}
