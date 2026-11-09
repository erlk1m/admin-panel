import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  getFirebaseEnv,
  requireAdmin,
} from "@/lib/firebase";

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const body = await request.json();
    const { token } = body;
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const safeToken = encodeFirebaseKey(String(token));

    const res = await fetch(
      buildFirebaseUrl(firebase.env, `/kicks/${safeToken}.json`),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Date.now()),
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Firebase Error:", errorText);
      throw new Error("Gagal menyimpan ke Firebase: " + errorText);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to kick user" },
      { status: 500 }
    );
  }
}
