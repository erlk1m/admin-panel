"use client";

import { useState, useEffect } from "react";
import { Tv, ShieldAlert, Key, Save, Globe, RefreshCcw, Bell, AlertTriangle, Image as ImageIcon, MessageSquare, Trash2, Send, Activity, Users } from "lucide-react";

export default function AdminPanel() {
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [m3uUrl, setM3uUrl] = useState("");
  const [m3uUrl2, setM3uUrl2] = useState("");
  const [m3uUrl3, setM3uUrl3] = useState("");
  interface TokenObject {
    code: string;
    expiresAt: number | null;
    label: string;
    badgeIcon?: string;
    badgeColor?: string;
    nameEffect?: string;
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

  const [chatEnabled, setChatEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  const [adminBadgeIcon, setAdminBadgeIcon] = useState("🔧");
  const [adminBadgeColor, setAdminBadgeColor] = useState("#FF00FF");
  const [adminNameEffect, setAdminNameEffect] = useState("NONE");

  const [tokenBadgeIcon, setTokenBadgeIcon] = useState("");
  const [tokenBadgeColor, setTokenBadgeColor] = useState("#FFD700");
  const [tokenNameEffect, setTokenNameEffect] = useState("NONE");

  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  useEffect(() => {
    // Coba ambil config yang ada (publik)
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setM3uUrl(data.m3uUrl || "");
          setM3uUrl2(data.m3uUrl2 || "");
          setM3uUrl3(data.m3uUrl3 || "");
          
          // Migrasi otomatis jika masih pakai accessCode lama
          if (data.tokens && Array.isArray(data.tokens)) {
            const mappedTokens = data.tokens.map((t: any) => {
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
          setChatEnabled(data.chatEnabled !== false); // default true if not set
          setAdminBadgeIcon(data.adminBadgeIcon || "🔧");
          setAdminBadgeColor(data.adminBadgeColor || "#FF00FF");
          setAdminNameEffect(data.adminNameEffect || "NONE");
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
      fetchChats();
      fetchPresence();
      const chatInterval = setInterval(fetchChats, 3000);
      const presenceInterval = setInterval(fetchPresence, 10000);
      return () => {
        clearInterval(chatInterval);
        clearInterval(presenceInterval);
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
    } catch (e) {}
  };

  const handleDeleteChat = async (id: string) => {
    if (id === 'all' && !confirm("Yakin ingin menghapus semua pesan chat?")) return;
    try {
      await fetch(`/api/chats?id=${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
    } catch (e) {}
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
    } catch (e) {
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
    if (cleanToken !== "" && !tokens.some(t => t.code === cleanToken)) {
      setTokens([...tokens, { code: cleanToken, badgeIcon: tokenBadgeIcon, badgeColor: tokenBadgeColor, nameEffect: tokenNameEffect, ...getExpirationParams(tokenDuration) }]);
      setCustomTokenInput("");
    }
  };

  const removeToken = (tokenToRemove: string) => {
    setTokens(tokens.filter(t => t.code !== tokenToRemove));
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
          tokens, // Kirim array tokens
          notificationText,
          notificationEnabled,
          backgroundUrl,
          welcomeBannerUrl,
          latestVersionCode,
          apkUpdateUrl,
          isMaintenance,
          chatEnabled,
          adminBadgeIcon,
          adminBadgeColor,
          adminNameEffect,
        }),
      });

      if (res.ok) {
        alert("Pengaturan berhasil disimpan ke Firebase!");
      } else {
        const err = await res.json();
        alert("Gagal menyimpan: " + (err.error || "Password Admin Salah!"));
        if (res.status === 401) setIsAuthenticated(false);
      }
    } catch (e) {
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
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between bg-[#111] p-6 rounded-3xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-3 rounded-2xl">
              <Tv className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">KIMTV Dashboard</h1>
              <p className="text-gray-400 text-sm">Kelola pengaturan aplikasi Android secara real-time</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            Logout
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Card 0: Analytics Dashboard */}
          <div className="bg-gradient-to-br from-blue-900/40 to-blue-900/10 p-6 rounded-3xl border border-blue-500/20 space-y-4 md:col-span-2">
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
                          {Math.floor((Date.now() - user.lastSeen) / 1000)}s lalu
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
          
          {/* Card 1: Playlist M3U Multi-Server */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4 mb-4">
              <Globe className="text-blue-500" />
              <h2 className="text-lg font-semibold">Multi-Server Playlist (M3U)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-blue-400 mb-2">Server Utama</label>
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
                  type="url"
                  value={m3uUrl3}
                  onChange={(e) => setM3uUrl3(e.target.value)}
                  placeholder="https://server3.com/list.m3u"
                  className="w-full bg-black/50 border border-white/10 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Jika Server Utama gagal dimuat, aplikasi akan otomatis mencoba Server Cadangan tanpa sepengetahuan pengguna.</p>
          </div>

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
                  <select
                    value={tokenNameEffect}
                    onChange={(e) => setTokenNameEffect(e.target.value)}
                    className="bg-black/50 border border-white/10 text-white rounded-xl px-3 py-3 focus:outline-none focus:border-yellow-500 text-sm"
                    title="Efek Nama (Glitch/Sparkle)"
                  >
                    <option value="NONE">Normal</option>
                    <option value="GLITCH">⚡ Glitch</option>
                    <option value="SPARKLE">✨ Sparkle</option>
                    <option value="NEON">🔮 Neon Glow</option>
                    <option value="RAINBOW">🌈 Rainbow</option>
                    <option value="WAVY">🌊 Wavy Bounce</option>
                  </select>
                  <button 
                    onClick={addCustomToken}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-4 py-3 rounded-xl transition-colors"
                  >
                    Tambah
                  </button>
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
                      </div>
                      <button 
                        onClick={() => removeToken(tokenObj.code)}
                        className="text-red-500 hover:text-red-400 text-sm font-bold bg-red-500/10 hover:bg-red-500/20 px-3 py-1 rounded-lg transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Hapus token untuk langsung mengeluarkan pengguna (logout) dari TV mereka.</p>
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

          {/* Card 4: Notifikasi / Marquee */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6 md:col-span-2">
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

          {/* Card: Chat Moderation */}
          <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6 md:col-span-2">
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
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Efek Animasi</label>
                  <select
                    value={adminNameEffect}
                    onChange={(e) => setAdminNameEffect(e.target.value)}
                    className="h-10 bg-black/50 border border-white/10 text-white rounded-lg px-2 focus:outline-none focus:border-pink-500 text-sm"
                  >
                    <option value="NONE">Normal</option>
                    <option value="GLITCH">⚡ Glitch</option>
                    <option value="SPARKLE">✨ Sparkle</option>
                    <option value="NEON">🔮 Neon Glow</option>
                    <option value="RAINBOW">🌈 Rainbow</option>
                    <option value="WAVY">🌊 Wavy Bounce</option>
                  </select>
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

          {/* Card 5: Maintenance Mode */}
          <div className={`p-6 rounded-3xl border md:col-span-2 transition-all ${isMaintenance ? 'bg-red-900/30 border-red-500' : 'bg-[#111] border-white/5'}`}>
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

        {/* Save Button */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCcw className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />}
            {saving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>
    </div>
  );
}
