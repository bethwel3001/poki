import { NextResponse } from "next/server";
import Groq from "@groq/groq-sdk";

export const runtime = "edge";

const defaultGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function POST(request: Request) {
  let payload: {
    distance?: unknown;
    bearing?: unknown;
    goal?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return new NextResponse("Invalid JSON body.", { status: 400 });
  }

  const { distance, bearing, goal, latitude, longitude } = payload;

  if (distance === undefined || bearing === undefined) {
    return new NextResponse("Missing distance or bearing in request body.", {
      status: 400,
    });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new NextResponse("GROQ_API_KEY is not configured.", { status: 500 });
  }

  const groq = apiKey ? new Groq({ apiKey }) : defaultGroq;

  const goalText =
    typeof goal === "string" && goal.trim()
      ? ` Destination Goal: ${goal.trim()}.`
      : "";
  const coordsText =
    latitude !== undefined && longitude !== undefined
      ? ` Coordinates: (${latitude}, ${longitude}).`
      : "";

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          "You are a gritty, 8-bit outdoor adventure guide. Output exactly two short, punchy sentences guiding the user to their target or destination based on their goal, distance, and bearing (e.g., 'Head 50 meters North. Don't look at your screen, look for your target.').",
      },
      {
        role: "user",
        content: `Distance: ${distance} meters. Bearing: ${bearing}.${coordsText}${goalText}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() ?? "";

  return new NextResponse(text, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
