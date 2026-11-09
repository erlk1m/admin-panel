"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Film,
  Image as ImageIcon,
  PhoneCall,
  Tv,
  Zap,
} from "lucide-react";
import { AdminConfigState } from "@/types/admin";

interface SettingsTabProps {
  config: AdminConfigState;
  updateConfig: (patch: Partial<AdminConfigState>) => void;
}

const isHttpUrl = (val: string): boolean => {
  const trimmed = val.trim();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
};

const ImagePreviewBox: React.FC<{
  url: string;
  emptyLabel: string;
  alt: string;
}> = ({ url, emptyLabel, alt }) => {
  const [failedUrl, setFailedUrl] = useState("");
  const cleanUrl = url.trim();
  const validHttp = isHttpUrl(cleanUrl);
  const hasError = validHttp && failedUrl === cleanUrl;

  return (
    <div className="relative aspect-video w-full rounded-2xl bg-[#070b14] border border-white/10 overflow-hidden flex items-center justify-center">
      {!cleanUrl ? (
        <div className="flex flex-col items-center gap-1.5 text-slate-500 text-[11px] px-4 text-center">
          <ImageIcon className="w-5 h-5 text-slate-600" />
          <span>{emptyLabel}</span>
        </div>
      ) : !validHttp || hasError ? (
        <div className="flex flex-col items-center gap-1.5 text-amber-400/80 text-[11px] px-4 text-center">
          <ImageIcon className="w-5 h-5" />
          <span>
            {hasError
              ? "Gagal memuat pratinjau gambar dari URL tersebut"
              : "URL harus diawali http:// atau https://"}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cleanUrl}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(cleanUrl)}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  updateConfig,
}) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-toast">
      {/* Maintenance Mode (Full-width Prominent Emergency Card) */}
      <div
        className={`xl:col-span-2 p-6 rounded-3xl border transition-all ${
          config.isMaintenance
            ? "bg-red-950/40 border-red-500 shadow-xl shadow-red-950/40"
            : "glass-panel"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                config.isMaintenance
                  ? "bg-red-500 text-white"
                  : "bg-white/5 text-slate-400"
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-bold text-white">
                  Mode Perbaikan (Maintenance Mode)
                </h4>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    config.isMaintenance
                      ? "bg-red-500/25 text-red-200 border border-red-400/40"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                  }`}
                >
                  {config.isMaintenance ? "Terkunci" : "Normal Online"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kunci seluruh aplikasi TV pengguna secara paksa jika server
                sedang dalam perawatan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              updateConfig({ isMaintenance: !config.isMaintenance })
            }
            aria-label="Toggle Maintenance Mode"
            className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${
              config.isMaintenance ? "bg-red-600" : "bg-slate-700"
            }`}
          >
            <div
              className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${
                config.isMaintenance ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Card 1: Identitas & Kontak Admin */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <Tv className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Identitas Aplikasi & Kontak Admin
            </h3>
            <p className="text-xs text-slate-400">
              Branding header TV dan link dukungan QR di layar Profil.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Nama Aplikasi (Tampil di Layar TV & Admin)
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => updateConfig({ appName: e.target.value })}
              placeholder="KIMTV"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              Link Kontak Admin (WhatsApp / Telegram)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={config.adminContactUrl}
                onChange={(e) =>
                  updateConfig({ adminContactUrl: e.target.value })
                }
                placeholder="https://wa.me/6281234567890"
                className="flex-1 bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500"
              />
              {isHttpUrl(config.adminContactUrl) && (
                <a
                  href={config.adminContactUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                  title="Test buka link kontak"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Ditampilkan sebagai QR Code pada layar Profil aplikasi TV.
            </p>
          </div>
        </div>
      </div>

      {/* Card 2: Auto-Update APK & Versioning */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Sistem Auto-Update Aplikasi TV
            </h3>
            <p className="text-xs text-slate-400">
              TV mengunduh dan meminta instalasi APK otomatis saat versi naik.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Kode Versi Terbaru (Version Code) *
            </label>
            <input
              type="number"
              min={1}
              value={config.latestVersionCode}
              onChange={(e) =>
                updateConfig({
                  latestVersionCode: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
            />
            <p className="text-[11px] text-slate-400">
              Sesuaikan dengan{" "}
              <code className="text-cyan-300">versionCode</code> rilisan APK
              terbaru agar pengguna mendapat notifikasi update OTA.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              URL Download APK Langsung (.apk)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={config.apkUpdateUrl}
                onChange={(e) => updateConfig({ apkUpdateUrl: e.target.value })}
                placeholder="https://domain.com/kimtv-release.apk"
                className="flex-1 bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 font-mono"
              />
              {isHttpUrl(config.apkUpdateUrl) && (
                <a
                  href={config.apkUpdateUrl.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                  title="Uji URL APK"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Marquee / Teks Berjalan dengan LIVE PREVIEW */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Teks Pengumuman Berjalan (Marquee)
              </h3>
              <p className="text-xs text-slate-400">
                Ticker pengumuman di bagian atas layar utama TV.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-semibold text-slate-300">
              {config.notificationEnabled ? "Aktif" : "Mati"}
            </span>
            <button
              type="button"
              onClick={() =>
                updateConfig({
                  notificationEnabled: !config.notificationEnabled,
                })
              }
              aria-label="Toggle Marquee"
              className={`w-12 h-6 rounded-full transition-colors relative ${
                config.notificationEnabled ? "bg-emerald-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  config.notificationEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Isi Pesan Pengumuman
            </label>
            <input
              type="text"
              value={config.notificationText}
              onChange={(e) =>
                updateConfig({ notificationText: e.target.value })
              }
              placeholder="Selamat datang di KIMTV! Update channel terbaru setiap hari..."
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block">
              Warna Teks
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.notificationColor}
                onChange={(e) =>
                  updateConfig({ notificationColor: e.target.value })
                }
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={config.notificationColor}
                onChange={(e) =>
                  updateConfig({ notificationColor: e.target.value })
                }
                className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-2.5 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Live Marquee Preview Banner */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Simulasi Layar TV:
          </span>
          <div className="w-full bg-slate-950/80 rounded-2xl border border-white/10 p-3 overflow-hidden flex items-center gap-3">
            <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex-1 overflow-hidden">
              <div
                className="animate-marquee font-medium text-xs whitespace-nowrap"
                style={{ color: config.notificationColor }}
              >
                {config.notificationText ||
                  "Contoh teks berjalan KIMTV yang tampil di TV pengguna..."}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 4: Iklan Pre-Roll Video */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Film className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Iklan Pre-Roll Video
              </h3>
              <p className="text-xs text-slate-400">
                Putar klip sponsor singkat sebelum tayangan siaran TV.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="text-xs font-semibold text-slate-300">
              {config.prerollAdEnabled ? "Aktif" : "Nonaktif"}
            </span>
            <button
              type="button"
              onClick={() =>
                updateConfig({ prerollAdEnabled: !config.prerollAdEnabled })
              }
              aria-label="Toggle Pre-Roll Ad"
              className={`w-12 h-6 rounded-full transition-colors relative ${
                config.prerollAdEnabled ? "bg-amber-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  config.prerollAdEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            URL Video Iklan Pre-Roll (.mp4 / .m3u8)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={config.prerollAdUrl}
              onChange={(e) => updateConfig({ prerollAdUrl: e.target.value })}
              placeholder="https://cdn.domain.com/sponsor-preroll.mp4"
              className="flex-1 bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs font-mono focus:outline-none focus:border-amber-500"
            />
            {isHttpUrl(config.prerollAdUrl) && (
              <a
                href={config.prerollAdUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
                title="Preview file video iklan"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Pastikan URL mengarah langsung ke video stream MP4/HLS yang cepat
            diakses agar pemutaran awal di Android TV tetap mulus.
          </p>
        </div>
      </div>

      {/* Card 5: Wallpaper & Welcome Banner dengan Live Image Preview (Full Width) */}
      <div className="xl:col-span-2 glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Wallpaper & Promo Banner Pop-up
            </h3>
            <p className="text-xs text-slate-400">
              Pratinjau langsung tampilan latar belakang dan banner promo awal.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wallpaper */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                URL Gambar Latar Belakang (Wallpaper TV)
              </label>
              <input
                type="url"
                value={config.backgroundUrl}
                onChange={(e) =>
                  updateConfig({ backgroundUrl: e.target.value })
                }
                placeholder="https://domain.com/bg.jpg"
                className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Kosongkan untuk menggunakan latar gelap bawaan aplikasi.
              </p>
            </div>
            <ImagePreviewBox
              url={config.backgroundUrl}
              emptyLabel="Menggunakan latar belakang bawaan aplikasi"
              alt="Preview Wallpaper TV"
            />
          </div>

          {/* Welcome Banner */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                URL Banner Sambutan (Popup Promo)
              </label>
              <input
                type="url"
                value={config.welcomeBannerUrl}
                onChange={(e) =>
                  updateConfig({ welcomeBannerUrl: e.target.value })
                }
                placeholder="https://domain.com/promo.jpg"
                className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Muncul sekali setiap pengguna membuka aplikasi TV.
              </p>
            </div>
            <ImagePreviewBox
              url={config.welcomeBannerUrl}
              emptyLabel="Tidak ada banner promo sambutan aktif"
              alt="Preview Banner Promo TV"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
