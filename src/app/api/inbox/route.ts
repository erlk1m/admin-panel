import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  getFirebaseEnv,
  logServerError,
  NO_STORE_HEADERS,
  requireAdmin,
} from "@/lib/firebase";
import { validateTokenCode } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const auth = requireAdmin(req);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv("Firebase URL not configured");
    if (!firebase.ok) return firebase.response;

    let body: unknown;
    try {
      body = await req.json();
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

    const tokenCheck = validateTokenCode(record.token);
    if (!tokenCheck.ok) {
      return NextResponse.json(
        { error: tokenCheck.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const rawMessage = record.message;
    if (typeof rawMessage !== "string" || rawMessage.trim().length === 0) {
      return NextResponse.json(
        { error: "Token dan message wajib diisi" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const safeToken = encodeFirebaseKey(tokenCheck.value);
    const safeMessage = rawMessage.trim().slice(0, 1000);

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
      return NextResponse.json(
        { error: "Gagal menyimpan pesan ke database" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    logServerError("api/inbox POST", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
