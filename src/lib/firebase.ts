import crypto from "crypto";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "kimtv_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export const NO_STORE_HEADERS: Record<string, string> = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export const NO_STORE_FETCH_HEADERS: Record<string, string> = {
  "Cache-Control": "no-cache, no-store, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export interface FirebaseEnv {
  firebaseUrl: string;
  firebaseSecret: string;
  authQuery: string;
}

export function safeCompareStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function getPasswordFingerprint(adminPassword: string): string {
  return crypto
    .createHash("sha256")
    .update(`pw:${adminPassword}`, "utf8")
    .digest("hex")
    .slice(0, 12);
}

function getSigningKey(): Buffer | null {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return null;
  const baseSecret = process.env.SESSION_SECRET || adminPassword;
  return crypto
    .createHmac("sha256", "kimtv-admin-session-v1")
    .update(baseSecret, "utf8")
    .digest();
}

export function createAdminSessionToken(): string | null {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const key = getSigningKey();
  if (!adminPassword || !key) return null;

  const exp = Date.now() + SESSION_TTL_MS;
  const fp = getPasswordFingerprint(adminPassword);
  const nonce = crypto.randomBytes(16).toString("hex");
  const payload = `${exp}.${fp}.${nonce}`;
  const sig = crypto
    .createHmac("sha256", key)
    .update(payload, "utf8")
    .digest("base64url");

  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const key = getSigningKey();
  if (!adminPassword || !key) return false;

  const parts = token.split(".");
  if (parts.length !== 4) return false;

  const [expStr, fp, nonce, providedSig] = parts;
  if (!expStr || !fp || !nonce || !providedSig) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() >= exp) return false;

  const expectedFp = getPasswordFingerprint(adminPassword);
  if (!safeCompareStrings(fp, expectedFp)) return false;

  const payload = `${expStr}.${fp}.${nonce}`;
  const expectedSig = crypto
    .createHmac("sha256", key)
    .update(payload, "utf8")
    .digest("base64url");

  return safeCompareStrings(providedSig, expectedSig);
}

function extractCookie(request: Request, cookieName: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const eqIndex = pair.indexOf("=");
    if (eqIndex === -1) continue;
    const name = pair.slice(0, eqIndex).trim();
    if (name === cookieName) {
      const rawVal = pair.slice(eqIndex + 1).trim();
      try {
        return decodeURIComponent(rawVal);
      } catch {
        return rawVal;
      }
    }
  }
  return null;
}

export function setAdminSessionCookie(
  response: NextResponse,
  token: string
): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

export function clearAdminSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export function getFirebaseEnv(
  missingMessage = "FIREBASE_URL is not configured"
): { ok: true; env: FirebaseEnv } | { ok: false; response: NextResponse } {
  const rawUrl = process.env.FIREBASE_URL;
  if (!rawUrl) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: missingMessage },
        { status: 500, headers: NO_STORE_HEADERS }
      ),
    };
  }

  const firebaseUrl = rawUrl.trim().replace(/\/+$/, "");
  const firebaseSecret = (process.env.FIREBASE_SECRET || "").trim();
  const authQuery = firebaseSecret
    ? `?auth=${encodeURIComponent(firebaseSecret)}`
    : "";

  return {
    ok: true,
    env: {
      firebaseUrl,
      firebaseSecret,
      authQuery,
    },
  };
}

export function buildFirebaseUrl(
  env: FirebaseEnv,
  path: string,
  cacheBust = false
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = `${env.firebaseUrl}${normalizedPath}${env.authQuery}`;
  if (!cacheBust) return base;
  const sep = env.authQuery ? "&" : "?";
  return `${base}${sep}_t=${Date.now()}`;
}

export function encodeFirebaseKey(rawKey: string): string {
  return encodeURIComponent(rawKey.trim()).replace(/\./g, "%2E");
}

export function safeDecodeFirebaseKey(rawKey: string): string {
  try {
    return decodeURIComponent(rawKey);
  } catch {
    return rawKey;
  }
}

export function isAdminRequest(request: Request): boolean {
  const sessionToken = extractCookie(request, ADMIN_SESSION_COOKIE);
  if (sessionToken && verifyAdminSessionToken(sessionToken)) {
    return true;
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get("x-admin-password");
  if (!adminPassword || !providedPassword) return false;

  return safeCompareStrings(providedPassword, adminPassword);
}

export function requireAdmin(
  request: Request
): { ok: true } | { ok: false; response: NextResponse } {
  if (!isAdminRequest(request)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Sesi admin tidak valid atau sudah berakhir." },
        { status: 401, headers: NO_STORE_HEADERS }
      ),
    };
  }
  return { ok: true };
}

export async function fetchFirebaseWithEtag<T = unknown>(
  env: FirebaseEnv,
  path: string
): Promise<{ ok: true; data: T | null; etag: string | null } | { ok: false; status: number }> {
  const res = await fetch(buildFirebaseUrl(env, path, true), {
    cache: "no-store",
    headers: {
      ...NO_STORE_FETCH_HEADERS,
      "X-Firebase-ETag": "true",
    },
  });

  if (!res.ok) {
    return { ok: false, status: res.status };
  }

  const etag = res.headers.get("etag") || res.headers.get("ETag");
  const data = (await res.json()) as T | null;
  return { ok: true, data, etag };
}

export async function putFirebaseWithEtag(
  env: FirebaseEnv,
  path: string,
  payload: unknown,
  etag: string | null
): Promise<{ ok: true } | { ok: false; conflict: boolean; status: number }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (etag) {
    headers["if-match"] = etag;
  }

  const res = await fetch(buildFirebaseUrl(env, path), {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  if (res.status === 412) {
    return { ok: false, conflict: true, status: 412 };
  }

  if (!res.ok) {
    return { ok: false, conflict: false, status: res.status };
  }

  return { ok: true };
}

export function logServerError(context: string, err: unknown): void {
  const raw = err instanceof Error ? err.message : String(err || "Unknown error");
  const redacted = raw.replace(/([?&]auth=)[^&\s]+/gi, "$1[REDACTED]");
  console.error(`[${context}]`, redacted);
}
