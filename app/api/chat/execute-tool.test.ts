import { afterEach, describe, expect, it, vi } from "vitest";
import { executeTool } from "./execute-tool";

describe("executeTool - calculate", () => {
  it("respects operator precedence", async () => {
    const result = await executeTool("calculate", { expression: "2+3*4" });
    expect(result.isError).toBe(false);
    expect(JSON.parse(result.output)).toEqual({ result: 14 });
  });

  it("respects parentheses", async () => {
    const result = await executeTool("calculate", { expression: "(2+3)*4" });
    expect(result.isError).toBe(false);
    expect(JSON.parse(result.output)).toEqual({ result: 20 });
  });

  it("returns isError for division by zero instead of throwing", async () => {
    const result = await executeTool("calculate", { expression: "5/0" });
    expect(result.isError).toBe(true);
    expect(result.output).toMatch(/division by zero/i);
  });

  it.each([["2+"], ["2*(3"], ["2 3"], ["2..3"], ["@"], [""]])(
    "returns isError for malformed expression %j instead of throwing",
    async (expression) => {
      const result = await executeTool("calculate", { expression });
      expect(result.isError).toBe(true);
    },
  );
});

describe("executeTool - get_weather", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns isError instead of crashing when the city can't be found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      }),
    );

    const result = await executeTool("get_weather", {
      city: "Nowhereville12345",
    });

    expect(result.isError).toBe(true);
    expect(result.output).toMatch(/could not find a location/i);
  });

  it("returns isError when the geocoding request itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );

    const result = await executeTool("get_weather", { city: "Paris" });

    expect(result.isError).toBe(true);
  });
});
