import { NextResponse } from "next/server";
import Groq from "@groq/groq-sdk";

const defaultGroq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "",
});

async function getLocalContext(
  latitude: unknown,
  longitude: unknown,
): Promise<string> {
  if (
    !process.env.SERPAPI_API_KEY ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return "Unknown local area";
  }

  try {
    const url = `https://serpapi.com/search.json?engine=google_maps&q=${latitude},${longitude}&api_key=${process.env.SERPAPI_API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        `SerpApi error: ${response.status} ${response.statusText}`,
      );
      return "Unknown local area";
    }

    const data = await response.json();

    const localResults: Array<Record<string, unknown>> = Array.isArray(
      data?.local_results,
    )
      ? data.local_results
      : [];

    const placeResults: Array<Record<string, unknown>> = Array.isArray(
      data?.place_results,
    )
      ? data.place_results
      : data?.place_results && typeof data.place_results === "object"
        ? [data.place_results]
        : [];

    const candidates = [...localResults, ...placeResults];

    const landmarks = candidates
      .slice(0, 3)
      .map((item) => {
        const title =
          typeof item?.title === "string"
            ? item.title
            : typeof item?.name === "string"
              ? item.name
              : typeof item?.street === "string"
                ? item.street
                : typeof item?.address === "string"
                  ? item.address
                  : "";
        return title.trim();
      })
      .filter(Boolean);

    return landmarks.length > 0 ? landmarks.join(", ") : "Unknown local area";
  } catch (error) {
    console.error("Error fetching SerpApi local context:", error);
    return "Unknown local area";
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

  const {
    distance,
    bearing,
    goal,
    destination: payloadDestination,
    latitude,
    longitude,
  } = payload;

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

  const localContext = await getLocalContext(latitude, longitude);

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
          "You are an expert, highly accurate outdoor navigator. You are generating raw text for a TTS engine. Output ONLY the exact spoken words. Do NOT include titles, prefixes like \"Voiceover script:\", stage directions, or markdown. Keep your response punchy and under 4 sentences to ensure fast audio processing. You MUST spell out all abbreviations (e.g., write 'meters' or 'kilometers', NEVER 'm' or 'km'). NEVER output raw latitude or longitude numbers. You are an expert on Kenyan geography. Do not just describe the immediate area. Deduce the logical route from the user's current location to their destination. You MUST mention the specific main roads they will use and the major logical landmarks they will pass along the basis of the route (for example, if heading to The Hub Karen, mention passing Cooperative University or specific roads like Bogani or Langata Road if applicable). Describe the journey, not just the starting point. DO NOT invent fake landmarks or transport networks. Only use the EXACT landmarks provided in the localContext alongside real Kenyan roads and landmarks on the route. If the localContext contains known real-world landmarks, you may include ONE brief, 100% factual historical or geographical fact about them. Give precise directional instructions based on the distance and bearing. Keep it concise, grounded, and highly accurate.",
      },
      {
        role: "user",
        content: `The user is currently near: ${localContext}. They need to go ${distance} meters heading ${bearing}. The general destination is ${destination}. Give them exact, step-by-step directions. If it is over 800 meters, tell them to board a local bus/matatu. Mention specific buildings, streets, or landmarks they are near (e.g., opposite the cemetery, south of the expressway, near the local mall) based on the local context. Be descriptive, humorous, and give them a vivid picture of the route. Do not use generic terms like 'move X meters'.`,
      },
    ],
  });

  const rawScript = completion.choices[0]?.message?.content;
  const script =
    rawScript && rawScript.trim().length > 0
      ? rawScript.trim()
      : "I seem to have lost my bearings for a moment. Give me a second to recalculate the route.";

  return new NextResponse(script, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
