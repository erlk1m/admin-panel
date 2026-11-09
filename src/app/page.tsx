"use client";

import { useState } from "react";
import {
  Activity,
  Globe,
  Key,
  MessageSquare,
  PieChart,
  Sliders,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { LoadingScreen } from "@/components/layout/LoadingScreen";
import { LoginView } from "@/components/layout/LoginView";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { MobileNav } from "@/components/layout/MobileNav";
import { NavigationTab, Sidebar } from "@/components/layout/Sidebar";
import { AnalyticsTab } from "@/components/tabs/AnalyticsTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { OverviewTab } from "@/components/tabs/OverviewTab";
import { PlaylistTab } from "@/components/tabs/PlaylistTab";
import { SettingsTab } from "@/components/tabs/SettingsTab";
import { TokenManager } from "@/components/tabs/TokenManager";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DashboardErrorBoundary } from "@/components/ui/ErrorBoundary";
import { InboxModal } from "@/components/ui/InboxModal";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { useAdminConfig } from "@/hooks/useAdminConfig";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useLivePolling } from "@/hooks/useLivePolling";
import { useToast } from "@/hooks/useToast";
import {
  AdminTabId,
  ConfirmDialogState,
  InboxModalState,
  TokenObject,
} from "@/types/admin";

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] =
    useState<ConfirmDialogState | null>(null);
  const [inboxModal, setInboxModal] = useState<InboxModalState | null>(null);

  const { toasts, showToast, dismissToast } = useToast();
  const now = useCurrentTime(1000);
  const {
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
  } = useAdminConfig(showToast);

  const {
    chatMessages,
    setChatMessages,
    activeUsers,
    activeUsersCount,
    channelStats,
  } = useLivePolling(isAuthenticated, handleLogout);

  const handleSendChat = async (message: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          message,
          senderOverride: `Admin|ID|${config.adminBadgeIcon}|${config.adminBadgeColor}|ADMIN|${config.adminNameEffect}`,
        }),
      });
      if (res.status === 401) {
        void handleLogout();
        showToast("error", "Sesi admin berakhir. Silakan login ulang.");
        return false;
      }
      if (!res.ok) {
        showToast("error", "Gagal mengirim pesan chat.");
        return false;
      }
      showToast("success", "Pesan admin terkirim ke Live Chat!");
      return true;
    } catch {
      showToast("error", "Gagal mengirim pesan chat.");
      return false;
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (id === "all") {
      setConfirmDialog({
        isOpen: true,
        title: "Bersihkan Semua Chat?",
        message:
          "Semua riwayat obrolan pengguna dan admin di server akan dihapus secara permanen.",
        confirmText: "Hapus Semua",
        isDestructive: true,
        onConfirm: async () => {
          try {
            const res = await fetch("/api/chats?id=all", {
              method: "DELETE",
              credentials: "same-origin",
            });
            if (res.status === 401) {
              void handleLogout();
              showToast("error", "Sesi admin berakhir. Silakan login ulang.");
            } else if (res.ok) {
              setChatMessages([]);
              showToast("success", "Semua pesan chat berhasil dibersihkan.");
            } else {
              showToast("error", "Gagal menghapus pesan chat.");
            }
          } catch {
            showToast("error", "Gagal menghapus pesan chat.");
          }
          setConfirmDialog(null);
        },
      });
      return;
    }

    try {
      const res = await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (res.status === 401) {
        void handleLogout();
        showToast("error", "Sesi admin berakhir. Silakan login ulang.");
        return;
      }
      if (res.ok) {
        setChatMessages((prev) => prev.filter((m) => m.id !== id));
        showToast("info", "Pesan dihapus.");
      } else {
        showToast("error", "Gagal menghapus pesan chat.");
      }
    } catch {
      showToast("error", "Gagal menghapus pesan chat.");
    }
  };

  const handleKick = (token: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Tendang Perangkat?",
      message: `Perangkat dengan token "${token}" akan dipaksa keluar (exit) seketika dari tayangan TV.`,
      confirmText: "KICK SEKARANG",
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await fetch("/api/kick", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "same-origin",
            body: JSON.stringify({ token }),
          });
          if (res.status === 401) {
            void handleLogout();
            showToast("error", "Sesi admin berakhir. Silakan login ulang.");
          } else if (res.ok) {
            showToast("success", `Sinyal KICK terkirim ke token ${token}!`);
          } else {
            showToast("error", "Gagal mengirim sinyal KICK.");
          }
        } catch {
          showToast("error", "Gagal mengirim sinyal KICK.");
        }
        setConfirmDialog(null);
      },
    });
  };

  const handleSendInboxSubmit = async () => {
    if (!inboxModal || !inboxModal.message.trim()) return;
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          token: inboxModal.token,
          message: inboxModal.message,
        }),
      });
      if (res.status === 401) {
        void handleLogout();
        showToast("error", "Sesi admin berakhir. Silakan login ulang.");
        setInboxModal(null);
      } else if (res.ok) {
        showToast(
          "success",
          `Pesan popup berhasil dikirim ke TV (${inboxModal.token})!`
        );
        setInboxModal(null);
      } else {
        showToast("error", "Gagal mengirim pesan popup.");
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan.");
    }
  };

  const handleRemoveToken = (tokenToRemove: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Token Akses?",
      message: `Token "${tokenToRemove}" akan dihapus. Perangkat TV pengguna akan otomatis logout.`,
      confirmText: "Hapus Token",
      isDestructive: true,
      onConfirm: () => {
        setConfig((prev) => ({
          ...prev,
          tokens: prev.tokens.filter((t) => t.code !== tokenToRemove),
        }));
        showToast("info", `Token ${tokenToRemove} dihapus.`);
        setConfirmDialog(null);
      },
    });
  };

  const handleResetDevice = (tokenCode: string) => {
    setConfig((prev) => ({
      ...prev,
      tokens: prev.tokens.map((t) =>
        t.code === tokenCode
          ? { ...t, deviceId: "", deviceIds: [], _resetDevice: true }
          : t
      ),
    }));
    showToast(
      "success",
      `Ikatan perangkat TV untuk ${tokenCode} berhasil di-reset!`
    );
  };

  const handleUpgradeTrial = (tokenCode: string) => {
    setConfig((prev) => ({
      ...prev,
      tokens: prev.tokens.map((t) =>
        t.code === tokenCode
          ? {
              ...t,
              isTrial: false,
              label: "Lifetime",
              expiresAt: null,
              badgeIcon: "👑",
              badgeColor: "#FFD700",
            }
          : t
      ),
    }));
    showToast("success", `Token ${tokenCode} berhasil di-upgrade ke VIP Lifetime!`);
  };

  const handleClearExpiredTokens = (isTrialTab: boolean, count: number) => {
    const labelType = isTrialTab ? "Trial 1 Jam" : "Token VIP";
    setConfirmDialog({
      isOpen: true,
      title: `Hapus ${count} ${labelType} Expired?`,
      message: `Semua token ${labelType} yang sudah kedaluwarsa akan dihapus dari draf konfigurasi. Pastikan klik Simpan Perubahan setelahnya.`,
      confirmText: `Hapus ${count} Token`,
      isDestructive: true,
      onConfirm: () => {
        const checkTime = Date.now();
        setConfig((prev) => ({
          ...prev,
          tokens: prev.tokens.filter((t) => {
            const isTabMatch = isTrialTab ? Boolean(t.isTrial) : !t.isTrial;
            const isExpired = Boolean(t.expiresAt && t.expiresAt <= checkTime);
            return !(isTabMatch && isExpired);
          }),
        }));
        showToast(
          "info",
          `${count} token ${labelType} expired dihapus dari draf.`
        );
        setConfirmDialog(null);
      },
    });
  };

  const handleRequestDiscard = () => {
    if (!hasUnsavedChanges) return;
    setConfirmDialog({
      isOpen: true,
      title: "Batalkan Perubahan Belum Disimpan?",
      message:
        "Seluruh perubahan yang Anda lakukan sejak penyimpanan terakhir akan dikembalikan ke versi server saat ini.",
      confirmText: "Ya, Batalkan",
      isDestructive: true,
      onConfirm: () => {
        discardChanges();
        setConfirmDialog(null);
      },
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <LoginView
          appName={config.appName}
          adminPassword={adminPassword}
          onPasswordChange={setAdminPassword}
          onSubmit={handleLogin}
        />
      </>
    );
  }

  const navigationTabs: NavigationTab[] = [
    {
      id: "overview",
      label: "Dashboard",
      icon: Activity,
      badge: activeUsersCount ? `${activeUsersCount} online` : undefined,
    },
    { id: "analytics", label: "Analisis", icon: PieChart },
    {
      id: "playlist",
      label: "M3U & Channel",
      icon: Globe,
      count: config.customChannels.length,
    },
    {
      id: "tokens",
      label: "Token Akses",
      icon: Key,
      count: config.tokens.length,
    },
    {
      id: "chat",
      label: "Live Chat",
      icon: MessageSquare,
      badge: chatMessages.length > 0 ? chatMessages.length : undefined,
    },
    { id: "settings", label: "Pengaturan TV", icon: Sliders },
  ];

  const activeTabLabel =
    navigationTabs.find((t) => t.id === activeTab)?.label || activeTab;

  return (
    <div className="flex h-screen bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <ConfirmModal
        state={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      <InboxModal
        modal={inboxModal}
        onChangeMessage={(message) =>
          setInboxModal((prev) => (prev ? { ...prev, message } : null))
        }
        onClose={() => setInboxModal(null)}
        onSubmit={handleSendInboxSubmit}
      />

      <Sidebar
        appName={config.appName}
        navigationTabs={navigationTabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={() => {
          void handleLogout();
        }}
      />

      <MobileDrawer
        isOpen={isMobileMenuOpen}
        appName={config.appName}
        navigationTabs={navigationTabs}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onClose={() => setIsMobileMenuOpen(false)}
        onLogout={() => {
          void handleLogout();
        }}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <Header
          appName={config.appName}
          activeTabLabel={activeTabLabel}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          saving={saving}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onDiscardChanges={handleRequestDiscard}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <div
          className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${
            hasUnsavedChanges || saving ? "pb-36 lg:pb-12" : "pb-24 lg:pb-12"
          }`}
        >
          <DashboardErrorBoundary>
            <div className="max-w-7xl mx-auto space-y-6">
              {activeTab === "overview" && (
                <OverviewTab
                  isMaintenance={config.isMaintenance}
                  tokens={config.tokens}
                  activeUsers={activeUsers}
                  activeUsersCount={activeUsersCount}
                  latestVersionCode={config.latestVersionCode}
                  channelStats={channelStats}
                  now={now}
                  searchQuery={searchQuery}
                  onGoToSettings={() => setActiveTab("settings")}
                  onOpenInbox={(token) =>
                    setInboxModal({ isOpen: true, token, message: "" })
                  }
                  onKick={handleKick}
                />
              )}

              {activeTab === "analytics" && (
                <AnalyticsTab activeUsers={activeUsers} />
              )}

              {activeTab === "playlist" && (
                <PlaylistTab
                  config={config}
                  updateConfig={updateConfig}
                  showToast={showToast}
                  searchQuery={searchQuery}
                />
              )}

              {activeTab === "tokens" && (
                <TokenManager
                  appName={config.appName}
                  tokens={config.tokens}
                  now={now}
                  searchQuery={searchQuery}
                  onAddToken={(newToken: TokenObject) =>
                    setConfig((prev) => ({
                      ...prev,
                      tokens: [...prev.tokens, newToken],
                    }))
                  }
                  onUpdateToken={(tokenCode: string, updated: TokenObject) =>
                    setConfig((prev) => ({
                      ...prev,
                      tokens: prev.tokens.map((t) =>
                        t.code === tokenCode ? updated : t
                      ),
                    }))
                  }
                  onRemoveToken={handleRemoveToken}
                  onClearExpired={handleClearExpiredTokens}
                  onResetDevice={handleResetDevice}
                  onUpgradeTrial={handleUpgradeTrial}
                  onOpenInbox={(tokenCode: string) =>
                    setInboxModal({ isOpen: true, token: tokenCode, message: "" })
                  }
                  showToast={showToast}
                />
              )}

              {activeTab === "chat" && (
                <ChatTab
                  config={config}
                  updateConfig={updateConfig}
                  chatMessages={chatMessages}
                  onSendChat={handleSendChat}
                  onDeleteChat={handleDeleteChat}
                />
              )}

              {activeTab === "settings" && (
                <SettingsTab config={config} updateConfig={updateConfig} />
              )}
            </div>
          </DashboardErrorBoundary>
        </div>

        <MobileNav
          navigationTabs={navigationTabs}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          saving={saving}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onDiscardChanges={handleRequestDiscard}
        />
      </main>
    </div>
  );
}
