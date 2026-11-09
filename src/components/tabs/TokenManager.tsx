"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Key,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { TokenEditModal } from "@/components/ui/TokenEditModal";
import {
  formatDateSafe,
  generateRandomTokenCode,
  getExpirationParams,
} from "@/lib/format";
import { ToastMessage, TokenObject } from "@/types/admin";

interface TokenManagerProps {
  appName?: string;
  tokens: TokenObject[];
  now: number;
  searchQuery?: string;
  onAddToken: (newToken: TokenObject) => void;
  onUpdateToken: (tokenCode: string, updatedToken: TokenObject) => void;
  onRemoveToken: (tokenCode: string) => void;
  onClearExpired: (isTrialTab: boolean, count: number) => void;
  onResetDevice: (tokenCode: string) => void;
  onUpgradeTrial: (tokenCode: string) => void;
  onOpenInbox: (tokenCode: string) => void;
  showToast: (type: ToastMessage["type"], message: string) => void;
}

const PAGE_SIZE = 20;

export const TokenManager: React.FC<TokenManagerProps> = ({
  appName = "KIMTV",
  tokens,
  now,
  searchQuery = "",
  onAddToken,
  onUpdateToken,
  onRemoveToken,
  onClearExpired,
  onResetDevice,
  onUpgradeTrial,
  onOpenInbox,
  showToast,
}) => {
  const [customTokenInput, setCustomTokenInput] = useState("");
  const [customLabelInput, setCustomLabelInput] = useState("");
  const [tokenDuration, setTokenDuration] = useState("lifetime");
  const [tokenMaxDevices, setTokenMaxDevices] = useState(1);
  const [editingToken, setEditingToken] = useState<TokenObject | null>(null);

  const [tokenSubTab, setTokenSubTab] = useState<"premium" | "trial">("premium");
  const [tokenFilter, setTokenFilter] = useState<"all" | "active" | "expired">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleGenerateRandomToken = () => {
    const token = generateRandomTokenCode("KIM-");
    setCustomTokenInput(token);
    showToast(
      "info",
      `Kode acak ${token} dihasilkan. Pilih durasi & slot lalu klik Tambah Token.`
    );
  };

  const addCustomToken = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = customTokenInput.trim();
    if (!cleanToken) {
      showToast("error", "Kode token tidak boleh kosong!");
      return;
    }

    if (tokens.some((t) => t.code === cleanToken)) {
      showToast("error", `Token ${cleanToken} sudah terdaftar!`);
      return;
    }

    const expParams = getExpirationParams(tokenDuration);
    const label = customLabelInput.trim() || expParams.label;

    onAddToken({
      code: cleanToken,
      badgeIcon: "",
      badgeColor: "#FFD700",
      nameEffect: "NONE",
      deviceId: "",
      maxDevices: Math.max(1, Math.min(10, Number(tokenMaxDevices) || 1)),
      deviceIds: [],
      expiresAt: expParams.expiresAt,
      label,
    });

    setCustomTokenInput("");
    setCustomLabelInput("");
    setTokenSubTab("premium");
    setCurrentPage(1);
    showToast("success", `Token ${cleanToken} berhasil ditambahkan!`);
  };

  const copyToClipboard = (key: string, text: string, msg: string) => {
    void navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    showToast("success", msg);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyShareInfo = (tokenObj: TokenObject) => {
    const maxDev = Number(tokenObj.maxDevices) || 1;
    const expText = tokenObj.expiresAt
      ? formatDateSafe(tokenObj.expiresAt)
      : "Lifetime (Selamanya)";
    const packageLabel =
      tokenObj.label || (tokenObj.isTrial ? "Trial 1 Jam" : "VIP Lifetime");

    const formatted = [
      `🔐 Kode Akses ${appName}`,
      `Token: ${tokenObj.code}`,
      `Paket: ${packageLabel}`,
      `Batas TV: ${maxDev} Perangkat`,
      `Aktif s/d: ${expText}`,
    ].join("\n");

    copyToClipboard(
      `info_${tokenObj.code}`,
      formatted,
      `Detail langganan ${tokenObj.code} tersalin (siap kirim WA)!`
    );
  };

  const isTrialSubTab = tokenSubTab === "trial";

  const expiredInSubTabCount = tokens.filter((t) => {
    const isTabMatch = isTrialSubTab ? Boolean(t.isTrial) : !t.isTrial;
    const isExpired = Boolean(t.expiresAt && now > 0 && t.expiresAt <= now);
    return isTabMatch && isExpired;
  }).length;

  const filteredTokens = tokens.filter((t) => {
    // 1. Sub-tab filter (VIP vs Trial)
    const isTabMatch = isTrialSubTab ? Boolean(t.isTrial) : !t.isTrial;
    if (!isTabMatch) return false;

    // 2. Status filter
    const isExpired = Boolean(t.expiresAt && now > 0 && t.expiresAt <= now);
    if (tokenFilter === "active" && isExpired) return false;
    if (tokenFilter === "expired" && !isExpired) return false;

    // 3. Quick search filter from header
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = t.code.toLowerCase().includes(q);
      const labelMatch = t.label && t.label.toLowerCase().includes(q);
      const devMatch =
        (t.deviceId && t.deviceId.toLowerCase().includes(q)) ||
        (t.deviceIds && t.deviceIds.some((d) => d.toLowerCase().includes(q)));
      return Boolean(codeMatch || labelMatch || devMatch);
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTokens.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const paginatedTokens = filteredTokens.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="space-y-6 animate-toast">
      {/* Token Generator Card */}
      <form
        onSubmit={addCustomToken}
        className="glass-panel p-6 rounded-3xl space-y-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Generator Token Akses
              </h3>
              <p className="text-xs text-slate-400">
                Buat token langganan baru dan atur batasan perangkat TV.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerateRandomToken}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all border border-white/10 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Generate Acak
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Code Input (supports both uppercase & lowercase) */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
              Kode Token Custom *
            </label>
            <input
              type="text"
              value={customTokenInput}
              onChange={(e) => setCustomTokenInput(e.target.value)}
              placeholder="VIP-BUDI atau vipBudi123"
              className="w-full bg-[#0c1322] border border-white/10 text-white font-mono font-bold rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Label / Buyer Note */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
              Label / Catatan
            </label>
            <input
              type="text"
              value={customLabelInput}
              onChange={(e) => setCustomLabelInput(e.target.value)}
              placeholder="Opsional (Pak Budi)"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
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
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500 font-mono font-bold"
            />
          </div>

          {/* Add Action */}
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Tambah Token
            </button>
          </div>
        </div>
      </form>

      {/* Token List Panel */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        {/* Sub-tabs, Filter Controls & Bulk Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/[0.07]">
          {/* Segmented Control */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/[0.08] shadow-inner w-fit">
            <button
              type="button"
              onClick={() => {
                setTokenSubTab("premium");
                setCurrentPage(1);
              }}
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
              type="button"
              onClick={() => {
                setTokenSubTab("trial");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                tokenSubTab === "trial"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>⏱️ Trial 1 Jam</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">
                {tokens.filter((t) => t.isTrial).length}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bulk Clean Expired */}
            {expiredInSubTabCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  onClearExpired(isTrialSubTab, expiredInSubTabCount)
                }
                className="px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-xs font-bold border border-red-500/30 flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan Expired ({expiredInSubTabCount})</span>
              </button>
            )}

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/5">
              <button
                type="button"
                onClick={() => {
                  setTokenFilter("all");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  tokenFilter === "all"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenFilter("active");
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  tokenFilter === "active"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Aktif
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenFilter("expired");
                  setCurrentPage(1);
                }}
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
          <>
            <div className="space-y-3">
              {paginatedTokens.map((tokenObj, idx) => {
                const isExpired = Boolean(
                  tokenObj.expiresAt && now > 0 && tokenObj.expiresAt <= now
                );
                const maxDev = Number(tokenObj.maxDevices) || 1;
                const devCount = Array.isArray(tokenObj.deviceIds)
                  ? tokenObj.deviceIds.length
                  : tokenObj.deviceId
                  ? 1
                  : 0;
                const hasCustomEffect =
                  tokenObj.nameEffect && tokenObj.nameEffect !== "NONE";

                return (
                  <div
                    key={tokenObj.code || idx}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                      isExpired
                        ? "bg-red-950/10 border-red-500/20 opacity-75"
                        : "bg-gradient-to-r from-white/[0.025] to-white/[0.01] border-white/[0.07] hover:border-indigo-500/40 hover:shadow-[0_0_25px_-5px_rgba(99,102,241,0.15)]"
                    }`}
                  >
                    <div className="space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-black text-amber-300 tracking-wide break-all">
                          {tokenObj.code}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              tokenObj.code,
                              tokenObj.code,
                              `Token ${tokenObj.code} tersalin!`
                            )
                          }
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all active:scale-90"
                          title="Salin Kode Token"
                        >
                          {copiedKey === tokenObj.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => copyShareInfo(tokenObj)}
                          className="px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/20 flex items-center gap-1 transition-all active:scale-95"
                          title="Salin info token & masa aktif siap kirim ke WhatsApp"
                        >
                          {copiedKey === `info_${tokenObj.code}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Share2 className="w-3 h-3" />
                          )}
                          <span>Info</span>
                        </button>

                        {/* Status / Tier Badge */}
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
                            {tokenObj.badgeIcon || "👑"}{" "}
                            {tokenObj.label || "VIP Lifetime"}
                          </span>
                        )}

                        {hasCustomEffect && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 font-mono border border-purple-500/25">
                            {tokenObj.nameEffect}
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
                          type="button"
                          onClick={() => onUpgradeTrial(tokenObj.code)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                        >
                          Upgrade VIP
                        </button>
                      )}
                      {devCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onResetDevice(tokenObj.code)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-colors border border-amber-500/20"
                          title="Reset kaitan TV lama"
                        >
                          Reset TV
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenInbox(tokenObj.code)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-colors border border-emerald-500/20"
                      >
                        Pesan TV
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingToken(tokenObj)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-colors border border-white/10"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onRemoveToken(tokenObj.code)}
                        className="p-2 rounded-xl hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                        title="Hapus Token"
                        aria-label={`Hapus token ${tokenObj.code}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {filteredTokens.length > PAGE_SIZE && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5 text-xs text-slate-400">
                <span>
                  Menampilkan{" "}
                  <strong className="text-white">{startIdx + 1}</strong>–
                  <strong className="text-white">
                    {Math.min(startIdx + PAGE_SIZE, filteredTokens.length)}
                  </strong>{" "}
                  dari{" "}
                  <strong className="text-white">
                    {filteredTokens.length}
                  </strong>{" "}
                  token
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage(safePage - 1)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-semibold flex items-center gap-1 border border-white/10"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Sebelumnya
                  </button>
                  <span className="font-mono px-2 text-slate-300">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage(safePage + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-slate-200 font-semibold flex items-center gap-1 border border-white/10"
                  >
                    Berikutnya
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Dedicated Edit Modal (prevents losing scroll & allows full field edits) */}
      {editingToken && (
        <TokenEditModal
          key={editingToken.code}
          token={editingToken}
          existingCodes={tokens.map((t) => t.code)}
          now={now}
          onClose={() => setEditingToken(null)}
          onResetDevice={(code) => onResetDevice(code)}
          onSave={(originalCode, updated) => {
            onUpdateToken(originalCode, updated);
            setEditingToken(null);
            showToast(
              "success",
              `Token ${updated.code} diperbarui (klik Simpan untuk simpan permanen).`
            );
          }}
        />
      )}
    </div>
  );
};
