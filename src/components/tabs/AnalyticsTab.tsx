"use client";

import React from "react";
import { Monitor, PieChart, Smartphone } from "lucide-react";
import { ActiveUser } from "@/types/admin";

interface AnalyticsTabProps {
  activeUsers: ActiveUser[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ activeUsers }) => {
  const tvCount = activeUsers.filter((u) => u.isTv).length;
  const mobileCount = activeUsers.length - tvCount;
  const tvPercent =
    activeUsers.length > 0
      ? Math.round((tvCount / activeUsers.length) * 100)
      : 50;

  const brands: Record<string, number> = {};
  const models: Record<string, number> = {};
  activeUsers.forEach((u) => {
    const b = u.deviceBrand || "Unknown";
    brands[b] = (brands[b] || 0) + 1;
    const m = u.deviceModel || "Unknown";
    models[m] = (models[m] || 0) + 1;
  });

  const brandList = Object.entries(brands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const modelList = Object.entries(models)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-toast">
      {/* Device Distribution Split Bar */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-white/5">
          <PieChart className="w-5 h-5 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">
            Distribusi Perangkat Penonton
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="flex items-center gap-2 text-blue-400">
              <Monitor className="w-4 h-4" /> Smart TV / STB: {tvCount} (
              {tvPercent}%)
            </span>
            <span className="flex items-center gap-2 text-emerald-400">
              <Smartphone className="w-4 h-4" /> Smartphone / HP:{" "}
              {mobileCount} ({100 - tvPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-4 overflow-hidden flex shadow-inner">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-400 h-full transition-all duration-500"
              style={{ width: `${tvPercent}%` }}
            />
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${100 - tvPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Brand and Model Rank Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/5">
            Peringkat Merek Perangkat (Top Brands)
          </h4>
          <div className="space-y-2">
            {brandList.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Belum ada data perangkat.
              </p>
            ) : (
              brandList.map(([brand, count]) => (
                <div
                  key={brand}
                  className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs"
                >
                  <span className="font-semibold text-white capitalize">
                    {brand}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">
                    {count} Perangkat
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-5 sm:p-6 rounded-3xl space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/5">
            Peringkat Tipe Model (Top Models)
          </h4>
          <div className="space-y-2">
            {modelList.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Belum ada data model.
              </p>
            ) : (
              modelList.map(([model, count]) => (
                <div
                  key={model}
                  className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-xs"
                >
                  <span className="font-semibold text-white uppercase">
                    {model}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                    {count} User
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

