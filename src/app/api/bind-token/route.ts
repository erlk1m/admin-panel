import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  fetchFirebaseWithEtag,
  getFirebaseEnv,
  logServerError,
  NO_STORE_HEADERS,
  putFirebaseWithEtag,
} from "@/lib/firebase";
import { extractDeviceIds } from "@/lib/normalize";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { validateDeviceId, validateTokenCode } from "@/lib/validation";

const BIND_MAX_REQUESTS = 20;
const BIND_WINDOW_MS = 5 * 60 * 1000;
const MAX_CAS_ATTEMPTS = 4;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = consumeRateLimit(
      `bind:${ip}`,
      BIND_MAX_REQUESTS,
      BIND_WINDOW_MS
    );
    if (!rate.allowed) {
      return rateLimitResponse(
        rate.retryAfterSeconds,
        "Terlalu banyak percobaan aktivasi token. Tunggu beberapa menit."
      );
    }

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format permintaan tidak valid" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const rawCode =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).code
        : undefined;
    const rawDeviceId =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).deviceId
        : undefined;

    const codeCheck = validateTokenCode(rawCode);
    if (!codeCheck.ok) {
      return NextResponse.json(
        { error: codeCheck.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const deviceCheck = validateDeviceId(rawDeviceId);
    if (!deviceCheck.ok) {
      return NextResponse.json(
        { error: deviceCheck.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanCode = codeCheck.value;
    const cleanDeviceId = deviceCheck.value;

    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
      const currentFetch = await fetchFirebaseWithEtag<Record<string, unknown>>(
        firebase.env,
        "/config.json"
      );

      if (!currentFetch.ok) {
        return NextResponse.json(
          { error: "Gagal mengambil data token dari server" },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }

      const rawData = currentFetch.data;
      if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
        return NextResponse.json(
          { error: "Token tidak ditemukan" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      const data: Record<string, unknown> = { ...rawData };
      if (
        data.tokens &&
        !Array.isArray(data.tokens) &&
        typeof data.tokens === "object"
      ) {
        data.tokens = Object.values(data.tokens as Record<string, unknown>);
      }

      if (!Array.isArray(data.tokens)) {
        return NextResponse.json(
          { error: "Token tidak ditemukan" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      let tokenIndex = -1;
      let tokenObj: Record<string, unknown> | null = null;

      for (let i = 0; i < data.tokens.length; i++) {
        const t = data.tokens[i];
        if (typeof t === "string" && t === cleanCode) {
          tokenIndex = i;
          tokenObj = { code: t, expiresAt: null, label: "Lifetime" };
          break;
        } else if (
          t &&
          typeof t === "object" &&
          (t as Record<string, unknown>).code === cleanCode
        ) {
          tokenIndex = i;
          tokenObj = { ...(t as Record<string, unknown>) };
          break;
        }
      }

      if (tokenIndex === -1 || !tokenObj) {
        return NextResponse.json(
          { error: "Token tidak valid" },
          { status: 404, headers: NO_STORE_HEADERS }
        );
      }

      const expiresAt =
        typeof tokenObj.expiresAt === "number"
          ? tokenObj.expiresAt
          : Number(tokenObj.expiresAt) || null;
      if (expiresAt && Date.now() > expiresAt) {
        return NextResponse.json(
          { error: "Token sudah kadaluarsa" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const maxDevices = Math.max(
        1,
        Math.min(10, Math.trunc(Number(tokenObj.maxDevices) || 1))
      );
      const currentDeviceIds = extractDeviceIds(tokenObj);
      const safeCode = encodeFirebaseKey(String(tokenObj.code));

      if (currentDeviceIds.includes(cleanDeviceId)) {
        await fetch(
          buildFirebaseUrl(firebase.env, `/kicks/${safeCode}.json`),
          { method: "DELETE" }
        ).catch(() => {});

        return NextResponse.json(
          { success: true, message: "Akses diizinkan." },
          { headers: NO_STORE_HEADERS }
        );
      }

      if (currentDeviceIds.length >= maxDevices) {
        return NextResponse.json(
          {
            error: `Token sudah digunakan di batas maksimum (${maxDevices} TV)!`,
          },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const nextDeviceIds = [...currentDeviceIds, cleanDeviceId];
      tokenObj.deviceIds = nextDeviceIds;
      tokenObj.deviceId = nextDeviceIds[0];
      data.tokens[tokenIndex] = tokenObj;

      const putResult = await putFirebaseWithEtag(
        firebase.env,
        "/config.json",
        data,
        currentFetch.etag
      );

      if (putResult.ok) {
        await fetch(
          buildFirebaseUrl(firebase.env, `/kicks/${safeCode}.json`),
          { method: "DELETE" }
        ).catch(() => {});

        return NextResponse.json(
          {
            success: true,
            message: "Token berhasil diikat ke perangkat ini.",
          },
          { headers: NO_STORE_HEADERS }
        );
      }

      if (!putResult.conflict) {
        return NextResponse.json(
          { error: "Gagal menyimpan aktivasi token ke database" },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }
    }

    return NextResponse.json(
      { error: "Server sedang sibuk. Silakan coba beberapa detik lagi." },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logServerError("api/bind-token POST", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
