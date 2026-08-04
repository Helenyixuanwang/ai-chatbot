import { useState } from "react";

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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeak = async () => {
    if (isStreaming || isSpeaking || !message.content) return;
    setIsSpeaking(true);
    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.content }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.onerror = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSpeaking(false);
    }
  };

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
        <button
          onClick={handleSpeak}
          disabled={isStreaming || isSpeaking || !message.content}
          aria-label="Play message as audio"
          title="Play as audio"
          className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded border border-terminal-green text-terminal-green align-text-bottom
            hover:bg-terminal-green hover:text-terminal-bg transition-colors
            disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-terminal-green"
        >
          {isSpeaking ? (
            <span className="text-[10px] leading-none animate-pulse">...</span>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path d="M11 5 6 9H2v6h4l5 4V5zM16.5 12a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
            </svg>
          )}
        </button>
      </div>
      {isUser && (
        <div className="shrink-0 w-7 h-7 rounded border border-terminal-amber bg-terminal-surface flex items-center justify-center text-terminal-amber text-xs font-semibold">
          YOU
        </div>
      )}
    </div>
  );
}
