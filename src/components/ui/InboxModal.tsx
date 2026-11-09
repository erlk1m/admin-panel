"use client";

import React from "react";
import { MessageCircle } from "lucide-react";
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
  if (!modal || !modal.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-toast">
      <div className="glass-panel p-6 rounded-3xl border border-white/10 max-w-md w-full shadow-2xl space-y-4">
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
        <p className="text-xs text-slate-400">
          Pesan ini akan muncul sebagai dialog peringatan besar di tengah layar
          TV pengguna.
        </p>
        <textarea
          rows={3}
          placeholder="Contoh: Masa aktif langganan Anda tersisa 3 hari. Segera perpanjang ke admin..."
          value={modal.message}
          onChange={(e) => onChangeMessage(e.target.value)}
          className="w-full bg-[#0c1322] border border-white/10 text-white rounded-2xl p-3.5 focus:outline-none focus:border-indigo-500 text-sm"
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
          >
            Batal
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
          >
            Kirim ke TV
          </button>
        </div>
      </div>
    </div>
  );
};

