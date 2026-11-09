"use client";

import React from "react";
import { AlertTriangle, Bell, Image as ImageIcon, Tv, Zap } from "lucide-react";
import { AdminConfigState } from "@/types/admin";

interface SettingsTabProps {
  config: AdminConfigState;
  updateConfig: (patch: Partial<AdminConfigState>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  config,
  updateConfig,
}) => {
  return (
    <div className="space-y-6 animate-toast">
      {/* Card 1: Branding */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <Tv className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Identitas & Branding Aplikasi
          </h3>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Nama Aplikasi (Tampil di Layar TV & Header)
          </label>
          <input
            type="text"
            value={config.appName}
            onChange={(e) => updateConfig({ appName: e.target.value })}
            placeholder="KIMTV"
            className="w-full max-w-md bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Card 2: Marquee / Teks Berjalan dengan LIVE PREVIEW */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <Bell className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Teks Pengumuman Berjalan (Marquee)
              </h3>
              <p className="text-xs text-slate-400">
                Pesan siaran berjalan di bagian atas layar TV pengguna.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              {config.notificationEnabled ? "Marquee Aktif" : "Mati"}
            </span>
            <button
              onClick={() =>
                updateConfig({
                  notificationEnabled: !config.notificationEnabled,
                })
              }
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3 space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
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
            <label className="text-xs font-semibold text-slate-300">
              Warna Teks
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.notificationColor}
                onChange={(e) =>
                  updateConfig({ notificationColor: e.target.value })
                }
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <input
                type="text"
                value={config.notificationColor}
                onChange={(e) =>
                  updateConfig({ notificationColor: e.target.value })
                }
                className="flex-1 bg-[#0c1322] border border-white/10 text-white rounded-xl p-2 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Live Marquee Preview Banner */}
        <div className="space-y-1.5 pt-2">
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

      {/* Card 3: Auto-Update APK & Versioning */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <Zap className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Sistem Auto-Update Aplikasi TV
            </h3>
            <p className="text-xs text-slate-400">
              TV akan otomatis mendownload dan auto-install APK jika versi
              dinaikkan.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Kode Versi Terbaru (Version Code) *
            </label>
            <input
              type="number"
              value={config.latestVersionCode}
              onChange={(e) =>
                updateConfig({
                  latestVersionCode: parseInt(e.target.value, 10) || 1,
                })
              }
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 font-mono font-bold"
            />
            <p className="text-[11px] text-slate-400">
              Aplikasi saat ini: Kode 10 (v5.5). Jika ingin memicu update, isi
              11 atau lebih tinggi.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              URL Download APK Langsung (.apk)
            </label>
            <input
              type="url"
              value={config.apkUpdateUrl}
              onChange={(e) => updateConfig({ apkUpdateUrl: e.target.value })}
              placeholder="https://domain.com/kimtv-release.apk"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-slate-300">
              Link Kontak Admin (WhatsApp / Telegram)
            </label>
            <input
              type="text"
              value={config.adminContactUrl}
              onChange={(e) =>
                updateConfig({ adminContactUrl: e.target.value })
              }
              placeholder="https://wa.me/6281234567890"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500"
            />
            <p className="text-[11px] text-slate-400">
              Akan dirender sebagai QR Code di layar Profil aplikasi TV.
            </p>
          </div>
        </div>
      </div>

      {/* Card 4: Wallpaper & Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <ImageIcon className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-bold text-white">
            Wallpaper & Promo Banner Pop-up
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              URL Gambar Latar Belakang (Wallpaper TV)
            </label>
            <input
              type="url"
              value={config.backgroundUrl}
              onChange={(e) => updateConfig({ backgroundUrl: e.target.value })}
              placeholder="https://domain.com/bg.jpg"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Kosongkan jika ingin menggunakan latar bawaan aplikasi.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              URL Banner Sambutan (Popup Promo)
            </label>
            <input
              type="url"
              value={config.welcomeBannerUrl}
              onChange={(e) =>
                updateConfig({ welcomeBannerUrl: e.target.value })
              }
              placeholder="https://domain.com/promo.jpg"
              className="w-full bg-[#0c1322] border border-white/10 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Muncul sekali setiap pengguna membuka aplikasi TV.
            </p>
          </div>
        </div>
      </div>

      {/* Card 5: Maintenance Mode */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          config.isMaintenance
            ? "bg-red-950/40 border-red-500 shadow-xl shadow-red-950/40"
            : "glass-panel"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3 rounded-2xl ${
                config.isMaintenance
                  ? "bg-red-500 text-white"
                  : "bg-white/5 text-slate-400"
              }`}
            >
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">
                Mode Perbaikan (Maintenance Mode)
              </h4>
              <p className="text-xs text-slate-400">
                Kunci semua aplikasi TV pengguna secara paksa jika server
                streaming sedang mengalami kendala.
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              updateConfig({ isMaintenance: !config.isMaintenance })
            }
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
    </div>
  );
};

