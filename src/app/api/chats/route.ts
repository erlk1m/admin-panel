import { NextResponse } from "next/server";

export async function GET() {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const res = await fetch(`${firebaseUrl}/chats.json`, { cache: 'no-store' });
    const data = await res.json();
    
    // Convert object to array for easier consumption
    const messages = [];
    if (data && typeof data === 'object') {
      for (const key in data) {
        messages.push({ id: key, ...data[key] });
      }
    }
    
    // Sort by timestamp
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    return NextResponse.json(messages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch from Firebase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = request.headers.get("x-admin-password");

    if (adminPassword && providedPassword !== adminPassword) {
      return NextResponse.json({ error: "Password Admin Salah" }, { status: 401 });
    }

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { message, senderOverride } = body;
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const chatPayload = {
      sender: senderOverride || "Admin|ID|🔧|#FF00FF|ADMIN",
      message: message,
      timestamp: Date.now()
    };

    const res = await fetch(`${firebaseUrl}/chats.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatPayload),
    });

    if (!res.ok) {
      throw new Error("Failed to post message");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save to Firebase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = request.headers.get("x-admin-password");

    if (adminPassword && providedPassword !== adminPassword) {
      return NextResponse.json({ error: "Password Admin Salah" }, { status: 401 });
    }

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    let url = `${firebaseUrl}/chats/${id}.json`;
    if (id === 'all') {
      url = `${firebaseUrl}/chats.json`;
    }

    const res = await fetch(url, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Failed to delete message");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete from Firebase" }, { status: 500 });
  }
}
