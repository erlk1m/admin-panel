import { CustomChannel, TokenObject } from "@/types/admin";

export function extractDeviceIds(token: {
  deviceId?: unknown;
  deviceIds?: unknown;
}): string[] {
  if (Array.isArray(token.deviceIds)) {
    return token.deviceIds.map(String);
  }
  if (typeof token.deviceId === "string" && token.deviceId.length > 0) {
    return [token.deviceId];
  }
  return [];
}

export function normalizeCustomChannels(raw: unknown): CustomChannel[] {
  if (!raw) return [];

  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "object") {
    list = Object.values(raw as Record<string, unknown>);
  }

  return list.map((item: unknown, idx: number) => {
    const c = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    return {
      id: String(c.id || `cc_${idx}`),
      name: typeof c.name === "string" ? c.name : String(c.name || ""),
      type: typeof c.type === "string" ? c.type : "direct",
      streamUrl: typeof c.streamUrl === "string" ? c.streamUrl : String(c.streamUrl || ""),
      group: typeof c.group === "string" ? c.group : c.group ? String(c.group) : undefined,
      logoUrl: typeof c.logoUrl === "string" ? c.logoUrl : undefined,
      licenseKey: typeof c.licenseKey === "string" ? c.licenseKey : undefined,
      licenseType: typeof c.licenseType === "string" ? c.licenseType : undefined,
      userAgent: typeof c.userAgent === "string" ? c.userAgent : undefined,
      referer: typeof c.referer === "string" ? c.referer : undefined,
      tvgId: typeof c.tvgId === "string" ? c.tvgId : undefined,
    };
  });
}

export function normalizeTokens(raw: unknown): TokenObject[] {
  if (!raw) return [];

  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === "object") {
    list = Object.entries(raw as Record<string, unknown>).map(([key, val]) => {
      if (typeof val === "string") {
        return { code: val || key, expiresAt: null, label: "Lifetime" };
      }
      if (typeof val === "object" && val !== null) {
        const obj = val as Record<string, unknown>;
        return {
          ...obj,
          code: typeof obj.code === "string" ? obj.code : key,
        };
      }
      return { code: key, expiresAt: null, label: "Lifetime" };
    });
  }

  return list.map((item: unknown) => {
    if (typeof item === "string") {
      return { code: item, expiresAt: null, label: "Lifetime" };
    }
    if (item && typeof item === "object") {
      const t = item as Record<string, unknown>;
      return {
        ...(t as Partial<TokenObject>),
        code: typeof t.code === "string" ? t.code : String(t.code || ""),
        label: typeof t.label === "string" ? t.label : String(t.label || "Lifetime"),
        expiresAt: typeof t.expiresAt === "number" ? t.expiresAt : Number(t.expiresAt) || null,
        maxDevices: typeof t.maxDevices === "number" ? t.maxDevices : Number(t.maxDevices) || 1,
        deviceId: typeof t.deviceId === "string" ? t.deviceId : String(t.deviceId || ""),
        deviceIds: Array.isArray(t.deviceIds) ? t.deviceIds.map(String) : [],
        isTrial: Boolean(t.isTrial),
        badgeIcon: typeof t.badgeIcon === "string" ? t.badgeIcon : String(t.badgeIcon || ""),
        badgeColor: typeof t.badgeColor === "string" ? t.badgeColor : String(t.badgeColor || "#FFD700"),
        nameEffect: typeof t.nameEffect === "string" ? t.nameEffect : String(t.nameEffect || "NONE"),
      };
    }
    return { code: String(item || ""), expiresAt: null, label: "Lifetime" };
  });
}

