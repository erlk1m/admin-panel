"use client";

import { useCallback, useEffect, useState } from "react";
import { normalizeCustomChannels, normalizeTokens } from "@/lib/normalize";
import { AdminConfigState, ToastMessage } from "@/types/admin";

const INITIAL_CONFIG: AdminConfigState = {
  m3uUrl: "",
  m3uUrl2: "",
  m3uUrl3: "",
  m3uName: "",
  m3uName2: "",
  m3uName3: "",
  epgUrl: "",
  proxyUrl: "",
  customChannels: [],
  tokens: [],
  notificationText: "",
  notificationColor: "#FFFFFF",
  notificationEnabled: false,
  backgroundUrl: "",
  welcomeBannerUrl: "",
  latestVersionCode: 1,
  apkUpdateUrl: "",
  adminContactUrl: "",
  isMaintenance: false,
  prerollAdUrl: "",
  prerollAdEnabled: false,
  appName: "KIMTV",
  chatEnabled: true,
  adminBadgeIcon: "🔧",
  adminBadgeColor: "#FF00FF",
  adminNameEffect: "NONE",
};

function buildAdminConfigState(data: Record<string, unknown>): AdminConfigState {
  return {
    m3uUrl: typeof data.m3uUrl === "string" ? data.m3uUrl : "",
    m3uUrl2: typeof data.m3uUrl2 === "string" ? data.m3uUrl2 : "",
    m3uUrl3: typeof data.m3uUrl3 === "string" ? data.m3uUrl3 : "",
    m3uName: typeof data.m3uName === "string" ? data.m3uName : "",
    m3uName2: typeof data.m3uName2 === "string" ? data.m3uName2 : "",
    m3uName3: typeof data.m3uName3 === "string" ? data.m3uName3 : "",
    epgUrl: typeof data.epgUrl === "string" ? data.epgUrl : "",
    proxyUrl: typeof data.proxyUrl === "string" ? data.proxyUrl : "",
    customChannels: data.customChannels
      ? normalizeCustomChannels(data.customChannels)
      : [],
    tokens: data.tokens ? normalizeTokens(data.tokens) : [],
    notificationText:
      typeof data.notificationText === "string"
        ? data.notificationText
        : String(data.notificationText || ""),
    notificationColor:
      typeof data.notificationColor === "string"
        ? data.notificationColor
        : "#FFFFFF",
    notificationEnabled: Boolean(data.notificationEnabled),
    backgroundUrl:
      typeof data.backgroundUrl === "string" ? data.backgroundUrl : "",
    welcomeBannerUrl:
      typeof data.welcomeBannerUrl === "string" ? data.welcomeBannerUrl : "",
    latestVersionCode:
      typeof data.latestVersionCode === "number"
        ? data.latestVersionCode
        : Number(data.latestVersionCode) || 1,
    apkUpdateUrl:
      typeof data.apkUpdateUrl === "string" ? data.apkUpdateUrl : "",
    adminContactUrl:
      typeof data.adminContactUrl === "string" ? data.adminContactUrl : "",
    isMaintenance: Boolean(data.isMaintenance),
    prerollAdUrl:
      typeof data.prerollAdUrl === "string" ? data.prerollAdUrl : "",
    prerollAdEnabled: Boolean(data.prerollAdEnabled),
    chatEnabled: data.chatEnabled !== false,
    adminBadgeIcon:
      typeof data.adminBadgeIcon === "string" ? data.adminBadgeIcon : "🔧",
    adminBadgeColor:
      typeof data.adminBadgeColor === "string"
        ? data.adminBadgeColor
        : "#FF00FF",
    adminNameEffect:
      typeof data.adminNameEffect === "string" ? data.adminNameEffect : "NONE",
    appName:
      typeof data.appName === "string"
        ? data.appName
        : String(data.appName || "KIMTV"),
  };
}

