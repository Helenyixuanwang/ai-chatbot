import type Anthropic from "@anthropic-ai/sdk";

export const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description:
      "Get the current weather for a city — temperature (°C), condition, and wind speed (km/h). Uses live data, so call it whenever the user asks about current weather or conditions in a specific place.",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name, e.g. 'Paris' or 'San Francisco'",
        },
      },
      required: ["city"],
    },
  },
  {
    name: "calculate",
    description:
      "Evaluate a numeric math expression (e.g. '12 * (3 + 4) / 2') and return the result. Use this for any arithmetic instead of computing it yourself.",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description:
            "A math expression using digits and the operators + - * / ( ) . , e.g. '(15 + 27) * 3'",
        },
      },
      required: ["expression"],
    },
  },
];
