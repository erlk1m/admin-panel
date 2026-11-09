import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  getFirebaseEnv,
  isAdminRequest,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
} from "@/lib/firebase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const res = await fetch(
      buildFirebaseUrl(firebase.env, "/presence.json", true),
      {
        cache: "no-store",
        headers: NO_STORE_FETCH_HEADERS,
      }
    );
    const data = await res.json();

    const activeUsers = [];
    const now = Date.now();
    const threshold = 60000; // 60 detik batas toleransi offline

    if (data && typeof data === "object") {
      for (const token in data) {
        const userPresence = data[token];
        if (!userPresence || typeof userPresence !== "object") continue;
        const lastSeenTime = Number(
          userPresence.lastActive || userPresence.lastSeen || 0
        );
        if (lastSeenTime && now - lastSeenTime <= threshold) {
          const rawChannel =
            userPresence.activity || userPresence.channel || "Lainnya";
          const rawCountry = userPresence.country || "ID";
          const rawBrand = userPresence.deviceBrand || "Unknown";
          const rawModel = userPresence.deviceModel || "Unknown";

          activeUsers.push({
            token: String(token),
            channel:
              typeof rawChannel === "string"
                ? rawChannel
                : typeof rawChannel === "object" && rawChannel !== null
                ? (rawChannel as any).name ||
                  (rawChannel as any).title ||
                  JSON.stringify(rawChannel)
                : String(rawChannel),
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

    const safeUsers = isAdminRequest(request)
      ? activeUsers
      : activeUsers.map((u) => ({
          ...u,
          token: u.token.length > 4 ? `${u.token.slice(0, 3)}***` : "***",
        }));

    return NextResponse.json(
      { count: activeUsers.length, users: safeUsers },
      { headers: NO_STORE_HEADERS }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Firebase" },
      { status: 500 }
    );
  }
}
