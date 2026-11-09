"use client";

import React from "react";
import { LogOut, Tv, X } from "lucide-react";
import { AdminTabId } from "@/types/admin";
import { NavigationTab } from "./Sidebar";

interface MobileDrawerProps {
  isOpen: boolean;
  appName: string;
  navigationTabs: NavigationTab[];
  activeTab: AdminTabId;
  onSelectTab: (tab: AdminTabId) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  appName,
  navigationTabs,
  activeTab,
  onSelectTab,
  onClose,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-72 max-w-[80vw] bg-[#070b14] border-r border-white/10 h-full flex flex-col p-4 shadow-2xl z-10 animate-toast">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{appName}</h2>
              <p className="text-[10px] text-slate-400">Mobile Hub Console</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1.5 overflow-y-auto">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onSelectTab(tab.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/30"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <button
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="mt-auto flex items-center gap-3 p-3 text-sm text-red-400 hover:bg-red-500/10 rounded-xl font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout Sesi
        </button>
      </div>
    </div>
  );
};

