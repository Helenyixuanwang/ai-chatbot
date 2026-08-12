// Wire protocol for /api/chat's streamed response body.
//
// The body is plain text (assistant reply text streams through as-is, so
// existing chunk-and-append consumers keep working unmodified). Tool-call
// status updates are inlined as out-of-band events: a NUL byte, a JSON
// payload, then a NUL byte. NUL cannot appear in normal text content, so
// consumers can safely split on it to recover events from the text stream.

export const EVENT_DELIMITER = "\x00";

export interface ToolUseEvent {
  type: "tool_use";
  tool: string;
}

export function encodeToolUseEvent(tool: string): string {
  const event: ToolUseEvent = { type: "tool_use", tool };
  return `${EVENT_DELIMITER}${JSON.stringify(event)}${EVENT_DELIMITER}`;
}

export type StreamSegment =
  | { type: "text"; value: string }
  | { type: "event"; value: ToolUseEvent };

// Incrementally decodes a raw /api/chat stream into ordered text/event
// segments. Buffers across calls so an event split across two `read()`
// chunks (the NUL delimiters landing in different reads) still parses
// correctly instead of being mistaken for literal text.
export function createStreamParser() {
  let buffer = "";

  return function feed(chunk: string): StreamSegment[] {
    buffer += chunk;
    const segments: StreamSegment[] = [];

    while (true) {
      const start = buffer.indexOf(EVENT_DELIMITER);
      if (start === -1) {
        if (buffer) segments.push({ type: "text", value: buffer });
        buffer = "";
        break;
      }
      if (start > 0) {
        segments.push({ type: "text", value: buffer.slice(0, start) });
      }

      const end = buffer.indexOf(EVENT_DELIMITER, start + 1);
      if (end === -1) {
        // Incomplete event — hold everything from the marker onward until
        // the next chunk arrives.
        buffer = buffer.slice(start);
        break;
      }

      const payload = buffer.slice(start + 1, end);
      try {
        segments.push({ type: "event", value: JSON.parse(payload) as ToolUseEvent });
      } catch {
        // Malformed event payload — drop it rather than crash the UI.
      }
      buffer = buffer.slice(end + 1);
    }

    return segments;
  };
}
