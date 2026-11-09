"use client";

import React, { useState } from "react";
import { Check, Clock, Copy, Key, Sparkles, Trash2 } from "lucide-react";
import {
  formatDateSafe,
  generateRandomTokenCode,
  getExpirationParams,
} from "@/lib/format";
import { ToastMessage, TokenObject } from "@/types/admin";

interface TokenManagerProps {
  tokens: TokenObject[];
  now: number;
  searchQuery?: string;
  onAddToken: (newToken: TokenObject) => void;
  onUpdateToken: (tokenCode: string, updatedToken: TokenObject) => void;
  onRemoveToken: (tokenCode: string) => void;
  onResetDevice: (tokenCode: string) => void;
  onUpgradeTrial: (tokenCode: string) => void;
  onOpenInbox: (tokenCode: string) => void;
  showToast: (type: ToastMessage["type"], message: string) => void;
}

export const TokenManager: React.FC<TokenManagerProps> = ({
  tokens,
  now,
  searchQuery = "",
  onAddToken,
  onUpdateToken,
  onRemoveToken,
  onResetDevice,
  onUpgradeTrial,
  onOpenInbox,
  showToast,
}) => {
  const [customTokenInput, setCustomTokenInput] = useState("");
  const [tokenDuration, setTokenDuration] = useState("lifetime");
  const [tokenMaxDevices, setTokenMaxDevices] = useState(1);
  const [editingTokenCode, setEditingTokenCode] = useState<string | null>(null);

  const [tokenSubTab, setTokenSubTab] = useState<"premium" | "trial">("premium");
  const [tokenFilter, setTokenFilter] = useState<"all" | "active" | "expired">(
    "all"
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerateRandomToken = () => {
    const token = generateRandomTokenCode("KIM-");
    setCustomTokenInput(token);
    showToast(
      "info",
      `Kode acak ${token} dihasilkan. Pilih durasi & slot lalu klik Tambah Token.`
    );
  };

  const addCustomToken = () => {
    const cleanToken = customTokenInput.trim();
    if (!cleanToken) {
      showToast("error", "Kode token tidak boleh kosong!");
      return;
    }

    if (editingTokenCode) {
      const existing = tokens.find((t) => t.code === editingTokenCode);
      if (existing) {
        if (
          cleanToken !== editingTokenCode &&
          tokens.some((t) => t.code === cleanToken)
        ) {
          showToast("error", `Token ${cleanToken} sudah terdaftar!`);
          return;
        }
        onUpdateToken(editingTokenCode, {
          ...existing,
          code: cleanToken,
          maxDevices: tokenMaxDevices,
        });
      }
      setEditingTokenCode(null);
      setCustomTokenInput("");
      showToast("success", `Token ${cleanToken} berhasil diperbarui!`);
    } else {
      if (tokens.some((t) => t.code === cleanToken)) {
        showToast("error", `Token ${cleanToken} sudah terdaftar!`);
        return;
      }
      onAddToken({
        code: cleanToken,
        badgeIcon: "",
        badgeColor: "#FFD700",
        nameEffect: "NONE",
        deviceId: "",
        maxDevices: tokenMaxDevices,
        deviceIds: [],
        ...getExpirationParams(tokenDuration),
      });
      setCustomTokenInput("");
      showToast("success", `Token ${cleanToken} berhasil ditambahkan!`);
    }
  };

  const startEditToken = (token: TokenObject) => {
    setEditingTokenCode(token.code);
    setCustomTokenInput(token.code);
    setTokenMaxDevices(token.maxDevices || 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("info", `Mengedit token ${token.code}. Ubah dan klik 'Simpan Edit'.`);
  };

  const copyToClipboard = (key: string, msg: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    showToast("success", msg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTokens = tokens.filter((t) => {
    // 1. Sub-tab filter (VIP vs Trial)
    const isTabMatch = tokenSubTab === "premium" ? !t.isTrial : Boolean(t.isTrial);
    if (!isTabMatch) return false;

    // 2. Status filter
    const isExpired = Boolean(t.expiresAt && now > 0 && t.expiresAt <= now);
    if (tokenFilter === "active" && isExpired) return false;
    if (tokenFilter === "expired" && !isExpired) return false;

    // 3. Quick search filter from header
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = t.code.toLowerCase().includes(q);
      const devMatch =
        (t.deviceId && t.deviceId.toLowerCase().includes(q)) ||
        (t.deviceIds && t.deviceIds.some((d) => d.toLowerCase().includes(q)));
      return Boolean(codeMatch || devMatch);
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-toast">
      {/* Token Generator Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Generator Token Akses
              </h3>
              <p className="text-xs text-slate-400">
                Buat token langganan baru atau atur batasan perangkat TV.
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateRandomToken}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Generate Acak
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Code Input (supports both uppercase & lowercase) */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
              {editingTokenCode
                ? `Kode Token (Mengedit: ${editingTokenCode})`
                : "Kode Token Custom"}
            </label>
            <input
              type="text"
              value={customTokenInput}
              onChange={(e) => setCustomTokenInput(e.target.value)}
              placeholder="VIP-BUDI atau vipBudi123"
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
              onChange={(e) =>
                setTokenMaxDevices(parseInt(e.target.value, 10) || 1)
              }
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
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        {/* Sub-tabs & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          {/* Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/[0.08] shadow-inner">
            <button
              onClick={() => setTokenSubTab("premium")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                tokenSubTab === "premium"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>💎 Token VIP</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {tokens.filter((t) => !t.isTrial).length}
              </span>
            </button>
            <button
              onClick={() => setTokenSubTab("trial")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                tokenSubTab === "trial"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>⏱️ Trial Gratis 1 Jam</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {tokens.filter((t) => t.isTrial).length}
              </span>
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/5">
            <button
              onClick={() => setTokenFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                tokenFilter === "all"
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setTokenFilter("active")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                tokenFilter === "active"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => setTokenFilter("expired")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                tokenFilter === "expired"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Token Rows */}
        {filteredTokens.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs flex flex-col items-center gap-2">
            <Key className="w-8 h-8 text-slate-700 animate-pulse" />
            <span>
              Tidak ada token yang sesuai dengan filter atau pencarian saat ini.
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTokens.map((tokenObj, idx) => {
              const isExpired = Boolean(
                tokenObj.expiresAt && now > 0 && tokenObj.expiresAt <= now
              );
              const maxDev = Number(tokenObj.maxDevices) || 1;
              const devCount = Array.isArray(tokenObj.deviceIds)
                ? tokenObj.deviceIds.length
                : tokenObj.deviceId
                ? 1
                : 0;

              return (
                <div
                  key={tokenObj.code || idx}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    isExpired
                      ? "bg-red-950/10 border-red-500/20 opacity-70"
                      : "bg-gradient-to-r from-white/[0.025] to-white/[0.01] border-white/[0.07] hover:border-indigo-500/40 hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.15)]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-base font-black text-amber-300 tracking-wide">
                        {tokenObj.code}
                      </span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            tokenObj.code,
                            `Token ${tokenObj.code} tersalin!`
                          )
                        }
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
                        title="Salin Token ke Clipboard"
                      >
                        {copiedKey === tokenObj.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Metallic Shimmer Badge */}
                      {isExpired ? (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-300 font-bold border border-red-500/30">
                          EXPIRED
                        </span>
                      ) : tokenObj.isTrial ? (
                        <span className="shimmer-badge text-[10px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 font-bold border border-slate-600">
                          ⏱️ TRIAL
                        </span>
                      ) : (
                        <span className="shimmer-badge text-[10px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent text-amber-300 font-bold border border-amber-500/30 shadow-[0_0_12px_-2px_rgba(245,158,11,0.25)]">
                          👑 {tokenObj.label || "VIP Lifetime"}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      {tokenObj.expiresAt && (
                        <span className="flex items-center gap-1.5 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Exp: {formatDateSafe(tokenObj.expiresAt)}
                        </span>
                      )}

                      {/* Visual Device Slots Meter */}
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(maxDev, 10) }).map(
                            (_, i) => (
                              <span
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  i < devCount
                                    ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                                    : "bg-slate-700/80 border border-white/10"
                                }`}
                                title={
                                  i < devCount
                                    ? "Slot TV Terhubung"
                                    : "Slot TV Tersedia"
                                }
                              />
                            )
                          )}
                        </div>
                        <span className="text-xs text-slate-300 font-mono">
                          {devCount}/{maxDev} TV
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {tokenObj.isTrial && (
                      <button
                        onClick={() => onUpgradeTrial(tokenObj.code)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                      >
                        Upgrade VIP
                      </button>
                    )}
                    {devCount > 0 && (
                      <button
                        onClick={() => onResetDevice(tokenObj.code)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-colors border border-amber-500/20"
                        title="Reset kaitan TV lama"
                      >
                        Reset TV
                      </button>
                    )}
                    <button
                      onClick={() => onOpenInbox(tokenObj.code)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors border border-emerald-500/20"
                    >
                      Pesan TV
                    </button>
                    {!tokenObj.isTrial && (
                      <button
                        onClick={() => startEditToken(tokenObj)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors border border-white/10"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveToken(tokenObj.code)}
                      className="p-2 rounded-xl hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
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
  );
};

