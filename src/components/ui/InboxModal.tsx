"use client";

import React, { useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { InboxModalState } from "@/types/admin";

interface InboxModalProps {
  modal: InboxModalState | null;
  onChangeMessage: (message: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const InboxModal: React.FC<InboxModalProps> = ({
  modal,
  onChangeMessage,
  onClose,
  onSubmit,
}) => {
  const isOpen = Boolean(modal?.isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!modal || !modal.isOpen) return null;

  const canSubmit = modal.message.trim().length > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast"
    >
      <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Kirim Pesan Layar TV
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Token: {modal.token}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            aria-label="Tutup popup pesan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Pesan ini akan muncul sebagai dialog peringatan besar di tengah layar
          TV pengguna.
        </p>

        <div className="space-y-1.5">
          <textarea
            rows={3}
            autoFocus
            placeholder="Contoh: Masa aktif langganan Anda tersisa 3 hari. Segera perpanjang ke admin..."
            value={modal.message}
            onChange={(e) => onChangeMessage(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && canSubmit) {
                e.preventDefault();
                onSubmit();
              }
            }}
            className="w-full bg-[#0c1322] border border-white/10 text-white rounded-2xl p-3.5 focus:outline-none focus:border-indigo-500 text-sm"
          />
          <p className="text-[10px] text-slate-500 text-right">
            Tekan <kbd className="px-1 py-0.5 bg-white/5 rounded">Ctrl+Enter</kbd>{" "}
            untuk mengirim cepat
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
          >
            Kirim ke TV
          </button>
        </div>
      </div>
    </div>
  );
};