export function useAdminConfig(
  showToast: (type: ToastMessage["type"], message: string) => void
) {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AdminConfigState>(INITIAL_CONFIG);
  const [lastSavedJson, setLastSavedJson] = useState<string>("");

  const hasUnsavedChanges =
    isAuthenticated &&
    lastSavedJson !== "" &&
    JSON.stringify(config) !== lastSavedJson;

  const updateConfig = useCallback((patch: Partial<AdminConfigState>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
  }, []);

  const discardChanges = useCallback(() => {
    if (!lastSavedJson) return;
    try {
      const parsed = JSON.parse(lastSavedJson) as AdminConfigState;
      setConfig(parsed);
      showToast("info", "Perubahan yang belum disimpan dibatalkan.");
    } catch {}
  }, [lastSavedJson, showToast]);

  const loadConfig = useCallback(
    async (authenticatedSession: boolean) => {
      try {
        const res = await fetch("/api/config", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!res.ok) {
          throw new Error("Config request failed");
        }
        const data = (await res.json()) as Record<string, unknown>;
        if (data && typeof data === "object") {
          const baseConfig = buildAdminConfigState(data);
          if (authenticatedSession) {
            setConfig(baseConfig);
            setLastSavedJson(JSON.stringify(baseConfig));
          } else {
            setConfig((prev) => ({
              ...baseConfig,
              tokens: prev.tokens,
            }));
          }
        }
      } catch (e) {
        console.error("Config fetch error:", e);
        showToast("error", "Gagal memuat konfigurasi dari server.");
      }
    },
    [showToast]
  );

  useEffect(() => {
    let active = true;
    const bootstrap = async () => {
      try {
        const authRes = await fetch("/api/verify-password", {
          cache: "no-store",
          credentials: "same-origin",
        });
        const authData = authRes.ok
          ? ((await authRes.json()) as { authenticated?: boolean })
          : { authenticated: false };
        const hasSession = Boolean(authData?.authenticated);

        if (!active) return;
        setIsAuthenticated(hasSession);
        await loadConfig(hasSession);
      } catch {
        if (active) {
          setIsAuthenticated(false);
          await loadConfig(false);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, [loadConfig]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (adminPassword.trim() === "") return;

      try {
        const res = await fetch("/api/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ password: adminPassword }),
        });

        if (res.ok) {
          setAdminPassword("");
          setIsAuthenticated(true);
          await loadConfig(true);
          showToast("success", "Berhasil login ke Admin Console!");
        } else {
          const data = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          showToast("error", data.error || "Password Admin Salah!");
        }
      } catch {
        showToast("error", "Terjadi kesalahan jaringan.");
      }
    },
    [adminPassword, loadConfig, showToast]
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/verify-password", {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {}
    setAdminPassword("");
    setIsAuthenticated(false);
    setLastSavedJson("");
    setConfig((prev) => ({
      ...INITIAL_CONFIG,
      appName: prev.appName,
      backgroundUrl: prev.backgroundUrl,
      welcomeBannerUrl: prev.welcomeBannerUrl,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(config),
      });

      const responseData = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        config?: Record<string, unknown>;
        error?: string;
      };

      if (res.ok) {
        if (responseData.config && typeof responseData.config === "object") {
          const syncedConfig = buildAdminConfigState(responseData.config);
          setConfig(syncedConfig);
          setLastSavedJson(JSON.stringify(syncedConfig));
        } else {
          await loadConfig(true);
        }
        showToast(
          "success",
          "Semua pengaturan berhasil tersimpan ke Firebase!"
        );
      } else {
        showToast(
          "error",
          "Gagal menyimpan: " + (responseData.error || "Terjadi kesalahan server")
        );
        if (res.status === 401) {
          setIsAuthenticated(false);
        }
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  }, [config, loadConfig, showToast]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isAuthenticated && !saving) {
          void handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAuthenticated, saving, handleSave]);

  // Warn user before leaving page with unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    adminPassword,
    setAdminPassword,
    isAuthenticated,
    loading,
    saving,
    hasUnsavedChanges,
    config,
    setConfig,
    updateConfig,
    discardChanges,
    handleLogin,
    handleLogout,
    handleSave,
  };
}
