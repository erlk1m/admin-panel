export function safeDecode(str: string): string {
  try {
    return decodeURIComponent(str);
  } catch {
    return String(str || "");
  }
}

export function formatDateSafe(timestamp: unknown): string {
  if (!timestamp) return "";
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return "";
  try {
    const d = new Date(num);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function getExpirationParams(
  duration: string,
  nowMs = Date.now()
): { expiresAt: number | null; label: string } {
  switch (duration) {
    case "1h":
      return { expiresAt: nowMs + 3600000, label: "1 Jam" };
    case "1d":
      return { expiresAt: nowMs + 86400000, label: "1 Hari" };
    case "1w":
      return { expiresAt: nowMs + 604800000, label: "1 Minggu" };
    case "1m":
      return { expiresAt: nowMs + 2592000000, label: "1 Bulan" };
    default:
      return { expiresAt: null, label: "Lifetime" };
  }
}

export function generateRandomTokenCode(prefix = "KIM-"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = prefix;
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

