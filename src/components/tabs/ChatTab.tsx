"use client";

import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Send, Trash2 } from "lucide-react";
import { formatDateSafe } from "@/lib/format";
import { AdminConfigState, ChatMessage } from "@/types/admin";

interface ChatTabProps {
  config: AdminConfigState;
  updateConfig: (patch: Partial<AdminConfigState>) => void;
  chatMessages: ChatMessage[];
  onSendChat: (message: string) => Promise<boolean>;
  onDeleteChat: (id: string) => void;
}

const ADMIN_NAME_EFFECTS = [
  { value: "NONE", label: "Polos" },
  { value: "GLITCH", label: "Glitch" },
  { value: "SPARKLE", label: "Sparkle" },
  { value: "NEON", label: "Neon" },
  { value: "RAINBOW", label: "Rainbow" },
  { value: "WAVY", label: "Wavy" },
];

const isHttpUrl = (val?: string): boolean => {
  const trimmed = (val || "").trim().toLowerCase();
  return trimmed.startsWith("http://") || trimmed.startsWith("https://");
};

const ChatBadgeIcon: React.FC<{ icon?: string; fallback?: string }> = ({
  icon,
  fallback = "",
}) => {
  const [failedUrl, setFailedUrl] = useState("");
  const cleanIcon = (icon || "").trim();

  if (isHttpUrl(cleanIcon) && failedUrl !== cleanIcon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={cleanIcon}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedUrl(cleanIcon)}
        className="w-3.5 h-3.5 rounded-sm object-contain shrink-0"
      />
    );
  }

  const display = cleanIcon && !isHttpUrl(cleanIcon) ? cleanIcon : fallback;
  return display ? <span className="shrink-0">{display}</span> : null;
};

export const ChatTab: React.FC<ChatTabProps> = ({
  config,
  updateConfig,
  chatMessages,
  onSendChat,
  onDeleteChat,
}) => {
  const [chatInput, setChatInput] = useState("");
  const messagesBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = messagesBoxRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chatMessages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const sent = await onSendChat(chatInput.trim());
    if (sent) {
      setChatInput("");
    }
  };

  return (
    <div className="space-y-6 animate-toast">
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        {/* Header & Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-pink-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Moderasi Live Chat
              </h3>
              <p className="text-xs text-slate-400">
                Kelola obrolan publik dan kirim siaran resmi sebagai
                Administrator.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300">
              {config.chatEnabled ? "Chat Diaktifkan" : "Chat Ditutup"}
            </span>
            <button
              type="button"
              onClick={() =>
                updateConfig({ chatEnabled: !config.chatEnabled })
              }
              aria-label="Toggle Live Chat"
              className={`w-12 h-6 rounded-full transition-colors relative ${
                config.chatEnabled ? "bg-pink-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  config.chatEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Admin Identity Customizer & Live Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Badge Ikon Admin
            </label>
            <input
              type="text"
              value={config.adminBadgeIcon}
              onChange={(e) => updateConfig({ adminBadgeIcon: e.target.value })}
              className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Warna Badge
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.adminBadgeColor}
                onChange={(e) =>
                  updateConfig({ adminBadgeColor: e.target.value })
                }
                className="w-10 h-9 rounded-xl bg-transparent border-0 cursor-pointer shrink-0"
              />
              <input
                type="text"
                value={config.adminBadgeColor}
                onChange={(e) =>
                  updateConfig({ adminBadgeColor: e.target.value })
                }
                className="flex-1 bg-[#0c1322] border border-white/10 rounded-xl p-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Efek Nama Admin
            </label>
            <select
              value={config.adminNameEffect}
              onChange={(e) =>
                updateConfig({ adminNameEffect: e.target.value })
              }
              className="w-full bg-[#0c1322] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              {ADMIN_NAME_EFFECTS.map((ef) => (
                <option key={ef.value} value={ef.value}>
                  {ef.label}
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview Bubble */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase">
              Live Preview Bubble
            </label>
            <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-sm shrink-0 inline-flex items-center gap-1"
                style={{ backgroundColor: config.adminBadgeColor }}
              >
                <ChatBadgeIcon icon={config.adminBadgeIcon} fallback="🔧" />
                <span>ADMIN</span>
              </span>
              <span className="text-xs text-slate-300 truncate">
                Halo penonton!
              </span>
            </div>
          </div>
        </div>

        {/* Chat Messages Box */}
        <div
          ref={messagesBoxRef}
          className="bg-[#090d16] border border-white/10 rounded-2xl p-4 h-80 overflow-y-auto space-y-2 flex flex-col"
        >
          {chatMessages.length === 0 ? (
            <div className="text-center m-auto text-slate-500 text-xs">
              Belum ada pesan chat live dari penonton.
            </div>
          ) : (
            chatMessages.map((msg) => {
              const senderParts = msg.sender.split("|");
              const senderName = senderParts[0] || "User";
              const senderBadge = senderParts[2] || "";
              const isAdminMsg = senderParts.includes("ADMIN");

              return (
                <div
                  key={msg.id}
                  className={`p-2.5 rounded-xl flex items-start justify-between gap-3 group transition-colors ${
                    isAdminMsg
                      ? "bg-indigo-950/40 border border-indigo-500/20"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ChatBadgeIcon icon={senderBadge} />
                      <span
                        className={`text-xs font-bold ${
                          isAdminMsg ? "text-pink-400" : "text-cyan-400"
                        }`}
                      >
                        {senderName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatDateSafe(msg.timestamp) || "Baru saja"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 break-words">
                      {msg.message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteChat(msg.id)}
                    className="opacity-75 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                    title="Hapus pesan"
                    aria-label="Hapus pesan chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Chat Composer */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            onClick={() => onDeleteChat("all")}
            className="px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 shrink-0"
            title="Bersihkan Semua Chat"
            aria-label="Bersihkan Semua Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Kirim pesan resmi sebagai Admin..."
            className="flex-1 bg-[#0c1322] border border-white/10 text-white rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-pink-500 min-w-0"
          />
          <button
            type="submit"
            className="px-4 sm:px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-pink-600/25 shrink-0 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>
      </div>
    </div>
  );
};
