import { NextResponse } from "next/server";
import {
  fetchFirebaseWithEtag,
  getFirebaseEnv,
  logServerError,
  NO_STORE_HEADERS,
  putFirebaseWithEtag,
} from "@/lib/firebase";
import { generateRandomTokenCode } from "@/lib/format";
import { extractDeviceIds } from "@/lib/normalize";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { validateDeviceId } from "@/lib/validation";

const TRIAL_ENDPOINT_MAX_PER_HOUR = 12;
const TRIAL_CREATE_MAX_PER_HOUR = 3;
const TRIAL_WINDOW_MS = 60 * 60 * 1000;
const TRIAL_PRUNE_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_ACTIVE_TRIALS = 250;
const MAX_CAS_ATTEMPTS = 4;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const readRate = consumeRateLimit(
      `trial_req:${ip}`,
      TRIAL_ENDPOINT_MAX_PER_HOUR,
      TRIAL_WINDOW_MS
    );
    if (!readRate.allowed) {
      return rateLimitResponse(
        readRate.retryAfterSeconds,
        "Terlalu banyak permintaan trial dari jaringan ini. Coba lagi nanti."
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

    const rawDeviceId =
      body && typeof body === "object"
        ? (body as Record<string, unknown>).deviceId
        : undefined;

    const deviceCheck = validateDeviceId(rawDeviceId);
    if (!deviceCheck.ok) {
      return NextResponse.json(
        { error: deviceCheck.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanDeviceId = deviceCheck.value;
    let consumedNewTrialQuota = false;

    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
      const currentFetch = await fetchFirebaseWithEtag<Record<string, unknown>>(
        firebase.env,
        "/config.json"
      );

      if (!currentFetch.ok) {
        return NextResponse.json(
          { error: "Gagal mengakses database konfigurasi" },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }

      const rawData = currentFetch.data;
      if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
        return NextResponse.json(
          { error: "Database tidak ditemukan" },
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

      const tokensList: unknown[] = Array.isArray(data.tokens)
        ? [...data.tokens]
        : [];

      const now = Date.now();
      const prunedTokens = tokensList.filter((t) => {
        if (t && typeof t === "object") {
          const obj = t as Record<string, unknown>;
          const exp = Number(obj.expiresAt) || 0;
          if (obj.isTrial && exp > 0 && now - exp > TRIAL_PRUNE_AGE_MS) {
            return false;
          }
        }
        return true;
      });

      // Check if device already claimed a trial
      let existingToken: Record<string, unknown> | null = null;
      for (const t of prunedTokens) {
        if (t && typeof t === "object") {
          const obj = t as Record<string, unknown>;
          if (obj.isTrial) {
            const devIds = extractDeviceIds(obj);
            if (devIds.includes(cleanDeviceId)) {
              existingToken = obj;
              break;
            }
          }
        }
      }

      if (existingToken) {
        const exp = Number(existingToken.expiresAt) || 0;
        if (exp > 0 && now > exp) {
          return NextResponse.json(
            { error: "Masa trial Anda sudah habis!" },
            { status: 403, headers: NO_STORE_HEADERS }
          );
        }
        return NextResponse.json(
          {
            success: true,
            code: String(existingToken.code || ""),
            message: "Trial dilanjutkan",
          },
          { headers: NO_STORE_HEADERS }
        );
      }

      // Enforce per-IP limit specifically for new trial creation
      if (!consumedNewTrialQuota) {
        const createRate = consumeRateLimit(
          `trial_create:${ip}`,
          TRIAL_CREATE_MAX_PER_HOUR,
          TRIAL_WINDOW_MS
        );
        consumedNewTrialQuota = true;
        if (!createRate.allowed) {
          return rateLimitResponse(
            createRate.retryAfterSeconds,
            "Batas pembuatan akun trial per jam telah tercapai."
          );
        }
      }

      // Guard database array growth under spam
      const activeTrialCount = prunedTokens.filter((t) => {
        if (!t || typeof t !== "object") return false;
        const obj = t as Record<string, unknown>;
        const exp = Number(obj.expiresAt) || 0;
        return Boolean(obj.isTrial) && (exp === 0 || exp > now);
      }).length;

      if (activeTrialCount >= MAX_ACTIVE_TRIALS) {
        return NextResponse.json(
          {
            error:
              "Kuota trial otomatis sedang penuh. Silakan hubungi admin.",
          },
          { status: 503, headers: NO_STORE_HEADERS }
        );
      }

      let newCode = generateRandomTokenCode("TRIAL-");
      while (
        prunedTokens.some(
          (t) =>
            t &&
            typeof t === "object" &&
            (t as Record<string, unknown>).code === newCode
        )
      ) {
        newCode = generateRandomTokenCode("TRIAL-");
      }

      const tokenObj = {
        code: newCode,
        deviceId: cleanDeviceId,
        deviceIds: [cleanDeviceId],
        maxDevices: 1,
        expiresAt: now + 60 * 60 * 1000,
        label: "Trial User",
        isTrial: true,
        badgeIcon: "⏱️",
        badgeColor: "#808080",
      };

      data.tokens = [...prunedTokens, tokenObj];

      const putResult = await putFirebaseWithEtag(
        firebase.env,
        "/config.json",
        data,
        currentFetch.etag
      );

      if (putResult.ok) {
        return NextResponse.json(
          {
            success: true,
            code: newCode,
            message: "Trial 1 Jam berhasil diaktifkan!",
          },
          { headers: NO_STORE_HEADERS }
        );
      }

      if (!putResult.conflict) {
        return NextResponse.json(
          { error: "Gagal menyimpan trial ke database" },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }
    }

    return NextResponse.json(
      { error: "Server sedang sibuk. Silakan coba lagi." },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logServerError("api/generate-trial POST", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
