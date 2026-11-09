"use client";

import React from "react";
import { RefreshCcw, Save, Sliders } from "lucide-react";
import { AdminTabId } from "@/types/admin";
import { NavigationTab } from "./Sidebar";

interface MobileNavProps {
  appName: string;
  navigationTabs: NavigationTab[];
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  saving: boolean;
  onSave: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  appName,
  navigationTabs,
  activeTab,
  onSelectTab,
  saving,
  onSave,
}) => {
  return (
    <>
      {/* Mobile Floating Quick Save Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 bg-[#080c14]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-between z-30">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white truncate max-w-[150px]">
            {appName} Admin
          </span>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCcw className="animate-spin w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{saving ? "Menyimpan..." : "Simpan"}</span>
        </button>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090d16]/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around z-40 px-2 pb-[env(safe-area-inset-bottom)]">
        {navigationTabs.slice(0, 5).map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
                isActive
                  ? "text-indigo-400 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
              )}
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">
                {tab.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
        <button
          onClick={() => onSelectTab("settings")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all relative ${
            activeTab === "settings"
              ? "text-indigo-400 font-bold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {activeTab === "settings" && (
            <span className="absolute top-0 w-8 h-1 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
          )}
          <Sliders className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Setelan</span>
        </button>
      </nav>
    </>
  );
};

