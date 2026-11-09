import { NextResponse } from "next/server";

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

export function getFirebaseEnv(
  missingMessage = "FIREBASE_URL is not configured"
): { ok: true; env: FirebaseEnv } | { ok: false; response: NextResponse } {
  const firebaseUrl = process.env.FIREBASE_URL;
  if (!firebaseUrl) {
    return {
      ok: false,
      response: NextResponse.json({ error: missingMessage }, { status: 500 }),
    };
  }

  const firebaseSecret = process.env.FIREBASE_SECRET || "";
  const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

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

export function isAdminRequest(request: Request): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get("x-admin-password");
  return Boolean(adminPassword && providedPassword === adminPassword);
}

export function requireAdmin(
  request: Request
): { ok: true } | { ok: false; response: NextResponse } {
  if (!isAdminRequest(request)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Password Admin Salah atau Belum Dikonfigurasi" },
        { status: 401 }
      ),
    };
  }
  return { ok: true };
}

