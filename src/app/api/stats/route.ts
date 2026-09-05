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

    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

    // Encoding channel name to be safe for Firebase path (no '.', '#', '$', '[', or ']')
    const safeChannelName = encodeURIComponent(channel).replace(/\./g, '%2E');

    // 1. Get current count
    const getRes = await fetch(`${firebaseUrl}/stats/channels/${safeChannelName}.json${authQuery}`);
    let currentCount = 0;
    if (getRes.ok) {
      const data = await getRes.json();
      currentCount = data ? Number(data) : 0;
    }

    // 2. Increment and PUT
    const putRes = await fetch(`${firebaseUrl}/stats/channels/${safeChannelName}.json${authQuery}`, {
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

    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

    const res = await fetch(`${firebaseUrl}/stats/channels.json${authQuery}`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
    const data = await res.json();
    
    const cleanStats: Record<string, number> = {};
    if (data && typeof data === 'object') {
      for (const key in data) {
        const val = data[key];
        if (typeof val === 'number') {
          cleanStats[key] = val;
        } else if (typeof val === 'string') {
          cleanStats[key] = Number(val) || 0;
        } else if (typeof val === 'object' && val !== null) {
          cleanStats[key] = Number((val as any).count || (val as any).views || (val as any).total || 0) || 0;
        } else {
          cleanStats[key] = 0;
        }
      }
    }
    return NextResponse.json(cleanStats);
  } catch (error) {
    console.error("Stats GET API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
