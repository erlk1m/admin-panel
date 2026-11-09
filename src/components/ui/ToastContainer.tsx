"use client";

import React from "react";
import { AlertCircle, Check, Sparkles, X } from "lucide-react";
import { ToastMessage } from "@/types/admin";

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl shadow-xl border text-sm backdrop-blur-xl animate-toast transition-all ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
              : toast.type === "error"
              ? "bg-red-950/90 border-red-500/30 text-red-200"
              : "bg-indigo-950/90 border-indigo-500/30 text-indigo-200"
          }`}
        >
          {toast.type === "success" && (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          {toast.type === "error" && (
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          {toast.type === "info" && (
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          )}
          <span className="flex-1 text-xs sm:text-sm font-medium">
            {toast.message}
          </span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-white p-1"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

