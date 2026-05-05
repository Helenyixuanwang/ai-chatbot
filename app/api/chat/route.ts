import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Validate input
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Invalid messages format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "You are a helpful, concise AI assistant with a clean terminal aesthetic. " +
      "Format code blocks with proper markdown. Be direct and precise.",
    messages,
  });

  // Convert Anthropic's stream to a Web ReadableStream
  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}