import { describe, expect, it } from "vitest";
import {
  createStreamParser,
  encodeToolUseEvent,
  EVENT_DELIMITER,
} from "./stream-protocol";

describe("createStreamParser", () => {
  it("parses plain text with no events", () => {
    const feed = createStreamParser();
    expect(feed("hello world")).toEqual([
      { type: "text", value: "hello world" },
    ]);
  });

  it("parses a single event delivered in one chunk", () => {
    const feed = createStreamParser();
    const chunk = `before${encodeToolUseEvent("get_weather")}after`;
    expect(feed(chunk)).toEqual([
      { type: "text", value: "before" },
      { type: "event", value: { type: "tool_use", tool: "get_weather" } },
      { type: "text", value: "after" },
    ]);
  });

  it("reassembles an event split across chunk boundaries at the opening delimiter", () => {
    const feed = createStreamParser();
    const full = `before${encodeToolUseEvent("calculate")}after`;
    const splitAt = full.indexOf(EVENT_DELIMITER) + 1;

    const first = feed(full.slice(0, splitAt));
    expect(first).toEqual([{ type: "text", value: "before" }]);

    const second = feed(full.slice(splitAt));
    expect(second).toEqual([
      { type: "event", value: { type: "tool_use", tool: "calculate" } },
      { type: "text", value: "after" },
    ]);
  });

  it("reassembles an event split in the middle of its JSON payload", () => {
    const feed = createStreamParser();
    const event = encodeToolUseEvent("calculate");
    const mid = Math.floor(event.length / 2);
    const full = `before${event}after`;
    const splitPoint = "before".length + mid;

    const first = feed(full.slice(0, splitPoint));
    expect(first).toEqual([{ type: "text", value: "before" }]);

    const second = feed(full.slice(splitPoint));
    expect(second).toEqual([
      { type: "event", value: { type: "tool_use", tool: "calculate" } },
      { type: "text", value: "after" },
    ]);
  });

  it("reassembles an event split right at the closing delimiter", () => {
    const feed = createStreamParser();
    const full = `before${encodeToolUseEvent("get_weather")}after`;
    const splitPoint = full.length - 1 - "after".length;

    const first = feed(full.slice(0, splitPoint));
    expect(first).toEqual([{ type: "text", value: "before" }]);

    const second = feed(full.slice(splitPoint));
    expect(second).toEqual([
      { type: "event", value: { type: "tool_use", tool: "get_weather" } },
      { type: "text", value: "after" },
    ]);
  });

  it("handles multiple events and chunks split at arbitrary byte boundaries", () => {
    const feed = createStreamParser();
    const full = [
      "start ",
      encodeToolUseEvent("get_weather"),
      " middle ",
      encodeToolUseEvent("calculate"),
      " end",
    ].join("");

    // Feed one character at a time to stress-test buffering across many
    // arbitrary chunk boundaries, not just at the delimiters.
    const segments = [];
    for (const ch of full) {
      segments.push(...feed(ch));
    }

    const merged = segments.reduce<
      Array<{ type: string; value: unknown }>
    >((acc, seg) => {
      const last = acc[acc.length - 1];
      if (last && last.type === "text" && seg.type === "text") {
        (last.value as string) += seg.value as string;
      } else {
        acc.push({ ...seg });
      }
      return acc;
    }, []);

    expect(merged).toEqual([
      { type: "text", value: "start " },
      { type: "event", value: { type: "tool_use", tool: "get_weather" } },
      { type: "text", value: " middle " },
      { type: "event", value: { type: "tool_use", tool: "calculate" } },
      { type: "text", value: " end" },
    ]);
  });

  it("drops a malformed event payload instead of crashing", () => {
    const feed = createStreamParser();
    const chunk = `before${EVENT_DELIMITER}not-json${EVENT_DELIMITER}after`;
    expect(feed(chunk)).toEqual([
      { type: "text", value: "before" },
      { type: "text", value: "after" },
    ]);
  });
});
