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

export function generateRandomTokenCode(prefix = "KIM-", length = 6): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const maxValid = Math.floor(256 / chars.length) * chars.length; // 252 (unbiased)
  const cryptoApi = globalThis.crypto;
  let token = prefix;

  if (cryptoApi && typeof cryptoApi.getRandomValues === "function") {
    const buf = new Uint8Array(16);
    while (token.length < prefix.length + length) {
      cryptoApi.getRandomValues(buf);
      for (let i = 0; i < buf.length && token.length < prefix.length + length; i++) {
        if (buf[i] < maxValid) {
          token += chars.charAt(buf[i] % chars.length);
        }
      }
    }
    return token;
  }

  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

