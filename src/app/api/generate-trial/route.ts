import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  getFirebaseEnv,
  NO_STORE_FETCH_HEADERS,
} from "@/lib/firebase";
import { generateRandomTokenCode } from "@/lib/format";
import { extractDeviceIds } from "@/lib/normalize";

export async function POST(request: Request) {
  try {
    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const { deviceId } = await request.json();

    if (!deviceId || typeof deviceId !== "string") {
      return NextResponse.json(
        { error: "Device ID diperlukan" },
        { status: 400 }
      );
    }

    const cleanDeviceId = deviceId.trim();
    if (cleanDeviceId.length < 3 || cleanDeviceId.length > 120) {
      return NextResponse.json(
        { error: "Device ID tidak valid" },
        { status: 400 }
      );
    }

    // 1. Fetch current config
    const getRes = await fetch(
      buildFirebaseUrl(firebase.env, "/config.json", true),
      {
        cache: "no-store",
        headers: NO_STORE_FETCH_HEADERS,
      }
    );
    const data = await getRes.json();

    if (!data) {
      return NextResponse.json(
        { error: "Database tidak ditemukan" },
        { status: 404 }
      );
    }

    if (
      data.tokens &&
      !Array.isArray(data.tokens) &&
      typeof data.tokens === "object"
    ) {
      data.tokens = Object.values(data.tokens);
    }

    if (!data.tokens || !Array.isArray(data.tokens)) {
      data.tokens = [];
    }

    // Prune stale trial tokens expired > 48 hours ago
    const now = Date.now();
    data.tokens = data.tokens.filter((t: any) => {
      if (
        typeof t === "object" &&
        t.isTrial &&
        t.expiresAt &&
        now - t.expiresAt > 48 * 60 * 60 * 1000
      ) {
        return false;
      }
      return true;
    });

    // 2. Check if device already claimed trial
    let alreadyClaimed = false;
    let existingToken: any = null;

    for (let i = 0; i < data.tokens.length; i++) {
      const t = data.tokens[i];
      if (typeof t === "object" && t.isTrial) {
        const currentDeviceIds = extractDeviceIds(t);
        if (currentDeviceIds.includes(cleanDeviceId)) {
          alreadyClaimed = true;
          existingToken = t;
          break;
        }
      }
    }

    if (alreadyClaimed && existingToken) {
      if (existingToken.expiresAt && Date.now() > existingToken.expiresAt) {
        return NextResponse.json(
          { error: "Masa trial Anda sudah habis!" },
          { status: 403 }
        );
      }
      return NextResponse.json({
        success: true,
        code: existingToken.code,
        message: "Trial dilanjutkan",
      });
    }

    // 3. Generate unique new trial token
    let newCode = generateRandomTokenCode("TRIAL-");
    while (
      data.tokens.some(
        (t: any) => typeof t === "object" && t.code === newCode
      )
    ) {
      newCode = generateRandomTokenCode("TRIAL-");
    }

    const tokenObj = {
      code: newCode,
      deviceId: cleanDeviceId,
      deviceIds: [cleanDeviceId],
      maxDevices: 1,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 Hour
      label: "Trial User",
      isTrial: true,
      badgeIcon: "⏱️",
      badgeColor: "#808080",
    };

    data.tokens.push(tokenObj);

    // 4. Save to Firebase
    const putRes = await fetch(buildFirebaseUrl(firebase.env, "/config.json"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!putRes.ok) throw new Error("Gagal menyimpan ke Firebase");

    return NextResponse.json({
      success: true,
      code: newCode,
      message: "Trial 1 Jam berhasil diaktifkan!",
    });
  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
