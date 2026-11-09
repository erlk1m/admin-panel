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

export function useAdminConfig(
  showToast: (type: ToastMessage["type"], message: string) => void
) {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AdminConfigState>(INITIAL_CONFIG);

  const updateConfig = useCallback(
    (patch: Partial<AdminConfigState>) => {
      setConfig((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const loadConfig = useCallback(
    async (authPassword?: string) => {
      try {
        const headers: Record<string, string> = {};
        if (authPassword) {
          headers["x-admin-password"] = authPassword;
        }
        const res = await fetch("/api/config", { headers, cache: "no-store" });
        const data = await res.json();
        if (data && typeof data === "object") {
          setConfig((prev) => ({
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
            tokens: data.tokens ? normalizeTokens(data.tokens) : prev.tokens,
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
              typeof data.welcomeBannerUrl === "string"
                ? data.welcomeBannerUrl
                : "",
            latestVersionCode:
              typeof data.latestVersionCode === "number"
                ? data.latestVersionCode
                : Number(data.latestVersionCode) || 1,
            apkUpdateUrl:
              typeof data.apkUpdateUrl === "string" ? data.apkUpdateUrl : "",
            adminContactUrl:
              typeof data.adminContactUrl === "string"
                ? data.adminContactUrl
                : "",
            isMaintenance: Boolean(data.isMaintenance),
            prerollAdUrl:
              typeof data.prerollAdUrl === "string" ? data.prerollAdUrl : "",
            prerollAdEnabled: Boolean(data.prerollAdEnabled),
            chatEnabled: data.chatEnabled !== false,
            adminBadgeIcon:
              typeof data.adminBadgeIcon === "string"
                ? data.adminBadgeIcon
                : "🔧",
            adminBadgeColor:
              typeof data.adminBadgeColor === "string"
                ? data.adminBadgeColor
                : "#FF00FF",
            adminNameEffect:
              typeof data.adminNameEffect === "string"
                ? data.adminNameEffect
                : "NONE",
            appName:
              typeof data.appName === "string"
                ? data.appName
                : String(data.appName || "KIMTV"),
          }));
        }
      } catch (e) {
        console.error("Config fetch error:", e);
        showToast("error", "Gagal memuat konfigurasi dari server.");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadConfig();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadConfig]);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (adminPassword.trim() === "") return;

      try {
        const res = await fetch("/api/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: adminPassword }),
        });

        if (res.ok) {
          setIsAuthenticated(true);
          void loadConfig(adminPassword);
          showToast("success", "Berhasil login ke Admin Console!");
        } else {
          const data = await res.json();
          showToast("error", data.error || "Password Admin Salah!");
        }
      } catch {
        showToast("error", "Terjadi kesalahan jaringan.");
      }
    },
    [adminPassword, loadConfig, showToast]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        showToast("success", "Semua pengaturan berhasil tersimpan ke Firebase!");
      } else {
        const err = await res.json();
        showToast(
          "error",
          "Gagal menyimpan: " + (err.error || "Password Admin Salah!")
        );
        if (res.status === 401) setIsAuthenticated(false);
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  }, [adminPassword, config, showToast]);

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

  return {
    adminPassword,
    setAdminPassword,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    saving,
    config,
    setConfig,
    updateConfig,
    handleLogin,
    handleSave,
  };
}

