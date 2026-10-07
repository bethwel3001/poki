import { NextResponse } from "next/server";
import Groq from "@groq/groq-sdk";

export const runtime = "edge";

const defaultGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

async function getLocalContext(
  latitude: unknown,
  longitude: unknown,
): Promise<string> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey || latitude === undefined || longitude === undefined) {
    return "";
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_maps_reverse_geocoding&ll=${latitude},${longitude}&api_key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `SerpApi error: ${response.status} ${response.statusText}`,
      );
      return "";
    }

    const data = await response.json();
    const placeResults: Array<Record<string, unknown>> = Array.isArray(
      data?.place_results,
    )
      ? data.place_results
      : [];

    const landmarks = placeResults
      .slice(0, 3)
      .map((item) => {
        const title =
          typeof item.title === "string"
            ? item.title
            : typeof item.name === "string"
              ? item.name
              : typeof item.street === "string"
                ? item.street
                : typeof item.address === "string"
                  ? item.address
                  : "";
        return title.trim();
      })
      .filter(Boolean);

    return landmarks.join(", ");
  } catch (error) {
    console.error("Error fetching SerpApi reverse geocoding:", error);
    return "";
  }
}

export async function POST(request: Request) {
  let payload: {
    distance?: unknown;
    bearing?: unknown;
    goal?: unknown;
    destination?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  };

  try {
    payload = await request.json();
  } catch {
    return new NextResponse("Invalid JSON body.", { status: 400 });
  }

  const { distance, bearing, goal, destination: payloadDestination, latitude, longitude } = payload;

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

  const localContextResult = await getLocalContext(latitude, longitude);
  const localContext = localContextResult || "their current location";

  const destination =
    typeof payloadDestination === "string" && payloadDestination.trim()
      ? payloadDestination.trim()
      : typeof goal === "string" && goal.trim()
        ? goal.trim()
        : "their target destination";

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [
      {
        role: "system",
        content:
          "You are a highly detailed, slightly sarcastic, incredibly knowledgeable local outdoor navigator. Your job is to guide the user to their destination using hyper-local context.",
      },
      {
        role: "user",
        content: `The user is currently near: ${localContext}. They need to go ${distance} meters heading ${bearing}. The general destination is ${destination}. Give them exact, step-by-step directions. If it is over 800 meters, tell them to board a local bus/matatu. Mention specific buildings, streets, or landmarks they are near (e.g., opposite the cemetery, south of the expressway, near the local mall) based on the local context. Be descriptive, humorous, and give them a vivid picture of the route. Do not use generic terms like 'move X meters'.`,
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
