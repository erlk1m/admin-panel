import { NextResponse } from "next/server";
import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  isAdminRequest,
  logServerError,
  NO_STORE_HEADERS,
  safeCompareStrings,
  setAdminSessionCookie,
} from "@/lib/firebase";
import {
  consumeRateLimit,
  getClientIp,
  getRateLimitStatus,
  rateLimitResponse,
  resetRateLimit,
} from "@/lib/rateLimit";

const LOGIN_MAX_FAILURES = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  return NextResponse.json(
    { authenticated: isAdminRequest(request) },
    { headers: NO_STORE_HEADERS }
  );
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateKey = `login:${ip}`;
    const rateStatus = getRateLimitStatus(
      rateKey,
      LOGIN_MAX_FAILURES,
      LOGIN_WINDOW_MS
    );
    if (!rateStatus.allowed) {
      return rateLimitResponse(
        rateStatus.retryAfterSeconds,
        "Terlalu banyak percobaan login gagal. Coba lagi beberapa menit lagi."
      );
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json(
        { error: "ADMIN_PASSWORD belum dikonfigurasi di server" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format request tidak valid" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const password =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).password
        : undefined;

    if (
      typeof password !== "string" ||
      password.length === 0 ||
      password.length > 256 ||
      !safeCompareStrings(password, adminPassword)
    ) {
      const next = consumeRateLimit(
        rateKey,
        LOGIN_MAX_FAILURES,
        LOGIN_WINDOW_MS
      );
      if (!next.allowed) {
        return rateLimitResponse(
          next.retryAfterSeconds,
          "Terlalu banyak percobaan login gagal. Coba lagi beberapa menit lagi."
        );
      }
      return NextResponse.json(
        { error: "Password Admin Salah" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    resetRateLimit(rateKey);
    const sessionToken = createAdminSessionToken();
    const res = NextResponse.json(
      { success: true },
      { headers: NO_STORE_HEADERS }
    );
    if (sessionToken) {
      setAdminSessionCookie(res, sessionToken);
    }
    return res;
  } catch (err) {
    logServerError("api/verify-password POST", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json(
    { success: true },
    { headers: NO_STORE_HEADERS }
  );
  clearAdminSessionCookie(res);
  return res;
}
