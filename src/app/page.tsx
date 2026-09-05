"use client";

import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import {
  Tv,
  ShieldAlert,
  Key,
  Save,
  Globe,
  RefreshCcw,
  Bell,
  AlertTriangle,
  Image as ImageIcon,
  MessageSquare,
  Trash2,
  Send,
  Activity,
  Users,
  PlaySquare,
  PieChart,
  Menu,
  X,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Search,
  Plus,
  Sparkles,
  RotateCcw,
  MessageCircle,
  LogOut,
  Radio,
  Clock,
  Eye,
  AlertCircle,
  Sliders,
  ChevronRight,
  UserCheck,
  Zap,
} from "lucide-react";

// ==========================================
// Types & Interfaces
// ==========================================

interface CustomChannel {
  id: string;
  name: string;
  type?: string;
  streamUrl: string;
  group?: string;
  logoUrl?: string;
  licenseKey?: string;
  licenseType?: string;
  userAgent?: string;
  referer?: string;
  tvgId?: string;
}

interface TokenObject {
  code: string;
  expiresAt: number | null;
  label: string;
  badgeIcon?: string;
  badgeColor?: string;
  nameEffect?: string;
  deviceId?: string;
  maxDevices?: number;
  deviceIds?: string[];
  isTrial?: boolean;
  _resetDevice?: boolean;
}

interface ActiveUser {
  token: string;
  channel: string;
  country?: string;
  deviceBrand?: string;
  deviceModel?: string;
  isTv?: boolean;
  lastSeen: number;
}

interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
}

