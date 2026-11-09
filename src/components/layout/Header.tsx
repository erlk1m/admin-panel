"use client";

import React from "react";
import { Menu, RefreshCcw, Save, Search } from "lucide-react";

interface HeaderProps {
  appName: string;
  activeTabLabel: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  saving: boolean;
  onSave: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  activeTabLabel,
  searchQuery,
  onSearchChange,
  saving,
  onSave,
  onOpenMobileMenu,
}) => {
  return (
    <header className="h-16 bg-[#060911]/85 backdrop-blur-xl border-b border-white/[0.07] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 font-medium hidden sm:inline">
            {appName} Hub
          </span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="font-bold text-white capitalize bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-indigo-300">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {activeTabLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search */}
        <div className="relative hidden md:block group">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Cari token / user..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-44 lg:w-56 bg-[#0c1322] border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:w-64 transition-all font-sans"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 bg-white/5 border border-white/10 px-1 rounded pointer-events-none">
            /
          </kbd>
        </div>

        {/* Save Config Button */}
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/50 active:scale-95 disabled:opacity-50 transition-all border border-indigo-400/20"
          title="Shortcut: Ctrl+S"
        >
          {saving ? (
            <RefreshCcw className="animate-spin w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          <kbd className="hidden xl:inline px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">
            ⌘S
          </kbd>
        </button>
      </div>
    </header>
  );
};

