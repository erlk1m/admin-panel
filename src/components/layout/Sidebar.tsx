"use client";

import React from "react";
import { LogOut, Tv, type LucideIcon } from "lucide-react";
import { AdminTabId } from "@/types/admin";

export interface NavigationTab {
  id: AdminTabId;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  count?: number;
}

interface SidebarProps {
  appName: string;
  navigationTabs: NavigationTab[];
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  appName,
  navigationTabs,
  activeTab,
  onSelectTab,
  onLogout,
}) => {
  return (
    <aside className="w-64 bg-[#070b14]/90 backdrop-blur-xl border-r border-white/[0.07] flex flex-col hidden lg:flex select-none z-20">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 opacity-60 blur-[4px] group-hover:opacity-100 transition duration-300" />
            <div className="relative w-10 h-10 rounded-xl bg-[#090d16] border border-white/10 flex items-center justify-center shadow-lg">
              <Tv className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              {appName}
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold border border-indigo-500/30">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Management Hub
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Menu Utama
        </div>
        {navigationTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-xs font-semibold group relative ${
                isActive
                  ? "bg-gradient-to-r from-indigo-600/20 via-indigo-600/10 to-transparent text-white border border-indigo-500/30 shadow-[0_0_20px_-4px_rgba(99,102,241,0.25)] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-indigo-400 before:rounded-r-full"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-indigo-400"
                      : "text-slate-400 group-hover:text-indigo-400"
                  }`}
                />
                <span>{tab.label}</span>
              </div>
              {tab.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isActive
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {typeof tab.count === "number" && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold font-mono ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer with System Widget */}
      <div className="p-3 border-t border-white/[0.07] space-y-2">
        <div className="px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            RTDB Engine
          </span>
          <span className="font-mono text-emerald-400 font-bold">
            Synchronized
          </span>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all group text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center font-bold text-xs text-white border border-white/10 shadow-sm group-hover:from-red-600 group-hover:to-red-900 transition-all">
              AD
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white group-hover:text-red-300 truncate">
                Administrator
              </div>
              <div className="text-[10px] text-slate-400 group-hover:text-red-400/80">
                Keluar Sesi
              </div>
            </div>
          </div>
          <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
        </button>
      </div>
    </aside>
  );
};

