import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  fetchFirebaseWithEtag,
  getFirebaseEnv,
  isAdminRequest,
  logServerError,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
  putFirebaseWithEtag,
  requireAdmin,
} from "@/lib/firebase";
import {
  extractDeviceIds,
  normalizeCustomChannels,
  normalizeTokens,
} from "@/lib/normalize";
import { sanitizeAdminConfigPayload } from "@/lib/validation";
import { AdminConfigState, TokenObject } from "@/types/admin";

export const dynamic = "force-dynamic";

const MAX_CAS_ATTEMPTS = 4;

export async function GET(request: Request) {
  try {
    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const res = await fetch(
      buildFirebaseUrl(firebase.env, "/config.json", true),
      {
        cache: "no-store",
        headers: NO_STORE_FETCH_HEADERS,
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Gagal mengambil konfigurasi dari database." },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    const data = await res.json();
    const configData: Record<string, unknown> =
      data && typeof data === "object" && !Array.isArray(data)
        ? { ...(data as Record<string, unknown>) }
        : {};

    if (!isAdminRequest(request)) {
      return NextResponse.json(
        {
          appName:
            typeof configData.appName === "string" && configData.appName.trim()
              ? configData.appName
              : "KIMTV",
          backgroundUrl: configData.backgroundUrl || null,
          welcomeBannerUrl: configData.welcomeBannerUrl || null,
          isMaintenance: Boolean(configData.isMaintenance),
          notificationText:
            typeof configData.notificationText === "string"
              ? configData.notificationText
              : "",
          notificationColor:
            typeof configData.notificationColor === "string"
              ? configData.notificationColor
              : "#FFFFFF",
          notificationEnabled: Boolean(configData.notificationEnabled),
          latestVersionCode: Number(configData.latestVersionCode) || 1,
          apkUpdateUrl: configData.apkUpdateUrl || null,
          adminContactUrl: configData.adminContactUrl || null,
          chatEnabled: configData.chatEnabled !== false,
          prerollAdUrl: configData.prerollAdUrl || null,
          prerollAdEnabled: Boolean(configData.prerollAdEnabled),
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    if (configData.tokens) {
      configData.tokens = normalizeTokens(configData.tokens);
    }
    if (configData.customChannels) {
      configData.customChannels = normalizeCustomChannels(
        configData.customChannels
      );
    }

    return NextResponse.json(configData, { headers: NO_STORE_HEADERS });
  } catch (err) {
    logServerError("api/config GET", err);
    return NextResponse.json(
      { error: "Gagal memuat konfigurasi dari server." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format payload JSON tidak valid." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const sanitized = sanitizeAdminConfigPayload(rawBody);
    if (!sanitized.ok) {
      return NextResponse.json(
        { error: sanitized.error },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    for (let attempt = 0; attempt < MAX_CAS_ATTEMPTS; attempt++) {
      const currentFetch = await fetchFirebaseWithEtag<Record<string, unknown>>(
        firebase.env,
        "/config.json"
      );

      if (!currentFetch.ok) {
        return NextResponse.json(
          { error: "Gagal membaca konfigurasi terbaru dari database." },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }

      const currentConfig =
        currentFetch.data &&
        typeof currentFetch.data === "object" &&
        !Array.isArray(currentFetch.data)
          ? currentFetch.data
          : {};

      const currentTokens = currentConfig.tokens
        ? normalizeTokens(currentConfig.tokens)
        : [];
      const currentTokenMap = new Map<string, TokenObject>();
      for (const existingToken of currentTokens) {
        if (existingToken.code) {
          currentTokenMap.set(existingToken.code, existingToken);
        }
      }

      const mergedTokens: TokenObject[] = [];
      const handledCodes = new Set<string>();

      for (const inputToken of sanitized.config.tokens) {
        handledCodes.add(inputToken.code);
        const existing = currentTokenMap.get(inputToken.code);

        if (existing) {
          const isResetExplicit = sanitized.resetDeviceCodes.has(
            inputToken.code
          );
          const preservedDeviceIds = isResetExplicit
            ? []
            : extractDeviceIds(existing);
          const preservedDeviceId = isResetExplicit
            ? ""
            : existing.deviceId || preservedDeviceIds[0] || "";

          mergedTokens.push({
            ...inputToken,
            deviceId: preservedDeviceId,
            deviceIds: preservedDeviceIds,
          });
        } else {
          mergedTokens.push(inputToken);
        }
      }

      // Preserve active trial tokens claimed concurrently on TVs
      const now = Date.now();
      for (const existingToken of currentTokens) {
        if (
          existingToken.code &&
          !handledCodes.has(existingToken.code) &&
          existingToken.isTrial &&
          (!existingToken.expiresAt || existingToken.expiresAt > now)
        ) {
          mergedTokens.push(existingToken);
        }
      }

      const payloadToSave: AdminConfigState = {
        ...sanitized.config,
        tokens: mergedTokens,
      };

      const putResult = await putFirebaseWithEtag(
        firebase.env,
        "/config.json",
        payloadToSave,
        currentFetch.etag
      );

      if (putResult.ok) {
        return NextResponse.json(
          { success: true, config: payloadToSave },
          { headers: NO_STORE_HEADERS }
        );
      }

      if (!putResult.conflict) {
        return NextResponse.json(
          { error: "Gagal menyimpan konfigurasi ke database." },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }
    }

    return NextResponse.json(
      {
        error:
          "Konfigurasi sedang diperbarui secara bersamaan. Silakan coba simpan lagi.",
      },
      { status: 409, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logServerError("api/config POST", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menyimpan konfigurasi." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
