"use client";

import { useState, useEffect } from "react";
import { Tv, ShieldAlert, Key, Save, Globe, RefreshCcw, Bell, AlertTriangle, Image as ImageIcon, MessageSquare, Trash2, Send, Activity, Users, PlaySquare, TrendingUp } from "lucide-react";

export default function AdminPanel() {
  const [adminPassword, setAdminPassword] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
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
  }

  const [tokens, setTokens] = useState<TokenObject[]>([]); // Ganti accessCode jadi tokens
  const [customTokenInput, setCustomTokenInput] = useState(""); // Input untuk token custom
  const [tokenDuration, setTokenDuration] = useState("lifetime");
  const [notificationText, setNotificationText] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [welcomeBannerUrl, setWelcomeBannerUrl] = useState("");
  const [latestVersionCode, setLatestVersionCode] = useState(1);
  const [apkUpdateUrl, setApkUpdateUrl] = useState("");
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
  const [editingTokenCode, setEditingTokenCode] = useState<string | null>(null);

  const [activeUsers, setActiveUsers] = useState<{ token: string; channel: string; lastSeen: number }[]>([]);
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
        if (data) {
          setM3uUrl(data.m3uUrl || "");
          setM3uUrl2(data.m3uUrl2 || "");
          setM3uUrl3(data.m3uUrl3 || "");
          setM3uName(data.m3uName || "");
          setM3uName2(data.m3uName2 || "");
          setM3uName3(data.m3uName3 || "");
          setEpgUrl(data.epgUrl || "");
          setProxyUrl(data.proxyUrl || "");
          setCustomChannels(data.customChannels || []);
          
          // Migrasi otomatis jika masih pakai accessCode lama
          if (data.tokens && Array.isArray(data.tokens)) {
            const mappedTokens = data.tokens.map((t: TokenObject | string) => {
              if (typeof t === 'string') {
                return { code: t, expiresAt: null, label: "Lifetime" };
              }
              return t;
            });
            setTokens(mappedTokens);
          } else if (data.accessCode) {
            setTokens([{ code: data.accessCode, expiresAt: null, label: "Lifetime" }]);
          } else {
            setTokens([]);
          }

          setNotificationText(data.notificationText || "");
          setNotificationEnabled(data.notificationEnabled || false);
          setBackgroundUrl(data.backgroundUrl || "");
          setWelcomeBannerUrl(data.welcomeBannerUrl || "");
          setLatestVersionCode(data.latestVersionCode || 1);
          setApkUpdateUrl(data.apkUpdateUrl || "");
          setIsMaintenance(data.isMaintenance || false);
          setPrerollAdUrl(data.prerollAdUrl || "");
          setPrerollAdEnabled(data.prerollAdEnabled || false);
          setChatEnabled(data.chatEnabled !== false); // default true if not set
          setAdminBadgeIcon(data.adminBadgeIcon || "🔧");
          setAdminBadgeColor(data.adminBadgeColor || "#FF00FF");
          setAdminNameEffect(data.adminNameEffect || "NONE");
          setAppName(data.appName || "KIMTV");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim() !== "") {
      setIsAuthenticated(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchChats = () => {
        fetch("/api/chats")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) setChatMessages(data);
          })
          .catch(() => {});
      };
      const fetchPresence = () => {
        fetch("/api/presence")
          .then(res => res.json())
          .then(data => {
            if (data.users) {
              setActiveUsers(data.users);
              setActiveUsersCount(data.count);
            }
          })
          .catch(() => {});
      };
      const fetchStats = () => {
        fetch("/api/stats")
          .then(res => res.json())
          .then(data => {
            if (data && !data.error) {
              const statsArray = Object.keys(data).map(key => ({
                name: decodeURIComponent(key),
                count: data[key]
              }));
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
      setTokens([...tokens, { code: token, badgeIcon: tokenBadgeIcon, badgeColor: tokenBadgeColor, nameEffect: tokenNameEffect, ...getExpirationParams(tokenDuration) }]);
    }
  };

  const addCustomToken = () => {
    const cleanToken = customTokenInput.trim();
    if (editingTokenCode) {
      if (cleanToken !== "") {
        setTokens(tokens.map(t => t.code === editingTokenCode ? { ...t, code: cleanToken, badgeIcon: tokenBadgeIcon, badgeColor: tokenBadgeColor, nameEffect: tokenNameEffect } : t));
        setEditingTokenCode(null);
        setCustomTokenInput("");
      }
    } else {
      if (cleanToken !== "" && !tokens.some(t => t.code === cleanToken)) {
        setTokens([...tokens, { code: cleanToken, badgeIcon: tokenBadgeIcon, badgeColor: tokenBadgeColor, nameEffect: tokenNameEffect, deviceId: "", ...getExpirationParams(tokenDuration) }]);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removeToken = (tokenToRemove: string) => {
    setTokens(tokens.filter(t => t.code !== tokenToRemove));
  };

  const resetTokenDevice = (tokenCode: string) => {
    setTokens(tokens.map(t => t.code === tokenCode ? { ...t, deviceId: "" } : t));
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
          notificationEnabled,
          backgroundUrl,
          welcomeBannerUrl,
          latestVersionCode,
          apkUpdateUrl,
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <RefreshCcw className="animate-spin w-8 h-8 text-red-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#110000] to-[#000000] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-red-600/20 p-4 rounded-full">
              <Tv className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-white mb-2">KIMTV Admin Panel</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Silakan masukkan password admin untuk melanjutkan.</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <div className="relative">
                <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-600 to-red-800 text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Key className="w-5 h-5" /> Masuk Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-4 border-b border-white/5">
          <div className="bg-red-600 p-2 rounded-xl">
            <Tv className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">{appName}<span className="text-red-500">.</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "playlist", label: "Playlist M3U", icon: Globe },
            { id: "tokens", label: "Akses & Token", icon: Key },
            { id: "chat", label: "Live Chat", icon: MessageSquare },
            { id: "settings", label: "Pengaturan", icon: ShieldAlert }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === tab.id 
                  ? "bg-red-600/10 text-red-500 border border-red-500/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 md:h-20 bg-[#111]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10 gap-2">
          <div className="flex-1 overflow-hidden">
            <h2 className="text-base md:text-xl font-bold capitalize truncate">
              {activeTab === "overview" && "Dashboard Analytics"}
              {activeTab === "playlist" && "M3U Playlist Configuration"}
              {activeTab === "tokens" && "Access & Token Management"}
              {activeTab === "chat" && "Live Chat Moderation"}
              {activeTab === "settings" && "Global App Settings"}
            </h2>
            <p className="text-sm text-gray-500 hidden md:block">Kelola pengaturan aplikasi secara real-time</p>
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 md:py-2.5 md:px-6 rounded-xl transition-all flex items-center gap-1 md:gap-2 disabled:opacity-50 shadow-lg shadow-red-900/20 flex-shrink-0"
          >
            {saving ? <RefreshCcw className="animate-spin w-4 h-4 md:w-5 md:h-5" /> : <Save className="w-4 h-4 md:w-5 md:h-5" />}
            <span className="text-sm md:text-base hidden md:inline">{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
            <span className="text-sm md:hidden">{saving ? "Simpan..." : "Simpan"}</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12">
            {activeTab === "overview" && (
              <>
              {/* Card: Top Channels */}
              <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4 mb-8">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <TrendingUp className="text-purple-500" />
                  <h2 className="text-lg font-semibold">Top 5 Channel Terpopuler</h2>
                </div>
                {channelStats.length === 0 ? (
                  <div className="text-center text-gray-500 py-4 text-sm bg-white/5 rounded-xl">
                    Belum ada data statistik channel.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {channelStats.map((stat, i) => (
                      <div key={stat.name} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-gray-400/20 text-gray-400' : i === 2 ? 'bg-orange-600/20 text-orange-500' : 'bg-white/10 text-gray-400'}`}>
                            #{i + 1}
                          </div>
                          <span className="font-medium text-gray-200">{stat.name}</span>
                        </div>
                        <div className="text-sm font-bold bg-white/10 px-3 py-1 rounded-lg">
                          {stat.count} klik
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 0: Analytics Dashboard */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 p-6 rounded-3xl border border-blue-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <Activity className="text-blue-400" />
                <h2 className="text-lg font-semibold text-blue-100">Analitik Pengguna Aktif</h2>
              </div>
              <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-xl font-bold">
                <Users className="w-4 h-4" />
                <span>{activeUsersCount} Online</span>
              </div>
            </div>
            
            <div className="bg-black/40 rounded-xl p-4 min-h-[100px] max-h-64 overflow-y-auto">
              {activeUsers.length === 0 ? (
                <div className="text-center text-gray-500 py-6">Belum ada perangkat TV yang terhubung saat ini.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeUsers.map((user, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                      <div>
                        <div className="font-mono text-sm text-yellow-400 font-bold">{user.token}</div>
                        <div className="text-xs text-gray-400 mt-1">📺 Menonton: <span className="text-white">{user.channel}</span></div>
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="text-xs font-bold text-gray-500">
                          {now ? Math.floor((now - user.lastSeen) / 1000) : 0}s lalu
                        </div>
                        <button onClick={() => handleKick(user.token)} className="text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500/50 p-1.5 rounded-lg text-xs font-bold transition-colors">
                          KICK
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
              </>
            )}
            {activeTab === "playlist" && (
              <>
              {/* Card 1: Playlist M3U Multi-Server */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
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
                  className="w-full bg-black/50 border border-blue-500/30 text-white rounded-xl p-3 mb-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="url"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                  placeholder="https://server1.com/list.m3u"
                  className="w-full bg-black/50 border border-blue-500/30 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Server Cadangan 1</label>
                <input
                  type="text"
                  value={m3uName2}
                  onChange={(e) => setM3uName2(e.target.value)}
                  placeholder="Nama (opsional, cth: Server Cadangan)"
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 mb-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="url"
                  value={m3uUrl2}
                  onChange={(e) => setM3uUrl2(e.target.value)}
                  placeholder="https://server2.com/list.m3u"
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Server Cadangan 2</label>
                <input
                  type="text"
                  value={m3uName3}
                  onChange={(e) => setM3uName3(e.target.value)}
                  placeholder="Nama (opsional, cth: Server 3)"
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 mb-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <input
                  type="url"
                  value={m3uUrl3}
                  onChange={(e) => setM3uUrl3(e.target.value)}
                  placeholder="https://server3.com/list.m3u"
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 mb-6">Jika Server Utama gagal dimuat, aplikasi akan otomatis mencoba Server Cadangan tanpa sepengetahuan pengguna.</p>
            
            <div className="border-t border-white/10 pt-4 mt-2">
              <label className="block text-sm font-bold text-green-400 mb-2">Global EPG URL (Jadwal Tayangan XMLTV)</label>
              <input
                type="url"
                value={epgUrl}
                onChange={(e) => setEpgUrl(e.target.value)}
                placeholder="https://example.com/epg.xml"
                className="w-full bg-black/50 border border-green-500/30 text-white rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">Opsional. Jika diisi, semua aplikasi TV akan otomatis menggunakan jadwal (EPG) dari URL ini dan menimpa pengaturan EPG manual di dalam aplikasi TV.</p>
            </div>

            <div className="border-t border-white/10 pt-4 mt-2">
              <label className="block text-sm font-bold text-purple-400 mb-2">Global Stream Proxy URL (Cloudflare Worker)</label>
              <input
                type="url"
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
                placeholder="https://proxy.namakamu.workers.dev/"
                className="w-full bg-black/50 border border-purple-500/30 text-white rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">Opsional. Jika diisi, channel dengan DRM atau Referer akan otomatis dirutekan melalui proxy ini untuk melewati pemblokiran.</p>
            </div>

            <div className="border-t border-white/10 pt-4 mt-6">
              <div className="flex items-center gap-3 mb-4">
                <Tv className="text-orange-500" />
                <h2 className="text-lg font-semibold">Custom Channels (Manual)</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">Tambahkan channel sendiri tanpa perlu mengedit file M3U. Channel ini akan digabungkan otomatis ke daftar tayangan di TV.</p>
              
              <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="text" placeholder="Nama Channel (Wajib)" className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500"
                    value={editingCustomChannel?.name || ""}
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, name: e.target.value})} />
                  <select 
                    value={editingCustomChannel?.type || "direct"} 
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, type: e.target.value})}
                    className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500">
                    <option value="direct">Direct Stream (m3u8/mp4)</option>
                    <option value="embed">Embed Code / Iframe</option>
                  </select>
                  
                  {editingCustomChannel?.type === "embed" ? (
                    <textarea 
                      placeholder="Masukkan kode Iframe HTML atau URL webpage di sini (Wajib)" 
                      className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500 md:col-span-2 min-h-[100px]"
                      value={editingCustomChannel?.streamUrl || ""}
                      onChange={(e) => setEditingCustomChannel({...editingCustomChannel, streamUrl: e.target.value})}
                    />
                  ) : (
                    <input type="url" placeholder="Stream URL (Wajib)" className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500"
                      value={editingCustomChannel?.streamUrl || ""}
                      onChange={(e) => setEditingCustomChannel({...editingCustomChannel, streamUrl: e.target.value})} />
                  )}

                  <input type="text" placeholder="Grup (Cth: VIP)" className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500"
                    value={editingCustomChannel?.group || ""}
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, group: e.target.value})} />
                  <input type="url" placeholder="Logo URL" className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500"
                    value={editingCustomChannel?.logoUrl || ""}
                    onChange={(e) => setEditingCustomChannel({...editingCustomChannel, logoUrl: e.target.value})} />
                  
                  {editingCustomChannel?.type !== "embed" && (
                    <>
                      <input type="text" placeholder="License Key (opsional)" className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500"
                        value={editingCustomChannel?.licenseKey || ""}
                        onChange={(e) => setEditingCustomChannel({...editingCustomChannel, licenseKey: e.target.value})} />
                      <input type="text" placeholder="User-Agent (opsional)" className="bg-black/50 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-orange-500"
                        value={editingCustomChannel?.userAgent || ""}
                        onChange={(e) => setEditingCustomChannel({...editingCustomChannel, userAgent: e.target.value})} />
                    </>
                  )}
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => setEditingCustomChannel(null)} className="px-3 py-1.5 text-xs rounded-lg bg-gray-500/20 text-white">Batal</button>
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
                  }} className="px-3 py-1.5 text-xs rounded-lg bg-orange-500 text-white font-bold">
                    {editingCustomChannel?.id ? "Simpan Perubahan" : "Tambah Channel"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {customChannels.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">Belum ada custom channel.</p>
                ) : (
                  customChannels.map((c) => (
                    <div key={c.id} className="flex justify-between items-center bg-black/40 p-3 rounded-lg border border-white/5">
                      <div>
                        <div className="font-bold text-orange-400 text-sm">{c.name} {c.type === 'embed' && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1 ml-1 rounded">EMBED</span>}</div>
                        <div className="text-xs text-gray-400 truncate max-w-[200px] md:max-w-[400px]">{c.streamUrl}</div>
                        {c.group && <div className="text-[10px] bg-white/10 inline-block px-1.5 rounded mt-1">{c.group}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingCustomChannel(c)} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/40">Edit</button>
                        <button onClick={() => setCustomChannels(customChannels.filter(x => x.id !== c.id))} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/40">Hapus</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
              </>
            )}
            {activeTab === "tokens" && (
              <>
              {/* Card 2: Keamanan Akses (Multi-Token) */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
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
                <label className="block text-sm text-gray-400">Buat Token Custom</label>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={tokenDuration}
                    onChange={(e) => setTokenDuration(e.target.value)}
                    className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-yellow-500 text-sm"
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
                    className="flex-1 bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-yellow-500 transition-colors min-w-[150px]"
                  />
                  <input
                    type="text"
                    value={tokenBadgeIcon}
                    onChange={(e) => setTokenBadgeIcon(e.target.value)}
                    placeholder="Badge (cth: 👑)"
                    className="w-32 bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-yellow-500 transition-colors"
                  />
                  <input
                    type="color"
                    value={tokenBadgeColor}
                    onChange={(e) => setTokenBadgeColor(e.target.value)}
                    className="w-12 h-12 p-1 bg-black/50 border border-white/10 rounded-xl cursor-pointer"
                    title="Warna Chat"
                  />
                  <div className="flex flex-col gap-2">
                    <select
                      value={tokenNameEffect.startsWith('http') ? 'CUSTOM' : tokenNameEffect}
                      onChange={(e) => {
                        if (e.target.value === 'CUSTOM') {
                          setTokenNameEffect('https://');
                        } else {
                          setTokenNameEffect(e.target.value);
                        }
                      }}
                      className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-yellow-500 text-sm"
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
                    {tokenNameEffect.startsWith('http') && (
                      <input
                        type="url"
                        value={tokenNameEffect}
                        onChange={(e) => setTokenNameEffect(e.target.value)}
                        placeholder="https://...gif"
                        className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 w-full max-w-[200px]"
                      />
                    )}
                  </div>
                  <button 
                    onClick={addCustomToken}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-3 rounded-xl transition-colors"
                  >
                    {editingTokenCode ? "Simpan" : "Tambah"}
                  </button>
                  {editingTokenCode && (
                    <button 
                      onClick={() => {
                        setEditingTokenCode(null);
                        setCustomTokenInput("");
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-4 py-3 rounded-xl transition-colors"
                    >
                      Batal
                    </button>
                  )}
                </div>
              </div>

              <button 
                onClick={generateRandomToken}
                className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                + Generate Token Acak
              </button>

              {/* Daftar Token Aktif */}
              <div className="mt-4 pt-4 border-t border-white/5 max-h-48 overflow-y-auto pr-2 space-y-2">
                {tokens.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada token. Aplikasi TV akan menolak semua masuk.</p>
                ) : (
                  tokens.map((tokenObj, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                      <div>
                        <span className="font-mono text-yellow-400 font-bold block">{tokenObj.code}</span>
                        <span className="text-xs text-gray-400">
                          Durasi: {tokenObj.label} 
                          {tokenObj.expiresAt ? ` (s.d ${new Date(tokenObj.expiresAt).toLocaleString()})` : ""}
                          {tokenObj.nameEffect && tokenObj.nameEffect !== "NONE" ? ` • Efek: ${tokenObj.nameEffect}` : ""}
                        </span>
                        {tokenObj.deviceId && (
                          <span 
                            onClick={() => {
                              navigator.clipboard.writeText(tokenObj.deviceId || "");
                              alert('Device ID disalin: ' + tokenObj.deviceId);
                            }}
                            className="text-xs font-bold text-red-400 mt-1 flex items-center gap-1 cursor-pointer hover:text-red-300 transition-colors w-fit"
                            title="Klik untuk menyalin Device ID lengkap"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                            Terikat dengan TV (ID: {tokenObj.deviceId.substring(0, 8)}...)
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {tokenObj.deviceId && (
                          <button 
                            onClick={() => resetTokenDevice(tokenObj.code)}
                            className="text-yellow-500 hover:text-yellow-400 text-sm font-bold bg-yellow-500/10 hover:bg-yellow-500/20 px-3 py-1 rounded-lg transition-colors"
                            title="Hapus kaitan dengan TV lama"
                          >
                            Reset TV
                          </button>
                        )}
                        <button 
                          onClick={() => handleSendInbox(tokenObj.code)}
                          className="text-green-500 hover:text-green-400 text-sm font-bold bg-green-500/10 hover:bg-green-500/20 px-3 py-1 rounded-lg transition-colors"
                        >
                          Pesan
                        </button>
                        <button 
                          onClick={() => startEditToken(tokenObj)}
                          className="text-blue-500 hover:text-blue-400 text-sm font-bold bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => removeToken(tokenObj.code)}
                          className="text-red-500 hover:text-red-400 text-sm font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Hapus token untuk mengeluarkan pengguna (logout) dari TV mereka. Gunakan <b>Reset TV</b> jika pengguna membeli TV baru.</p>
            </div>
          </div>
              </>
            )}
            {activeTab === "chat" && (
              <>
              {/* Card: Chat Moderation */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-pink-500" />
                <h2 className="text-lg font-semibold">Moderasi Live Chat</h2>
              </div>
              <label className="flex items-center gap-3 cursor-pointer p-2 bg-black/50 rounded-xl border border-white/10">
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
              <div className="flex items-center gap-4 bg-black/50 p-4 rounded-xl border border-white/10">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Badge Admin</label>
                  <input
                    type="text"
                    value={adminBadgeIcon}
                    onChange={(e) => setAdminBadgeIcon(e.target.value)}
                    className="w-20 bg-black/50 border border-white/10 text-white rounded-lg p-2 focus:outline-none focus:border-pink-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Warna</label>
                  <input
                    type="color"
                    value={adminBadgeColor}
                    onChange={(e) => setAdminBadgeColor(e.target.value)}
                    className="w-10 h-10 p-1 bg-black/50 border border-white/10 rounded-lg cursor-pointer"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="block text-xs text-gray-400 mb-1">Efek Animasi</label>
                  <select
                    value={adminNameEffect.startsWith('http') ? 'CUSTOM' : adminNameEffect}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setAdminNameEffect('https://');
                      } else {
                        setAdminNameEffect(e.target.value);
                      }
                    }}
                    className="h-10 bg-black/50 border border-white/10 text-white rounded-lg px-2 focus:outline-none focus:border-pink-500 text-sm"
                  >
                    <option value="NONE">Normal</option>
                    <option value="GLITCH">⚡ Glitch</option>
                    <option value="SPARKLE">✨ Sparkle</option>
                    <option value="NEON">🔮 Neon Glow</option>
                    <option value="RAINBOW">🌈 Rainbow</option>
                    <option value="WAVY">🌊 Wavy Bounce</option>
                    <option value="CUSTOM">🎨 Custom GIF URL...</option>
                  </select>
                  {adminNameEffect.startsWith('http') && (
                    <input
                      type="url"
                      value={adminNameEffect}
                      onChange={(e) => setAdminNameEffect(e.target.value)}
                      placeholder="https://..."
                      className="bg-black/50 border border-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-pink-500 w-32"
                    />
                  )}
                </div>
              </div>

              <div className="bg-black/50 border border-white/10 rounded-xl p-4 h-64 overflow-y-auto flex flex-col gap-2">
                {chatMessages.length === 0 ? (
                  <div className="text-gray-500 text-center m-auto">Belum ada pesan chat</div>
                ) : (
                  chatMessages.map((msg) => (
                    <div key={msg.id} className="flex justify-between items-start group hover:bg-white/5 p-2 rounded-lg transition-colors">
                      <div>
                        <span className="font-bold text-sm text-blue-400 mr-2">{msg.sender.split('|')[0]}</span>
                        <span className="text-sm text-gray-300">{msg.message}</span>
                        <div className="text-xs text-gray-600 mt-1">{new Date(msg.timestamp).toLocaleString()}</div>
                      </div>
                      <button onClick={() => handleDeleteChat(msg.id)} className="text-red-500 opacity-50 group-hover:opacity-100 hover:text-red-400 p-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex gap-2">
                <button onClick={() => handleDeleteChat('all')} className="bg-red-500/20 hover:bg-red-500/30 text-red-500 p-3 rounded-xl transition-colors" title="Hapus Semua Chat">
                  <Trash2 className="w-5 h-5" />
                </button>
                <form onSubmit={handleSendChat} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Kirim pesan sebagai Admin..."
                    className="flex-1 bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                  <button type="submit" className="bg-pink-600 hover:bg-pink-700 text-white px-4 rounded-xl transition-colors">
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
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Bell className="text-green-500" />
              <h2 className="text-lg font-semibold">Teks Berjalan (Marquee)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                <label className="block text-sm text-gray-400 mb-2">Teks Pengumuman</label>
                <input
                  type="text"
                  value={notificationText}
                  onChange={(e) => setNotificationText(e.target.value)}
                  placeholder="Contoh: Selamat datang di KIMTV..."
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
                />
              </div>
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-black/50 rounded-xl border border-white/10">
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
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6 mt-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Tv className="text-purple-500" />
              <h2 className="text-lg font-semibold">Teks Logo Aplikasi</h2>
            </div>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Nama Aplikasi (Tampil di Menu Utama & Settings)</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="KIMTV"
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>

              {/* Pre-roll Ads Settings */}
              <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
                <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                  <PlaySquare className="text-green-500" />
                  <h2 className="text-lg font-semibold">Iklan Pembuka (Pre-roll Ad)</h2>
                </div>
                
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-400 font-medium">Aktifkan Iklan Video?</label>
                  <button
                    onClick={() => setPrerollAdEnabled(!prerollAdEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${prerollAdEnabled ? 'bg-green-600' : 'bg-gray-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${prerollAdEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="space-y-2 mt-4">
                  <label className="block text-sm text-gray-400 mb-2">URL Video Iklan (MP4/HLS)</label>
                  <input 
                    type="url"
                    value={prerollAdUrl}
                    onChange={(e) => setPrerollAdUrl(e.target.value)}
                    placeholder="https://example.com/ad.mp4"
                    className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-green-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Video iklan akan diputar sebelum tayangan TV dimulai.</p>
                </div>
              </div>

                {/* Card 3: Wallpaper TV */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <ImageIcon className="text-purple-500" />
              <h2 className="text-lg font-semibold">Wallpaper TV (Background)</h2>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">URL Gambar Latar Belakang</label>
              <input
                type="url"
                value={backgroundUrl}
                onChange={(e) => setBackgroundUrl(e.target.value)}
                placeholder="https://contoh.com/gambar-bagus.jpg"
                className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2 mb-4">Kosongkan kolom ini jika ingin menggunakan wallpaper bawaan aplikasi.</p>

              <label className="block text-sm text-gray-400 mb-2 border-t border-white/10 pt-4">URL Banner Promo (Pop-up Sambutan)</label>
              <input
                type="url"
                value={welcomeBannerUrl}
                onChange={(e) => setWelcomeBannerUrl(e.target.value)}
                placeholder="https://contoh.com/promo-diskon.jpg"
                className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">Gambar akan muncul sekali setiap pengguna membuka aplikasi TV. Kosongkan untuk mematikan.</p>
            </div>
          </div>

          
                {/* Card: Auto Update */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <RefreshCcw className="text-cyan-500" />
              <h2 className="text-lg font-semibold">Auto-Update Aplikasi TV</h2>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Versi Aplikasi Terbaru (Version Code)</label>
              <input
                type="number"
                value={latestVersionCode}
                onChange={(e) => setLatestVersionCode(parseInt(e.target.value) || 1)}
                className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500 transition-colors mb-4"
              />
              <label className="block text-sm text-gray-400 mb-2">URL Download APK Terbaru</label>
              <input
                type="url"
                value={apkUpdateUrl}
                onChange={(e) => setApkUpdateUrl(e.target.value)}
                placeholder="https://contoh.com/KIMTV_v2.apk"
                className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <p className="text-xs text-gray-500 mt-2">Ubah version code lebih tinggi dari aplikasi TV (saat ini biasanya 1) agar TV menampilkan popup Update.</p>
            </div>
          </div>

          
                {/* Card 5: Maintenance Mode */}
          <div className={`p-6 rounded-3xl border transition-all ${isMaintenance ? 'bg-red-900/30 border-red-500' : 'bg-[#111] border-white/5'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${isMaintenance ? 'bg-red-600' : 'bg-gray-800'}`}>
                  <AlertTriangle className={`w-8 h-8 ${isMaintenance ? 'text-white' : 'text-gray-500'}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">MODE PERBAIKAN (MAINTENANCE)</h2>
                  <p className="text-gray-400 text-sm">Kunci semua aplikasi TV pengguna jika server sedang mati atau diperbaiki.</p>
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
                  <div className={`block w-16 h-8 rounded-full transition-colors ${isMaintenance ? 'bg-red-600' : 'bg-gray-700'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${isMaintenance ? 'transform translate-x-8' : ''}`}></div>
                </div>
              </label>
            </div>
          </div>

        
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 flex justify-around p-2 z-50 pb-[env(safe-area-inset-bottom)]">
        {[
          { id: "overview", label: "Beranda", icon: Activity },
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
                ? "text-red-500" 
                : "text-gray-500 hover:text-gray-300"
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