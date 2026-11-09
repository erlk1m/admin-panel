"use client";

import React from "react";
import {
  Activity,
  AlertTriangle,
  Check,
  Key,
  MessageCircle,
  Monitor,
  Radio,
  Smartphone,
  Tv,
  Users,
  Zap,
} from "lucide-react";
import { ActiveUser, ChannelStat, TokenObject } from "@/types/admin";

interface OverviewTabProps {
  isMaintenance: boolean;
  tokens: TokenObject[];
  activeUsers: ActiveUser[];
  activeUsersCount: number;
  latestVersionCode: number;
  channelStats: ChannelStat[];
  now: number;
  onGoToSettings: () => void;
  onOpenInbox: (token: string) => void;
  onKick: (token: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  isMaintenance,
  tokens,
  activeUsers,
  activeUsersCount,
  latestVersionCode,
  channelStats,
  now,
  onGoToSettings,
  onOpenInbox,
  onKick,
}) => {
  const activeTokensCount = tokens.filter(
    (t) => !t.expiresAt || now === 0 || t.expiresAt > now
  ).length;
  const activePercent =
    tokens.length > 0
      ? Math.round((activeTokensCount / tokens.length) * 100)
      : 0;

  const maxSlot = tokens.reduce(
    (sum, t) => sum + (Number(t.maxDevices) || 1),
    0
  );
  const usedSlot = tokens.reduce(
    (sum, t) =>
      sum + (Array.isArray(t.deviceIds) ? t.deviceIds.length : t.deviceId ? 1 : 0),
    0
  );
  const slotPercent =
    maxSlot > 0 ? Math.min(100, Math.round((usedSlot / maxSlot) * 100)) : 0;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-6 animate-toast">
      {/* Maintenance Banner Warning */}
      {isMaintenance && (
        <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 flex items-center justify-between gap-4 shadow-lg shadow-red-950/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 animate-bounce" />
            <div>
              <h4 className="text-sm font-bold">
                MODE MAINTENANCE SEDANG AKTIF
              </h4>
              <p className="text-xs text-red-300/80">
                Semua aplikasi TV pengguna saat ini diblokir dengan pesan
                perbaikan.
              </p>
            </div>
          </div>
          <button
            onClick={onGoToSettings}
            className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-400 shrink-0"
          >
            Ubah di Settings
          </button>
        </div>
      )}

      {/* 4 KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1 */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-amber-500 before:to-amber-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Token Aktif
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {activeTokensCount}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${activePercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {tokens.length} total
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Slot Terpakai
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {usedSlot}
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-indigo-300 h-full rounded-full transition-all duration-500"
                style={{ width: `${slotPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {maxSlot} max
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-emerald-500 before:to-teal-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Live Streaming
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight flex items-center gap-2">
            {activeUsersCount}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-[11px] text-emerald-400/80 mt-2 font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            TV & Device Aktif Terhubung
          </p>
        </div>

        {/* KPI 4 */}
        <div className="glass-card p-4 sm:p-5 rounded-2xl relative overflow-hidden group before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-cyan-500 before:to-sky-300">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Versi TV
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)] group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-300 tracking-tight">
            v{latestVersionCode}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
            <Check className="w-3 h-3 text-cyan-400" />
            OTA Update Otomatis Siap
          </p>
        </div>
      </div>

      {/* 2-Pane: Top Channels & Active Streamers */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Top Channels (col-span-4) */}
        <div className="lg:col-span-4 glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Channel Paling Banyak Ditonton
                </h3>
                <p className="text-[11px] text-slate-400">
                  Peringkat statistik live tayangan
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono">
              Live Counter
            </span>
          </div>

          {channelStats.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
              <Radio className="w-6 h-6 text-slate-600 animate-pulse" />
              <span>Belum ada data tontonan saluran terkumpul.</span>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {channelStats.map((stat, i) => {
                const maxCount = channelStats[0]?.count || 1;
                const percent = Math.round((stat.count / maxCount) * 100);
                return (
                  <div
                    key={stat.name || i}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 font-bold text-white">
                        <span className="text-sm">
                          {medals[i] || `#${i + 1}`}
                        </span>
                        <span className="truncate max-w-[200px] sm:max-w-[280px] group-hover:text-indigo-300 transition-colors">
                          {stat.name}
                        </span>
                      </div>
                      <span className="font-mono text-indigo-300 font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                        {stat.count} views
                      </span>
                    </div>
                    <div className="w-full bg-slate-900/80 rounded-full h-2 overflow-hidden p-0.5 border border-white/5">
                      <div
                        className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Streamers (col-span-3) */}
        <div className="lg:col-span-3 glass-panel p-5 sm:p-6 rounded-3xl space-y-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Penonton Streaming
                </h3>
                <p className="text-[11px] text-slate-400">
                  Realtime presence live
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/25 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeUsersCount} Online
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[340px] space-y-2.5 pr-1">
            {activeUsers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                <Tv className="w-6 h-6 text-slate-700" />
                <span>Tidak ada penonton aktif saat ini.</span>
              </div>
            ) : (
              activeUsers.map((user, idx) => {
                const elapsedSec = now
                  ? Math.max(
                      0,
                      Math.floor((now - (Number(user.lastSeen) || 0)) / 1000)
                    )
                  : 0;
                return (
                  <div
                    key={user.token || idx}
                    className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all flex items-center justify-between gap-3 text-xs group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-slate-800/90 flex items-center justify-center text-slate-300 shrink-0 border border-white/10 shadow-inner group-hover:border-emerald-500/30 transition-colors">
                        {user.isTv ? (
                          <Monitor className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-mono font-bold text-amber-300 truncate flex items-center gap-1.5">
                          <span>{user.token}</span>
                          {user.deviceBrand &&
                            user.deviceBrand !== "Unknown" && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-slate-300 font-sans font-normal">
                                {user.deviceBrand}
                              </span>
                            )}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {user.channel}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {elapsedSec}s lalu
                      </span>
                      <button
                        onClick={() => onOpenInbox(user.token)}
                        className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 transition-colors"
                        title="Kirim Pesan Layar TV"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onKick(user.token)}
                        className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 font-bold text-[10px] transition-colors border border-red-500/20"
                        title="Tendang Sesi Pengguna"
                      >
                        KICK
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

