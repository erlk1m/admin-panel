import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  getFirebaseEnv,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
  requireAdmin,
} from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const res = await fetch(buildFirebaseUrl(firebase.env, "/chats.json", true), {
      cache: "no-store",
      headers: NO_STORE_FETCH_HEADERS,
    });
    const data = await res.json();

    const messages = [];
    if (data && typeof data === "object") {
      for (const key in data) {
        const item = data[key];
        if (item && typeof item === "object") {
          const rawSender = item.sender || "User|ID|👤|#FFFFFF|USER";
          const rawMessage = item.message;
          messages.push({
            id: String(key),
            ...item,
            sender:
              typeof rawSender === "string"
                ? rawSender
                : typeof rawSender === "object"
                ? JSON.stringify(rawSender)
                : String(rawSender || "User"),
            message:
              typeof rawMessage === "string"
                ? rawMessage
                : typeof rawMessage === "object" && rawMessage !== null
                ? (rawMessage as any).text ||
                  (rawMessage as any).msg ||
                  JSON.stringify(rawMessage)
                : String(rawMessage || ""),
            timestamp:
              typeof item.timestamp === "number"
                ? item.timestamp
                : Number(item.timestamp) || Date.now(),
          });
        } else if (typeof item === "string") {
          messages.push({
            id: String(key),
            sender: "User|ID|👤|#FFFFFF|USER",
            message: item,
            timestamp: Date.now(),
          });
        }
      }
    }

    messages.sort(
      (a, b) => (Number(a.timestamp) || 0) - (Number(b.timestamp) || 0)
    );

    return NextResponse.json(messages, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Firebase" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const body = await request.json();
    const { message, senderOverride } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const safeMessage = message.trim().slice(0, 500);
    const safeSender =
      typeof senderOverride === "string"
        ? senderOverride.trim().slice(0, 100)
        : "Admin|ID|🔧|#FF00FF|ADMIN";

    const chatPayload = {
      sender: safeSender,
      message: safeMessage,
      timestamp: Date.now(),
    };

    const res = await fetch(buildFirebaseUrl(firebase.env, "/chats.json"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatPayload),
    });

    if (!res.ok) {
      throw new Error("Failed to post message");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to save to Firebase" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const path =
      id === "all" ? "/chats.json" : `/chats/${encodeFirebaseKey(id)}.json`;

    const res = await fetch(buildFirebaseUrl(firebase.env, path), {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error("Failed to delete message");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete from Firebase" },
      { status: 500 }
    );
  }
}
