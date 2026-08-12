// WMO weather codes → human-readable condition (per Open-Meteo docs)
const WEATHER_CONDITIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  56: "Light freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  97: "Thunderstorm with heavy hail",
};

async function getWeather(city: string): Promise<string> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      city,
    )}&count=1&language=en&format=json`,
  );
  if (!geoRes.ok) throw new Error("Geocoding lookup failed");
  const geo = await geoRes.json();
  const place = geo?.results?.[0];
  if (!place) throw new Error(`Could not find a location named "${city}"`);

  const { latitude, longitude, name, country } = place;
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m,weather_code`,
  );
  if (!weatherRes.ok) throw new Error("Weather lookup failed");
  const weather = await weatherRes.json();
  const current = weather?.current;
  if (!current) throw new Error("No current weather data returned");

  const condition =
    WEATHER_CONDITIONS[current.weather_code] ?? "Unknown conditions";

  return JSON.stringify({
    location: [name, country].filter(Boolean).join(", "),
    temperature_c: current.temperature_2m,
    condition,
    wind_speed_kmh: current.wind_speed_10m,
  });
}

// --- Safe arithmetic expression evaluator (no eval/Function — input is model-supplied) ---

type Token = { type: "num"; value: number } | { type: "op"; value: string };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        num += expression[i];
        i++;
      }
      if (!/^\d+(\.\d+)?$/.test(num)) {
        throw new Error(`Invalid number "${num}" in expression`);
      }
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    if ("+-*/()".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    throw new Error(`Unexpected character "${ch}" in expression`);
  }
  return tokens;
}

// Recursive-descent parser: expression := term (('+' | '-') term)*
//                            term       := factor (('*' | '/') factor)*
//                            factor     := ('+' | '-') factor | '(' expression ')' | number
class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  parse(): number {
    const result = this.parseExpression();
    if (this.pos < this.tokens.length) {
      throw new Error("Unexpected trailing characters in expression");
    }
    return result;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private next(): Token {
    const token = this.tokens[this.pos];
    if (!token) throw new Error("Unexpected end of expression");
    this.pos++;
    return token;
  }

  private peekOp(candidates: string[]): boolean {
    const token = this.peek();
    return token?.type === "op" && candidates.includes(token.value);
  }

  private parseExpression(): number {
    let value = this.parseTerm();
    while (this.peekOp(["+", "-"])) {
      const op = this.next().value;
      const rhs = this.parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    while (this.peekOp(["*", "/"])) {
      const op = this.next().value;
      const rhs = this.parseFactor();
      if (op === "/") {
        if (rhs === 0) throw new Error("Division by zero");
        value = value / rhs;
      } else {
        value = value * rhs;
      }
    }
    return value;
  }

  private parseFactor(): number {
    const token = this.peek();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "op" && token.value === "-") {
      this.next();
      return -this.parseFactor();
    }
    if (token.type === "op" && token.value === "+") {
      this.next();
      return this.parseFactor();
    }
    if (token.type === "op" && token.value === "(") {
      this.next();
      const value = this.parseExpression();
      const close = this.next();
      if (close.type !== "op" || close.value !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      return value;
    }
    if (token.type === "num") {
      this.next();
      return token.value;
    }
    throw new Error(`Unexpected token "${token.value}"`);
  }
}

function calculate(expression: string): number {
  const tokens = tokenize(expression);
  if (tokens.length === 0) throw new Error("Empty expression");
  return new Parser(tokens).parse();
}

export async function executeTool(
  name: string,
  input: unknown,
): Promise<{ output: string; isError: boolean }> {
  try {
    const params = (input ?? {}) as Record<string, unknown>;

    if (name === "get_weather") {
      const city = String(params.city ?? "").trim();
      if (!city) throw new Error("Missing required parameter: city");
      return { output: await getWeather(city), isError: false };
    }

    if (name === "calculate") {
      const expression = String(params.expression ?? "").trim();
      if (!expression) throw new Error("Missing required parameter: expression");
      const result = calculate(expression);
      return { output: JSON.stringify({ result }), isError: false };
    }

    return { output: `Unknown tool: ${name}`, isError: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool execution failed";
    return { output: message, isError: true };
  }
}
