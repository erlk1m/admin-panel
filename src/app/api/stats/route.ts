import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  fetchFirebaseWithEtag,
  getFirebaseEnv,
  logServerError,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
  putFirebaseWithEtag,
  requireAdmin,
} from "@/lib/firebase";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { validateChannelName } from "@/lib/validation";

export const dynamic = "force-dynamic";

const STATS_MAX_PER_MIN = 60;
const STATS_WINDOW_MS = 60 * 1000;
const MAX_CAS_ATTEMPTS = 4;

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rate = consumeRateLimit(
      `stats:${ip}`,
      STATS_MAX_PER_MIN,
      STATS_WINDOW_MS
    );
    if (!rate.allowed) {
      return rateLimitResponse(
        rate.retryAfterSeconds,
        "Terlalu banyak permintaan statistik. Coba beberapa saat lagi."
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Format payload JSON tidak valid" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const rawChannel =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).channel
        : undefined;
    const channelCheck = validateChannelName(rawChannel);
    if (!channelCheck.ok) {
      return NextResponse.json(
        { error: channelCheck.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const firebase = getFirebaseEnv("Firebase URL not configured");
    if (!firebase.ok) return firebase.response;

    const safeChannelName = encodeFirebaseKey(channelCheck.value);
    const channelPath = `/stats/channels/${safeChannelName}.json`;

    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
      const currentFetch = await fetchFirebaseWithEtag<unknown>(
        firebase.env,
        channelPath
      );

      if (!currentFetch.ok) {
        return NextResponse.json(
          { error: "Gagal mengakses statistik database" },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }

      const rawVal = currentFetch.data;
      let currentCount = 0;
      if (typeof rawVal === "number" && Number.isFinite(rawVal)) {
        currentCount = rawVal;
      } else if (typeof rawVal === "string") {
        currentCount = Number(rawVal) || 0;
      } else if (typeof rawVal === "object" && rawVal !== null) {
        const obj = rawVal as Record<string, unknown>;
        currentCount = Number(obj.count || obj.views || obj.total || 0) || 0;
      }

      const nextCount = Math.max(0, Math.trunc(currentCount)) + 1;
      const putResult = await putFirebaseWithEtag(
        firebase.env,
        channelPath,
        nextCount,
        currentFetch.etag
      );

      if (putResult.ok) {
        return NextResponse.json(
          { success: true, count: nextCount },
          { headers: NO_STORE_HEADERS }
        );
      }

      if (!putResult.conflict) {
        return NextResponse.json(
          { error: "Failed to update stats" },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }
    }

    return NextResponse.json(
      { error: "Gagal memperbarui statistik karena konflik penulisan" },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logServerError("api/stats POST", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv("Firebase URL not configured");
    if (!firebase.ok) return firebase.response;

    const res = await fetch(
      buildFirebaseUrl(firebase.env, "/stats/channels.json", true),
      {
        cache: "no-store",
        headers: NO_STORE_FETCH_HEADERS,
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }
    const data = await res.json();

    const cleanStats: Record<string, number> = {};
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const statMap = data as Record<string, unknown>;
      for (const key in statMap) {
        const val = statMap[key];
        if (typeof val === "number") {
          cleanStats[key] = val;
        } else if (typeof val === "string") {
          cleanStats[key] = Number(val) || 0;
        } else if (typeof val === "object" && val !== null) {
          const obj = val as Record<string, unknown>;
          cleanStats[key] =
            Number(obj.count || obj.views || obj.total || 0) || 0;
        } else {
          cleanStats[key] = 0;
        }
      }
    }

    return NextResponse.json(cleanStats, { headers: NO_STORE_HEADERS });
  } catch (err) {
    logServerError("api/stats GET", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
