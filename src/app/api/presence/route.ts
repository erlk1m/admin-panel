import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  getFirebaseEnv,
  logServerError,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
  requireAdmin,
  safeDecodeFirebaseKey,
} from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const res = await fetch(
      buildFirebaseUrl(firebase.env, "/presence.json", true),
      {
        cache: "no-store",
        headers: NO_STORE_FETCH_HEADERS,
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil data presence dari database" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    const data = await res.json();

    const activeUsers = [];
    const now = Date.now();
    const threshold = 60000;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const presenceMap = data as Record<string, unknown>;
      for (const encodedToken in presenceMap) {
        const rawEntry = presenceMap[encodedToken];
        if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
          continue;
        }
        const userPresence = rawEntry as Record<string, unknown>;
        const lastSeenTime = Number(
          userPresence.lastActive || userPresence.lastSeen || 0
        );
        if (lastSeenTime && now - lastSeenTime <= threshold) {
          const rawChannel =
            userPresence.activity || userPresence.channel || "Lainnya";
          const rawCountry = userPresence.country || "ID";
          const rawBrand = userPresence.deviceBrand || "Unknown";
          const rawModel = userPresence.deviceModel || "Unknown";

          let channelStr: string;
          if (typeof rawChannel === "string") {
            channelStr = rawChannel;
          } else if (typeof rawChannel === "object" && rawChannel !== null) {
            const obj = rawChannel as Record<string, unknown>;
            channelStr = String(obj.name || obj.title || JSON.stringify(obj));
          } else {
            channelStr = String(rawChannel);
          }

          activeUsers.push({
            token: safeDecodeFirebaseKey(String(encodedToken)),
            channel: channelStr,
            country:
              typeof rawCountry === "string"
                ? rawCountry
                : String(rawCountry || "ID"),
            deviceBrand:
              typeof rawBrand === "string"
                ? rawBrand
                : String(rawBrand || "Unknown"),
            deviceModel:
              typeof rawModel === "string"
                ? rawModel
                : String(rawModel || "Unknown"),
            isTv: Boolean(userPresence.isTv),
            lastSeen: lastSeenTime,
          });
        }
      }
    }

    activeUsers.sort((a, b) => b.lastSeen - a.lastSeen);

    return NextResponse.json(
      { count: activeUsers.length, users: activeUsers },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logServerError("api/presence GET", err);
    return NextResponse.json(
      { error: "Gagal mengambil data penonton aktif" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
