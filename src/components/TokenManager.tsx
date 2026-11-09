"use client";

import React, { useState } from "react";
import { TokenObject } from "@/types/admin";
import {
  Key,
  Plus,
  Search,
  Copy,
  Trash2,
  RefreshCcw,
  Sparkles,
  Tv,
  Users,
  Clock,
  Zap,
  Check,
  Smartphone,
  ShieldAlert,
  Sliders,
  Send,
  Radio,
} from "lucide-react";

interface TokenManagerProps {
  tokens: TokenObject[];
  onAddToken: (newToken: TokenObject) => void;
  onUpdateToken: (tokenCode: string, updatedToken: TokenObject) => void;
  onRemoveToken: (tokenCode: string) => void;
  onResetDevice: (tokenCode: string) => void;
  onUpgradeTrial: (tokenCode: string) => void;
  onOpenInbox: (tokenCode: string) => void;
  onKickToken: (tokenCode: string) => void;
  showToast: (type: "success" | "error" | "info", message: string) => void;
}

export const TokenManager: React.FC<TokenManagerProps> = ({
  tokens,
  onAddToken,
  onUpdateToken,
  onRemoveToken,
  onResetDevice,
  onUpgradeTrial,
  onOpenInbox,
  onKickToken,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "lifetime" | "trial" | "expired">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<TokenObject | null>(null);

  // Form State for Token Creation/Editing
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState("lifetime");
  const [maxDevices, setMaxDevices] = useState(1);
  const [badgeIcon, setBadgeIcon] = useState("");
  const [badgeColor, setBadgeColor] = useState("#FFD700");

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let token = "KIM-";
    for (let i = 0; i < 6; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(token);
  };

  const calculateExpiresAt = (dur: string): number | null => {
    const now = Date.now();
    switch (dur) {
      case "1h":
        return now + 3600000;
      case "1d":
        return now + 86400000;
      case "1w":
        return now + 604800000;
      case "1m":
        return now + 2592000000;
      default:
        return null;
    }
  };

  const getDurationLabel = (dur: string): string => {
    switch (dur) {
      case "1h":
        return "1 Jam";
      case "1d":
        return "1 Hari";
      case "1w":
        return "1 Minggu";
      case "1m":
        return "1 Bulan";
      default:
        return "Lifetime";
    }
  };

  const openCreateModal = () => {
    setEditingToken(null);
    generateRandomCode();
    setLabel("");
    setDuration("lifetime");
    setMaxDevices(1);
    setBadgeIcon("👑");
    setBadgeColor("#FFD700");
    setIsModalOpen(true);
  };

  const openEditModal = (token: TokenObject) => {
    setEditingToken(token);
    setCode(token.code);
    setLabel(token.label || "");
    setDuration(token.expiresAt ? "custom" : "lifetime");
    setMaxDevices(token.maxDevices || 1);
    setBadgeIcon(token.badgeIcon || "👑");
    setBadgeColor(token.badgeColor || "#FFD700");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      showToast("error", "Kode Token tidak boleh kosong!");
      return;
    }

    if (editingToken) {
      onUpdateToken(editingToken.code, {
        ...editingToken,
        code: cleanCode,
        label: label.trim() || "User Token",
        badgeIcon,
        badgeColor,
        maxDevices,
      });
      showToast("success", `Token ${cleanCode} berhasil diperbarui!`);
    } else {
      if (tokens.some((t) => t.code === cleanCode)) {
        showToast("error", `Kode token ${cleanCode} sudah digunakan!`);
        return;
      }

      const newToken: TokenObject = {
        code: cleanCode,
        label: label.trim() || "User Token",
        badgeIcon,
        badgeColor,
        maxDevices,
        deviceIds: [],
        expiresAt: calculateExpiresAt(duration),
        isTrial: duration === "1h",
      };

      onAddToken(newToken);
      showToast("success", `Token baru ${cleanCode} (${getDurationLabel(duration)}) berhasil dibuat!`);
    }

    setIsModalOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("info", `Kode "${text}" berhasil disalin!`);
  };

  // Filter Tokens
  const now = Date.now();
  const filteredTokens = tokens.filter((t) => {
    const matchesSearch =
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.label && t.label.toLowerCase().includes(searchQuery.toLowerCase()));

    const isExpired = t.expiresAt !== null && t.expiresAt < now;
    const isTrial = Boolean(t.isTrial);

    if (!matchesSearch) return false;

    if (filterTab === "lifetime") return !t.expiresAt && !isTrial;
    if (filterTab === "trial") return isTrial;
    if (filterTab === "expired") return isExpired;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Header & Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Manajemen Token VIP ({tokens.length})
            </h2>
            <p className="text-xs text-slate-400">
              Buat, edit, reset peranti, dan atur durasi lisensi TV pengguna.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Buat Token Baru
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari token atau nama pemilik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "all" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua ({tokens.length})
          </button>
          <button
            onClick={() => setFilterTab("lifetime")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "lifetime" ? "bg-amber-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            👑 Lifetime
          </button>
          <button
            onClick={() => setFilterTab("trial")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "trial" ? "bg-cyan-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⏱️ Trial
          </button>
          <button
            onClick={() => setFilterTab("expired")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              filterTab === "expired" ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            🔴 Kadaluarsa
          </button>
        </div>
      </div>

      {/* Token List Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Kode Token</th>
                <th className="py-3.5 px-4">Pemilik / Label</th>
                <th className="py-3.5 px-4">Masa Aktif</th>
                <th className="py-3.5 px-4">Batas Perangkat</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Tidak ada token yang sesuai pencarian.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((t) => {
                  const isExpired = t.expiresAt !== null && t.expiresAt < now;
                  const currentCount = t.deviceIds ? t.deviceIds.length : t.deviceId ? 1 : 0;
                  const maxDev = t.maxDevices || 1;

                  return (
                    <tr key={t.code} className="hover:bg-slate-800/30 transition-colors">
                      {/* Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                        <span>{t.badgeIcon || "🔑"}</span>
                        <span>{t.code}</span>
                        <button
                          onClick={() => copyToClipboard(t.code)}
                          title="Salin Kode"
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* Label */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-200">{t.label || "Lifetime User"}</span>
                        {t.isTrial && (
                          <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                            TRIAL
                          </span>
                        )}
                      </td>

                      {/* Expiration */}
                      <td className="py-3.5 px-4">
                        {t.expiresAt ? (
                          isExpired ? (
                            <span className="px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                              Kadaluarsa
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-amber-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(t.expiresAt).toLocaleString("id-ID", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                          )
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                            👑 Lifetime
                          </span>
                        )}
                      </td>

                      {/* Devices */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                          <Tv className="w-3.5 h-3.5 text-indigo-400" />
                          {currentCount} / {maxDev} Perangkat
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {t.isTrial && (
                            <button
                              onClick={() => onUpgradeTrial(t.code)}
                              title="Upgrade ke VIP Lifetime"
                              className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/20 transition-all text-xs font-semibold flex items-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Upgrade VIP
                            </button>
                          )}
                          <button
                            onClick={() => onOpenInbox(t.code)}
                            title="Kirim Pesan Popup ke TV"
                            className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/20 transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onResetDevice(t.code)}
                            title="Reset Perangkat TV"
                            className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/20 transition-all"
                          >
                            <RefreshCcw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            title="Edit Token"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-all"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onRemoveToken(t.code)}
                            title="Hapus Token"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/20 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form: Buat / Edit Token */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                {editingToken ? `Edit Token ${editingToken.code}` : "Buat Token Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Kode Token VIP
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="misal: KIM-VIP2026"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                  {!editingToken && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold shrink-0"
                    >
                      Acak Kode
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nama Pemilik / Catatan
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="misal: Pak Budi - Ruang Tamu"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Durasi Masa Aktif
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="lifetime">👑 Lifetime (Selamanya)</option>
                    <option value="1h">⏱️ 1 Jam (Trial)</option>
                    <option value="1d">📅 1 Hari</option>
                    <option value="1w">📅 1 Minggu</option>
                    <option value="1m">📅 1 Bulan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Maks Perangkat (TV/HP)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(Number(e.target.value) || 1)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20"
                >
                  {editingToken ? "Simpan Perubahan" : "Buat Token"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
