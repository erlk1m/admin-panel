import { extractDeviceIds } from "@/lib/normalize";
import { AdminConfigState, CustomChannel, TokenObject } from "@/types/admin";

const DANGEROUS_SCHEME_RE = /^(javascript|data|vbscript|file|content):/i;
const SAFE_WEB_PROTOCOLS = new Set(["http:", "https:"]);
const SAFE_STREAM_PROTOCOLS = new Set([
  "http:",
  "https:",
  "rtmp:",
  "rtmps:",
  "rtsp:",
  "udp:",
  "rtp:",
]);

export interface SanitizedConfigResult {
  ok: true;
  config: AdminConfigState;
  resetDeviceCodes: Set<string>;
}

export interface ValidationFailure {
  ok: false;
  error: string;
}

export function validateDeviceId(
  raw: unknown
): { ok: true; value: string } | ValidationFailure {
  if (typeof raw !== "string") {
    return { ok: false, error: "Device ID diperlukan" };
  }
  const clean = raw.trim();
  if (clean.length < 8 || clean.length > 120) {
    return { ok: false, error: "Device ID tidak valid" };
  }
  const lower = clean.toLowerCase();
  if (
    lower === "unknown_device" ||
    lower === "unknown" ||
    lower === "null" ||
    lower === "undefined"
  ) {
    return { ok: false, error: "Device ID tidak valid" };
  }
  if (!/^[A-Za-z0-9_.:-]+$/.test(clean)) {
    return { ok: false, error: "Format Device ID tidak valid" };
  }
  return { ok: true, value: clean };
}

export function validateTokenCode(
  raw: unknown
): { ok: true; value: string } | ValidationFailure {
  if (typeof raw !== "string") {
    return { ok: false, error: "Code token diperlukan" };
  }
  const clean = raw.trim();
  if (clean.length === 0 || clean.length > 100) {
    return { ok: false, error: "Panjang kode token tidak valid" };
  }
  if (/[\x00-\x1F\x7F/]/.test(clean)) {
    return { ok: false, error: "Kode token mengandung karakter terlarang" };
  }
  return { ok: true, value: clean };
}

export function validateChannelName(
  raw: unknown
): { ok: true; value: string } | ValidationFailure {
  if (typeof raw !== "string") {
    return { ok: false, error: "Nama channel wajib diisi" };
  }
  const clean = raw.trim();
  if (clean.length === 0 || clean.length > 100) {
    return { ok: false, error: "Nama channel harus 1-100 karakter" };
  }
  if (/[\x00-\x1F\x7F/]/.test(clean)) {
    return { ok: false, error: "Nama channel mengandung karakter tidak valid" };
  }
  return { ok: true, value: clean };
}

function validateOptionalUrl(
  raw: unknown,
  fieldLabel: string,
  allowedProtocols = SAFE_WEB_PROTOCOLS,
  maxLength = 1000
): { ok: true; value: string } | ValidationFailure {
  if (raw === undefined || raw === null) {
    return { ok: true, value: "" };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: `${fieldLabel} harus berupa teks URL` };
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: true, value: "" };
  }
  if (trimmed.length > maxLength) {
    return { ok: false, error: `${fieldLabel} terlalu panjang` };
  }
  if (DANGEROUS_SCHEME_RE.test(trimmed)) {
    return {
      ok: false,
      error: `${fieldLabel} menggunakan skema URL yang tidak diizinkan`,
    };
  }
  try {
    const parsed = new URL(trimmed);
    if (!allowedProtocols.has(parsed.protocol)) {
      return {
        ok: false,
        error: `${fieldLabel} harus menggunakan awalan http:// atau https://`,
      };
    }
    return { ok: true, value: trimmed };
  } catch {
    return {
      ok: false,
      error: `Format ${fieldLabel} tidak valid (gunakan http:// atau https://)`,
    };
  }
}

function cleanText(raw: unknown, maxLength: number, fallback = ""): string {
  if (typeof raw !== "string") {
    if (raw === undefined || raw === null) return fallback;
    return String(raw).trim().slice(0, maxLength);
  }
  const cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  return cleaned ? cleaned.slice(0, maxLength) : fallback;
}

function cleanColor(raw: unknown, fallback: string): string {
  const s = cleanText(raw, 20, fallback);
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(s)) {
    return s;
  }
  return fallback;
}

