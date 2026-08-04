const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

export async function POST(req: Request) {
  const { text, voice_id } = await req.json();

  // Validate input
  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ error: "Invalid text format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const voiceId =
    typeof voice_id === "string" && voice_id
      ? voice_id
      : process.env.DEFAULT_VOICE_ID;

  if (!voiceId) {
    return new Response(
      JSON.stringify({ error: "No voice_id provided and DEFAULT_VOICE_ID is not set" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const response = await fetch(`${ELEVENLABS_API_URL}/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
      "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
    }),
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    return new Response(
      JSON.stringify({ error: "ElevenLabs API error", detail }),
      {
        status: response.status || 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
