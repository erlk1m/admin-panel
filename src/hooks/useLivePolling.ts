"use client";

import { useEffect, useState } from "react";
import { safeDecode } from "@/lib/format";
import { ActiveUser, ChannelStat, ChatMessage } from "@/types/admin";

export function useLivePolling(isAuthenticated: boolean, adminPassword: string) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const headers: Record<string, string> = { "x-admin-password": adminPassword };

    const fetchChats = () => {
      fetch("/api/chats")
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            const safeMessages: ChatMessage[] = data.map((msg: any, i: number) => ({
              id: String(msg.id || `msg_${i}`),
              sender:
                typeof msg.sender === "string"
                  ? msg.sender
                  : String(msg.sender || "User"),
              message:
                typeof msg.message === "string"
                  ? msg.message
                  : typeof msg.message === "object" && msg.message !== null
                  ? msg.message.text || msg.message.msg || JSON.stringify(msg.message)
                  : String(msg.message || ""),
              timestamp:
                typeof msg.timestamp === "number"
                  ? msg.timestamp
                  : Number(msg.timestamp) || 0,
            }));
            setChatMessages(safeMessages);
          }
        })
        .catch(() => {});
    };

    const fetchPresence = () => {
      fetch("/api/presence", { headers })
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data && data.users && Array.isArray(data.users)) {
            const safeUsers: ActiveUser[] = data.users.map((u: any) => ({
              token: String(u.token || ""),
              channel:
                typeof u.channel === "string"
                  ? u.channel
                  : typeof u.channel === "object" && u.channel !== null
                  ? u.channel.name || u.channel.title || JSON.stringify(u.channel)
                  : String(u.channel || "Lainnya"),
              country: typeof u.country === "string" ? u.country : String(u.country || "ID"),
              deviceBrand:
                typeof u.deviceBrand === "string"
                  ? u.deviceBrand
                  : String(u.deviceBrand || "Unknown"),
              deviceModel:
                typeof u.deviceModel === "string"
                  ? u.deviceModel
                  : String(u.deviceModel || "Unknown"),
              isTv: Boolean(u.isTv),
              lastSeen:
                typeof u.lastSeen === "number"
                  ? u.lastSeen
                  : Number(u.lastSeen) || 0,
            }));
            setActiveUsers(safeUsers);
            setActiveUsersCount(
              typeof data.count === "number" ? data.count : safeUsers.length
            );
          }
        })
        .catch(() => {});
    };

    const fetchStats = () => {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && data && !data.error && typeof data === "object") {
            const statsArray: ChannelStat[] = Object.keys(data).map((key) => {
              const val = data[key];
              let count = 0;
              if (typeof val === "number") {
                count = val;
              } else if (typeof val === "string") {
                count = Number(val) || 0;
              } else if (typeof val === "object" && val !== null) {
                count = Number(val.count || val.views || val.total || 0) || 0;
              }
              return {
                name: typeof key === "string" ? safeDecode(key) : String(key || ""),
                count,
              };
            });
            statsArray.sort((a, b) => b.count - a.count);
            setChannelStats(statsArray.slice(0, 5));
          }
        })
        .catch(() => {});
    };

    fetchChats();
    fetchPresence();
    fetchStats();
    const chatInterval = setInterval(fetchChats, 3000);
    const presenceInterval = setInterval(fetchPresence, 8000);
    const statsInterval = setInterval(fetchStats, 60000);

    return () => {
      cancelled = true;
      clearInterval(chatInterval);
      clearInterval(presenceInterval);
      clearInterval(statsInterval);
    };
  }, [isAuthenticated, adminPassword]);

  return {
    chatMessages,
    setChatMessages,
    activeUsers,
    activeUsersCount,
    channelStats,
  };
}

