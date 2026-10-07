import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import {
  calculateBearing,
  calculateDistance,
  isValidLatitude,
  isValidLongitude,
  type GeoJsonPoint,
} from "@/lib/geo";

type LocationPayload = {
  latitude?: unknown;
  longitude?: unknown;
  friendSessionId?: unknown;
  sessionId?: unknown;
  goal?: unknown;
};

type SessionLocation = {
  coordinates: {
    type: "Point";
    coordinates: [number, number];
  };
  goal?: string;
  createdAt: Date;
};

let sessionsIndexPromise: Promise<string> | undefined;

async function getSessionsCollection() {
  const db = await getMongoDb();
  const sessions = db.collection<SessionLocation>("sessions");

  sessionsIndexPromise ??= sessions.createIndex({ coordinates: "2dsphere" });
  await sessionsIndexPromise;

  return sessions;
}

export async function POST(request: Request) {
  try {
    let payload: LocationPayload;

    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const { latitude, longitude } = payload;

    if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
      return NextResponse.json(
        { error: "Expected latitude and longitude as valid numbers." },
        { status: 400 },
      );
    }

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not set.");
    }

    const sessions = await getSessionsCollection();
    const friendSessionId = payload.friendSessionId ?? payload.sessionId;

    if (friendSessionId !== undefined) {
      if (typeof friendSessionId !== "string" || !ObjectId.isValid(friendSessionId)) {
        return NextResponse.json(
          { error: "Expected friendSessionId as a valid MongoDB ObjectId." },
          { status: 400 },
        );
      }

      const friend = await sessions.findOne({
        _id: new ObjectId(friendSessionId),
      });

      if (!friend) {
        return NextResponse.json({ error: "Friend session not found." }, { status: 404 });
      }

      const currentUserPoint: GeoJsonPoint = {
        type: "Point",
        coordinates: [longitude, latitude],
      };

      const distance = calculateDistance(currentUserPoint, friend.coordinates);
      const bearing = calculateBearing(currentUserPoint, friend.coordinates);

      return NextResponse.json({
        distance,
        bearing,
      });
    }

    const result = await sessions.insertOne({
      coordinates: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      ...(typeof payload.goal === "string" && payload.goal.trim()
        ? { goal: payload.goal.trim() }
        : {}),
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        id: result.insertedId.toString(),
        sessionId: result.insertedId.toString(),
        coordinates: [longitude, latitude],
      },
      { status: 201 },
    );
  } catch (err: unknown) {
    console.error(err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
