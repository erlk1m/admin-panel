"use client";

import React, { useEffect, useState } from "react";
import { Tv, X } from "lucide-react";
import { CustomChannel } from "@/types/admin";

interface ChannelModalProps {
  isOpen: boolean;
  channel: Partial<CustomChannel> | null;
  onChange: (updated: Partial<CustomChannel>) => void;
  onClose: () => void;
  onSave: () => void;
}

export const ChannelModal: React.FC<ChannelModalProps> = ({
  isOpen,
  channel,
  onChange,
  onClose,
  onSave,
}) => {
  const [failedLogoUrl, setFailedLogoUrl] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const logoUrl = channel?.logoUrl?.trim() || "";
  const isLogoHttp =
    logoUrl.startsWith("http://") || logoUrl.startsWith("https://");
  const showLogoPreview = Boolean(isLogoHttp && failedLogoUrl !== logoUrl);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="glass-panel p-6 rounded-3xl border border-white/10 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h3 className="text-base font-bold text-white">
            {channel?.id ? "Edit Custom Channel" : "Tambah Custom Channel"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Tutup modal channel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Nama Channel *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: RCTI HD"
                value={channel?.name || ""}
                onChange={(e) =>
                  onChange({ ...channel, name: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Tipe Siaran
              </label>
              <select
                value={channel?.type || "direct"}
                onChange={(e) =>
                  onChange({ ...channel, type: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="direct">
                  Direct Stream (m3u8 / mp4 / mpd)
                </option>
                <option value="embed">Embed Webpage / Iframe HTML</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Stream URL atau Kode Embed *
            </label>
            {channel?.type === "embed" ? (
              <textarea
                rows={3}
                required
                placeholder="<iframe>...</iframe>"
                value={channel?.streamUrl || ""}
                onChange={(e) =>
                  onChange({ ...channel, streamUrl: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            ) : (
              <input
                type="url"
                required
                placeholder="https://example.com/stream.m3u8"
                value={channel?.streamUrl || ""}
                onChange={(e) =>
                  onChange({ ...channel, streamUrl: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Kategori Grup
              </label>
              <input
                type="text"
                placeholder="Contoh: Nasional / Sports"
                value={channel?.group || ""}
                onChange={(e) =>
                  onChange({ ...channel, group: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                TVG ID / Kode EPG (Opsional)
              </label>
              <input
                type="text"
                placeholder="RCTI.id"
                value={channel?.tvgId || ""}
                onChange={(e) =>
                  onChange({ ...channel, tvgId: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Logo URL (Opsional)
            </label>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0c1322] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1">
                {showLogoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    onError={() => setFailedLogoUrl(logoUrl)}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Tv className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <input
                type="url"
                placeholder="https://.../logo.png"
                value={channel?.logoUrl || ""}
                onChange={(e) =>
                  onChange({ ...channel, logoUrl: e.target.value })
                }
                className="flex-1 bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {channel?.type !== "embed" && (
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Opsi Keamanan & Header Stream
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Tipe DRM (Wajib jika pakai License Key)
                  </label>
                  <select
                    value={channel?.licenseType || ""}
                    onChange={(e) =>
                      onChange({ ...channel, licenseType: e.target.value })
                    }
                    className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Tanpa DRM (Otomatis)</option>
                    <option value="org.w3.clearkey">
                      ClearKey (org.w3.clearkey)
                    </option>
                    <option value="com.widevine.alpha">
                      Widevine (com.widevine.alpha)
                    </option>
                    <option value="com.microsoft.playready">
                      PlayReady (com.microsoft.playready)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    License Key / DRM URL
                  </label>
                  <input
                    type="text"
                    placeholder="key_id:key atau https://license..."
                    value={channel?.licenseKey || ""}
                    onChange={(e) => {
                      const nextKey = e.target.value;
                      const trimmedKey = nextKey.trim();
                      const suggestedType =
                        !channel?.licenseType && trimmedKey
                          ? trimmedKey.toLowerCase().startsWith("http")
                            ? "com.widevine.alpha"
                            : "org.w3.clearkey"
                          : channel?.licenseType;
                      onChange({
                        ...channel,
                        licenseKey: nextKey,
                        licenseType: suggestedType,
                      });
                    }}
                    className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    User-Agent Kustom
                  </label>
                  <input
                    type="text"
                    placeholder="KIMTV/1.0"
                    value={channel?.userAgent || ""}
                    onChange={(e) =>
                      onChange({ ...channel, userAgent: e.target.value })
                    }
                    className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Referer URL (Opsional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://sumber-origin.com/"
                    value={channel?.referer || ""}
                    onChange={(e) =>
                      onChange({ ...channel, referer: e.target.value })
                    }
                    className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
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
            Simpan Channel
          </button>
        </div>
      </form>
    </div>
  );
};
