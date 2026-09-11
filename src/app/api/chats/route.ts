import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";
    const sep = authQuery ? "&" : "?";

    const res = await fetch(`${firebaseUrl}/chats.json${authQuery}${sep}_t=${Date.now()}`, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    const data = await res.json();
    
    // Convert object to array for easier consumption
    const messages = [];
    if (data && typeof data === 'object') {
      for (const key in data) {
        const item = data[key];
        if (item && typeof item === 'object') {
          const rawSender = item.sender || "User|ID|👤|#FFFFFF|USER";
          const rawMessage = item.message;
          messages.push({
            id: String(key),
            ...item,
            sender: typeof rawSender === 'string' ? rawSender : (typeof rawSender === 'object' ? JSON.stringify(rawSender) : String(rawSender || 'User')),
            message: typeof rawMessage === 'string' ? rawMessage : (typeof rawMessage === 'object' && rawMessage !== null ? ((rawMessage as any).text || (rawMessage as any).msg || JSON.stringify(rawMessage)) : String(rawMessage || '')),
            timestamp: typeof item.timestamp === 'number' ? item.timestamp : (Number(item.timestamp) || Date.now())
          });
        } else if (typeof item === 'string') {
          messages.push({
            id: String(key),
            sender: "User|ID|👤|#FFFFFF|USER",
            message: item,
            timestamp: Date.now()
          });
        }
      }
    }
    
    // Sort by timestamp
    messages.sort((a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0));
    
    return NextResponse.json(messages, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch from Firebase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = request.headers.get("x-admin-password");

    if (!adminPassword || providedPassword !== adminPassword) {
      return NextResponse.json({ error: "Password Admin Salah atau Belum Dikonfigurasi" }, { status: 401 });
    }

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { message, senderOverride } = body;
    
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const safeMessage = message.trim().slice(0, 500);
    const safeSender = typeof senderOverride === "string" ? senderOverride.trim().slice(0, 100) : "Admin|ID|🔧|#FF00FF|ADMIN";

    const chatPayload = {
      sender: safeSender,
      message: safeMessage,
      timestamp: Date.now()
    };

    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

    const res = await fetch(`${firebaseUrl}/chats.json${authQuery}`, {
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
  }  
  catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to save to Firebase" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = request.headers.get("x-admin-password");

    if (!adminPassword || providedPassword !== adminPassword) {
      return NextResponse.json({ error: "Password Admin Salah atau Belum Dikonfigurasi" }, { status: 401 });
    }

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

    let url = "";
    if (id === 'all') {
      url = `${firebaseUrl}/chats.json${authQuery}`;
    } else {
      const safeId = encodeURIComponent(id.trim()).replace(/\./g, '%2E');
      url = `${firebaseUrl}/chats/${safeId}.json${authQuery}`;
    }

    const res = await fetch(url, {
      method: "DELETE"
    });

    if (!res.ok) {
      throw new Error("Failed to delete message");
    }

    return NextResponse.json({ success: true });
  }  
  catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete from Firebase" }, { status: 500 });
  }
}
