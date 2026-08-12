"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage, { Message } from "./components/ChatMessage";
import ChatInput from "./components/ChatInput";
import { createStreamParser } from "./lib/stream-protocol";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Append an empty assistant message — we'll stream into it
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parseChunk = createStreamParser();

      // Read stream chunks: text segments append to the last message,
      // tool_use events toggle the "🔧 ..." indicator.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        for (const segment of parseChunk(chunk)) {
          if (segment.type === "event") {
            setActiveTool(segment.value.tool);
            continue;
          }
          setActiveTool(null);
          const text = segment.value;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: updated[updated.length - 1].content + text,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "⚠️ Something went wrong. Please try again.",
        };
        return updated;
      });
      console.error(err);
    } finally {
      setActiveTool(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="shrink-0 border-b border-terminal-border bg-terminal-surface px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-terminal-green font-semibold text-sm">●</span>
            <span className="text-terminal-text font-semibold tracking-wide">
              AI CHATBOT
            </span>
          </div>
          <span className="text-terminal-muted text-xs">
            powered by Claude
          </span>
        </div>
      </header>

      {/* Message list */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="text-center mt-24 space-y-3">
              <p className="text-terminal-green text-2xl font-semibold">
                &gt; Hello, World.
              </p>
              <p className="text-terminal-muted text-sm">
                Ask me anything. I&apos;m powered by Claude.
              </p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isStreaming =
              isLoading && i === messages.length - 1 && msg.role === "assistant";
            return (
              <ChatMessage
                key={i}
                message={msg}
                isStreaming={isStreaming}
                activeTool={isStreaming ? activeTool : null}
              />
            );
          })}

          {/* Invisible anchor for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <ChatInput
        value={input}
        onChange={setInput}
        onSubmit={sendMessage}
        isLoading={isLoading}
      />
      {/* Footer */}
<footer className="shrink-0 border-t border-terminal-border bg-terminal-bg px-6 py-2">
  <div className="max-w-3xl mx-auto flex items-center justify-center gap-6">
    <a href="https://linkedin.com/in/helenyixuanwang" target="_blank" rel="noopener noreferrer" className="text-terminal-muted hover:text-terminal-green text-xs transition-colors">LinkedIn</a>
    <span className="text-terminal-border">|</span>
    <a href="https://github.com/Helenyixuanwang" target="_blank" rel="noopener noreferrer" className="text-terminal-muted hover:text-terminal-green text-xs transition-colors">GitHub</a>
    <span className="text-terminal-border">|</span>
    <span className="text-terminal-muted text-xs">Built by Helen Wang</span>
  </div>
</footer>
    </div>
  );
}