import Anthropic from "@anthropic-ai/sdk";
import { tools } from "./tools";
import { executeTool } from "./execute-tool";
import { encodeToolUseEvent } from "../../lib/stream-protocol";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT =
  "You are a helpful, concise AI assistant with a clean terminal aesthetic. " +
  "Format code blocks with proper markdown. Be direct and precise.";

// Guards against a runaway tool-call loop (e.g. the model repeatedly
// re-calling a tool instead of answering).
const MAX_TOOL_ITERATIONS = 5;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Validate input
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Invalid messages format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const conversation: Anthropic.MessageParam[] = [...messages];

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueueText = (text: string) =>
        controller.enqueue(encoder.encode(text));

      try {
        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const stream = client.messages.stream({
            model: "claude-sonnet-4-6",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: conversation,
            tools,
          });

          // Stream assistant text as it arrives, same as before tool use existed.
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              enqueueText(chunk.delta.text);
            }
          }

          const finalMessage = await stream.finalMessage();

          // No tool call requested — this iteration's streamed text is the
          // full answer, we're done.
          if (finalMessage.stop_reason !== "tool_use") break;

          // Record the assistant turn (including its tool_use blocks) so the
          // follow-up request has full context.
          conversation.push({ role: "assistant", content: finalMessage.content });

          const toolUseBlocks = finalMessage.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
          );

          const toolResults: Anthropic.ToolResultBlockParam[] = [];
          for (const block of toolUseBlocks) {
            enqueueText(encodeToolUseEvent(block.name));
            const { output, isError } = await executeTool(block.name, block.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: output,
              is_error: isError,
            });
          }

          // Send all tool results back in a single user message, then loop
          // to let Claude continue (either with the real answer, or another
          // tool call).
          conversation.push({ role: "user", content: toolResults });
        }
      } catch (err) {
        console.error(err);
        enqueueText("\n⚠️ Something went wrong while processing your request.");
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
