"use client";

import React from "react";
import { X } from "lucide-react";
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast">
      <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h3 className="text-base font-bold text-white">
            {channel?.id ? "Edit Custom Channel" : "Tambah Custom Channel"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Tutup modal channel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Nama Channel *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: RCTI HD"
              value={channel?.name || ""}
              onChange={(e) => onChange({ ...channel, name: e.target.value })}
              className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Tipe Siaran
            </label>
            <select
              value={channel?.type || "direct"}
              onChange={(e) => onChange({ ...channel, type: e.target.value })}
              className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
            >
              <option value="direct">
                Direct Stream (m3u8 / mp4 / mpd)
              </option>
              <option value="embed">Embed Webpage / Iframe HTML</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold">
              Stream URL atau Kode Embed *
            </label>
            {channel?.type === "embed" ? (
              <textarea
                rows={3}
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
                placeholder="https://example.com/stream.m3u8"
                value={channel?.streamUrl || ""}
                onChange={(e) =>
                  onChange({ ...channel, streamUrl: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Kategori Grup
              </label>
              <input
                type="text"
                placeholder="Contoh: Nasional"
                value={channel?.group || ""}
                onChange={(e) =>
                  onChange({ ...channel, group: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Logo URL
              </label>
              <input
                type="url"
                placeholder="https://.../logo.png"
                value={channel?.logoUrl || ""}
                onChange={(e) =>
                  onChange({ ...channel, logoUrl: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {channel?.type !== "embed" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  License Key (DRM)
                </label>
                <input
                  type="text"
                  placeholder="key_id:key"
                  value={channel?.licenseKey || ""}
                  onChange={(e) =>
                    onChange({ ...channel, licenseKey: e.target.value })
                  }
                  className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
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
                  className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-300 text-xs font-semibold rounded-xl hover:bg-white/5"
          >
            Batal
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20"
          >
            Simpan Channel
          </button>
        </div>
      </div>
    </div>
  );
};

