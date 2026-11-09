"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { ConfirmDialogState } from "@/types/admin";

interface ConfirmModalProps {
  state: ConfirmDialogState | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  state,
  onClose,
}) => {
  if (!state || !state.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast">
      <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              state.isDestructive
                ? "bg-red-500/10 text-red-400"
                : "bg-indigo-500/10 text-indigo-400"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">{state.title}</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {state.message}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={state.onConfirm}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${
              state.isDestructive
                ? "bg-red-600 hover:bg-red-500 shadow-red-600/25"
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/25"
            }`}
          >
            {state.confirmText || "Konfirmasi"}
          </button>
        </div>
      </div>
    </div>
  );
};

