import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  getFirebaseEnv,
} from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const { channel } = await req.json();
    if (
      !channel ||
      typeof channel !== "string" ||
      channel.trim().length === 0 ||
      channel.length > 100
    ) {
      return NextResponse.json(
        { error: "Channel name is required and must be valid" },
        { status: 400 }
      );
    }

    const firebase = getFirebaseEnv("Firebase URL not configured");
    if (!firebase.ok) return firebase.response;

    const safeChannelName = encodeFirebaseKey(channel);
    const channelPath = `/stats/channels/${safeChannelName}.json`;

    // 1. Get current count
    const getRes = await fetch(buildFirebaseUrl(firebase.env, channelPath));
    let currentCount = 0;
    if (getRes.ok) {
      const data = await getRes.json();
      currentCount = data ? Number(data) : 0;
    }

    // 2. Increment and PUT
    const putRes = await fetch(buildFirebaseUrl(firebase.env, channelPath), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentCount + 1),
    });

    if (!putRes.ok) {
      return NextResponse.json(
        { error: "Failed to update stats" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: currentCount + 1 });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const firebase = getFirebaseEnv("Firebase URL not configured");
    if (!firebase.ok) return firebase.response;

    const res = await fetch(
      buildFirebaseUrl(firebase.env, "/stats/channels.json"),
      { cache: "no-store" }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      );
    }
    const data = await res.json();

    const cleanStats: Record<string, number> = {};
    if (data && typeof data === "object") {
      for (const key in data) {
        const val = data[key];
        if (typeof val === "number") {
          cleanStats[key] = val;
        } else if (typeof val === "string") {
          cleanStats[key] = Number(val) || 0;
        } else if (typeof val === "object" && val !== null) {
          cleanStats[key] =
            Number(
              (val as any).count ||
                (val as any).views ||
                (val as any).total ||
                0
            ) || 0;
        } else {
          cleanStats[key] = 0;
        }
      }
    }
    return NextResponse.json(cleanStats);
  } catch (error) {
    console.error("Stats GET API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
