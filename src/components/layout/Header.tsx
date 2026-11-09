"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Menu,
  RefreshCcw,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";

interface HeaderProps {
  appName: string;
  activeTabLabel: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  saving: boolean;
  hasUnsavedChanges: boolean;
  onSave: () => void;
  onDiscardChanges: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  appName,
  activeTabLabel,
  searchQuery,
  onSearchChange,
  saving,
  hasUnsavedChanges,
  onSave,
  onDiscardChanges,
  onOpenMobileMenu,
}) => {
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      e.preventDefault();
      if (desktopInputRef.current && desktopInputRef.current.offsetParent !== null) {
        desktopInputRef.current.focus();
      } else {
        setIsMobileSearchOpen(true);
        setTimeout(() => mobileInputRef.current?.focus(), 20);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="bg-[#060911]/85 backdrop-blur-xl border-b border-white/[0.07] sticky top-0 z-20">
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 shrink-0"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-slate-400 font-medium hidden sm:inline shrink-0">
              {appName} Hub
            </span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="font-bold text-white capitalize bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-indigo-300 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
              <span className="truncate">{activeTabLabel}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => {
              const next = !isMobileSearchOpen;
              setIsMobileSearchOpen(next);
              if (next) {
                setTimeout(() => mobileInputRef.current?.focus(), 20);
              }
            }}
            className={`md:hidden p-2 rounded-xl border transition-colors relative ${
              isMobileSearchOpen || searchQuery
                ? "bg-indigo-500/15 border-indigo-500/30 text-indigo-300"
                : "bg-white/[0.03] border-white/10 text-slate-400 hover:text-white"
            }`}
            aria-label="Cari token atau channel"
            title="Cari"
          >
            <Search className="w-4 h-4" />
            {searchQuery && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1.5 right-1.5" />
            )}
          </button>

          {/* Desktop Quick Search */}
          <div className="relative hidden md:block group">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-400 transition-colors" />
            <input
              ref={desktopInputRef}
              type="text"
              placeholder="Cari token / channel / user..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  onSearchChange("");
                  desktopInputRef.current?.blur();
                }
              }}
              className="w-48 lg:w-60 bg-[#0c1322] border border-white/10 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 focus:w-72 transition-all font-sans"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white rounded"
                aria-label="Bersihkan pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded pointer-events-none">
                /
              </kbd>
            )}
          </div>

          {/* Unsaved Changes Indicator + Discard */}
          {hasUnsavedChanges && !saving && (
            <div className="flex items-center gap-1.5">
              <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-[11px] font-semibold text-amber-300">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Belum disimpan
              </span>
              <button
                type="button"
                onClick={onDiscardChanges}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                title="Batalkan perubahan yang belum disimpan"
                aria-label="Batalkan perubahan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Save Config Button */}
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all border ${
              hasUnsavedChanges
                ? "bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-500 hover:from-amber-400 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/40 border-amber-400/40"
                : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/25 border-indigo-400/20"
            }`}
            title="Shortcut: Ctrl+S"
          >
            {saving ? (
              <RefreshCcw className="animate-spin w-4 h-4" />
            ) : hasUnsavedChanges ? (
              <Save className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4 text-emerald-300 hidden sm:inline" />
            )}
            <span className="hidden sm:inline">
              {saving
                ? "Menyimpan..."
                : hasUnsavedChanges
                ? "Simpan Perubahan"
                : "Tersimpan"}
            </span>
            <span className="sm:hidden">
              {saving ? "..." : hasUnsavedChanges ? "Simpan" : "Simpan"}
            </span>
            <kbd className="hidden xl:inline px-1.5 py-0.5 text-[10px] bg-white/20 rounded font-mono">
              ⌘S
            </kbd>
          </button>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {isMobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-white/5 animate-toast">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={mobileInputRef}
              type="text"
              placeholder="Cari token, channel, atau penonton..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-[#0c1322] border border-white/10 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
