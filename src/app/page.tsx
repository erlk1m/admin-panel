"use client";

import { useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { Tv, ShieldAlert, Key, Save, Globe, RefreshCcw, Bell, AlertTriangle, Image as ImageIcon, MessageSquare, Trash2, Send, Activity, Users, PlaySquare, TrendingUp, PieChart } from "lucide-react";

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
        <div className="p-8 bg-card rounded-xl border border-red-500/50 text-foreground my-4 space-y-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-bold">Terjadi Kesalahan Tampilan Data</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {this.state.error?.message || "Data dari Firebase sedang tidak sinkron. Klik tombol di bawah untuk memuat ulang."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Muat Ulang Tampilan
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const safeDecode = (str: string) => {
  try {
    return decodeURIComponent(str);
  } catch {
    return String(str || '');
  }
};

const formatDateSafe = (timestamp: any) => {
  if (!timestamp) return "";
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return "";
  try {
    const d = new Date(num);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString('id-ID');
  } catch {
    return "";
  }
};

const isCustomEffect = (effect: any) => typeof effect === 'string' && effect.startsWith('http');

export default function AdminPanel() {
  const [adminPassword, setAdminPassword] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [tokenSubTab, setTokenSubTab] = useState("premium");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [m3uUrl, setM3uUrl] = useState("");
  const [m3uUrl2, setM3uUrl2] = useState("");
  const [m3uUrl3, setM3uUrl3] = useState("");
  const [m3uName, setM3uName] = useState("");
  const [m3uName2, setM3uName2] = useState("");
  const [m3uName3, setM3uName3] = useState("");
  const [epgUrl, setEpgUrl] = useState("");
  const [proxyUrl, setProxyUrl] = useState("");
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
  const [customChannels, setCustomChannels] = useState<CustomChannel[]>([]);
  const [editingCustomChannel, setEditingCustomChannel] = useState<Partial<CustomChannel> | null>(null);

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
  }

  const [tokens, setTokens] = useState<TokenObject[]>([]); // Ganti accessCode jadi tokens
  const [customTokenInput, setCustomTokenInput] = useState(""); // Input untuk token custom
  const [tokenDuration, setTokenDuration] = useState("lifetime");
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

  const [tokenBadgeIcon, setTokenBadgeIcon] = useState("");
  const [tokenBadgeColor, setTokenBadgeColor] = useState("#FFD700");
  const [tokenNameEffect, setTokenNameEffect] = useState("NONE");
  const [tokenMaxDevices, setTokenMaxDevices] = useState(1);
  const [editingTokenCode, setEditingTokenCode] = useState<string | null>(null);

  const [activeUsers, setActiveUsers] = useState<{ token: string; channel: string; country?: string; deviceBrand?: string; deviceModel?: string; isTv?: boolean; lastSeen: number }[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [channelStats, setChannelStats] = useState<{name: string, count: number}[]>([]);
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Coba ambil config yang ada (publik)
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setM3uUrl(typeof data.m3uUrl === 'string' ? data.m3uUrl : "");
          setM3uUrl2(typeof data.m3uUrl2 === 'string' ? data.m3uUrl2 : "");
          setM3uUrl3(typeof data.m3uUrl3 === 'string' ? data.m3uUrl3 : "");
          setM3uName(typeof data.m3uName === 'string' ? data.m3uName : "");
          setM3uName2(typeof data.m3uName2 === 'string' ? data.m3uName2 : "");
          setM3uName3(typeof data.m3uName3 === 'string' ? data.m3uName3 : "");
          setEpgUrl(typeof data.epgUrl === 'string' ? data.epgUrl : "");
          setProxyUrl(typeof data.proxyUrl === 'string' ? data.proxyUrl : "");

          let rawChannels: any[] = [];
          if (data.customChannels) {
            if (Array.isArray(data.customChannels)) {
              rawChannels = data.customChannels;
            } else if (typeof data.customChannels === 'object') {
              rawChannels = Object.values(data.customChannels);
            }
          }
          const safeChannels: CustomChannel[] = rawChannels.map((c: any) => ({
            id: String(c.id || "cc_" + Math.random()),
            name: typeof c.name === 'string' ? c.name : (typeof c.name === 'object' ? JSON.stringify(c.name) : String(c.name || '')),
            type: typeof c.type === 'string' ? c.type : 'direct',
            streamUrl: typeof c.streamUrl === 'string' ? c.streamUrl : (typeof c.streamUrl === 'object' ? JSON.stringify(c.streamUrl) : String(c.streamUrl || '')),
            group: typeof c.group === 'string' ? c.group : (c.group ? String(c.group) : undefined),
            logoUrl: typeof c.logoUrl === 'string' ? c.logoUrl : undefined,
            licenseKey: typeof c.licenseKey === 'string' ? c.licenseKey : undefined,
            licenseType: typeof c.licenseType === 'string' ? c.licenseType : undefined,
            userAgent: typeof c.userAgent === 'string' ? c.userAgent : undefined,
            referer: typeof c.referer === 'string' ? c.referer : undefined,
            tvgId: typeof c.tvgId === 'string' ? c.tvgId : undefined,
          }));
          setCustomChannels(safeChannels);
          
          // Migrasi otomatis jika masih pakai accessCode lama
          let rawTokens: any[] = [];
          if (data.tokens) {
            if (Array.isArray(data.tokens)) {
              rawTokens = data.tokens;
            } else if (typeof data.tokens === 'object') {
              rawTokens = Object.entries(data.tokens).map(([key, val]: [string, any]) => {
                if (typeof val === 'string') return { code: val || key, expiresAt: null, label: "Lifetime" };
                if (typeof val === 'object' && val !== null) return { ...val, code: typeof val.code === 'string' ? val.code : key };
                return { code: key, expiresAt: null, label: "Lifetime" };
              });
            }
          } else if (data.accessCode) {
            rawTokens = [{ code: typeof data.accessCode === 'string' ? data.accessCode : String(data.accessCode), expiresAt: null, label: "Lifetime" }];
          }

          const mappedTokens: TokenObject[] = rawTokens.map((t: any) => {
            if (typeof t === 'string') {
              return { code: t, expiresAt: null, label: "Lifetime" };
            }
            if (t && typeof t === 'object') {
              return {
                ...t,
                code: typeof t.code === 'string' ? t.code : String(t.code || ''),
                label: typeof t.label === 'string' ? t.label : (typeof t.label === 'object' ? JSON.stringify(t.label) : String(t.label || 'Lifetime')),
                expiresAt: typeof t.expiresAt === 'number' ? t.expiresAt : (Number(t.expiresAt) || null),
                maxDevices: typeof t.maxDevices === 'number' ? t.maxDevices : (Number(t.maxDevices) || 1),
                deviceId: typeof t.deviceId === 'string' ? t.deviceId : String(t.deviceId || ''),
                deviceIds: Array.isArray(t.deviceIds) ? t.deviceIds.map(String) : [],
                isTrial: Boolean(t.isTrial),
                badgeIcon: typeof t.badgeIcon === 'string' ? t.badgeIcon : String(t.badgeIcon || ''),
                badgeColor: typeof t.badgeColor === 'string' ? t.badgeColor : String(t.badgeColor || '#FFD700'),
                nameEffect: typeof t.nameEffect === 'string' ? t.nameEffect : String(t.nameEffect || 'NONE'),
              };
            }
            return { code: String(t || ''), expiresAt: null, label: "Lifetime" };
          });
          setTokens(mappedTokens);

          setNotificationText(typeof data.notificationText === 'string' ? data.notificationText : (typeof data.notificationText === 'object' ? JSON.stringify(data.notificationText) : String(data.notificationText || "")));
          setNotificationColor(typeof data.notificationColor === 'string' ? data.notificationColor : "#FFFFFF");
          setNotificationEnabled(Boolean(data.notificationEnabled));
          setBackgroundUrl(typeof data.backgroundUrl === 'string' ? data.backgroundUrl : "");
          setWelcomeBannerUrl(typeof data.welcomeBannerUrl === 'string' ? data.welcomeBannerUrl : "");
          setLatestVersionCode(typeof data.latestVersionCode === 'number' ? data.latestVersionCode : (Number(data.latestVersionCode) || 1));
          setApkUpdateUrl(typeof data.apkUpdateUrl === 'string' ? data.apkUpdateUrl : "");
          setAdminContactUrl(typeof data.adminContactUrl === 'string' ? data.adminContactUrl : "");
          setIsMaintenance(Boolean(data.isMaintenance));
          setPrerollAdUrl(typeof data.prerollAdUrl === 'string' ? data.prerollAdUrl : "");
          setPrerollAdEnabled(Boolean(data.prerollAdEnabled));
          setChatEnabled(data.chatEnabled !== false); // default true if not set
          setAdminBadgeIcon(typeof data.adminBadgeIcon === 'string' ? data.adminBadgeIcon : "🔧");
          setAdminBadgeColor(typeof data.adminBadgeColor === 'string' ? data.adminBadgeColor : "#FF00FF");
          setAdminNameEffect(typeof data.adminNameEffect === 'string' ? data.adminNameEffect : "NONE");
          setAppName(typeof data.appName === 'string' ? data.appName : (typeof data.appName === 'object' ? JSON.stringify(data.appName) : String(data.appName || "KIMTV")));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim() !== "") {
      try {
        const res = await fetch("/api/verify-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: adminPassword })
        });
        
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          const data = await res.json();
          alert(data.error || "Password Admin Salah!");
        }
      } catch {
        alert("Terjadi kesalahan jaringan.");
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchChats = () => {
        fetch("/api/chats")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              const safeMessages = data.map((msg: any) => ({
                id: String(msg.id || Math.random()),
                sender: typeof msg.sender === 'string' ? msg.sender : (typeof msg.sender === 'object' ? JSON.stringify(msg.sender) : String(msg.sender || 'User')),
                message: typeof msg.message === 'string' ? msg.message : (typeof msg.message === 'object' && msg.message !== null ? (msg.message.text || msg.message.msg || JSON.stringify(msg.message)) : String(msg.message || '')),
                timestamp: typeof msg.timestamp === 'number' ? msg.timestamp : (Number(msg.timestamp) || Date.now())
              }));
              setChatMessages(safeMessages);
            }
          })
          .catch(() => {});
      };
      const fetchPresence = () => {
        fetch("/api/presence")
          .then(res => res.json())
          .then(data => {
            if (data && data.users && Array.isArray(data.users)) {
              const safeUsers = data.users.map((u: any) => ({
                token: String(u.token || ''),
                channel: typeof u.channel === 'string' ? u.channel : (typeof u.channel === 'object' && u.channel !== null ? (u.channel.name || u.channel.title || JSON.stringify(u.channel)) : String(u.channel || 'Lainnya')),
                country: typeof u.country === 'string' ? u.country : String(u.country || 'ID'),
                deviceBrand: typeof u.deviceBrand === 'string' ? u.deviceBrand : String(u.deviceBrand || 'Unknown'),
                deviceModel: typeof u.deviceModel === 'string' ? u.deviceModel : String(u.deviceModel || 'Unknown'),
                isTv: Boolean(u.isTv),
                lastSeen: typeof u.lastSeen === 'number' ? u.lastSeen : (Number(u.lastSeen) || Date.now())
              }));
              setActiveUsers(safeUsers);
              setActiveUsersCount(typeof data.count === 'number' ? data.count : safeUsers.length);
            }
          })
          .catch(() => {});
      };
      const fetchStats = () => {
        fetch("/api/stats")
          .then(res => res.json())
          .then(data => {
            if (data && !data.error && typeof data === 'object') {
              const statsArray = Object.keys(data).map(key => {
                const val = data[key];
                let count = 0;
                if (typeof val === 'number') {
                  count = val;
                } else if (typeof val === 'string') {
                  count = Number(val) || 0;
                } else if (typeof val === 'object' && val !== null) {
                  count = Number(val.count || val.views || val.total || 0) || 0;
                }
                return {
                  name: typeof key === 'string' ? safeDecode(key) : String(key || ''),
                  count: count
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
      const presenceInterval = setInterval(fetchPresence, 10000);
      const statsInterval = setInterval(fetchStats, 60000);
      return () => {
        clearInterval(chatInterval);
        clearInterval(presenceInterval);
        clearInterval(statsInterval);
      };
    }
  }, [isAuthenticated]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ message: chatInput.trim(), senderOverride: `Admin|ID|${adminBadgeIcon}|${adminBadgeColor}|ADMIN|${adminNameEffect}` })
      });
      setChatInput("");
    } catch {}
  };

  const handleDeleteChat = async (id: string) => {
    if (id === 'all' && !confirm("Yakin ingin menghapus semua pesan chat?")) return;
    try {
      await fetch(`/api/chats?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
    } catch {}
  };

  const handleKick = async (token: string) => {
    if (!confirm(`Yakin ingin menendang perangkat dengan token ${token}? Aplikasi mereka akan dipaksa keluar secara real-time.`)) return;
    try {
      await fetch("/api/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ token })
      });
      alert(`Sinyal KICK berhasil dikirim ke ${token}!`);
    } catch {
      alert("Gagal mengirim sinyal KICK.");
    }
  };

  const getExpirationParams = (duration: string) => {
    const now = Date.now();
    switch (duration) {
      case "1h": return { expiresAt: now + 3600000, label: "1 Jam" };
      case "1d": return { expiresAt: now + 86400000, label: "1 Hari" };
      case "1w": return { expiresAt: now + 604800000, label: "1 Minggu" };
      case "1m": return { expiresAt: now + 2592000000, label: "1 Bulan" };
      default: return { expiresAt: null, label: "Lifetime" };
    }
  };

  const generateRandomToken = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "KIM-";
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!tokens.some(t => t.code === token)) {
      setTokens([...tokens, { code: token, badgeIcon: tokenBadgeIcon, badgeColor: tokenBadgeColor, nameEffect: tokenNameEffect, maxDevices: tokenMaxDevices, deviceIds: [], ...getExpirationParams(tokenDuration) }]);
    }
  };

  const addCustomToken = () => {
    const cleanToken = customTokenInput.trim();
    if (editingTokenCode) {
      if (cleanToken !== "") {
        setTokens(tokens.map(t => t.code === editingTokenCode ? { ...t, code: cleanToken, badgeIcon: tokenBadgeIcon, badgeColor: tokenBadgeColor, nameEffect: tokenNameEffect, maxDevices: tokenMaxDevices } : t));
        setEditingTokenCode(null);
        setCustomTokenInput("");
      }
    } else {
      if (cleanToken !== "" && !tokens.some(t => t.code === cleanToken)) {
        setTokens([...tokens, { code: cleanToken, badgeIcon: tokenBadgeIcon, badgeColor: tokenBadgeColor, nameEffect: tokenNameEffect, deviceId: "", maxDevices: tokenMaxDevices, deviceIds: [], ...getExpirationParams(tokenDuration) }]);
        setCustomTokenInput("");
      }
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
  };

  const upgradeTrialToPremium = (tokenCode: string) => {
    setTokens(tokens.map(t => {
      if (t.code === tokenCode) {
        return {
          ...t,
          isTrial: false,
          label: "Lifetime",
          expiresAt: null,
          badgeIcon: "👑",
          badgeColor: "#FFD700"
        };
      }
      return t;
    }));
    // Note: requires saving config to take effect
  };

  const removeToken = (tokenToRemove: string) => {
    setTokens(tokens.filter(t => t.code !== tokenToRemove));
  };

  const resetTokenDevice = (tokenCode: string) => {
    setTokens(tokens.map(t => t.code === tokenCode ? { ...t, deviceId: "", deviceIds: [] } : t));
    // Kita harus panggil handleSave atau biarkan user klik "Simpan Perubahan" sendiri.
    // Untuk kenyamanan, biarkan mereka klik "Simpan" setelah mereset, atau kita panggil otomatis.
    // Di sini kita biarkan admin menekan tombol "Simpan Perubahan" utama.
  };

  const handleSendInbox = async (tokenCode: string) => {
    const message = window.prompt(`Masukkan pesan peringatan untuk token ${tokenCode}:\n(Pesan ini akan muncul popup besar di layar TV mereka)`);
    if (!message) return;

    try {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({ token: tokenCode, message }),
      });
      if (res.ok) {
        alert("Pesan berhasil dikirim!");
      } else {
        alert("Gagal mengirim pesan.");
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
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
          tokens, // Kirim array tokens
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
        alert("Pengaturan berhasil disimpan ke Firebase!");
      } else {
        const err = await res.json();
        alert("Gagal menyimpan: " + (err.error || "Password Admin Salah!"));
        if (res.status === 401) setIsAuthenticated(false);
      }
    } catch {
      alert("Terjadi kesalahan jaringan.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-foreground">
        <RefreshCcw className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center p-4">
        <div className="bg-muted  border border-border shadow-sm  p-8 rounded-xl border border-border w-full max-w-md shadow-md">
          <div className="flex justify-center mb-6">
            <div className="bg-accent p-4 rounded-full">
              <Tv className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-foreground mb-2">KIMTV Admin Panel</h1>
          <p className="text-muted-foreground text-center text-sm mb-8">Silakan masukkan password admin untuk melanjutkan.</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="relative">
                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-background border border-border text-foreground rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" /> Masuk Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-background border-r border-border flex flex-col hidden md:flex">
        <div className="p-4 flex items-center gap-3">
          <div className="bg-foreground text-background p-1.5 rounded-md flex items-center justify-center">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">{appName}</h1>
            <p className="text-xs text-muted-foreground mt-1">Admin Panel</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-6 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">General</p>
            <div className="space-y-1">
              {[
                { id: "overview", label: "Dashboard", icon: Activity },
                { id: "analytics", label: "Analytics", icon: PieChart },
                { id: "chat", label: "Chats", icon: MessageSquare },
                { id: "tokens", label: "Users", icon: Users },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                    activeTab === tab.id 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Configuration</p>
            <div className="space-y-1">
              {[
                { id: "playlist", label: "M3U Playlist", icon: Globe },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                    activeTab === tab.id 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">Other</p>
            <div className="space-y-1">
              {[
                { id: "settings", label: "Settings", icon: ShieldAlert }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all text-sm font-medium ${
                    activeTab === tab.id 
                      ? "bg-accent text-accent-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </nav>
        
        <div className="p-4 mt-auto">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent text-muted-foreground hover:text-foreground rounded-md transition-colors text-sm font-medium"
          >
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-foreground font-bold text-xs border border-border">
              AD
            </div>
            <div className="flex-1 text-left">
              <div className="text-foreground leading-none font-bold">Admin</div>
              <div className="text-xs text-muted-foreground mt-1 truncate">Logout Panel</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 sticky top-0 z-10 gap-4">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-muted-foreground hover:text-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="hidden md:flex items-center text-sm text-muted-foreground gap-2">
              <span className="hover:text-foreground cursor-pointer transition-colors">General</span>
              <span className="text-border">/</span>
              <span className="text-foreground font-medium capitalize">{activeTab}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-2.5 text-muted-foreground"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search..." className="h-9 w-64 bg-accent/50 border border-transparent rounded-md pl-9 pr-12 text-sm focus:outline-none focus:border-border transition-colors" />
              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                <span className="bg-background border border-border text-[10px] text-muted-foreground px-1.5 py-0.5 rounded shadow-sm">⌘K</span>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCcw className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span className="hidden md:inline">{saving ? "Menyimpan..." : "Save"}</span>
            </button>

            <button className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
            </button>

            <div className="w-8 h-8 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-bold text-foreground overflow-hidden">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <DashboardErrorBoundary>
            <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-12">
              {activeTab === "overview" && (
              <>
              <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                  <button className="bg-foreground text-background hover:bg-foreground/90 h-9 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors">
                    Download
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 pb-2">
                <div className="bg-muted text-muted-foreground h-9 items-center justify-center rounded-lg p-1 space-x-1 inline-flex">
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium bg-background text-foreground shadow shadow-sm transition-all">Overview</button>
                  <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all hover:text-foreground">Analytics</button>
                  <button className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all hover:text-foreground">Reports</button>
                  <button className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all hover:text-foreground">Notifications</button>
                </div>
              </div>

              {/* KPI Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="bg-card border border-border text-card-foreground rounded-xl shadow-sm">
                  <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="tracking-tight text-sm font-medium">Total Token Aktif</h3>
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-2xl font-bold">
                      +{tokens.filter(t => !t.expiresAt || t.expiresAt > Date.now()).length}
                    </div>
                    <p className="text-xs text-muted-foreground">Dari total {tokens.length} token</p>
                  </div>
                </div>

                <div className="bg-card border border-border text-card-foreground rounded-xl shadow-sm">
                  <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="tracking-tight text-sm font-medium">Slot Terpakai</h3>
                    <Tv className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-2xl font-bold">
                      +{tokens.reduce((sum, t) => sum + (Array.isArray(t.deviceIds) ? t.deviceIds.length : (t.deviceId ? 1 : 0)), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">Dari {tokens.reduce((sum, t) => sum + (Number(t.maxDevices) || 1), 0)} max perangkat</p>
                  </div>
                </div>

                <div className="bg-card border border-border text-card-foreground rounded-xl shadow-sm">
                  <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="tracking-tight text-sm font-medium">User Online</h3>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-2xl font-bold flex items-center gap-2">
                      +{activeUsersCount}
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-sm"></div>
                    </div>
                    <p className="text-xs text-muted-foreground">Sedang streaming saat ini</p>
                  </div>
                </div>

                <div className="bg-card border border-border text-card-foreground rounded-xl shadow-sm">
                  <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="tracking-tight text-sm font-medium">Versi Aplikasi</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="text-2xl font-bold">v{typeof latestVersionCode === 'number' || typeof latestVersionCode === 'string' ? latestVersionCode : 1}</div>
                    <p className="text-xs text-muted-foreground">Pembaruan TV otomatis aktif</p>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-4">
                {/* Card: Top Channels (col-span-4) */}
                <div className="col-span-4 bg-card border border-border rounded-xl shadow-sm">
                  <div className="p-6 pb-4">
                    <h3 className="tracking-tight text-lg font-medium">Overview</h3>
                  </div>
                  <div className="p-6 pt-0">
                    {channelStats.length === 0 ? (
                      <div className="text-center text-muted-foreground py-10 text-sm">
                        Belum ada data statistik channel.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {channelStats.map((stat, i) => (
                          <div key={stat.name || i} className="flex items-center">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-accent text-muted-foreground mr-4">
                              {i + 1}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium leading-none">{typeof stat.name === 'string' ? stat.name : String(stat.name || '')}</p>
                              <p className="text-sm text-muted-foreground">Channel TV</p>
                            </div>
                            <div className="font-medium text-sm">
                              +{typeof stat.count === 'number' ? stat.count : (Number(stat.count) || 0)} views
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card: Analytics Dashboard / Active Users (col-span-3) */}
                <div className="col-span-3 bg-card border border-border rounded-xl shadow-sm">
                  <div className="p-6 pb-4">
                    <h3 className="tracking-tight text-lg font-medium">Recent Users</h3>
                    <p className="text-sm text-muted-foreground mt-1.5">Ada {activeUsersCount} perangkat sedang streaming saat ini.</p>
                  </div>
                  <div className="p-6 pt-0">
                    <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2">
                      {activeUsers.length === 0 ? (
                        <div className="text-center text-muted-foreground py-6 text-sm">Belum ada perangkat terhubung.</div>
                      ) : (
                        activeUsers.map((user, idx) => (
                          <div key={idx} className="flex items-center">
                            <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-accent items-center justify-center mr-4">
                              <span className="font-semibold text-muted-foreground text-xs">{typeof user.token === 'string' && user.token ? user.token.substring(0, 2).toUpperCase() : "U"}</span>
                            </span>
                            <div className="flex-1 space-y-1 overflow-hidden">
                              <p className="text-sm font-medium leading-none truncate">{typeof user.token === 'string' ? user.token : String(user.token || '')}</p>
                              <p className="text-sm text-muted-foreground truncate">{typeof user.channel === 'string' ? user.channel : (typeof user.channel === 'object' ? JSON.stringify(user.channel) : String(user.channel || ''))}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="font-medium text-xs text-muted-foreground">
                                {now ? Math.floor((now - (Number(user.lastSeen) || 0)) / 1000) : 0}s
                              </div>
                              <button onClick={() => handleKick(user.token)} className="text-primary hover:text-foreground text-xs font-bold transition-colors">
                                KICK
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Geo Analytics Card (Full width below) */}
              {(() => {
                const countryCounts: Record<string, number> = {};
                activeUsers.forEach(u => {
                  const rawCode = typeof u.country === 'string' ? u.country : String(u.country || "ID");
                  const code = rawCode.toUpperCase();
                  countryCounts[code] = (countryCounts[code] || 0) + 1;
                });
                const sortedCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                const getCountryName = (c: string) => {
                  const safeCode = typeof c === 'string' ? c : String(c || '');
                  const map: Record<string, string> = { ID: "Indonesia", MY: "Malaysia", SG: "Singapura", US: "Amerika Serikat", AU: "Australia" };
                  return map[safeCode.toUpperCase()] || safeCode.toUpperCase();
                };

                return (
                  <div className="bg-card rounded-xl border border-border shadow-sm mb-8 mt-4">
                    <div className="p-6 pb-4">
                      <h3 className="tracking-tight text-lg font-medium">Distribusi Lokasi</h3>
                    </div>
                    <div className="p-6 pt-0">
                      {sortedCountries.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 text-sm">Belum ada data lokasi.</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {sortedCountries.map(([code, count]) => (
                            <div key={code} className="flex flex-col items-center justify-center bg-accent/50 py-4 px-2 rounded-xl border border-border">
                              <span className="font-bold text-card-foreground text-md text-center">{getCountryName(code)}</span>
                              <span className="text-xs text-muted-foreground mt-1">{count} Perangkat</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
              </>
            )}
            {activeTab === "analytics" && (
              <div className="space-y-6">
                <div className="bg-card  border border-border p-6 rounded-xl">
                  <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
                    <PieChart className="text-blue-500" />
                    <h2 className="text-lg font-semibold">Distribusi Tipe Perangkat</h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    {(() => {
                       const tvCount = activeUsers.filter(u => u.isTv).length;
                       const mobileCount = activeUsers.length - tvCount;
                       const tvPercent = activeUsers.length > 0 ? (tvCount / activeUsers.length) * 100 : 0;
                       return (
                         <div className="w-full">
                           <div className="flex justify-between mb-2 font-medium">
                             <span className="text-blue-400">Smart TV / STB ({tvCount})</span>
                             <span className="text-green-400">Mobile / HP ({mobileCount})</span>
                           </div>
                           <div className="w-full bg-accent rounded-full h-4 overflow-hidden flex">
                             <div className="bg-blue-500 h-full transition-all" style={{ width: `${tvPercent}%` }}></div>
                             <div className="bg-green-500 h-full transition-all" style={{ width: `${100 - tvPercent}%` }}></div>
                           </div>
                         </div>
                       )
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-card  border border-border p-6 rounded-xl">
                    <h3 className="text-md font-medium text-muted-foreground mb-4 border-b border-border pb-2">Peringkat Merek (Top Brands)</h3>
                    <div className="space-y-3">
                      {(() => {
                         const brands: Record<string, number> = {};
                         activeUsers.forEach(u => {
                           const brand = typeof u.deviceBrand === 'string' ? u.deviceBrand : String(u.deviceBrand || "Unknown");
                           brands[brand] = (brands[brand] || 0) + 1;
                         });
                         return Object.entries(brands)
                           .sort((a,b) => b[1] - a[1])
                           .slice(0, 5)
                           .map(([brand, count], idx) => (
                             <div key={idx} className="flex justify-between items-center bg-card p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                               <span className="capitalize">{String(brand)}</span>
                               <span className="bg-blue-500/20 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">{count} User</span>
                             </div>
                           ));
                      })()}
                    </div>
                  </div>

                  <div className="bg-card  border border-border p-6 rounded-xl">
                    <h3 className="text-md font-medium text-muted-foreground mb-4 border-b border-border pb-2">Peringkat Model (Top Models)</h3>
                    <div className="space-y-3">
                      {(() => {
                         const models: Record<string, number> = {};
                         activeUsers.forEach(u => {
                           const model = typeof u.deviceModel === 'string' ? u.deviceModel : String(u.deviceModel || "Unknown");
                           models[model] = (models[model] || 0) + 1;
                         });
                         return Object.entries(models)
                           .sort((a,b) => b[1] - a[1])
                           .slice(0, 5)
                           .map(([model, count], idx) => (
                             <div key={idx} className="flex justify-between items-center bg-card p-3 rounded-lg border border-border hover:bg-accent transition-colors">
                               <span className="uppercase">{String(model)}</span>
                               <span className="bg-purple-500/20 border border-border text-primary px-3 py-1 rounded-full text-xs font-bold">{count} User</span>
                             </div>
                           ));
                      })()}
                    </div>
                  </div>
                </div>

                <div className="bg-card  border border-border p-6 rounded-xl overflow-hidden flex flex-col">
                  <h3 className="text-md font-medium text-muted-foreground mb-4 border-b border-border pb-2">Detail Perangkat Pengguna Aktif</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-muted-foreground uppercase bg-card">
                        <tr>
                          <th className="px-4 py-3 rounded-tl-lg">Token</th>
                          <th className="px-4 py-3">Tipe</th>
                          <th className="px-4 py-3">Merek & Model</th>
                          <th className="px-4 py-3 rounded-tr-lg">Aktivitas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeUsers.map((u, idx) => (
                          <tr key={idx} className="border-b border-border hover:bg-card">
                            <td className="px-4 py-3 font-mono text-yellow-400 font-bold">{String(u.token || '')}</td>
                            <td className="px-4 py-3">
                              {u.isTv ? (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">Smart TV</span>
                              ) : (
                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">Mobile</span>
                              )}
                            </td>
                            <td className="px-4 py-3 capitalize">
                              <div className="font-semibold text-card-foreground">{typeof u.deviceBrand === 'string' ? u.deviceBrand : String(u.deviceBrand || "-")}</div>
                              <div className="text-xs text-muted-foreground uppercase">{typeof u.deviceModel === 'string' ? u.deviceModel : String(u.deviceModel || "-")}</div>
                            </td>
                            <td className="px-4 py-3 text-card-foreground">{typeof u.channel === 'string' ? u.channel : (typeof u.channel === 'object' ? JSON.stringify(u.channel) : String(u.channel || '-'))}</td>
                          </tr>
                        ))}
                        {activeUsers.length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center py-6 text-muted-foreground">Belum ada pengguna aktif</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "playlist" && (
              <>
              {/* Card 1: Playlist M3U Multi-Server */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
              <Globe className="text-blue-500" />
              <h2 className="text-lg font-semibold">Multi-Server Playlist (M3U)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-blue-400 mb-2">Server Utama</label>
                <input
                  type="text"
                  value={m3uName}
                  onChange={(e) => setM3uName(e.target.value)}
                  placeholder="Nama (opsional, cth: VIP Server)"
                  className="w-full bg-background border border-blue-500/30 text-foreground rounded-xl p-3 mb-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="url"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  placeholder="https://server1.com/list.m3u"
                  className="w-full bg-background border border-blue-500/30 text-foreground rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Server Cadangan 1</label>
                <input
                  type="text"
                  value={m3uName2}
                  onChange={(e) => setM3uName2(e.target.value)}
                  placeholder="Nama (opsional, cth: Server Cadangan)"
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 mb-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="url"
                  value={m3uUrl2}
                  onChange={(e) => setM3uUrl2(e.target.value)}
                  placeholder="https://server2.com/list.m3u"
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Server Cadangan 2</label>
                <input
                  type="text"
                  value={m3uName3}
                  onChange={(e) => setM3uName3(e.target.value)}
                  placeholder="Nama (opsional, cth: Server 3)"
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 mb-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="url"
                  value={m3uUrl3}
                  onChange={(e) => setM3uUrl3(e.target.value)}
                  placeholder="https://server3.com/list.m3u"
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 mb-6">Jika Server Utama gagal dimuat, aplikasi akan otomatis mencoba Server Cadangan tanpa sepengetahuan pengguna.</p>
            
            <div className="border-t border-border pt-4 mt-2">
              <label className="block text-sm font-bold text-green-400 mb-2">Global EPG URL (Jadwal Tayangan XMLTV)</label>
              <input
                type="url"
                value={epgUrl}
                onChange={(e) => setEpgUrl(e.target.value)}
                placeholder="https://example.com/epg.xml"
                className="w-full bg-background border border-green-500/30 text-foreground rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">Opsional. Jika diisi, semua aplikasi TV akan otomatis menggunakan jadwal (EPG) dari URL ini dan menimpa pengaturan EPG manual di dalam aplikasi TV.</p>
            </div>

            <div className="border-t border-border pt-4 mt-2">
              <label className="block text-sm font-bold text-primary mb-2">Global Stream Proxy URL (Cloudflare Worker)</label>
              <input
                type="url"
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
                placeholder="https://proxy.namakamu.workers.dev/"
                className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">Opsional. Jika diisi, channel dengan DRM atau Referer akan otomatis dirutekan melalui proxy ini untuk melewati pemblokiran.</p>
            </div>

            <div className="border-t border-border pt-4 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <Tv className="text-orange-500" />
                <h2 className="text-lg font-semibold">Custom Channels (Manual)</h2>
              </div>
              <p className="text-xs text-muted-foreground mb-4">Tambahkan channel sendiri tanpa perlu mengedit file M3U. Channel ini akan digabungkan otomatis ke daftar tayangan di TV.</p>
              
              <div className="bg-black/30 p-4 rounded-xl border border-border space-y-3 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Nama Channel (Wajib)" className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500"
                    value={editingCustomChannel?.name || ""}
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, name: e.target.value})} />
                  <select 
                    value={editingCustomChannel?.type || "direct"} 
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, type: e.target.value})}
                    className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500">
                    <option value="direct">Direct Stream (m3u8/mp4)</option>
                    <option value="embed">Embed Code / Iframe</option>
                  </select>
                  
                  {editingCustomChannel?.type === "embed" ? (
                    <textarea 
                      placeholder="Masukkan kode Iframe HTML atau URL webpage di sini (Wajib)" 
                      className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500 md:col-span-2 min-h-[100px]"
                      value={editingCustomChannel?.streamUrl || ""}
                      onChange={(e) => setEditingCustomChannel({...editingCustomChannel, streamUrl: e.target.value})}
                    />
                  ) : (
                    <input type="url" placeholder="Stream URL (Wajib)" className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500"
                      value={editingCustomChannel?.streamUrl || ""}
                      onChange={(e) => setEditingCustomChannel({...editingCustomChannel, streamUrl: e.target.value})} />
                  )}

                  <input type="text" placeholder="Grup (Cth: VIP)" className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500"
                    value={editingCustomChannel?.group || ""}
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, group: e.target.value})} />
                  <input type="url" placeholder="Logo URL" className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500"
                    value={editingCustomChannel?.logoUrl || ""}
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, logoUrl: e.target.value})} />
                  
                  {editingCustomChannel?.type !== "embed" && (
                    <>
                      <input type="text" placeholder="License Key (opsional)" className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500"
                        value={editingCustomChannel?.licenseKey || ""}
                        onChange={(e) => setEditingCustomChannel({...editingCustomChannel, licenseKey: e.target.value})} />
                      <input type="text" placeholder="User-Agent (opsional)" className="bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:border-orange-500"
                        value={editingCustomChannel?.userAgent || ""}
                        onChange={(e) => setEditingCustomChannel({...editingCustomChannel, userAgent: e.target.value})} />
                    </>
                  )}
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => setEditingCustomChannel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-500/20 text-foreground">Batal</button>
                  <button onClick={() => {
                    if (!editingCustomChannel?.name || !editingCustomChannel?.streamUrl) return alert("Nama dan Stream URL wajib diisi!");
                    const isNew = !editingCustomChannel.id;
                    const id = isNew ? "cc_" + Date.now() : editingCustomChannel.id;
                    const newChannel = { ...editingCustomChannel, id } as CustomChannel;
                    if (isNew) {
                      setCustomChannels([...customChannels, newChannel]);
                    } else {
                      setCustomChannels(customChannels.map(c => c.id === id ? newChannel : c));
                    }
                    setEditingCustomChannel(null);
                  }} className="px-3 py-1.5 text-xs rounded-lg bg-orange-500 text-foreground font-bold">
                    {editingCustomChannel?.id ? "Simpan Perubahan" : "Tambah Channel"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {customChannels.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Belum ada custom channel.</p>
                ) : (
                  customChannels.map((c) => {
                    const nameStr = typeof c.name === 'string' ? c.name : (typeof c.name === 'object' ? JSON.stringify(c.name) : String(c.name || ''));
                    const streamUrlStr = typeof c.streamUrl === 'string' ? c.streamUrl : (typeof c.streamUrl === 'object' ? JSON.stringify(c.streamUrl) : String(c.streamUrl || ''));
                    const groupStr = typeof c.group === 'string' ? c.group : (c.group ? String(c.group) : '');

                    return (
                      <div key={c.id} className="flex justify-between items-center bg-muted p-3 rounded-lg border border-border">
                        <div>
                          <div className="font-bold text-orange-400 text-sm">{nameStr} {c.type === 'embed' && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 ml-1 rounded">EMBED</span>}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px] md:max-w-[400px]">{streamUrlStr}</div>
                          {groupStr && <div className="text-[10px] bg-accent inline-block px-1.5 rounded mt-1">{groupStr}</div>}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setEditingCustomChannel(c)} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40">Edit</button>
                          <button onClick={() => setCustomChannels(customChannels.filter(x => x.id !== c.id))} className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded hover:bg-purple-500/40">Hapus</button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
              </>
            )}
            {activeTab === "tokens" && (
              <>
              {/* Card 2: Keamanan Akses (Multi-Token) */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Key className="text-yellow-500" />
                <h2 className="text-lg font-semibold">Manajemen Token Akses</h2>
              </div>
              <span className="bg-yellow-500/20 text-yellow-500 text-xs font-bold px-2 py-1 rounded-lg">
                {tokens.length} Token Aktif
              </span>
            </div>
            
            <div className="space-y-4">
              {/* Tambah Token Baru */}
              <div className="flex flex-col gap-2">
                <label className="block text-sm text-muted-foreground">Buat Token Custom</label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={tokenDuration}
                    onChange={(e) => setTokenDuration(e.target.value)}
                    className="bg-background border border-border text-foreground rounded-xl px-3 py-3 focus:outline-none focus:border-yellow-500 text-sm"
                  >
                    <option value="lifetime">Lifetime</option>
                    <option value="1h">1 Jam</option>
                    <option value="1d">1 Hari</option>
                    <option value="1w">1 Minggu</option>
                    <option value="1m">1 Bulan</option>
                  </select>
                  <input
                    type="text"
                    value={customTokenInput}
                    onChange={(e) => setCustomTokenInput(e.target.value)}
                    placeholder="Misal: VIP-BUDI"
                    className="flex-1 bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-yellow-500 transition-colors min-w-[150px]"
                  />
                  <input
                    type="text"
                    value={tokenBadgeIcon}
                    onChange={(e) => setTokenBadgeIcon(e.target.value)}
                    placeholder="Badge (cth: 👑)"
                    className="w-32 bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                  <div className="flex flex-col">
                    <input
                      type="number"
                      min="1"
                      value={tokenMaxDevices}
                      onChange={(e) => setTokenMaxDevices(parseInt(e.target.value) || 1)}
                      className="w-20 bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-yellow-500 transition-colors"
                      title="Max Device"
                    />
                    <span className="text-[10px] text-muted-foreground text-center mt-1">Max Device</span>
                  </div>
                  <input
                    type="color"
                    value={tokenBadgeColor}
                    onChange={(e) => setTokenBadgeColor(e.target.value)}
                    className="w-12 h-12 p-1 bg-background border border-border rounded-xl cursor-pointer"
                    title="Warna Chat"
                  />
                  <div className="flex flex-col gap-2">
                    <select
                      value={isCustomEffect(tokenNameEffect) ? 'CUSTOM' : (tokenNameEffect || 'NONE')}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setTokenNameEffect('https://');
                        } else {
                          setTokenNameEffect(e.target.value);
                        }
                      }}
                      className="bg-background border border-border text-foreground rounded-xl px-3 py-3 focus:outline-none focus:border-yellow-500 text-sm"
                      title="Efek Nama (Glitch/Sparkle)"
                    >
                      <option value="NONE">Normal</option>
                      <option value="GLITCH">⚡ Glitch</option>
                      <option value="SPARKLE">✨ Sparkle</option>
                      <option value="NEON">🔮 Neon Glow</option>
                      <option value="RAINBOW">🌈 Rainbow</option>
                      <option value="WAVY">🌊 Wavy Bounce</option>
                      <option value="CUSTOM">🎨 Custom GIF URL...</option>
                    </select>
                    {isCustomEffect(tokenNameEffect) && (
                      <input
                        type="url"
                        value={tokenNameEffect || ''}
                        onChange={(e) => setTokenNameEffect(e.target.value)}
                        placeholder="https://...gif"
                        className="bg-background border border-border text-foreground rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 w-full max-w-[200px]"
                      />
                    )}
                  </div>
                  <button 
                    onClick={addCustomToken}
                    className="bg-yellow-600 hover:bg-yellow-700 text-foreground font-bold px-4 py-3 rounded-xl transition-colors"
                  >
                    {editingTokenCode ? "Simpan" : "Tambah"}
                  </button>
                  {editingTokenCode && (
                    <button 
                      onClick={() => {
                        setEditingTokenCode(null);
                        setCustomTokenInput("");
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-foreground font-bold px-4 py-3 rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              <button 
                onClick={generateRandomToken}
                className="w-full bg-card hover:bg-accent text-foreground border border-border font-medium py-3 rounded-xl transition-colors text-sm"
              >
                + Generate Token Acak
              </button>

              {/* Token Sub Tabs */}
              <div className="flex gap-2 border-b border-border pb-2">
                <button 
                  onClick={() => setTokenSubTab("premium")}
                  className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition-colors ${tokenSubTab === "premium" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-card-foreground"}`}
                >
                  Premium Tokens
                </button>
                <button 
                  onClick={() => setTokenSubTab("trial")}
                  className={`px-4 py-2 rounded-t-xl text-sm font-semibold transition-colors ${tokenSubTab === "trial" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-card-foreground"}`}
                >
                  Trial Users
                </button>
              </div>

              {/* Daftar Token Aktif */}
              <div className="mt-4 pt-4 max-h-48 overflow-y-auto pr-2 space-y-2">
                {tokens.filter(t => tokenSubTab === "premium" ? !t.isTrial : t.isTrial).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Belum ada {tokenSubTab === "premium" ? "token premium" : "pengguna trial"}.</p>
                ) : (
                  tokens.filter(t => tokenSubTab === "premium" ? !t.isTrial : t.isTrial).map((tokenObj, idx) => {
                    const codeStr = typeof tokenObj.code === 'string' ? tokenObj.code : String(tokenObj.code || '');
                    const labelStr = typeof tokenObj.label === 'string' ? tokenObj.label : String(tokenObj.label || 'Lifetime');
                    const maxDev = Number(tokenObj.maxDevices) || 1;
                    const devIdStr = typeof tokenObj.deviceId === 'string' ? tokenObj.deviceId : String(tokenObj.deviceId || '');
                    const devCount = Array.isArray(tokenObj.deviceIds) ? tokenObj.deviceIds.length : (devIdStr ? 1 : 0);
                    const formattedExp = formatDateSafe(tokenObj.expiresAt);

                    return (
                      <div key={idx} className="flex items-center justify-between bg-muted p-3 rounded-xl border border-border">
                        <div>
                          <span className="font-mono text-yellow-400 font-bold block">{codeStr}</span>
                          <span className="text-xs text-muted-foreground">
                            Durasi: {labelStr} 
                            {formattedExp ? ` (Exp: ${formattedExp})` : ''}
                          </span>
                          {maxDev > 1 && (
                            <span className="text-xs text-yellow-500 block mt-1">
                              Batas Perangkat: {maxDev} TV
                            </span>
                          )}
                          {((tokenObj.deviceIds && tokenObj.deviceIds.length > 0) || devIdStr) && (
                            <span 
                              onClick={() => {
                                navigator.clipboard.writeText(devIdStr);
                                alert('Device ID disalin: ' + devIdStr);
                              }}
                              className="text-xs font-bold text-purple-300 mt-1 flex items-center gap-1 cursor-pointer hover:text-red-300 transition-colors w-fit"
                              title="Klik untuk menyalin Device ID lengkap"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                              Terhubung ({devCount}/{maxDev})
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {tokenObj.isTrial && (
                            <button 
                              onClick={() => upgradeTrialToPremium(codeStr)}
                              className="text-indigo-400 hover:text-indigo-300 text-sm font-bold bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1 rounded-lg transition-colors"
                            >
                              Upgrade Premium
                            </button>
                          )}
                          {devIdStr && (
                            <button 
                              onClick={() => resetTokenDevice(codeStr)}
                              className="text-yellow-500 hover:text-yellow-400 text-sm font-bold bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1 rounded-lg transition-colors"
                              title="Hapus kaitan dengan TV lama"
                            >
                              Reset TV
                            </button>
                          )}
                          <button 
                            onClick={() => handleSendInbox(codeStr)}
                            className="text-green-500 hover:text-green-400 text-sm font-bold bg-green-500/10 hover:bg-green-500/20 px-3 py-1 rounded-lg transition-colors"
                          >
                            Pesan
                          </button>
                          {!tokenObj.isTrial && (
                            <button 
                              onClick={() => startEditToken(tokenObj)}
                              className="text-blue-500 hover:text-blue-400 text-sm font-bold bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                          )}
                          <button 
                            onClick={() => removeToken(codeStr)}
                            className="text-primary hover:text-purple-300 text-sm font-bold bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1 rounded-lg transition-colors"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Hapus token untuk mengeluarkan pengguna (logout) dari TV mereka. Gunakan <b>Reset TV</b> jika pengguna membeli TV baru.</p>
            </div>
          </div>
              </>
            )}
            {activeTab === "chat" && (
              <>
              {/* Card: Chat Moderation */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-pink-500" />
                <h2 className="text-lg font-semibold">Moderasi Live Chat</h2>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-2 bg-background rounded-xl border border-border">
                <span className="text-sm font-medium">{chatEnabled ? 'Chat Aktif' : 'Chat Dimatikan'}</span>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={chatEnabled}
                    onChange={(e) => setChatEnabled(e.target.checked)}
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${chatEnabled ? 'bg-pink-500' : 'bg-gray-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${chatEnabled ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 bg-background p-4 rounded-xl border border-border">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Badge Admin</label>
                  <input
                    type="text"
                    value={adminBadgeIcon}
                    onChange={(e) => setAdminBadgeIcon(e.target.value)}
                    className="w-20 bg-background border border-border text-foreground rounded-lg p-2 focus:outline-none focus:border-pink-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Warna</label>
                  <input
                    type="color"
                    value={adminBadgeColor}
                    onChange={(e) => setAdminBadgeColor(e.target.value)}
                    className="w-10 h-10 p-1 bg-background border border-border rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-xs text-muted-foreground mb-1">Efek Animasi</label>
                  <select
                    value={isCustomEffect(adminNameEffect) ? 'CUSTOM' : (adminNameEffect || 'NONE')}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setAdminNameEffect('https://');
                      } else {
                        setAdminNameEffect(e.target.value);
                      }
                    }}
                    className="h-10 bg-background border border-border text-foreground rounded-lg px-2 focus:outline-none focus:border-pink-500 text-sm"
                  >
                    <option value="NONE">Normal</option>
                    <option value="GLITCH">⚡ Glitch</option>
                    <option value="SPARKLE">✨ Sparkle</option>
                    <option value="NEON">🔮 Neon Glow</option>
                    <option value="RAINBOW">🌈 Rainbow</option>
                    <option value="WAVY">🌊 Wavy Bounce</option>
                    <option value="CUSTOM">🎨 Custom GIF URL...</option>
                  </select>
                  {isCustomEffect(adminNameEffect) && (
                    <input
                      type="url"
                      value={adminNameEffect || ''}
                      onChange={(e) => setAdminNameEffect(e.target.value)}
                      placeholder="https://..."
                      className="bg-background border border-border text-foreground rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-pink-500 w-32"
                    />
                  )}
                </div>
              </div>

              <div className="bg-background border border-border rounded-xl p-4 h-64 overflow-y-auto flex flex-col gap-2">
                {chatMessages.length === 0 ? (
                  <div className="text-muted-foreground text-center m-auto">Belum ada pesan chat</div>
                ) : (
                  chatMessages.map((msg) => {
                    const senderStr = typeof msg.sender === 'string' ? msg.sender : (typeof msg.sender === 'object' ? JSON.stringify(msg.sender) : String(msg.sender || 'User'));
                    const messageStr = typeof msg.message === 'string' ? msg.message : (typeof msg.message === 'object' && msg.message !== null ? ((msg.message as any).text || (msg.message as any).msg || JSON.stringify(msg.message)) : String(msg.message || ''));
                    const timestampNum = typeof msg.timestamp === 'number' ? msg.timestamp : (Number(msg.timestamp) || Date.now());

                    return (
                      <div key={msg.id} className="flex justify-between items-start group hover:bg-card p-2 rounded-lg transition-colors">
                        <div>
                          <span className="font-bold text-sm text-blue-400 mr-2">{senderStr.split('|')[0]}</span>
                          <span className="text-sm text-card-foreground">{messageStr}</span>
                          <div className="text-xs text-gray-600 mt-1">{formatDateSafe(timestampNum) || "Baru saja"}</div>
                        </div>
                        <button onClick={() => handleDeleteChat(msg.id)} className="text-primary opacity-50 group-hover:opacity-100 hover:text-purple-300 p-2">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => handleDeleteChat('all')} className="bg-purple-500/20 hover:bg-purple-500/30 text-primary p-3 rounded-xl transition-colors" title="Hapus Semua Chat">
                  <Trash2 className="w-5 h-5" />
                </button>
                <form onSubmit={handleSendChat} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Kirim pesan sebagai Admin..."
                    className="flex-1 bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-foreground px-4 rounded-xl transition-colors">
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
              </>
            )}
            {activeTab === "settings" && (
              <div className="space-y-8">
                {/* Card 4: Notifikasi / Marquee */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Bell className="text-green-500" />
              <h2 className="text-lg font-semibold">Teks Berjalan (Marquee)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm text-muted-foreground mb-2">Isi Pesan (Pengumuman / Marquee)</label>
                <input
                  type="text"
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  placeholder="Contoh: Selamat datang di KIMTV..."
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Warna Teks Marquee</label>
                <div className="flex gap-4">
                  <input
                    type="color"
                    value={notificationColor}
                    onChange={(e) => setNotificationColor(e.target.value)}
                    className="w-14 h-12 rounded cursor-pointer bg-background border-0 p-0"
                  />
                  <input
                    type="text"
                    value={notificationColor}
                    onChange={(e) => setNotificationColor(e.target.value)}
                    className="flex-1 bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors uppercase"
                    placeholder="#FFFFFF"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">Tampilkan Marquee?</label>
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-background rounded-xl border border-border">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only" 
                      checked={notificationEnabled}
                      onChange={(e) => setNotificationEnabled(e.target.checked)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${notificationEnabled ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${notificationEnabled ? 'transform translate-x-4' : ''}`}></div>
                  </div>
                  <span className="text-sm font-medium">{notificationEnabled ? 'Aktif' : 'Mati'}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Card: Konfigurasi Teks Aplikasi */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6 mt-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Tv className="text-primary" />
              <h2 className="text-lg font-semibold">Teks Logo Aplikasi</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Nama Aplikasi (Tampil di Menu Utama & Settings)</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="KIMTV"
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Card: Konfigurasi Update & Kontak */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6 mt-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Globe className="text-blue-500" />
              <h2 className="text-lg font-semibold">Konfigurasi Sistem TV</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">URL Kontak Admin (WhatsApp/Telegram)</label>
                <input
                  type="text"
                  value={adminContactUrl}
                  onChange={(e) => setAdminContactUrl(e.target.value)}
                  placeholder="https://wa.me/..."
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-2">Ditampilkan sebagai QR Code di layar Profil aplikasi TV.</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">URL Update APK</label>
                <input
                  type="text"
                  value={apkUpdateUrl}
                  onChange={(e) => setApkUpdateUrl(e.target.value)}
                  placeholder="https://example.com/app.apk"
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-2">Aplikasi akan mengunduh dari link ini jika ada update.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Versi Aplikasi Terbaru (Version Code)</label>
                <input
                  type="number"
                  value={latestVersionCode}
                  onChange={(e) => setLatestVersionCode(parseInt(e.target.value) || 1)}
                  placeholder="6"
                  className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-xs text-muted-foreground mt-2">Isikan angka versi (Contoh: Aplikasi Anda saat ini versi 5.1 dengan Version Code = 6).</p>
              </div>
            </div>
          </div>

              {/* Pre-roll Ads Settings */}
              <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <PlaySquare className="text-green-500" />
                  <h2 className="text-lg font-semibold">Iklan Pembuka (Pre-roll Ad)</h2>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="text-sm text-muted-foreground font-medium">Aktifkan Iklan Video?</label>
                  <button
                    onClick={() => setPrerollAdEnabled(!prerollAdEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${prerollAdEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${prerollAdEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-2 mt-4">
                  <label className="block text-sm text-muted-foreground mb-2">URL Video Iklan (MP4/HLS)</label>
                  <input 
                    type="url"
                    value={prerollAdUrl}
                    onChange={(e) => setPrerollAdUrl(e.target.value)}
                    placeholder="https://example.com/ad.mp4"
                    className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Video iklan akan diputar sebelum tayangan TV dimulai.</p>
                </div>
              </div>

                {/* Card 3: Wallpaper TV */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <ImageIcon className="text-primary" />
              <h2 className="text-lg font-semibold">Wallpaper TV (Background)</h2>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">URL Gambar Latar Belakang</label>
              <input
                type="url"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="https://contoh.com/gambar-bagus.jpg"
                className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2 mb-4">Kosongkan kolom ini jika ingin menggunakan wallpaper bawaan aplikasi.</p>

              <label className="block text-sm text-muted-foreground mb-2 border-t border-border pt-4">URL Banner Promo (Pop-up Sambutan)</label>
              <input
                type="url"
                value={welcomeBannerUrl}
                onChange={(e) => setWelcomeBannerUrl(e.target.value)}
                placeholder="https://contoh.com/promo-diskon.jpg"
                className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">Gambar akan muncul sekali setiap pengguna membuka aplikasi TV. Kosongkan untuk mematikan.</p>
            </div>
          </div>

          
                {/* Card: Auto Update */}
          <div className="bg-card  border-r border-border p-6 rounded-xl border border-border space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <RefreshCcw className="text-cyan-500" />
              <h2 className="text-lg font-semibold">Auto-Update Aplikasi TV</h2>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Versi Aplikasi Terbaru (Version Code)</label>
              <input
                type="number"
                value={latestVersionCode}
                onChange={(e) => setLatestVersionCode(parseInt(e.target.value) || 1)}
                className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-cyan-500 transition-colors mb-4"
              />
              <label className="block text-sm text-muted-foreground mb-2">URL Download APK Terbaru</label>
              <input
                type="url"
                value={apkUpdateUrl}
                onChange={(e) => setApkUpdateUrl(e.target.value)}
                placeholder="https://contoh.com/KIMTV_v2.apk"
                className="w-full bg-background border border-border text-foreground rounded-xl p-3 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <p className="text-xs text-muted-foreground mt-2">Ubah version code lebih tinggi dari aplikasi TV (saat ini biasanya 1) agar TV menampilkan popup Update.</p>
            </div>
          </div>

          
                {/* Card 5: Maintenance Mode */}
          <div className={`p-6 rounded-xl border transition-all ${isMaintenance ? 'bg-purple-900/30 border-purple-500' : 'bg-card  border-r border-border'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${isMaintenance ? 'bg-primary text-primary-foreground' : 'bg-gray-800'}`}>
                  <AlertTriangle className={`w-8 h-8 ${isMaintenance ? 'text-foreground' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-1">MODE PERBAIKAN (MAINTENANCE)</h2>
                  <p className="text-muted-foreground text-sm">Kunci semua aplikasi TV pengguna jika server sedang mati atau diperbaiki.</p>
                </div>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input 
                    type="checkbox" 
                    className="sr-only" 
                    checked={isMaintenance}
                    onChange={(e) => setIsMaintenance(e.target.checked)}
                  />
                  <div className={`block w-16 h-8 rounded-full transition-colors ${isMaintenance ? 'bg-primary text-primary-foreground' : 'bg-gray-700'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isMaintenance ? 'transform translate-x-8' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>

        
              </div>
            )}
            </div>
          </DashboardErrorBoundary>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card  border-r border-border border-t border-border flex justify-around p-2 z-50 pb-[env(safe-area-inset-bottom)]">
        {[
          { id: "overview", label: "Beranda", icon: Activity },
          { id: "analytics", label: "Analisis", icon: PieChart },
          { id: "playlist", label: "M3U", icon: Globe },
          { id: "tokens", label: "Token", icon: Key },
          { id: "chat", label: "Chat", icon: MessageSquare },
          { id: "settings", label: "Setelan", icon: ShieldAlert }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-colors ${
              activeTab === tab.id 
                ? "text-primary" 
                : "text-muted-foreground hover:text-card-foreground"
            }`}
          >
            <tab.icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}