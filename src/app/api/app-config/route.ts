import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  getFirebaseEnv,
  logServerError,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
} from "@/lib/firebase";
import {
  extractDeviceIds,
  normalizeCustomChannels,
  normalizeTokens,
} from "@/lib/normalize";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
} from "@/lib/rateLimit";
import { validateDeviceId, validateTokenCode } from "@/lib/validation";

export const dynamic = "force-dynamic";

const APP_CONFIG_MAX_REQUESTS = 60;
const APP_CONFIG_WINDOW_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = consumeRateLimit(
      `appcfg:${ip}`,
      APP_CONFIG_MAX_REQUESTS,
      APP_CONFIG_WINDOW_MS
    );
    if (!rate.allowed) {
      return rateLimitResponse(
        rate.retryAfterSeconds,
        "Terlalu banyak permintaan konfigurasi. Silakan coba lagi beberapa saat."
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format permintaan tidak valid", reason: "INVALID_REQUEST" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const record =
      body && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};

    const codeCheck = validateTokenCode(record.code);
    if (!codeCheck.ok) {
      return NextResponse.json(
        { error: codeCheck.error, reason: "INVALID_REQUEST" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const deviceCheck = validateDeviceId(record.deviceId);
    if (!deviceCheck.ok) {
      return NextResponse.json(
        { error: deviceCheck.error, reason: "INVALID_REQUEST" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const cleanCode = codeCheck.value;
    const cleanDeviceId = deviceCheck.value;

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

    const tokens = normalizeTokens(configData.tokens);
    let matchedToken = tokens.find((t) => t.code === cleanCode) ?? null;

    if (
      !matchedToken &&
      typeof configData.accessCode === "string" &&
      configData.accessCode.trim() === cleanCode
    ) {
      matchedToken = {
        code: cleanCode,
        expiresAt: null,
        label: "Lifetime",
        maxDevices: 1,
        deviceIds: [],
      };
    }

    if (!matchedToken) {
      return NextResponse.json(
        {
          error: "Token tidak ditemukan atau sudah dihapus oleh Admin.",
          reason: "INVALID_TOKEN",
        },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const expiresAt =
      typeof matchedToken.expiresAt === "number"
        ? matchedToken.expiresAt
        : Number(matchedToken.expiresAt) || null;
    if (expiresAt && Date.now() > expiresAt) {
      return NextResponse.json(
        {
          error: "Masa aktif token Anda telah berakhir.",
          reason: "EXPIRED",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const boundDeviceIds = extractDeviceIds(matchedToken);
    if (!boundDeviceIds.includes(cleanDeviceId)) {
      return NextResponse.json(
        {
          error:
            "Perangkat TV ini tidak terdaftar atau telah di-reset oleh Admin. Silakan masuk ulang.",
          reason: "DEVICE_UNBOUND",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

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
        adminBadgeIcon:
          typeof configData.adminBadgeIcon === "string" &&
          configData.adminBadgeIcon.trim()
            ? configData.adminBadgeIcon
            : "🔧",
        adminBadgeColor:
          typeof configData.adminBadgeColor === "string" &&
          configData.adminBadgeColor.trim()
            ? configData.adminBadgeColor
            : "#FF00FF",
        adminNameEffect:
          typeof configData.adminNameEffect === "string" &&
          configData.adminNameEffect.trim()
            ? configData.adminNameEffect
            : "NONE",
        m3uUrl: typeof configData.m3uUrl === "string" ? configData.m3uUrl : "",
        m3uUrl2:
          typeof configData.m3uUrl2 === "string" ? configData.m3uUrl2 : "",
        m3uUrl3:
          typeof configData.m3uUrl3 === "string" ? configData.m3uUrl3 : "",
        m3uName:
          typeof configData.m3uName === "string" && configData.m3uName.trim()
            ? configData.m3uName
            : "Server 1",
        m3uName2:
          typeof configData.m3uName2 === "string" && configData.m3uName2.trim()
            ? configData.m3uName2
            : "Server 2",
        m3uName3:
          typeof configData.m3uName3 === "string" && configData.m3uName3.trim()
            ? configData.m3uName3
            : "Server 3",
        epgUrl: typeof configData.epgUrl === "string" ? configData.epgUrl : "",
        proxyUrl:
          typeof configData.proxyUrl === "string" ? configData.proxyUrl : "",
        customChannels: configData.customChannels
          ? normalizeCustomChannels(configData.customChannels)
          : [],
        tokenInfo: {
          code: matchedToken.code,
          label:
            typeof matchedToken.label === "string" && matchedToken.label.trim()
              ? matchedToken.label
              : "Lifetime",
          expiresAt,
          isTrial: Boolean(matchedToken.isTrial),
          badgeIcon:
            typeof matchedToken.badgeIcon === "string"
              ? matchedToken.badgeIcon
              : "",
          badgeColor:
            typeof matchedToken.badgeColor === "string" &&
            matchedToken.badgeColor.trim()
              ? matchedToken.badgeColor
              : "#FFD700",
          nameEffect:
            typeof matchedToken.nameEffect === "string" &&
            matchedToken.nameEffect.trim()
              ? matchedToken.nameEffect
              : "NONE",
          maxDevices: Math.max(
            1,
            Math.min(10, Math.trunc(Number(matchedToken.maxDevices) || 1))
          ),
        },
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    logServerError("api/app-config POST", err);
    return NextResponse.json(
      { error: "Gagal memuat konfigurasi aplikasi dari server." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

