"use client";

import React from "react";
import { Tv } from "lucide-react";

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col items-center justify-center text-slate-100 gap-4">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        <Tv className="w-6 h-6 text-indigo-400 absolute" />
      </div>
      <p className="text-sm text-slate-400 font-medium animate-pulse">
        Menghubungkan ke KIMTV Hub...
      </p>
    </div>
  );
};

