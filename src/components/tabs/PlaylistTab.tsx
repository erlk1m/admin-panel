"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Plus,
  Tv,
  X,
} from "lucide-react";
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
  searchQuery?: string;
}

const isHttpUrl = (val: string): boolean => {
  const trimmed = val.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
};

const ChannelLogoThumbnail: React.FC<{ logoUrl?: string; name: string }> = ({
  logoUrl,
  name,
}) => {
  const [failedUrl, setFailedUrl] = useState("");
  const cleanUrl = logoUrl?.trim() || "";
  const canRenderImg = Boolean(
    cleanUrl && isHttpUrl(cleanUrl) && failedUrl !== cleanUrl
  );

  return (
    <div className="w-10 h-10 rounded-xl bg-[#0c1322] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1">
      {canRenderImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cleanUrl}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(cleanUrl)}
          className="w-full h-full object-contain"
        />
      ) : (
        <Tv className="w-4 h-4 text-slate-500" />
      )}
    </div>
  );
};

export const PlaylistTab: React.FC<PlaylistTabProps> = ({
  config,
  updateConfig,
  showToast,
  searchQuery = "",
}) => {
  const [editingCustomChannel, setEditingCustomChannel] =
    useState<Partial<CustomChannel> | null>(null);
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("Semua");

  const handleCopyUrl = (fieldKey: string, value: string, label: string) => {
    if (!value.trim()) return;
    void navigator.clipboard?.writeText(value.trim());
    setCopiedField(fieldKey);
    showToast("success", `URL ${label} disalin ke clipboard!`);
    setTimeout(() => setCopiedField(null), 1800);
  };

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

  const uniqueGroups = Array.from(
    new Set(
      config.customChannels
        .map((c) => c.group?.trim())
        .filter((g): g is string => Boolean(g))
    )
  );
  const activeGroup =
    groupFilter === "Semua" || uniqueGroups.includes(groupFilter)
      ? groupFilter
      : "Semua";

  const filteredChannels = config.customChannels.filter((c) => {
    const groupMatch =
      activeGroup === "Semua" || (c.group?.trim() || "") === activeGroup;
    if (!groupMatch) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.streamUrl.toLowerCase().includes(q) ||
        Boolean(c.group && c.group.toLowerCase().includes(q)) ||
        Boolean(c.tvgId && c.tvgId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const renderUrlToolbar = (
    fieldKey: string,
    value: string,
    label: string,
    onClear: () => void
  ) => {
    const trimmed = value.trim();
    const validHttp = isHttpUrl(trimmed);
    return (
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="min-w-0">
          {trimmed && !validHttp ? (
            <span className="text-[10px] text-amber-400">
              Gunakan awalan http:// atau https://
            </span>
          ) : (
            <span className="text-[10px] text-slate-500">
              {validHttp ? "Format URL valid" : "Belum diisi"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {trimmed && (
            <>
              <button
                type="button"
                onClick={() => handleCopyUrl(fieldKey, trimmed, label)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title={`Salin URL ${label}`}
              >
                {copiedField === fieldKey ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              {validHttp && (
                <a
                  href={trimmed}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-indigo-300 transition-colors"
                  title={`Buka URL ${label} di tab baru`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                title={`Kosongkan URL ${label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const playlistServers = [
    {
      key: "server1",
      title: "Server 1 (Utama)",
      badge: "Priority 1",
      isPrimary: true,
      nameValue: config.m3uName,
      urlValue: config.m3uUrl,
      namePlaceholder: "Label (Contoh: VIP Server)",
      urlPlaceholder: "https://server1.com/list.m3u",
      onNameChange: (val: string) => updateConfig({ m3uName: val }),
      onUrlChange: (val: string) => updateConfig({ m3uUrl: val }),
    },
    {
      key: "server2",
      title: "Server 2 (Cadangan 1)",
      badge: "Fallback 1",
      isPrimary: false,
      nameValue: config.m3uName2,
      urlValue: config.m3uUrl2,
      namePlaceholder: "Label (Contoh: Server Cadangan)",
      urlPlaceholder: "https://server2.com/list.m3u",
      onNameChange: (val: string) => updateConfig({ m3uName2: val }),
      onUrlChange: (val: string) => updateConfig({ m3uUrl2: val }),
    },
    {
      key: "server3",
      title: "Server 3 (Cadangan 2)",
      badge: "Fallback 2",
      isPrimary: false,
      nameValue: config.m3uName3,
      urlValue: config.m3uUrl3,
      namePlaceholder: "Label (Contoh: Emergency Server)",
      urlPlaceholder: "https://server3.com/list.m3u",
      onNameChange: (val: string) => updateConfig({ m3uName3: val }),
      onUrlChange: (val: string) => updateConfig({ m3uUrl3: val }),
    },
  ];

  return (
    <div className="space-y-6 animate-toast">
      {/* Multi-Server Playlist Card (Global URLs only, no M3U parsing) */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Multi-Server Playlist M3U (Global URL)
              </h3>
              <p className="text-xs text-slate-400">
                Tempel URL playlist global dengan failover 3 tingkat untuk
                aplikasi TV.
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
            {
              playlistServers.filter((s) => Boolean(s.urlValue.trim())).length
            }{" "}
            / 3 Server Terisi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {playlistServers.map((srv) => {
            const hasUrl = Boolean(srv.urlValue.trim());
            return (
              <div
                key={srv.key}
                className={`p-4 rounded-2xl border space-y-2.5 transition-colors ${
                  srv.isPrimary
                    ? "bg-indigo-950/20 border-indigo-500/30"
                    : "bg-white/[0.02] border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      srv.isPrimary ? "text-indigo-400" : "text-slate-300"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        hasUrl ? "bg-emerald-400" : "bg-slate-600"
                      }`}
                    />
                    {srv.title}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      srv.isPrimary
                        ? "bg-indigo-500/20 text-indigo-300"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {srv.badge}
                  </span>
                </div>

                <input
                  type="text"
                  value={srv.nameValue}
                  onChange={(e) => srv.onNameChange(e.target.value)}
                  placeholder={srv.namePlaceholder}
                  className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />

                <div>
                  <input
                    type="url"
                    value={srv.urlValue}
                    onChange={(e) => srv.onUrlChange(e.target.value)}
                    placeholder={srv.urlPlaceholder}
                    className={`w-full bg-[#0c1322] border text-white rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:border-indigo-500 ${
                      srv.isPrimary ? "border-indigo-500/30" : "border-white/10"
                    }`}
                  />
                  {renderUrlToolbar(srv.key, srv.urlValue, srv.title, () =>
                    srv.onUrlChange("")
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-white/5">
          {/* EPG URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Global EPG URL (Jadwal Siaran XMLTV)
              </label>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  config.epgUrl.trim()
                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                {config.epgUrl.trim() ? "Aktif" : "Kosong"}
              </span>
            </div>
            <input
              type="url"
              value={config.epgUrl}
              onChange={(e) => updateConfig({ epgUrl: e.target.value })}
              placeholder="https://example.com/epg.xml"
              className="w-full bg-[#0c1322] border border-emerald-500/30 text-white rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
            {renderUrlToolbar("epgUrl", config.epgUrl, "EPG XMLTV", () =>
              updateConfig({ epgUrl: "" })
            )}
            <p className="text-[11px] text-slate-400">
              Jadwal tayangan TV akan otomatis disinkronkan ke semua perangkat.
            </p>
          </div>

          {/* Stream Proxy URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Global Stream Proxy (Cloudflare Worker)
              </label>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                  config.proxyUrl.trim()
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                {config.proxyUrl.trim() ? "Aktif" : "Kosong"}
              </span>
            </div>
            <input
              type="url"
              value={config.proxyUrl}
              onChange={(e) => updateConfig({ proxyUrl: e.target.value })}
              placeholder="https://proxy.namakamu.workers.dev/"
              className="w-full bg-[#0c1322] border border-cyan-500/30 text-white rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
            {renderUrlToolbar("proxyUrl", config.proxyUrl, "Stream Proxy", () =>
              updateConfig({ proxyUrl: "" })
            )}
            <p className="text-[11px] text-slate-400">
              Bypass proteksi CORS / Referer untuk stream terproteksi.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Channels Section */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Tv className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Custom Channels (Manual)
              </h3>
              <p className="text-xs text-slate-400">
                Tambahkan channel khusus di luar URL playlist M3U global.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingCustomChannel({ type: "direct" });
              setIsChannelModalOpen(true);
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Tambah Channel Baru
          </button>
        </div>

        {/* Category Filter Pills (shown if groups exist) */}
        {uniqueGroups.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {["Semua", ...uniqueGroups].map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setGroupFilter(grp)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  activeGroup === grp
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                    : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                {grp}
              </button>
            ))}
          </div>
        )}

        {/* Channel Cards Grid */}
        {config.customChannels.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Belum ada channel custom manual yang ditambahkan.
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            Tidak ada custom channel yang cocok dengan filter atau pencarian
            saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredChannels.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <ChannelLogoThumbnail logoUrl={c.logoUrl} name={c.name} />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white text-sm truncate">
                        {c.name}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
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
                    <div className="flex flex-wrap items-center gap-1.5">
                      {c.group && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300">
                          {c.group}
                        </span>
                      )}
                      {c.licenseKey && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-mono">
                          DRM
                        </span>
                      )}
                      {(c.userAgent || c.referer) && (
                        <span className="inline-block text-[10px] px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 font-mono">
                          Headers
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCustomChannel(c);
                      setIsChannelModalOpen(true);
                    }}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig({
                        customChannels: config.customChannels.filter(
                          (x) => x.id !== c.id
                        ),
                      });
                      showToast(
                        "info",
                        `Channel ${c.name} dihapus dari draf.`
                      );
                    }}
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