export function sanitizeAdminConfigPayload(
  rawBody: unknown
): SanitizedConfigResult | ValidationFailure {
  if (!rawBody || typeof rawBody !== "object" || Array.isArray(rawBody)) {
    return { ok: false, error: "Payload konfigurasi harus berupa objek JSON." };
  }

  const b = rawBody as Record<string, unknown>;

  const m3uUrl = validateOptionalUrl(b.m3uUrl, "URL Playlist Server 1");
  if (!m3uUrl.ok) return m3uUrl;
  const m3uUrl2 = validateOptionalUrl(b.m3uUrl2, "URL Playlist Server 2");
  if (!m3uUrl2.ok) return m3uUrl2;
  const m3uUrl3 = validateOptionalUrl(b.m3uUrl3, "URL Playlist Server 3");
  if (!m3uUrl3.ok) return m3uUrl3;
  const epgUrl = validateOptionalUrl(b.epgUrl, "EPG URL");
  if (!epgUrl.ok) return epgUrl;
  const proxyUrl = validateOptionalUrl(b.proxyUrl, "Stream Proxy URL");
  if (!proxyUrl.ok) return proxyUrl;
  const backgroundUrl = validateOptionalUrl(b.backgroundUrl, "Wallpaper URL");
  if (!backgroundUrl.ok) return backgroundUrl;
  const welcomeBannerUrl = validateOptionalUrl(
    b.welcomeBannerUrl,
    "Banner Sambutan URL"
  );
  if (!welcomeBannerUrl.ok) return welcomeBannerUrl;
  const apkUpdateUrl = validateOptionalUrl(b.apkUpdateUrl, "URL Update APK");
  if (!apkUpdateUrl.ok) return apkUpdateUrl;
  const adminContactUrl = validateOptionalUrl(
    b.adminContactUrl,
    "URL Kontak Admin"
  );
  if (!adminContactUrl.ok) return adminContactUrl;
  const prerollAdUrl = validateOptionalUrl(b.prerollAdUrl, "URL Iklan Pre-Roll");
  if (!prerollAdUrl.ok) return prerollAdUrl;

  const rawChannels = Array.isArray(b.customChannels) ? b.customChannels : [];
  if (rawChannels.length > 500) {
    return { ok: false, error: "Maksimal 500 custom channel diperbolehkan." };
  }

  const customChannels: CustomChannel[] = [];
  for (let i = 0; i < rawChannels.length; i++) {
    const item = rawChannels[i];
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const ch = item as Record<string, unknown>;

    const name = cleanText(ch.name, 100);
    if (!name) {
      return { ok: false, error: `Custom channel #${i + 1} wajib memiliki nama.` };
    }

    const type = ch.type === "embed" ? "embed" : "direct";
    const rawStream = typeof ch.streamUrl === "string" ? ch.streamUrl.trim() : "";
    if (!rawStream) {
      return {
        ok: false,
        error: `Custom channel "${name}" wajib memiliki Stream URL / Embed.`,
      };
    }

    if (type === "embed") {
      if (rawStream.length > 4000) {
        return {
          ok: false,
          error: `Kode embed channel "${name}" terlalu panjang (maks 4000 karakter).`,
        };
      }
      if (/<\s*script|javascript:|onerror\s*=|onload\s*=/i.test(rawStream)) {
        return {
          ok: false,
          error: `Kode embed channel "${name}" mengandung skrip berbahaya.`,
        };
      }
    } else {
      const streamCheck = validateOptionalUrl(
        rawStream,
        `Stream URL (${name})`,
        SAFE_STREAM_PROTOCOLS,
        2000
      );
      if (!streamCheck.ok) return streamCheck;
    }

    const logoCheck = validateOptionalUrl(
      ch.logoUrl,
      `Logo URL (${name})`,
      SAFE_WEB_PROTOCOLS,
      1000
    );
    if (!logoCheck.ok) return logoCheck;

    const refererCheck = validateOptionalUrl(
      ch.referer,
      `Referer URL (${name})`,
      SAFE_WEB_PROTOCOLS,
      1000
    );
    if (!refererCheck.ok) return refererCheck;

    const cleanChannel: CustomChannel = {
      id: cleanText(ch.id, 64, `cc_${i}`),
      name,
      type,
      streamUrl: rawStream,
    };

    const group = cleanText(ch.group, 60);
    if (group) cleanChannel.group = group;
    if (logoCheck.value) cleanChannel.logoUrl = logoCheck.value;
    const licenseKey = cleanText(ch.licenseKey, 500);
    if (licenseKey) cleanChannel.licenseKey = licenseKey;
    const licenseType = cleanText(ch.licenseType, 80);
    if (licenseType) cleanChannel.licenseType = licenseType;
    const userAgent = cleanText(ch.userAgent, 300);
    if (userAgent) cleanChannel.userAgent = userAgent;
    if (refererCheck.value) cleanChannel.referer = refererCheck.value;
    const tvgId = cleanText(ch.tvgId, 100);
    if (tvgId) cleanChannel.tvgId = tvgId;

    customChannels.push(cleanChannel);
  }

  const rawTokens = Array.isArray(b.tokens) ? b.tokens : [];
  if (rawTokens.length > 2000) {
    return { ok: false, error: "Maksimal 2000 token diperbolehkan." };
  }

  const tokens: TokenObject[] = [];
  const seenCodes = new Set<string>();
  const resetDeviceCodes = new Set<string>();

  for (const item of rawTokens) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const t = item as Record<string, unknown>;

    const codeValidation = validateTokenCode(t.code);
    if (!codeValidation.ok) {
      return {
        ok: false,
        error: `Token tidak valid: ${codeValidation.error}`,
      };
    }

    const code = codeValidation.value;
    if (seenCodes.has(code)) {
      return {
        ok: false,
        error: `Terdapat kode token duplikat: ${code}`,
      };
    }
    seenCodes.add(code);

    if (Boolean(t._resetDevice)) {
      resetDeviceCodes.add(code);
    }

    const badgeIconRaw = cleanText(t.badgeIcon, 300);
    if (DANGEROUS_SCHEME_RE.test(badgeIconRaw)) {
      return {
        ok: false,
        error: `Badge token ${code} menggunakan skema URL yang tidak diizinkan.`,
      };
    }

    const nameEffectRaw = cleanText(t.nameEffect, 300, "NONE");
    if (DANGEROUS_SCHEME_RE.test(nameEffectRaw)) {
      return {
        ok: false,
        error: `Efek nama token ${code} menggunakan skema URL yang tidak diizinkan.`,
      };
    }

    const parsedExp =
      t.expiresAt === null || t.expiresAt === undefined || t.expiresAt === ""
        ? null
        : Number(t.expiresAt);
    const expiresAt =
      parsedExp !== null && Number.isFinite(parsedExp) && parsedExp > 0
        ? Math.trunc(parsedExp)
        : null;

    const maxDevices = Math.max(
      1,
      Math.min(10, Math.trunc(Number(t.maxDevices) || 1))
    );

    const normalizedDevIds = extractDeviceIds({
      deviceId: t.deviceId,
      deviceIds: t.deviceIds,
    })
      .map((d) => d.trim())
      .filter((d) => d.length > 0 && d.length <= 120)
      .slice(0, 10);

    tokens.push({
      code,
      label: cleanText(t.label, 80, "Lifetime"),
      expiresAt,
      maxDevices,
      deviceId: normalizedDevIds[0] || "",
      deviceIds: normalizedDevIds,
      isTrial: Boolean(t.isTrial),
      badgeIcon: badgeIconRaw,
      badgeColor: cleanColor(t.badgeColor, "#FFD700"),
      nameEffect: nameEffectRaw,
    });
  }

  const adminBadgeIcon = cleanText(b.adminBadgeIcon, 300, "🔧");
  if (DANGEROUS_SCHEME_RE.test(adminBadgeIcon)) {
    return {
      ok: false,
      error: "Badge ikon admin menggunakan skema URL yang tidak diizinkan.",
    };
  }

  const adminNameEffect = cleanText(b.adminNameEffect, 300, "NONE");
  if (DANGEROUS_SCHEME_RE.test(adminNameEffect)) {
    return {
      ok: false,
      error: "Efek nama admin menggunakan skema URL yang tidak diizinkan.",
    };
  }

  const latestVersionCode = Math.max(
    1,
    Math.min(999999, Math.trunc(Number(b.latestVersionCode) || 1))
  );

  const sanitizedConfig: AdminConfigState = {
    m3uUrl: m3uUrl.value,
    m3uUrl2: m3uUrl2.value,
    m3uUrl3: m3uUrl3.value,
    m3uName: cleanText(b.m3uName, 80),
    m3uName2: cleanText(b.m3uName2, 80),
    m3uName3: cleanText(b.m3uName3, 80),
    epgUrl: epgUrl.value,
    proxyUrl: proxyUrl.value,
    customChannels,
    tokens,
    notificationText: cleanText(b.notificationText, 500),
    notificationColor: cleanColor(b.notificationColor, "#FFFFFF"),
    notificationEnabled: Boolean(b.notificationEnabled),
    backgroundUrl: backgroundUrl.value,
    welcomeBannerUrl: welcomeBannerUrl.value,
    latestVersionCode,
    apkUpdateUrl: apkUpdateUrl.value,
    adminContactUrl: adminContactUrl.value,
    isMaintenance: Boolean(b.isMaintenance),
    prerollAdUrl: prerollAdUrl.value,
    prerollAdEnabled: Boolean(b.prerollAdEnabled),
    appName: cleanText(b.appName, 40, "KIMTV"),
    chatEnabled: b.chatEnabled !== false,
    adminBadgeIcon,
    adminBadgeColor: cleanColor(b.adminBadgeColor, "#FF00FF"),
    adminNameEffect,
  };

  return {
    ok: true,
    config: sanitizedConfig,
    resetDeviceCodes,
  };
}

