"use client";

import React from "react";
import { ToastMessage } from "@/types/admin";
import { Check, AlertCircle, Sparkles } from "lucide-react";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto p-4 rounded-xl shadow-2xl backdrop-blur-xl border text-sm font-medium flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-bottom-5 cursor-pointer ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200 shadow-emerald-950/50"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-500/30 text-rose-200 shadow-rose-950/50"
              : "bg-cyan-950/90 border-cyan-500/30 text-cyan-200 shadow-cyan-950/50"
          }`}
        >
          {toast.type === "success" && <Check className="w-5 h-5 text-emerald-400 shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          {toast.type === "info" && <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />}
          <span className="flex-1 leading-snug">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
