"use client";

import React, { useEffect, useState } from "react";
import { Clock, RotateCcw, Shield, Sparkles, Tv, X } from "lucide-react";
import { formatDateSafe, getExpirationParams } from "@/lib/format";
import { TokenObject } from "@/types/admin";

interface TokenEditModalProps {
  token: TokenObject;
  existingCodes: string[];
  now: number;
  onClose: () => void;
  onSave: (originalCode: string, updated: TokenObject) => void;
  onResetDevice: (tokenCode: string) => void;
}

const NAME_EFFECT_OPTIONS = [
  { value: "NONE", label: "Normal (Polos)" },
  { value: "GLITCH", label: "Glitch" },
  { value: "SPARKLE", label: "Sparkle" },
  { value: "NEON", label: "Neon" },
  { value: "RAINBOW", label: "Rainbow" },
  { value: "WAVY", label: "Wavy" },
];

const QUICK_BADGES = ["👑", "💎", "⚡", "🔥", "⭐", ""];

export const TokenEditModal: React.FC<TokenEditModalProps> = ({
  token,
  existingCodes,
  now,
  onClose,
  onSave,
  onResetDevice,
}) => {
  const [code, setCode] = useState(token.code);
  const [label, setLabel] = useState(token.label || "Lifetime");
  const [durationMode, setDurationMode] = useState<string>("keep");
  const [maxDevices, setMaxDevices] = useState<number>(token.maxDevices || 1);
  const [badgeIcon, setBadgeIcon] = useState(token.badgeIcon || "");
  const [badgeColor, setBadgeColor] = useState(token.badgeColor || "#FFD700");
  const [nameEffect, setNameEffect] = useState(token.nameEffect || "NONE");
  const [isResetPending, setIsResetPending] = useState(false);
  const [codeError, setCodeError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const rawDevCount = Array.isArray(token.deviceIds)
    ? token.deviceIds.length
    : token.deviceId
    ? 1
    : 0;
  const devCount = isResetPending ? 0 : rawDevCount;
  const isExpired = Boolean(token.expiresAt && now > 0 && token.expiresAt <= now);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) {
      setCodeError("Kode token tidak boleh kosong!");
      return;
    }

    if (
      cleanCode !== token.code &&
      existingCodes.some((c) => c === cleanCode)
    ) {
      setCodeError(`Kode token "${cleanCode}" sudah terdaftar!`);
      return;
    }

    let nextExpiresAt = token.expiresAt;
    let nextIsTrial = token.isTrial;
    let nextLabel = label.trim() || token.label || "Lifetime";

    if (durationMode !== "keep") {
      const expParams = getExpirationParams(durationMode);
      nextExpiresAt = expParams.expiresAt;
      if (durationMode !== "1h") {
        nextIsTrial = false;
      }
      if (!label.trim() || label === token.label) {
        nextLabel = expParams.label;
      }
    }

    onSave(token.code, {
      ...token,
      code: cleanCode,
      label: nextLabel,
      expiresAt: nextExpiresAt,
      isTrial: nextIsTrial,
      maxDevices: Math.max(1, Math.min(10, Number(maxDevices) || 1)),
      badgeIcon: badgeIcon.trim(),
      badgeColor: badgeColor.trim() || "#FFD700",
      nameEffect,
      ...(isResetPending
        ? { deviceId: "", deviceIds: [], _resetDevice: true }
        : {}),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-toast"
    >
      <form
        onSubmit={handleSubmit}
        className="glass-panel p-6 rounded-3xl border border-white/10 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Edit Token Akses</span>
                {token.isTrial && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-600">
                    TRIAL
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 font-mono">{token.code}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Tutup modal edit token"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Code + Label */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Kode Token (Case-Sensitive) *
              </label>
              <input
                type="text"
                autoFocus
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError("");
                }}
                placeholder="VIP-BUDI"
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
              {codeError && (
                <p className="text-[11px] text-red-400 mt-1">{codeError}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Label / Nama Pelanggan
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="VIP Lifetime / Pak Budi"
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Duration & Max Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Perbarui Masa Berlaku
              </label>
              <select
                value={durationMode}
                onChange={(e) => setDurationMode(e.target.value)}
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="keep">
                  Pertahankan saat ini{" "}
                  {token.expiresAt
                    ? isExpired
                      ? "(Expired)"
                      : `(${formatDateSafe(token.expiresAt)})`
                    : "(Lifetime)"}
                </option>
                <option value="lifetime">Ubah ke VIP Lifetime</option>
                <option value="1d">Set +1 Hari dari Sekarang</option>
                <option value="1w">Set +1 Minggu dari Sekarang</option>
                <option value="1m">Set +1 Bulan dari Sekarang</option>
                <option value="1h">Set +1 Jam dari Sekarang</option>
              </select>
              {token.expiresAt && (
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  Saat ini:{" "}
                  <span className={isExpired ? "text-red-400" : "text-slate-300"}>
                    {formatDateSafe(token.expiresAt)}
                  </span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Max Slot TV (1 - 10)
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={maxDevices}
                onChange={(e) =>
                  setMaxDevices(parseInt(e.target.value, 10) || 1)
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <Tv className="w-3 h-3" />
                  Terhubung: {devCount}/{maxDevices} TV
                </span>
                {devCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onResetDevice(token.code);
                      setIsResetPending(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset TV
                  </button>
                ) : (
                  isResetPending && (
                    <span className="text-emerald-400 font-semibold">
                      Siap di-reset
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Chat Identity Customizer */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Identitas Live Chat Pengguna
              </span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-900 border border-white/10"
                style={{ color: badgeColor || "#FFD700" }}
              >
                {badgeIcon ? `${badgeIcon} ` : ""}
                {code || "User"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Badge (Emoji / URL GIF)
                </label>
                <input
                  type="text"
                  value={badgeIcon}
                  onChange={(e) => setBadgeIcon(e.target.value)}
                  placeholder="👑 atau URL .gif"
                  className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-1 mt-1.5">
                  {QUICK_BADGES.map((b, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBadgeIcon(b)}
                      className={`px-1.5 py-0.5 rounded text-xs border transition-colors ${
                        badgeIcon === b
                          ? "bg-indigo-500/20 border-indigo-500/40 text-white"
                          : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                      }`}
                      title={b ? `Pakai ${b}` : "Kosongkan badge"}
                    >
                      {b || "Ø"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Warna Nama Chat
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-9 h-9 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={badgeColor}
                    onChange={(e) => setBadgeColor(e.target.value)}
                    className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Efek Nama di TV
                </label>
                <select
                  value={nameEffect}
                  onChange={(e) => setNameEffect(e.target.value)}
                  className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  {NAME_EFFECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-300 text-xs font-semibold rounded-xl hover:bg-white/5"
          >
            Batal
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            Terapkan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
};
