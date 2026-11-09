import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  getFirebaseEnv,
  requireAdmin,
} from "@/lib/firebase";

export async function POST(req: Request) {
  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const { token, message } = await req.json();
    if (
      !token ||
      typeof token !== "string" ||
      !message ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { error: "Token dan message wajib diisi" },
        { status: 400 }
      );
    }

    const firebase = getFirebaseEnv("Firebase URL not configured");
    if (!firebase.ok) return firebase.response;

    const safeToken = encodeFirebaseKey(token);
    const safeMessage = message.trim().slice(0, 1000);

    const res = await fetch(
      buildFirebaseUrl(firebase.env, `/inbox/${safeToken}.json`),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: safeMessage,
          timestamp: Date.now(),
        }),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Firebase Error in Inbox:", errorText);
      return NextResponse.json(
        { error: "Gagal menyimpan pesan ke Firebase: " + errorText },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inbox API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
