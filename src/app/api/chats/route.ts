import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  getFirebaseEnv,
  logServerError,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
  requireAdmin,
} from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const res = await fetch(buildFirebaseUrl(firebase.env, "/chats.json", true), {
      cache: "no-store",
      headers: NO_STORE_FETCH_HEADERS,
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil riwayat chat dari database" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    const data = await res.json();

    const messages = [];
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const chatMap = data as Record<string, unknown>;
      for (const key in chatMap) {
        const item = chatMap[key];
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const obj = item as Record<string, unknown>;
          const rawSender = obj.sender || "User|ID|👤|#FFFFFF|USER";
          const rawMessage = obj.message;

          let messageStr: string;
          if (typeof rawMessage === "string") {
            messageStr = rawMessage;
          } else if (typeof rawMessage === "object" && rawMessage !== null) {
            const msgObj = rawMessage as Record<string, unknown>;
            messageStr = String(
              msgObj.text || msgObj.msg || JSON.stringify(msgObj)
            );
          } else {
            messageStr = String(rawMessage || "");
          }

          messages.push({
            id: String(key),
            sender:
              typeof rawSender === "string"
                ? rawSender
                : typeof rawSender === "object"
                ? JSON.stringify(rawSender)
                : String(rawSender || "User"),
            message: messageStr,
            timestamp:
              typeof obj.timestamp === "number"
                ? obj.timestamp
                : Number(obj.timestamp) || Date.now(),
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
  } catch (err) {
    logServerError("api/chats GET", err);
    return NextResponse.json(
      { error: "Gagal mengambil data chat" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format payload JSON tidak valid" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const record =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
    const { message, senderOverride } = record;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const safeMessage = message.trim().slice(0, 500);
    const safeSender =
      typeof senderOverride === "string" && senderOverride.trim().length > 0
        ? senderOverride.trim().slice(0, 450)
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
      return NextResponse.json(
        { error: "Gagal menyimpan pesan chat ke database" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    logServerError("api/chats POST", err);
    return NextResponse.json(
      { error: "Gagal mengirim pesan chat" },
      { status: 500, headers: NO_STORE_HEADERS }
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
    const rawId = searchParams.get("id");

    if (!rawId || typeof rawId !== "string") {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanId = rawId.trim();
    if (
      cleanId.length === 0 ||
      cleanId.length > 128 ||
      cleanId === "." ||
      cleanId === ".." ||
      /[\x00-\x1F\x7F/]/.test(cleanId)
    ) {
      return NextResponse.json(
        { error: "ID pesan tidak valid" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const path =
      cleanId === "all"
        ? "/chats.json"
        : `/chats/${encodeFirebaseKey(cleanId)}.json`;

    const res = await fetch(buildFirebaseUrl(firebase.env, path), {
      method: "DELETE",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal menghapus pesan chat dari database" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    logServerError("api/chats DELETE", err);
    return NextResponse.json(
      { error: "Gagal menghapus pesan chat" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
