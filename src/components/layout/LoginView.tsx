"use client";

import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Key,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tv,
} from "lucide-react";

interface LoginViewProps {
  appName: string;
  adminPassword: string;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  appName,
  adminPassword,
  onPasswordChange,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[#060911] flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Ambient Glow Spots */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Central Card */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl relative z-10 before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-indigo-500 before:via-purple-500 before:to-cyan-400 before:rounded-t-3xl">
        <div className="flex flex-col items-center mb-8 text-center">
          {/* Glowing Brand Icon */}
          <div className="relative mb-5 group">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 opacity-60 blur-md group-hover:opacity-100 transition duration-500 animate-pulse-glow" />
            <div className="relative w-16 h-16 rounded-2xl bg-[#090d16] border border-white/15 p-0.5 shadow-2xl flex items-center justify-center">
              <Tv className="w-8 h-8 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-2.5">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Enterprise Hub • v2.0</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {appName} Console
          </h1>
          <p className="text-slate-400 text-xs mt-2 max-w-xs leading-relaxed">
            Pusat kendali live streaming IPTV, manajemen token VIP, moderasi
            chat, dan konfigurasi TV.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider pl-1 flex items-center justify-between">
              <span>Password Administrator</span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">
                wajib
              </span>
            </label>
            <div className="relative group">
              <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={adminPassword}
                onChange={(e) => onPasswordChange(e.target.value)}
                className="w-full bg-[#0a101d] border border-white/10 text-white rounded-2xl py-3.5 pl-12 pr-12 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all placeholder:text-slate-600 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 active:scale-[0.98] flex items-center justify-center gap-2 text-sm border border-indigo-400/20"
          >
            <Key className="w-4 h-4" /> Masuk ke Panel
          </button>
        </form>

        <div className="mt-8 pt-5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>SSL Protected</span>
          </span>
          <span className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Firebase RTDB
          </span>
        </div>
      </div>
    </div>
  );
};

