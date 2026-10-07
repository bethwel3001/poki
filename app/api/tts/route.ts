import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let text = "";
  let payloadModelId: string | undefined;
  let payloadVoiceId: string | undefined;
  let payloadVoiceSettings: unknown;

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const data = await request.json();
      if (typeof data === "string") {
        text = data;
      } else if (data && typeof data === "object") {
        text =
          typeof data.text === "string"
            ? data.text
            : typeof data.script === "string"
              ? data.script
              : "";
        payloadModelId =
          typeof data.model_id === "string" ? data.model_id : undefined;
        payloadVoiceId =
          typeof data.voice_id === "string"
            ? data.voice_id
            : typeof data.voiceId === "string"
              ? data.voiceId
              : undefined;
        payloadVoiceSettings = data.voice_settings;
      }
    } catch {
      return new NextResponse("Invalid JSON body.", { status: 400 });
    }
  } else {
    const raw = await request.text();
    if (raw.trim().startsWith("{")) {
      try {
        const data = JSON.parse(raw);
        if (typeof data === "string") {
          text = data;
        } else if (data && typeof data === "object") {
          text =
            typeof data.text === "string"
              ? data.text
              : typeof data.script === "string"
                ? data.script
                : raw;
          payloadModelId =
            typeof data.model_id === "string" ? data.model_id : undefined;
          payloadVoiceId =
            typeof data.voice_id === "string"
              ? data.voice_id
              : typeof data.voiceId === "string"
                ? data.voiceId
                : undefined;
          payloadVoiceSettings = data.voice_settings;
        }
      } catch {
        text = raw;
      }
    } else {
      text = raw;
    }
  }

  if (!text || typeof text !== "string" || !text.trim()) {
    return new NextResponse(
      "Expected a non-empty text string in request body.",
      { status: 400 },
    );
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new NextResponse(
      "ELEVENLABS_API_KEY environment variable is not configured.",
      { status: 500 },
    );
  }

  const voiceId = payloadVoiceId || "pNInz6obpgDQGcFmaJgB";

  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: payloadModelId || "eleven_flash_v2_5",
        ...(payloadVoiceSettings
          ? { voice_settings: payloadVoiceSettings }
          : {}),
      }),
    },
  );

  if (!elevenLabsResponse.ok) {
    const errorBody = await elevenLabsResponse.text();
    return new NextResponse(errorBody, {
      status: elevenLabsResponse.status,
      headers: {
        "Content-Type":
          elevenLabsResponse.headers.get("content-type") || "application/json",
      },
    });
  }

  return new NextResponse(elevenLabsResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      ...(elevenLabsResponse.headers.get("content-length")
        ? {
            "Content-Length":
              elevenLabsResponse.headers.get("content-length")!,
          }
        : {}),
    },
  });
}
