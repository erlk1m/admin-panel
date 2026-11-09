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

    const rawToken =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).token
        : undefined;
    const tokenCheck = validateTokenCode(rawToken);
    if (!tokenCheck.ok) {
      return NextResponse.json(
        { error: tokenCheck.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const safeToken = encodeFirebaseKey(tokenCheck.value);

    const res = await fetch(
      buildFirebaseUrl(firebase.env, `/kicks/${safeToken}.json`),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Date.now()),
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengirim sinyal KICK ke database" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json({ success: true }, { headers: NO_STORE_HEADERS });
  } catch (err) {
    logServerError("api/kick POST", err);
    return NextResponse.json(
      { error: "Gagal mengirim sinyal KICK" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
