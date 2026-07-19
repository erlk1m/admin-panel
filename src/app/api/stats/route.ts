import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { channel } = await req.json();
    if (!channel) {
      return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
    }

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "Firebase URL not configured" }, { status: 500 });
    }

    // Encoding channel name to be safe for Firebase path (no '.', '#', '$', '[', or ']')
    const safeChannelName = encodeURIComponent(channel).replace(/\./g, '%2E');

    // 1. Get current count
    const getRes = await fetch(`${firebaseUrl}/stats/channels/${safeChannelName}.json`);
    let currentCount = 0;
    if (getRes.ok) {
      const data = await getRes.json();
      currentCount = data ? Number(data) : 0;
    }

    // 2. Increment and PUT
    const putRes = await fetch(`${firebaseUrl}/stats/channels/${safeChannelName}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentCount + 1),
    });

    if (!putRes.ok) {
      return NextResponse.json({ error: "Failed to update stats" }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: currentCount + 1 });
  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "Firebase URL not configured" }, { status: 500 });
    }

    const res = await fetch(`${firebaseUrl}/stats/channels.json`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json(data || {});
  } catch (error) {
    console.error("Stats GET API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
