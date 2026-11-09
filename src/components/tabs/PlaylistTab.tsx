"use client";

import React, { useState } from "react";
import { Globe, Plus, Tv } from "lucide-react";
import { ChannelModal } from "@/components/ui/ChannelModal";
import {
  AdminConfigState,
  CustomChannel,
  ToastMessage,
} from "@/types/admin";

interface PlaylistTabProps {
  config: AdminConfigState;
  updateConfig: (patch: Partial<AdminConfigState>) => void;
  showToast: (type: ToastMessage["type"], message: string) => void;
}

export const PlaylistTab: React.FC<PlaylistTabProps> = ({
  config,
  updateConfig,
  showToast,
}) => {
  const [editingCustomChannel, setEditingCustomChannel] =
    useState<Partial<CustomChannel> | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);

  const handleSaveChannel = () => {
    if (!editingCustomChannel?.name || !editingCustomChannel?.streamUrl) {
      showToast("error", "Nama dan Stream URL wajib diisi!");
      return;
    }
    const isNew = !editingCustomChannel.id;
    const id = isNew ? "cc_" + Date.now() : editingCustomChannel.id!;
    const newChannel = { ...editingCustomChannel, id } as CustomChannel;
    if (isNew) {
      updateConfig({
        customChannels: [...config.customChannels, newChannel],
      });
      showToast("success", `Channel ${newChannel.name} ditambahkan!`);
    } else {
      updateConfig({
        customChannels: config.customChannels.map((c) =>
          c.id === id ? newChannel : c
        ),
      });
      showToast("success", `Channel ${newChannel.name} diperbarui!`);
    }
    setIsChannelModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-toast">
      {/* Multi-Server Playlist Card */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Multi-Server Playlist M3U
              </h3>
              <p className="text-xs text-slate-400">
                Konfigurasi sumber siaran otomatis dengan failover 3 tingkat.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Server 1 */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Server 1 (Utama)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                Priority 1
              </span>
            </div>
            <input
              type="text"
              value={config.m3uName}
              onChange={(e) => updateConfig({ m3uName: e.target.value })}
              placeholder="Label (Contoh: VIP Server)"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
            <input
              type="url"
              value={config.m3uUrl}
              onChange={(e) => updateConfig({ m3uUrl: e.target.value })}
              placeholder="https://server1.com/list.m3u"
              className="w-full bg-[#0c1322] border border-indigo-500/30 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Server 2 */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Server 2 (Cadangan 1)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-bold">
                Fallback 1
              </span>
            </div>
            <input
              type="text"
              value={config.m3uName2}
              onChange={(e) => updateConfig({ m3uName2: e.target.value })}
              placeholder="Label (Contoh: Server Cadangan)"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
            <input
              type="url"
              value={config.m3uUrl2}
              onChange={(e) => updateConfig({ m3uUrl2: e.target.value })}
              placeholder="https://server2.com/list.m3u"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Server 3 */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Server 3 (Cadangan 2)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-400 font-bold">
                Fallback 2
              </span>
            </div>
            <input
              type="text"
              value={config.m3uName3}
              onChange={(e) => updateConfig({ m3uName3: e.target.value })}
              placeholder="Label (Contoh: Emergency Server)"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
            />
            <input
              type="url"
              value={config.m3uUrl3}
              onChange={(e) => updateConfig({ m3uUrl3: e.target.value })}
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
              value={config.epgUrl}
              onChange={(e) => updateConfig({ epgUrl: e.target.value })}
              placeholder="https://example.com/epg.xml"
              className="w-full bg-[#0c1322] border border-emerald-500/30 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-400">
              Jadwal tayangan TV akan otomatis disinkronkan ke semua perangkat.
            </p>
          </div>

          {/* Stream Proxy URL */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-cyan-400 block uppercase tracking-wider">
              Global Stream Proxy (Cloudflare Worker)
            </label>
            <input
              type="url"
              value={config.proxyUrl}
              onChange={(e) => updateConfig({ proxyUrl: e.target.value })}
              placeholder="https://proxy.namakamu.workers.dev/"
              className="w-full bg-[#0c1322] border border-cyan-500/30 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Bypass proteksi CORS / Referer untuk stream terproteksi.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Channels Section */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Tv className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Custom Channels (Manual)
              </h3>
              <p className="text-xs text-slate-400">
                Tambahkan channel independen tanpa perlu mengedit M3U server.
              </p>
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
        {config.customChannels.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Belum ada channel custom manual yang ditambahkan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {config.customChannels.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm truncate">
                      {c.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        c.type === "embed"
                          ? "bg-purple-500/20 text-purple-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {c.type || "direct"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {c.streamUrl}
                  </p>
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
                    onClick={() =>
                      updateConfig({
                        customChannels: config.customChannels.filter(
                          (x) => x.id !== c.id
                        ),
                      })
                    }
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
      <ChannelModal
        isOpen={isChannelModalOpen}
        channel={editingCustomChannel}
        onChange={setEditingCustomChannel}
        onClose={() => setIsChannelModalOpen(false)}
        onSave={handleSaveChannel}
      />
    </div>
  );
};

