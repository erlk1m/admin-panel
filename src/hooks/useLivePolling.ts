"use client";

import { useEffect, useState } from "react";
import { safeDecode } from "@/lib/format";
import { ActiveUser, ChannelStat, ChatMessage } from "@/types/admin";

export function useLivePolling(
  isAuthenticated: boolean,
  onUnauthorized?: () => void
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [channelStats, setChannelStats] = useState<ChannelStat[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    const handleHttpStatus = (res: Response): boolean => {
      if (res.status === 401) {
        if (!cancelled) onUnauthorized?.();
        return false;
      }
      return res.ok;
    };

    const fetchChats = () => {
      fetch("/api/chats", {
        cache: "no-store",
        credentials: "same-origin",
      })
        .then(async (res) => {
          if (!handleHttpStatus(res)) return null;
          return (await res.json()) as unknown;
        })
        .then((data) => {
          if (!cancelled && Array.isArray(data)) {
            const safeMessages: ChatMessage[] = data.map(
              (rawMsg: unknown, i: number) => {
                const msg =
                  rawMsg && typeof rawMsg === "object"
                    ? (rawMsg as Record<string, unknown>)
                    : {};
                const rawMessage = msg.message;
                let msgText: string;
                if (typeof rawMessage === "string") {
                  msgText = rawMessage;
                } else if (
                  typeof rawMessage === "object" &&
                  rawMessage !== null
                ) {
                  const nested = rawMessage as Record<string, unknown>;
                  msgText = String(
                    nested.text || nested.msg || JSON.stringify(nested)
                  );
                } else {
                  msgText = String(rawMessage || "");
                }
                return {
                  id: String(msg.id || `msg_${i}`),
                  sender:
                    typeof msg.sender === "string"
                      ? msg.sender
                      : String(msg.sender || "User"),
                  message: msgText,
                  timestamp:
                    typeof msg.timestamp === "number"
                      ? msg.timestamp
                      : Number(msg.timestamp) || 0,
                };
              }
            );
            setChatMessages(safeMessages);
          }
        })
        .catch(() => {});
    };

    const fetchPresence = () => {
      fetch("/api/presence", {
        cache: "no-store",
        credentials: "same-origin",
      })
        .then(async (res) => {
          if (!handleHttpStatus(res)) return null;
          return (await res.json()) as unknown;
        })
        .then((raw) => {
          if (cancelled || !raw || typeof raw !== "object") return;
          const data = raw as Record<string, unknown>;
          if (!Array.isArray(data.users)) return;

          const safeUsers: ActiveUser[] = data.users.map((rawUser: unknown) => {
            const u =
              rawUser && typeof rawUser === "object"
                ? (rawUser as Record<string, unknown>)
                : {};
            const rawChannel = u.channel;
            let channelStr: string;
            if (typeof rawChannel === "string") {
              channelStr = rawChannel;
            } else if (
              typeof rawChannel === "object" &&
              rawChannel !== null
            ) {
              const nested = rawChannel as Record<string, unknown>;
              channelStr = String(
                nested.name || nested.title || JSON.stringify(nested)
              );
            } else {
              channelStr = String(rawChannel || "Lainnya");
            }
            return {
              token: String(u.token || ""),
              channel: channelStr,
              country:
                typeof u.country === "string"
                  ? u.country
                  : String(u.country || "ID"),
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
            };
          });
          setActiveUsers(safeUsers);
          setActiveUsersCount(
            typeof data.count === "number" ? data.count : safeUsers.length
          );
        })
        .catch(() => {});
    };

    const fetchStats = () => {
      fetch("/api/stats", {
        cache: "no-store",
        credentials: "same-origin",
      })
        .then(async (res) => {
          if (!handleHttpStatus(res)) return null;
          return (await res.json()) as unknown;
        })
        .then((raw) => {
          if (cancelled || !raw || typeof raw !== "object" || Array.isArray(raw)) {
            return;
          }
          const data = raw as Record<string, unknown>;
          if (data.error) return;

          const statsArray: ChannelStat[] = Object.keys(data).map((key) => {
            const val = data[key];
            let count = 0;
            if (typeof val === "number") {
              count = val;
            } else if (typeof val === "string") {
              count = Number(val) || 0;
            } else if (typeof val === "object" && val !== null) {
              const nested = val as Record<string, unknown>;
              count =
                Number(nested.count || nested.views || nested.total || 0) || 0;
            }
            return {
              name: safeDecode(String(key || "")),
              count,
            };
          });
          statsArray.sort((a, b) => b.count - a.count);
          setChannelStats(statsArray.slice(0, 5));
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
  }, [isAuthenticated, onUnauthorized]);

  return {
    chatMessages,
    setChatMessages,
    activeUsers,
    activeUsersCount,
    channelStats,
  };
}