// ==========================================
// Error Boundary
// ==========================================

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class DashboardErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Dashboard Error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 glass-card rounded-2xl border border-red-500/40 text-foreground my-6 space-y-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold">Terjadi Kesalahan Tampilan Data</h3>
          </div>
          <p className="text-sm text-slate-400">
            {this.state.error?.message || "Data dari Firebase sedang tidak sinkron. Klik tombol di bawah untuk memuat ulang."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-600/20"
          >
            Muat Ulang Tampilan
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// Helper Functions
// ==========================================

const safeDecode = (str: string) => {
  try {
    return decodeURIComponent(str);
  } catch {
    return String(str || "");
  }
};

const formatDateSafe = (timestamp: any) => {
  if (!timestamp) return "";
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return "";
  try {
    const d = new Date(num);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const isCustomEffect = (effect: any) => typeof effect === "string" && effect.startsWith("http");

// ==========================================
// Main Component
// ==========================================

export default function AdminPanel() {
  // Auth & Navigation States
  const [adminPassword, setAdminPassword] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [tokenSubTab, setTokenSubTab] = useState<"premium" | "trial">("premium");
  const [tokenFilter, setTokenFilter] = useState<"all" | "active" | "expired">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dialog & Toast States
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [inboxModal, setInboxModal] = useState<{ isOpen: boolean; token: string; message: string } | null>(null);

  // Config States
  const [m3uUrl, setM3uUrl] = useState("");
  const [m3uUrl2, setM3uUrl2] = useState("");
  const [m3uUrl3, setM3uUrl3] = useState("");
  const [m3uName, setM3uName] = useState("");
  const [m3uName2, setM3uName2] = useState("");
  const [m3uName3, setM3uName3] = useState("");
  const [epgUrl, setEpgUrl] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");

  const [customChannels, setCustomChannels] = useState<CustomChannel[]>([]);
  const [editingCustomChannel, setEditingCustomChannel] = useState<Partial<CustomChannel> | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  const [tokens, setTokens] = useState<TokenObject[]>([]);
  const [customTokenInput, setCustomTokenInput] = useState("");
  const [tokenDuration, setTokenDuration] = useState("lifetime");
  const [tokenBadgeIcon, setTokenBadgeIcon] = useState("");
  const [tokenBadgeColor, setTokenBadgeColor] = useState("#FFD700");
  const [tokenNameEffect, setTokenNameEffect] = useState("NONE");
  const [tokenMaxDevices, setTokenMaxDevices] = useState(1);
  const [editingTokenCode, setEditingTokenCode] = useState<string | null>(null);

  const [notificationText, setNotificationText] = useState("");
  const [notificationColor, setNotificationColor] = useState("#FFFFFF");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [welcomeBannerUrl, setWelcomeBannerUrl] = useState("");
  const [latestVersionCode, setLatestVersionCode] = useState(1);
  const [apkUpdateUrl, setApkUpdateUrl] = useState("");
  const [adminContactUrl, setAdminContactUrl] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);

  const [prerollAdUrl, setPrerollAdUrl] = useState("");
  const [prerollAdEnabled, setPrerollAdEnabled] = useState(false);
  const [appName, setAppName] = useState("KIMTV");

  const [chatEnabled, setChatEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<{ id: string; sender: string; message: string; timestamp: number }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [adminBadgeIcon, setAdminBadgeIcon] = useState("🔧");
  const [adminBadgeColor, setAdminBadgeColor] = useState("#FF00FF");
  const [adminNameEffect, setAdminNameEffect] = useState("NONE");

  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [channelStats, setChannelStats] = useState<{ name: string; count: number }[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // ==========================================
  // Toast Helper
  // ==========================================

  const showToast = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const copyToClipboard = (text: string, label = "Tersalin ke clipboard!") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast("success", label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isAuthenticated && !saving) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAuthenticated,
    saving,
    m3uUrl,
    m3uUrl2,
    m3uUrl3,
    m3uName,
    m3uName2,
    m3uName3,
    epgUrl,
    proxyUrl,
    customChannels,
    tokens,
    notificationText,
    notificationColor,
    notificationEnabled,
    backgroundUrl,
    welcomeBannerUrl,
    latestVersionCode,
    apkUpdateUrl,
    adminContactUrl,
    isMaintenance,
    chatEnabled,
    prerollAdUrl,
    prerollAdEnabled,
    adminBadgeIcon,
    adminBadgeColor,
    adminNameEffect,
    appName,
  ]);

  // ==========================================
  // Load Config
  // ==========================================

  const loadConfig = async (authPassword?: string) => {
    try {
      const headers: Record<string, string> = {};
      if (authPassword) {
        headers["x-admin-password"] = authPassword;
      }
      const res = await fetch("/api/config", { headers, cache: "no-store" });
      const data = await res.json();
      if (data && typeof data === "object") {
        setM3uUrl(typeof data.m3uUrl === "string" ? data.m3uUrl : "");
        setM3uUrl2(typeof data.m3uUrl2 === "string" ? data.m3uUrl2 : "");
        setM3uUrl3(typeof data.m3uUrl3 === "string" ? data.m3uUrl3 : "");
        setM3uName(typeof data.m3uName === "string" ? data.m3uName : "");
        setM3uName2(typeof data.m3uName2 === "string" ? data.m3uName2 : "");
        setM3uName3(typeof data.m3uName3 === "string" ? data.m3uName3 : "");
        setEpgUrl(typeof data.epgUrl === "string" ? data.epgUrl : "");
        setProxyUrl(typeof data.proxyUrl === "string" ? data.proxyUrl : "");

        let rawChannels: any[] = [];
        if (data.customChannels) {
          if (Array.isArray(data.customChannels)) {
            rawChannels = data.customChannels;
          } else if (typeof data.customChannels === "object") {
            rawChannels = Object.values(data.customChannels);
          }
        }
        const safeChannels: CustomChannel[] = rawChannels.map((c: any) => ({
          id: String(c.id || "cc_" + Math.random()),
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
        }));
        setCustomChannels(safeChannels);

        if (data.tokens) {
          let rawTokens: any[] = [];
          if (Array.isArray(data.tokens)) {
            rawTokens = data.tokens;
          } else if (typeof data.tokens === "object") {
            rawTokens = Object.entries(data.tokens).map(([key, val]: [string, any]) => {
              if (typeof val === "string") return { code: val || key, expiresAt: null, label: "Lifetime" };
              if (typeof val === "object" && val !== null) return { ...val, code: typeof val.code === "string" ? val.code : key };
              return { code: key, expiresAt: null, label: "Lifetime" };
            });
          }
          const mappedTokens: TokenObject[] = rawTokens.map((t: any) => {
            if (typeof t === "string") {
              return { code: t, expiresAt: null, label: "Lifetime" };
            }
            if (t && typeof t === "object") {
              return {
                ...t,
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
            return { code: String(t || ""), expiresAt: null, label: "Lifetime" };
          });
          setTokens(mappedTokens);
        }

        setNotificationText(typeof data.notificationText === "string" ? data.notificationText : String(data.notificationText || ""));
        setNotificationColor(typeof data.notificationColor === "string" ? data.notificationColor : "#FFFFFF");
        setNotificationEnabled(Boolean(data.notificationEnabled));
        setBackgroundUrl(typeof data.backgroundUrl === "string" ? data.backgroundUrl : "");
        setWelcomeBannerUrl(typeof data.welcomeBannerUrl === "string" ? data.welcomeBannerUrl : "");
        setLatestVersionCode(typeof data.latestVersionCode === "number" ? data.latestVersionCode : Number(data.latestVersionCode) || 1);
        setApkUpdateUrl(typeof data.apkUpdateUrl === "string" ? data.apkUpdateUrl : "");
        setAdminContactUrl(typeof data.adminContactUrl === "string" ? data.adminContactUrl : "");
        setIsMaintenance(Boolean(data.isMaintenance));
        setPrerollAdUrl(typeof data.prerollAdUrl === "string" ? data.prerollAdUrl : "");
        setPrerollAdEnabled(Boolean(data.prerollAdEnabled));
        setChatEnabled(data.chatEnabled !== false);
        setAdminBadgeIcon(typeof data.adminBadgeIcon === "string" ? data.adminBadgeIcon : "🔧");
        setAdminBadgeColor(typeof data.adminBadgeColor === "string" ? data.adminBadgeColor : "#FF00FF");
        setAdminNameEffect(typeof data.adminNameEffect === "string" ? data.adminNameEffect : "NONE");
        setAppName(typeof data.appName === "string" ? data.appName : String(data.appName || "KIMTV"));
      }
    } catch (e) {
      console.error("Config fetch error:", e);
      showToast("error", "Gagal memuat konfigurasi dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim() !== "") {
      try {
        const res = await fetch("/api/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: adminPassword }),
        });

        if (res.ok) {
          setIsAuthenticated(true);
          loadConfig(adminPassword);
          showToast("success", "Berhasil login ke Admin Console!");
        } else {
          const data = await res.json();
          showToast("error", data.error || "Password Admin Salah!");
        }
      } catch {
        showToast("error", "Terjadi kesalahan jaringan.");
      }
    }
  };

  // Real-time Polls
  useEffect(() => {
    if (isAuthenticated) {
      const fetchChats = () => {
        fetch("/api/chats")
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              const safeMessages = data.map((msg: any) => ({
                id: String(msg.id || Math.random()),
                sender: typeof msg.sender === "string" ? msg.sender : String(msg.sender || "User"),
                message:
                  typeof msg.message === "string"
                    ? msg.message
                    : typeof msg.message === "object" && msg.message !== null
                    ? msg.message.text || msg.message.msg || JSON.stringify(msg.message)
                    : String(msg.message || ""),
                timestamp: typeof msg.timestamp === "number" ? msg.timestamp : Number(msg.timestamp) || Date.now(),
              }));
              setChatMessages(safeMessages);
            }
          })
          .catch(() => {});
      };

      const fetchPresence = () => {
        fetch("/api/presence")
          .then((res) => res.json())
          .then((data) => {
            if (data && data.users && Array.isArray(data.users)) {
              const safeUsers: ActiveUser[] = data.users.map((u: any) => ({
                token: String(u.token || ""),
                channel:
                  typeof u.channel === "string"
                    ? u.channel
                    : typeof u.channel === "object" && u.channel !== null
                    ? u.channel.name || u.channel.title || JSON.stringify(u.channel)
                    : String(u.channel || "Lainnya"),
                country: typeof u.country === "string" ? u.country : String(u.country || "ID"),
                deviceBrand: typeof u.deviceBrand === "string" ? u.deviceBrand : String(u.deviceBrand || "Unknown"),
                deviceModel: typeof u.deviceModel === "string" ? u.deviceModel : String(u.deviceModel || "Unknown"),
                isTv: Boolean(u.isTv),
                lastSeen: typeof u.lastSeen === "number" ? u.lastSeen : Number(u.lastSeen) || Date.now(),
              }));
              setActiveUsers(safeUsers);
              setActiveUsersCount(typeof data.count === "number" ? data.count : safeUsers.length);
            }
          })
          .catch(() => {});
      };

      const fetchStats = () => {
        fetch("/api/stats")
          .then((res) => res.json())
          .then((data) => {
            if (data && !data.error && typeof data === "object") {
              const statsArray = Object.keys(data).map((key) => {
                const val = data[key];
                let count = 0;
                if (typeof val === "number") {
                  count = val;
                } else if (typeof val === "string") {
                  count = Number(val) || 0;
                } else if (typeof val === "object" && val !== null) {
                  count = Number(val.count || val.views || val.total || 0) || 0;
                }
                return {
                  name: typeof key === "string" ? safeDecode(key) : String(key || ""),
                  count,
                };
              });
              statsArray.sort((a, b) => b.count - a.count);
              setChannelStats(statsArray.slice(0, 5));
            }
          })
          .catch(() => {});
      };

      fetchChats();
      fetchPresence();
      fetchStats();
      const chatInterval = setInterval(fetchChats, 3000);
      const presenceInterval = setInterval(fetchPresence, 8000);
      const statsInterval = setInterval(fetchStats, 60000);
      return () => {
        clearInterval(chatInterval);
        clearInterval(presenceInterval);
        clearInterval(statsInterval);
      };
    }
  }, [isAuthenticated]);

  // ==========================================
  // Handlers
  // ==========================================

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({
          message: chatInput.trim(),
          senderOverride: `Admin|ID|${adminBadgeIcon}|${adminBadgeColor}|ADMIN|${adminNameEffect}`,
        }),
      });
      setChatInput("");
      showToast("success", "Pesan admin terkirim ke Live Chat!");
    } catch {
      showToast("error", "Gagal mengirim pesan chat.");
    }
  };

  const handleDeleteChat = async (id: string) => {
    if (id === "all") {
      setConfirmDialog({
        isOpen: true,
        title: "Bersihkan Semua Chat?",
        message: "Semua riwayat obrolan pengguna dan admin di server akan dihapus secara permanen.",
        confirmText: "Hapus Semua",
        isDestructive: true,
        onConfirm: async () => {
          try {
            await fetch(`/api/chats?id=all`, {
              method: "DELETE",
              headers: { "x-admin-password": adminPassword },
            });
            setChatMessages([]);
            showToast("success", "Semua pesan chat berhasil dibersihkan.");
          } catch {
            showToast("error", "Gagal menghapus pesan chat.");
          }
          setConfirmDialog(null);
        },
      });
      return;
    }

    try {
      await fetch(`/api/chats?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword },
      });
      setChatMessages((prev) => prev.filter((m) => m.id !== id));
      showToast("info", "Pesan dihapus.");
    } catch {}
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
          await fetch("/api/kick", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
            body: JSON.stringify({ token }),
          });
          showToast("success", `Sinyal KICK terkirim ke token ${token}!`);
        } catch {
          showToast("error", "Gagal mengirim sinyal KICK.");
        }
        setConfirmDialog(null);
      },
    });
  };

  const getExpirationParams = (duration: string) => {
    const now = Date.now();
    switch (duration) {
      case "1h":
        return { expiresAt: now + 3600000, label: "1 Jam" };
      case "1d":
        return { expiresAt: now + 86400000, label: "1 Hari" };
      case "1w":
        return { expiresAt: now + 604800000, label: "1 Minggu" };
      case "1m":
        return { expiresAt: now + 2592000000, label: "1 Bulan" };
      default:
        return { expiresAt: null, label: "Lifetime" };
    }
  };

  const generateRandomToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "KIM-";
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!tokens.some((t) => t.code === token)) {
      setTokens([
        ...tokens,
        {
          code: token,
          badgeIcon: tokenBadgeIcon,
          badgeColor: tokenBadgeColor,
          nameEffect: tokenNameEffect,
          maxDevices: tokenMaxDevices,
          deviceIds: [],
          ...getExpirationParams(tokenDuration),
        },
      ]);
      showToast("success", `Token acak ${token} berhasil dibuat! Tekan 'Simpan' untuk menerapkan.`);
    }
  };

  const addCustomToken = () => {
    const cleanToken = customTokenInput.trim().toUpperCase();
    if (!cleanToken) {
      showToast("error", "Kode token tidak boleh kosong!");
      return;
    }

    if (editingTokenCode) {
      setTokens(
        tokens.map((t) =>
          t.code === editingTokenCode
            ? {
                ...t,
                code: cleanToken,
                badgeIcon: tokenBadgeIcon,
                badgeColor: tokenBadgeColor,
                nameEffect: tokenNameEffect,
                maxDevices: tokenMaxDevices,
              }
            : t
        )
      );
      setEditingTokenCode(null);
      setCustomTokenInput("");
      showToast("success", `Token ${cleanToken} berhasil diperbarui!`);
    } else {
      if (tokens.some((t) => t.code === cleanToken)) {
        showToast("error", `Token ${cleanToken} sudah terdaftar!`);
        return;
      }
      setTokens([
        ...tokens,
        {
          code: cleanToken,
          badgeIcon: tokenBadgeIcon,
          badgeColor: tokenBadgeColor,
          nameEffect: tokenNameEffect,
          deviceId: "",
          maxDevices: tokenMaxDevices,
          deviceIds: [],
          ...getExpirationParams(tokenDuration),
        },
      ]);
      setCustomTokenInput("");
      showToast("success", `Token ${cleanToken} berhasil ditambahkan!`);
    }
  };

  const startEditToken = (token: TokenObject) => {
    setEditingTokenCode(token.code);
    setCustomTokenInput(token.code);
    setTokenBadgeIcon(token.badgeIcon || "");
    setTokenBadgeColor(token.badgeColor || "#FFD700");
    setTokenNameEffect(token.nameEffect || "NONE");
    setTokenMaxDevices(token.maxDevices || 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("info", `Mengedit token ${token.code}. Ubah dan klik 'Simpan Perubahan'.`);
  };

  const upgradeTrialToPremium = (tokenCode: string) => {
    setTokens(
      tokens.map((t) => {
        if (t.code === tokenCode) {
          return {
            ...t,
            isTrial: false,
            label: "Lifetime",
            expiresAt: null,
            badgeIcon: "👑",
            badgeColor: "#FFD700",
          };
        }
        return t;
      })
    );
    showToast("success", `Token ${tokenCode} berhasil di-upgrade ke VIP Lifetime!`);
  };

  const removeToken = (tokenToRemove: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Token Akses?",
      message: `Token "${tokenToRemove}" akan dihapus. Perangkat TV pengguna akan otomatis logout.`,
      confirmText: "Hapus Token",
      isDestructive: true,
      onConfirm: () => {
        setTokens(tokens.filter((t) => t.code !== tokenToRemove));
        showToast("info", `Token ${tokenToRemove} dihapus.`);
        setConfirmDialog(null);
      },
    });
  };

  const resetTokenDevice = (tokenCode: string) => {
    setTokens(
      tokens.map((t) =>
        t.code === tokenCode ? { ...t, deviceId: "", deviceIds: [], _resetDevice: true } : t
      )
    );
    showToast("success", `Ikatan perangkat TV untuk ${tokenCode} berhasil di-reset!`);
  };

  const handleSendInboxSubmit = async () => {
    if (!inboxModal || !inboxModal.message.trim()) return;
    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ token: inboxModal.token, message: inboxModal.message }),
      });
      if (res.ok) {
        showToast("success", `Pesan popup berhasil dikirim ke TV (${inboxModal.token})!`);
        setInboxModal(null);
      } else {
        showToast("error", "Gagal mengirim pesan popup.");
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          m3uUrl,
          m3uUrl2,
          m3uUrl3,
          m3uName,
          m3uName2,
          m3uName3,
          epgUrl,
          proxyUrl,
          customChannels,
          tokens,
          notificationText,
          notificationColor,
          notificationEnabled,
          backgroundUrl,
          welcomeBannerUrl,
          latestVersionCode,
          apkUpdateUrl,
          adminContactUrl,
          isMaintenance,
          chatEnabled,
          prerollAdUrl,
          prerollAdEnabled,
          adminBadgeIcon,
          adminBadgeColor,
          adminNameEffect,
          appName,
        }),
      });

      if (res.ok) {
        showToast("success", "Semua pengaturan berhasil tersimpan ke Firebase!");
      } else {
        const err = await res.json();
        showToast("error", "Gagal menyimpan: " + (err.error || "Password Admin Salah!"));
        if (res.status === 401) setIsAuthenticated(false);
      }
    } catch {
      showToast("error", "Terjadi kesalahan jaringan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // Loading & Login Views
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-100 gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
          <Tv className="w-6 h-6 text-indigo-400 absolute" />
        </div>
        <p className="text-sm text-slate-400 font-medium animate-pulse">Menghubungkan ke KIMTV Hub...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow ambient spots */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-xl shadow-indigo-500/25 mb-4">
              <div className="w-full h-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
                <Tv className="w-8 h-8 text-indigo-400" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">{appName} Console</h1>
            <p className="text-slate-400 text-xs mt-1.5 max-w-xs">
              Pusat kendali live streaming, token akses, moderasi chat, dan konfigurasi TV.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">
                Password Administrator
              </label>
              <div className="relative">
                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#0c1322] border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-4 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
            >
              <Key className="w-4 h-4" /> Masuk ke Panel
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
            <span>Versi Console 2.0</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Firebase Realtime
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Filtered tokens
  const filteredTokens = tokens.filter((t) => {
    const isTabMatch = tokenSubTab === "premium" ? !t.isTrial : t.isTrial;
    if (!isTabMatch) return false;

    const isExpired = t.expiresAt && t.expiresAt <= Date.now();
    if (tokenFilter === "active" && isExpired) return false;
    if (tokenFilter === "expired" && !isExpired) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = t.code.toLowerCase().includes(q);
      const devMatch = (t.deviceId && t.deviceId.toLowerCase().includes(q)) || (t.deviceIds && t.deviceIds.some(d => d.toLowerCase().includes(q)));
      return codeMatch || devMatch;
    }
    return true;
  });

  const navigationTabs = [
    { id: "overview", label: "Dashboard", icon: Activity, badge: activeUsersCount ? `${activeUsersCount} online` : undefined },
    { id: "analytics", label: "Analisis", icon: PieChart },
    { id: "playlist", label: "M3U & Channel", icon: Globe, count: customChannels.length },
    { id: "tokens", label: "Token Akses", icon: Key, count: tokens.length },
    { id: "chat", label: "Live Chat", icon: MessageSquare, badge: chatMessages.length > 0 ? chatMessages.length : undefined },
    { id: "settings", label: "Pengaturan TV", icon: Sliders },
  ];

  return (
    <div className="flex h-screen bg-[#080c14] text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl shadow-xl border text-sm backdrop-blur-xl animate-toast transition-all ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
                : toast.type === "error"
                ? "bg-red-950/90 border-red-500/30 text-red-200"
                : "bg-indigo-950/90 border-indigo-500/30 text-indigo-200"
            }`}
          >
            {toast.type === "success" && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
            {toast.type === "info" && <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />}
            <span className="flex-1 text-xs sm:text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl ${
                  confirmDialog.isDestructive ? "bg-red-500/10 text-red-400" : "bg-indigo-500/10 text-indigo-400"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{confirmDialog.title}</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{confirmDialog.message}</p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
                  confirmDialog.isDestructive
                    ? "bg-red-600 hover:bg-red-500 shadow-red-600/25"
                    : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
                }`}
              >
                {confirmDialog.confirmText || "Konfirmasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inbox Prompt Modal */}
      {inboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Kirim Pesan Layar TV</h3>
                <p className="text-xs text-slate-400 font-mono">Token: {inboxModal.token}</p>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Pesan ini akan muncul sebagai dialog peringatan besar di tengah layar TV pengguna.
            </p>
            <textarea
              rows={3}
              placeholder="Contoh: Masa aktif langganan Anda tersisa 3 hari. Segera perpanjang ke admin..."
              value={inboxModal.message}
              onChange={(e) => setInboxModal({ ...inboxModal, message: e.target.value })}
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-2xl p-3.5 focus:outline-none focus:border-indigo-500 text-sm"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setInboxModal(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
              >
                Batal
              </button>
              <button
                onClick={handleSendInboxSubmit}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
              >
                Kirim ke TV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          Desktop Sidebar
      ========================================== */}
      <aside className="w-64 bg-[#080c14] border-r border-white/5 flex flex-col hidden lg:flex select-none">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20">
              <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
                <Tv className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white">{appName}</h1>
              <p className="text-[11px] text-slate-400 font-medium">Management Hub</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Menu Utama
          </div>
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold group ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {tab.badge}
                  </span>
                )}
                {typeof tab.count === "number" && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-white/5 text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-300 border border-white/10 group-hover:bg-red-500/20 group-hover:text-red-300">
                AD
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white group-hover:text-red-300 truncate">Administrator</div>
                <div className="text-[10px] text-slate-400 group-hover:text-red-400/80">Keluar Sesi</div>
              </div>
            </div>
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </aside>

      {/* ==========================================
          Mobile Slide-over Drawer
      ========================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#090d16] border-r border-white/10 h-full flex flex-col p-4 shadow-2xl z-10 animate-toast">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Tv className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{appName}</h2>
                  <p className="text-[10px] text-slate-400">Mobile Admin</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive ? "bg-indigo-600 text-white font-bold" : "text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => {
                setIsAuthenticated(false);
                setIsMobileMenuOpen(false);
              }}
              className="mt-auto flex items-center gap-3 p-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Logout Sesi
            </button>
          </div>
        </div>
      )}

      {/* ==========================================
          Main Content Workspace
      ========================================== */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top App Header */}
        <header className="h-16 bg-[#080c14]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-white capitalize">{activeTab}</span>
              <span className="text-slate-600">/</span>
              <span className="hidden sm:inline text-slate-400">Console Hub</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Search */}
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari token / user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 lg:w-56 bg-[#0d1424] border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:w-64 transition-all"
              />
            </div>

            {/* Save Config Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50 transition-all"
              title="Shortcut: Ctrl+S"
            >
              {saving ? <RefreshCcw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
              <kbd className="hidden xl:inline px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">⌘S</kbd>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-28 md:pb-12">
          <DashboardErrorBoundary>
            <div className="max-w-7xl mx-auto space-y-6">

              {/* ==========================================
                  TAB 1: OVERVIEW (DASHBOARD)
              ========================================== */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-toast">
                  {/* Maintenance Banner Warning */}
                  {isMaintenance && (
                    <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-center justify-between gap-4 shadow-lg shadow-red-950/30">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
                        <div>
                          <h4 className="text-sm font-bold">MODE MAINTENANCE SEDANG AKTIF</h4>
                          <p className="text-xs text-red-300/80">Semua aplikasi TV pengguna saat ini diblokir dengan pesan perbaikan.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab("settings")}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-400 shrink-0"
                      >
                        Ubah di Settings
                      </button>
                    </div>
                  )}

                  {/* 4 KPI Metrics Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* KPI 1 */}
                    <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Token Aktif</span>
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                          <Key className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {tokens.filter((t) => !t.expiresAt || t.expiresAt > Date.now()).length}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dari total <span className="text-slate-200 font-semibold">{tokens.length}</span> token terdaftar
                      </p>
                    </div>

                    {/* KPI 2 */}
                    <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Slot Terpakai</span>
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                          <Tv className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {tokens.reduce((sum, t) => sum + (Array.isArray(t.deviceIds) ? t.deviceIds.length : t.deviceId ? 1 : 0), 0)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Dari <span className="text-slate-200 font-semibold">{tokens.reduce((sum, t) => sum + (Number(t.maxDevices) || 1), 0)}</span> max slot TV
                      </p>
                    </div>

                    {/* KPI 3 */}
                    <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sedang Streaming</span>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
                        {activeUsersCount}
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Pengguna aktif terhubung</p>
                    </div>

                    {/* KPI 4 */}
                    <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Versi TV</span>
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
                        v{latestVersionCode}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Auto-Update TV aktif</p>
                    </div>
                  </div>

                  {/* 2-Pane: Top Channels & Active Streamers */}
                  <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                    {/* Top Channels (col-span-4) */}
                    <div className="lg:col-span-4 glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <Radio className="w-5 h-5 text-indigo-400" />
                          <h3 className="text-sm font-bold text-white">Channel Paling Banyak Ditonton</h3>
                        </div>
                        <span className="text-xs text-slate-400">Real-time stats</span>
                      </div>

                      {channelStats.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 text-xs">
                          Belum ada statistik channel terkumpul.
                        </div>
                      ) : (
                        <div className="space-y-3 pt-1">
                          {channelStats.map((stat, i) => {
                            const maxCount = channelStats[0]?.count || 1;
                            const percent = Math.round((stat.count / maxCount) * 100);
                            const medals = ["🥇", "🥈", "🥉"];
                            return (
                              <div key={stat.name || i} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 font-bold text-white">
                                    <span>{medals[i] || `#${i + 1}`}</span>
                                    <span className="truncate max-w-[200px] sm:max-w-[280px]">{stat.name}</span>
                                  </div>
                                  <span className="font-mono text-indigo-300 font-bold">{stat.count} views</span>
                                </div>
                                <div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Active Streamers (col-span-3) */}
                    <div className="lg:col-span-3 glass-panel p-5 sm:p-6 rounded-3xl space-y-4 flex flex-col">
                      <div className="flex items-center justify-between pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <Users className="w-5 h-5 text-emerald-400" />
                          <h3 className="text-sm font-bold text-white">Penonton Streaming Saat Ini</h3>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                          {activeUsersCount} Online
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[320px] space-y-2 pr-1">
                        {activeUsers.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs">
                            Tidak ada penonton aktif saat ini.
                          </div>
                        ) : (
                          activeUsers.map((user, idx) => {
                            const elapsedSec = now ? Math.floor((now - (Number(user.lastSeen) || 0)) / 1000) : 0;
                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 border border-white/5">
                                    {user.isTv ? <Monitor className="w-4 h-4 text-blue-400" /> : <Smartphone className="w-4 h-4 text-emerald-400" />}
                                  </div>
                                  <div className="overflow-hidden">
                                    <div className="font-mono font-bold text-amber-300 truncate">{user.token}</div>
                                    <div className="text-[11px] text-slate-400 truncate">{user.channel}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-slate-500">{elapsedSec}s lalu</span>
                                  <button
                                    onClick={() => handleKick(user.token)}
                                    className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] transition-colors"
                                  >
                                    KICK
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 2: ANALYTICS
              ========================================== */}
              {activeTab === "analytics" && (
                <div className="space-y-6 animate-toast">
                  {/* Device Distribution Split Bar */}
                  <div className="glass-panel p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                      <PieChart className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-sm font-bold text-white">Distribusi Perangkat Penonton</h3>
                    </div>

                    {(() => {
                      const tvCount = activeUsers.filter((u) => u.isTv).length;
                      const mobileCount = activeUsers.length - tvCount;
                      const tvPercent = activeUsers.length > 0 ? Math.round((tvCount / activeUsers.length) * 100) : 50;
                      return (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="flex items-center gap-2 text-blue-400">
                              <Monitor className="w-4 h-4" /> Smart TV / STB: {tvCount} ({tvPercent}%)
                            </span>
                            <span className="flex items-center gap-2 text-emerald-400">
                              <Smartphone className="w-4 h-4" /> Smartphone / HP: {mobileCount} ({100 - tvPercent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-800/80 rounded-full h-4 overflow-hidden flex shadow-inner">
                            <div
                              className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
                              style={{ width: `${tvPercent}%` }}
                            />
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
                              style={{ width: `${100 - tvPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Brand and Model Rank Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/5">
                        Peringkat Merek Perangkat (Top Brands)
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const brands: Record<string, number> = {};
                          activeUsers.forEach((u) => {
                            const b = u.deviceBrand || "Unknown";
                            brands[b] = (brands[b] || 0) + 1;
                          });
                          const list = Object.entries(brands).sort((a, b) => b[1] - a[1]).slice(0, 5);
                          if (list.length === 0) {
                            return <p className="text-xs text-slate-500 py-4 text-center">Belum ada data perangkat.</p>;
                          }
                          return list.map(([brand, count], idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                              <span className="font-semibold text-white capitalize">{brand}</span>
                              <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                                {count} Perangkat
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>

                    <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/5">
                        Peringkat Tipe Model (Top Models)
                      </h4>
                      <div className="space-y-2">
                        {(() => {
                          const models: Record<string, number> = {};
                          activeUsers.forEach((u) => {
                            const m = u.deviceModel || "Unknown";
                            models[m] = (models[m] || 0) + 1;
                          });
                          const list = Object.entries(models).sort((a, b) => b[1] - a[1]).slice(0, 5);
                          if (list.length === 0) {
                            return <p className="text-xs text-slate-500 py-4 text-center">Belum ada data model.</p>;
                          }
                          return list.map(([model, count], idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs">
                              <span className="font-semibold text-white uppercase">{model}</span>
                              <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                                {count} User
                              </span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 3: PLAYLIST M3U & CUSTOM CHANNELS
              ========================================== */}
              {activeTab === "playlist" && (
                <div className="space-y-6 animate-toast">
                  {/* Multi-Server Playlist Card */}
                  <div className="glass-panel p-6 rounded-3xl space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-5 h-5 text-indigo-400" />
                        <div>
                          <h3 className="text-base font-bold text-white">Multi-Server Playlist M3U</h3>
                          <p className="text-xs text-slate-400">Konfigurasi sumber siaran otomatis dengan failover 3 tingkat.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Server 1 */}
                      <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Server 1 (Utama)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">Priority 1</span>
                        </div>
                        <input
                          type="text"
                          value={m3uName}
                          onChange={(e) => setM3uName(e.target.value)}
                          placeholder="Label (Contoh: VIP Server)"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="url"
                          value={m3uUrl}
                          onChange={(e) => setM3uUrl(e.target.value)}
                          placeholder="https://server1.com/list.m3u"
                          className="w-full bg-[#0c1322] border border-indigo-500/30 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Server 2 */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Server 2 (Cadangan 1)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-bold">Fallback 1</span>
                        </div>
                        <input
                          type="text"
                          value={m3uName2}
                          onChange={(e) => setM3uName2(e.target.value)}
                          placeholder="Label (Contoh: Server Cadangan)"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="url"
                          value={m3uUrl2}
                          onChange={(e) => setM3uUrl2(e.target.value)}
                          placeholder="https://server2.com/list.m3u"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Server 3 */}
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Server 3 (Cadangan 2)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-bold">Fallback 2</span>
                        </div>
                        <input
                          type="text"
                          value={m3uName3}
                          onChange={(e) => setM3uName3(e.target.value)}
                          placeholder="Label (Contoh: Emergency Server)"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <input
                          type="url"
                          value={m3uUrl3}
                          onChange={(e) => setM3uUrl3(e.target.value)}
                          placeholder="https://server3.com/list.m3u"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/5">
                      {/* EPG URL */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-emerald-400 block uppercase tracking-wider">
                          Global EPG URL (Jadwal Siaran XMLTV)
                        </label>
                        <input
                          type="url"
                          value={epgUrl}
                          onChange={(e) => setEpgUrl(e.target.value)}
                          placeholder="https://example.com/epg.xml"
                          className="w-full bg-[#0c1322] border border-emerald-500/30 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                        />
                        <p className="text-[11px] text-slate-400">Jadwal tayangan TV akan otomatis disinkronkan ke semua perangkat.</p>
                      </div>

                      {/* Stream Proxy URL */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-cyan-400 block uppercase tracking-wider">
                          Global Stream Proxy (Cloudflare Worker)
                        </label>
                        <input
                          type="url"
                          value={proxyUrl}
                          onChange={(e) => setProxyUrl(e.target.value)}
                          placeholder="https://proxy.namakamu.workers.dev/"
                          className="w-full bg-[#0c1322] border border-cyan-500/30 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <p className="text-[11px] text-slate-400">Bypass proteksi CORS / Referer untuk stream terproteksi.</p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Channels Section */}
                  <div className="glass-panel p-6 rounded-3xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <Tv className="w-5 h-5 text-amber-400" />
                        <div>
                          <h3 className="text-base font-bold text-white">Custom Channels (Manual)</h3>
                          <p className="text-xs text-slate-400">Tambahkan channel independen tanpa perlu mengedit M3U server.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingCustomChannel({ type: "direct" });
                          setIsChannelModalOpen(true);
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                      >
                        <Plus className="w-4 h-4" /> Tambah Channel Baru
                      </button>
                    </div>

                    {/* Channel Cards Grid */}
                    {customChannels.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        Belum ada channel custom manual yang ditambahkan.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {customChannels.map((c) => (
                          <div
                            key={c.id}
                            className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3 group"
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white text-sm truncate">{c.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  c.type === "embed" ? "bg-purple-500/20 text-purple-300" : "bg-emerald-500/20 text-emerald-300"
                                }`}>
                                  {c.type || "direct"}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono truncate">{c.streamUrl}</p>
                              {c.group && (
                                <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                                  {c.group}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                              <button
                                onClick={() => {
                                  setEditingCustomChannel(c);
                                  setIsChannelModalOpen(true);
                                }}
                                className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setCustomChannels(customChannels.filter((x) => x.id !== c.id))}
                                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold"
                              >
                                Hapus
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Channel Edit / Add Modal */}
                  {isChannelModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast">
                      <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                          <h3 className="text-base font-bold text-white">
                            {editingCustomChannel?.id ? "Edit Custom Channel" : "Tambah Custom Channel"}
                          </h3>
                          <button
                            onClick={() => setIsChannelModalOpen(false)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-300 mb-1 font-semibold">Nama Channel *</label>
                            <input
                              type="text"
                              required
                              placeholder="Contoh: RCTI HD"
                              value={editingCustomChannel?.name || ""}
                              onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, name: e.target.value })}
                              className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-300 mb-1 font-semibold">Tipe Siaran</label>
                            <select
                              value={editingCustomChannel?.type || "direct"}
                              onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, type: e.target.value })}
                              className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="direct">Direct Stream (m3u8 / mp4 / mpd)</option>
                              <option value="embed">Embed Webpage / Iframe HTML</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-300 mb-1 font-semibold">Stream URL atau Kode Embed *</label>
                            {editingCustomChannel?.type === "embed" ? (
                              <textarea
                                rows={3}
                                placeholder="<iframe>...</iframe>"
                                value={editingCustomChannel?.streamUrl || ""}
                                onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, streamUrl: e.target.value })}
                                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            ) : (
                              <input
                                type="url"
                                placeholder="https://example.com/stream.m3u8"
                                value={editingCustomChannel?.streamUrl || ""}
                                onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, streamUrl: e.target.value })}
                                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-slate-300 mb-1 font-semibold">Kategori Grup</label>
                              <input
                                type="text"
                                placeholder="Contoh: Nasional"
                                value={editingCustomChannel?.group || ""}
                                onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, group: e.target.value })}
                                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                            <div>
                              <label className="block text-slate-300 mb-1 font-semibold">Logo URL</label>
                              <input
                                type="url"
                                placeholder="https://.../logo.png"
                                value={editingCustomChannel?.logoUrl || ""}
                                onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, logoUrl: e.target.value })}
                                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          {editingCustomChannel?.type !== "embed" && (
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-slate-300 mb-1 font-semibold">License Key (DRM)</label>
                                <input
                                  type="text"
                                  placeholder="key_id:key"
                                  value={editingCustomChannel?.licenseKey || ""}
                                  onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, licenseKey: e.target.value })}
                                  className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-300 mb-1 font-semibold">User-Agent Kustom</label>
                                <input
                                  type="text"
                                  placeholder="KIMTV/1.0"
                                  value={editingCustomChannel?.userAgent || ""}
                                  onChange={(e) => setEditingCustomChannel({ ...editingCustomChannel, userAgent: e.target.value })}
                                  className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                          <button
                            onClick={() => setIsChannelModalOpen(false)}
                            className="px-4 py-2 text-slate-300 text-xs font-semibold rounded-xl hover:bg-white/5"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => {
                              if (!editingCustomChannel?.name || !editingCustomChannel?.streamUrl) {
                                showToast("error", "Nama dan Stream URL wajib diisi!");
                                return;
                              }
                              const isNew = !editingCustomChannel.id;
                              const id = isNew ? "cc_" + Date.now() : editingCustomChannel.id;
                              const newChannel = { ...editingCustomChannel, id } as CustomChannel;
                              if (isNew) {
                                setCustomChannels([...customChannels, newChannel]);
                                showToast("success", `Channel ${newChannel.name} ditambahkan!`);
                              } else {
                                setCustomChannels(customChannels.map((c) => (c.id === id ? newChannel : c)));
                                showToast("success", `Channel ${newChannel.name} diperbarui!`);
                              }
                              setIsChannelModalOpen(false);
                            }}
                            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20"
                          >
                            Simpan Channel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ==========================================
                  TAB 4: TOKEN & USER MANAGEMENT
              ========================================== */}
              {activeTab === "tokens" && (
                <div className="space-y-6 animate-toast">
                  {/* Token Generator Card */}
                  <div className="glass-panel p-6 rounded-3xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <Key className="w-5 h-5 text-amber-400" />
                        <div>
                          <h3 className="text-base font-bold text-white">Generator Token Akses</h3>
                          <p className="text-xs text-slate-400">Buat token langganan baru atau atur batasan perangkat TV.</p>
                        </div>
                      </div>
                      <button
                        onClick={generateRandomToken}
                        className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" /> Generate Acak
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      {/* Code Input */}
                      <div className="lg:col-span-2 space-y-1">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                          {editingTokenCode ? `Kode Token (Mengedit: ${editingTokenCode})` : "Kode Token Custom"}
                        </label>
                        <input
                          type="text"
                          value={customTokenInput}
                          onChange={(e) => setCustomTokenInput(e.target.value.toUpperCase())}
                          placeholder="VIP-BUDI"
                          className="w-full bg-[#0c1322] border border-white/10 text-white font-mono font-bold rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Duration */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                          Masa Berlaku
                        </label>
                        <select
                          value={tokenDuration}
                          onChange={(e) => setTokenDuration(e.target.value)}
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                        >
                          <option value="lifetime">VIP Lifetime</option>
                          <option value="1h">1 Jam (Uji Coba)</option>
                          <option value="1d">1 Hari</option>
                          <option value="1w">1 Minggu</option>
                          <option value="1m">1 Bulan</option>
                        </select>
                      </div>

                      {/* Max Devices */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
                          Max Slot TV
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={tokenMaxDevices}
                          onChange={(e) => setTokenMaxDevices(parseInt(e.target.value) || 1)}
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      {/* Add/Save Action */}
                      <div className="flex items-end gap-2">
                        <button
                          onClick={addCustomToken}
                          className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                        >
                          {editingTokenCode ? "Simpan Edit" : "Tambah Token"}
                        </button>
                        {editingTokenCode && (
                          <button
                            onClick={() => {
                              setEditingTokenCode(null);
                              setCustomTokenInput("");
                            }}
                            className="px-3 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-semibold"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Token List Panel */}
                  <div className="glass-panel p-6 rounded-3xl space-y-4">
                    {/* Sub-tabs & Filter Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.03] border border-white/5">
                        <button
                          onClick={() => setTokenSubTab("premium")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            tokenSubTab === "premium" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Premium ({tokens.filter((t) => !t.isTrial).length})
                        </button>
                        <button
                          onClick={() => setTokenSubTab("trial")}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            tokenSubTab === "trial" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Trial Users ({tokens.filter((t) => t.isTrial).length})
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTokenFilter("all")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            tokenFilter === "all" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Semua
                        </button>
                        <button
                          onClick={() => setTokenFilter("active")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            tokenFilter === "active" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Aktif
                        </button>
                        <button
                          onClick={() => setTokenFilter("expired")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            tokenFilter === "expired" ? "bg-red-500/20 text-red-300" : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          Expired
                        </button>
                      </div>
                    </div>

                    {/* Token Rows */}
                    {filteredTokens.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs">
                        Tidak ada token yang sesuai dengan filter.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredTokens.map((tokenObj, idx) => {
                          const isExpired = tokenObj.expiresAt && tokenObj.expiresAt <= Date.now();
                          const maxDev = Number(tokenObj.maxDevices) || 1;
                          const devCount = Array.isArray(tokenObj.deviceIds)
                            ? tokenObj.deviceIds.length
                            : tokenObj.deviceId
                            ? 1
                            : 0;

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                isExpired
                                  ? "bg-red-950/10 border-red-500/20 opacity-70"
                                  : "bg-white/[0.02] border-white/5 hover:border-indigo-500/30"
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-base font-black text-amber-300">{tokenObj.code}</span>
                                  <button
                                    onClick={() => copyToClipboard(tokenObj.code, `Token ${tokenObj.code} tersalin!`)}
                                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                    title="Salin Token"
                                  >
                                    {copiedKey === tokenObj.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                  {isExpired ? (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold">
                                      EXPIRED
                                    </span>
                                  ) : (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                                      {tokenObj.label || "Lifetime"}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                  {tokenObj.expiresAt && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-slate-500" />
                                      Exp: {formatDateSafe(tokenObj.expiresAt)}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1 text-slate-300">
                                    <Monitor className="w-3 h-3 text-indigo-400" />
                                    Slot: <b className="text-white">{devCount}/{maxDev}</b> TV Terhubung
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {tokenObj.isTrial && (
                                  <button
                                    onClick={() => upgradeTrialToPremium(tokenObj.code)}
                                    className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold transition-colors"
                                  >
                                    Upgrade VIP
                                  </button>
                                )}
                                {devCount > 0 && (
                                  <button
                                    onClick={() => resetTokenDevice(tokenObj.code)}
                                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-colors"
                                    title="Reset kaitan TV lama"
                                  >
                                    Reset TV
                                  </button>
                                )}
                                <button
                                  onClick={() => setInboxModal({ isOpen: true, token: tokenObj.code, message: "" })}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors"
                                >
                                  Pesan TV
                                </button>
                                {!tokenObj.isTrial && (
                                  <button
                                    onClick={() => startEditToken(tokenObj)}
                                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors"
                                  >
                                    Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => removeToken(tokenObj.code)}
                                  className="p-1.5 rounded-xl hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                  title="Hapus Token"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 5: LIVE CHAT MODERATION
              ========================================== */}
              {activeTab === "chat" && (
                <div className="space-y-6 animate-toast">
                  <div className="glass-panel p-6 rounded-3xl space-y-6">
                    {/* Header & Toggle */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-5 h-5 text-pink-400" />
                        <div>
                          <h3 className="text-base font-bold text-white">Moderasi Live Chat</h3>
                          <p className="text-xs text-slate-400">Kelola obrolan publik dan kirim siaran resmi sebagai Administrator.</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-300">
                          {chatEnabled ? "Chat Diaktifkan" : "Chat Ditutup"}
                        </span>
                        <button
                          onClick={() => setChatEnabled(!chatEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            chatEnabled ? "bg-pink-600" : "bg-slate-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                              chatEnabled ? "translate-x-7" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Admin Identity Customizer & Live Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Badge Ikon Admin</label>
                        <input
                          type="text"
                          value={adminBadgeIcon}
                          onChange={(e) => setAdminBadgeIcon(e.target.value)}
                          className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Warna Badge</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={adminBadgeColor}
                            onChange={(e) => setAdminBadgeColor(e.target.value)}
                            className="w-10 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={adminBadgeColor}
                            onChange={(e) => setAdminBadgeColor(e.target.value)}
                            className="flex-1 bg-[#0c1322] border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      {/* Live Preview Bubble */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-400 uppercase">Live Preview Bubble</label>
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-sm"
                            style={{ backgroundColor: adminBadgeColor }}
                          >
                            {adminBadgeIcon} ADMIN
                          </span>
                          <span className="text-xs text-slate-300">Halo penonton!</span>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages Box */}
                    <div className="bg-[#090d16] border border-white/10 rounded-2xl p-4 h-80 overflow-y-auto space-y-2 flex flex-col">
                      {chatMessages.length === 0 ? (
                        <div className="text-center m-auto text-slate-500 text-xs">
                          Belum ada pesan chat live dari penonton.
                        </div>
                      ) : (
                        chatMessages.map((msg) => {
                          const senderParts = msg.sender.split("|");
                          const senderName = senderParts[0] || "User";
                          const isAdminMsg = senderParts.includes("ADMIN");

                          return (
                            <div
                              key={msg.id}
                              className={`p-2.5 rounded-xl flex items-start justify-between gap-3 group transition-colors ${
                                isAdminMsg ? "bg-indigo-950/40 border border-indigo-500/20" : "hover:bg-white/[0.03]"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${isAdminMsg ? "text-pink-400" : "text-cyan-400"}`}>
                                    {senderName}
                                  </span>
                                  <span className="text-[10px] text-slate-500">{formatDateSafe(msg.timestamp) || "Baru saja"}</span>
                                </div>
                                <p className="text-xs text-slate-200">{msg.message}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteChat(msg.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Chat Composer */}
                    <form onSubmit={handleSendChat} className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteChat("all")}
                        className="px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400"
                        title="Bersihkan Semua Chat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Kirim pesan resmi sebagai Admin..."
                        className="flex-1 bg-[#0c1322] border border-white/10 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500"
                      />
                      <button
                        type="submit"
                        className="px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/25"
                      >
                        <Send className="w-4 h-4" /> Kirim
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* ==========================================
                  TAB 6: SETTINGS
              ========================================== */}
              {activeTab === "settings" && (
                <div className="space-y-6 animate-toast">
                  {/* Card 1: Branding */}
                  <div className="glass-panel p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                      <Tv className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-white">Identitas & Branding Aplikasi</h3>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Nama Aplikasi (Tampil di Layar TV & Header)</label>
                      <input
                        type="text"
                        value={appName}
                        onChange={(e) => setAppName(e.target.value)}
                        placeholder="KIMTV"
                        className="w-full max-w-md bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Card 2: Marquee / Teks Berjalan dengan LIVE PREVIEW */}
                  <div className="glass-panel p-6 rounded-3xl space-y-5">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h3 className="text-base font-bold text-white">Teks Pengumuman Berjalan (Marquee)</h3>
                          <p className="text-xs text-slate-400">Pesan siaran berjalan di bagian atas layar TV pengguna.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-300">
                          {notificationEnabled ? "Marquee Aktif" : "Mati"}
                        </span>
                        <button
                          onClick={() => setNotificationEnabled(!notificationEnabled)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notificationEnabled ? "bg-emerald-600" : "bg-slate-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                              notificationEnabled ? "translate-x-7" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3 space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Isi Pesan Pengumuman</label>
                        <input
                          type="text"
                          value={notificationText}
                          onChange={(e) => setNotificationText(e.target.value)}
                          placeholder="Selamat datang di KIMTV! Update channel terbaru setiap hari..."
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">Warna Teks</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={notificationColor}
                            onChange={(e) => setNotificationColor(e.target.value)}
                            className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={notificationColor}
                            onChange={(e) => setNotificationColor(e.target.value)}
                            className="flex-1 bg-[#0c1322] border border-white/10 text-white rounded-xl p-2 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Live Marquee Preview Banner */}
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Simulasi Layar TV:</span>
                      <div className="w-full bg-slate-950/80 rounded-2xl border border-white/10 p-3 overflow-hidden flex items-center gap-3">
                        <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <div
                            className="animate-marquee font-medium text-xs whitespace-nowrap"
                            style={{ color: notificationColor }}
                          >
                            {notificationText || "Contoh teks berjalan KIMTV yang tampil di TV pengguna..."}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Auto-Update APK & Versioning */}
                  <div className="glass-panel p-6 rounded-3xl space-y-5">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                      <Zap className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h3 className="text-base font-bold text-white">Sistem Auto-Update Aplikasi TV</h3>
                        <p className="text-xs text-slate-400">TV akan otomatis mendownload dan auto-install APK jika versi dinaikkan.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          Kode Versi Terbaru (Version Code) *
                        </label>
                        <input
                          type="number"
                          value={latestVersionCode}
                          onChange={(e) => setLatestVersionCode(parseInt(e.target.value) || 1)}
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
                        />
                        <p className="text-[11px] text-slate-400">
                          Aplikasi saat ini: Kode 10 (v5.5). Jika ingin memicu update, isi 11 atau lebih tinggi.
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">
                          URL Download APK Langsung (.apk)
                        </label>
                        <input
                          type="url"
                          value={apkUpdateUrl}
                          onChange={(e) => setApkUpdateUrl(e.target.value)}
                          placeholder="https://domain.com/kimtv-release.apk"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-300">
                          Link Kontak Admin (WhatsApp / Telegram)
                        </label>
                        <input
                          type="text"
                          value={adminContactUrl}
                          onChange={(e) => setAdminContactUrl(e.target.value)}
                          placeholder="https://wa.me/6281234567890"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500"
                        />
                        <p className="text-[11px] text-slate-400">Akan dirender sebagai QR Code di layar Profil aplikasi TV.</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Wallpaper & Welcome Banner */}
                  <div className="glass-panel p-6 rounded-3xl space-y-4">
                    <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
                      <ImageIcon className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-base font-bold text-white">Wallpaper & Promo Banner Pop-up</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">URL Gambar Latar Belakang (Wallpaper TV)</label>
                        <input
                          type="url"
                          value={backgroundUrl}
                          onChange={(e) => setBackgroundUrl(e.target.value)}
                          placeholder="https://domain.com/bg.jpg"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[11px] text-slate-400">Kosongkan jika ingin menggunakan latar bawaan aplikasi.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-300">URL Banner Sambutan (Popup Promo)</label>
                        <input
                          type="url"
                          value={welcomeBannerUrl}
                          onChange={(e) => setWelcomeBannerUrl(e.target.value)}
                          placeholder="https://domain.com/promo.jpg"
                          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[11px] text-slate-400">Muncul sekali setiap pengguna membuka aplikasi TV.</p>
                      </div>
                    </div>
                  </div>

                  {/* Card 5: Maintenance Mode */}
                  <div className={`p-6 rounded-3xl border transition-all ${
                    isMaintenance ? "bg-red-950/40 border-red-500 shadow-xl shadow-red-950/40" : "glass-panel"
                  }`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isMaintenance ? "bg-red-500 text-white" : "bg-white/5 text-slate-400"}`}>
                          <AlertTriangle className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">Mode Perbaikan (Maintenance Mode)</h4>
                          <p className="text-xs text-slate-400">
                            Kunci semua aplikasi TV pengguna secara paksa jika server streaming sedang mengalami kendala.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setIsMaintenance(!isMaintenance)}
                        className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${
                          isMaintenance ? "bg-red-600" : "bg-slate-700"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${
                            isMaintenance ? "translate-x-7" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </DashboardErrorBoundary>
        </div>

        {/* ==========================================
            Mobile Floating Quick Save Bar
        ========================================== */}
        <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 bg-[#080c14]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-between z-30">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white truncate max-w-[150px]">{appName} Admin</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
          >
            {saving ? <RefreshCcw className="animate-spin w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? "Menyimpan..." : "Simpan"}</span>
          </button>
        </div>

        {/* ==========================================
            Mobile Bottom Navigation Bar
        ========================================== */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090d16]/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around z-40 px-2 pb-[env(safe-area-inset-bottom)]">
          {navigationTabs.slice(0, 5).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                  isActive ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0 w-8 h-1 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
                )}
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] tracking-tight">{tab.label.split(" ")[0]}</span>
              </button>
            );
          })}
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
              activeTab === "settings" ? "text-indigo-400 font-bold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {activeTab === "settings" && (
              <span className="absolute top-0 w-8 h-1 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
            )}
            <Sliders className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Setelan</span>
          </button>
        </nav>
      </main>
    </div>
  );
}