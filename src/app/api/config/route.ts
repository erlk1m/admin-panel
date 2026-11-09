import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  getFirebaseEnv,
  isAdminRequest,
  NO_STORE_FETCH_HEADERS,
  NO_STORE_HEADERS,
  requireAdmin,
} from "@/lib/firebase";
import { extractDeviceIds } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const res = await fetch(buildFirebaseUrl(firebase.env, "/config.json", true), {
      cache: "no-store",
      headers: NO_STORE_FETCH_HEADERS,
    });
    const data = await res.json();
    const configData: Record<string, any> =
      data && typeof data === "object" ? { ...data } : {};

    if (!isAdminRequest(request)) {
      // Return only public non-sensitive config
      return NextResponse.json(
        {
          appName: configData.appName || "KIMTV",
          backgroundUrl: configData.backgroundUrl || null,
          welcomeBannerUrl: configData.welcomeBannerUrl || null,
          isMaintenance: Boolean(configData.isMaintenance),
          notificationText: configData.notificationText || "",
          notificationColor: configData.notificationColor || "#FFFFFF",
          notificationEnabled: Boolean(configData.notificationEnabled),
          latestVersionCode: configData.latestVersionCode || 1,
          apkUpdateUrl: configData.apkUpdateUrl || null,
          adminContactUrl: configData.adminContactUrl || null,
          chatEnabled: configData.chatEnabled !== false,
          prerollAdUrl: configData.prerollAdUrl || null,
          prerollAdEnabled: Boolean(configData.prerollAdEnabled),
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
    }

    // Normalize tokens if object (for authenticated admin)
    if (
      configData.tokens &&
      !Array.isArray(configData.tokens) &&
      typeof configData.tokens === "object"
    ) {
      configData.tokens = Object.entries(configData.tokens).map(
        ([key, val]: [string, any]) => {
          if (typeof val === "string") {
            return { code: val || key, expiresAt: null, label: "Lifetime" };
          }
          if (typeof val === "object" && val !== null) {
            return {
              ...val,
              code: typeof val.code === "string" ? val.code : key,
              label: typeof val.label === "string" ? val.label : "Lifetime",
              expiresAt:
                typeof val.expiresAt === "number"
                  ? val.expiresAt
                  : Number(val.expiresAt) || null,
            };
          }
          return { code: key, expiresAt: null, label: "Lifetime" };
        }
      );
    }

    // Normalize customChannels if object
    if (
      configData.customChannels &&
      !Array.isArray(configData.customChannels) &&
      typeof configData.customChannels === "object"
    ) {
      configData.customChannels = Object.values(configData.customChannels);
    }

    return NextResponse.json(configData, { headers: NO_STORE_HEADERS });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch from Firebase: " + (error?.message || "") },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = requireAdmin(request);
    if (!auth.ok) return auth.response;

    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const body = await request.json();

    // 1. Fetch current config from Firebase to prevent overwriting active device bindings and trials
    let currentConfig: Record<string, any> = {};
    try {
      const getRes = await fetch(
        buildFirebaseUrl(firebase.env, "/config.json", true),
        {
          cache: "no-store",
          headers: NO_STORE_FETCH_HEADERS,
        }
      );
      if (getRes.ok) {
        currentConfig = (await getRes.json()) || {};
      }
    } catch (e) {
      console.warn("Could not pre-fetch current config for merging:", e);
    }

    // 2. Merge tokens safely
    if (Array.isArray(body.tokens)) {
      let currentTokens: any[] = [];
      if (Array.isArray(currentConfig.tokens)) {
        currentTokens = currentConfig.tokens;
      } else if (
        currentConfig.tokens &&
        typeof currentConfig.tokens === "object"
      ) {
        currentTokens = Object.values(currentConfig.tokens);
      }

      const currentTokenMap = new Map<string, any>();
      for (const t of currentTokens) {
        if (t && typeof t === "object" && t.code) {
          currentTokenMap.set(String(t.code), t);
        }
      }

      const mergedTokens: any[] = [];
      const handledCodes = new Set<string>();

      for (const inputToken of body.tokens) {
        if (!inputToken || !inputToken.code) continue;
        const code = String(inputToken.code);
        handledCodes.add(code);

        const existing = currentTokenMap.get(code);
        if (existing) {
          const isResetExplicit = Boolean(inputToken._resetDevice);
          const preservedDeviceIds = isResetExplicit
            ? []
            : extractDeviceIds(existing);
          const preservedDeviceId = isResetExplicit
            ? ""
            : existing.deviceId || preservedDeviceIds[0] || "";

          const cleanToken = { ...inputToken };
          delete cleanToken._resetDevice;

          mergedTokens.push({
            ...cleanToken,
            deviceId: preservedDeviceId,
            deviceIds: preservedDeviceIds,
          });
        } else {
          const cleanToken = { ...inputToken };
          delete cleanToken._resetDevice;
          mergedTokens.push(cleanToken);
        }
      }

      // Preserve any active trial tokens from Firebase that were generated in the background
      for (const t of currentTokens) {
        if (t && t.code && !handledCodes.has(String(t.code)) && t.isTrial) {
          if (!t.expiresAt || t.expiresAt > Date.now()) {
            mergedTokens.push(t);
          }
        }
      }

      body.tokens = mergedTokens;
    }

    // 3. Save merged config back to Firebase RTDB
    const res = await fetch(buildFirebaseUrl(firebase.env, "/config.json"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Firebase Error:", errorText);
      throw new Error("Gagal menyimpan ke Firebase: " + errorText);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Failed to save to Firebase" },
      { status: 500 }
    );
  }
}
