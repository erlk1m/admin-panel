import { NextResponse } from "next/server";
import {
  buildFirebaseUrl,
  encodeFirebaseKey,
  getFirebaseEnv,
  NO_STORE_FETCH_HEADERS,
} from "@/lib/firebase";
import { extractDeviceIds } from "@/lib/normalize";

export async function POST(request: Request) {
  try {
    const firebase = getFirebaseEnv();
    if (!firebase.ok) return firebase.response;

    const { code, deviceId } = await request.json();

    if (
      !code ||
      typeof code !== "string" ||
      !deviceId ||
      typeof deviceId !== "string"
    ) {
      return NextResponse.json(
        { error: "Code dan Device ID diperlukan" },
        { status: 400 }
      );
    }

    const cleanCode = code.trim();
    const cleanDeviceId = deviceId.trim();

    if (
      cleanCode.length === 0 ||
      cleanDeviceId.length === 0 ||
      cleanCode.length > 100 ||
      cleanDeviceId.length > 150
    ) {
      return NextResponse.json(
        { error: "Input Code atau Device ID tidak valid" },
        { status: 400 }
      );
    }

    // 1. Fetch current config
    const getRes = await fetch(
      buildFirebaseUrl(firebase.env, "/config.json", true),
      {
        cache: "no-store",
        headers: NO_STORE_FETCH_HEADERS,
      }
    );
    const data = await getRes.json();

    if (!data) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 404 }
      );
    }

    if (
      data.tokens &&
      !Array.isArray(data.tokens) &&
      typeof data.tokens === "object"
    ) {
      data.tokens = Object.values(data.tokens);
    }

    if (!data.tokens || !Array.isArray(data.tokens)) {
      return NextResponse.json(
        { error: "Token tidak ditemukan" },
        { status: 404 }
      );
    }

    let tokenIndex = -1;
    let tokenObj: any = null;

    // 2. Find token
    for (let i = 0; i < data.tokens.length; i++) {
      const t = data.tokens[i];
      if (typeof t === "string" && t === cleanCode) {
        tokenIndex = i;
        tokenObj = { code: t, expiresAt: null, label: "Lifetime" };
        break;
      } else if (typeof t === "object" && t.code === cleanCode) {
        tokenIndex = i;
        tokenObj = { ...t };
        break;
      }
    }

    if (tokenIndex === -1) {
      return NextResponse.json({ error: "Token tidak valid" }, { status: 404 });
    }

    // 3. Check expiration
    if (tokenObj.expiresAt && Date.now() > tokenObj.expiresAt) {
      return NextResponse.json(
        { error: "Token sudah kadaluarsa" },
        { status: 403 }
      );
    }

    // 4. Bind logic
    const maxDevices = tokenObj.maxDevices || 1;
    const currentDeviceIds = extractDeviceIds(tokenObj);
    const safeCode = encodeFirebaseKey(String(tokenObj.code));

    const saveAndReturn = async (message: string) => {
      data.tokens[tokenIndex] = tokenObj;
      const putRes = await fetch(
        buildFirebaseUrl(firebase.env, "/config.json"),
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );
      if (!putRes.ok) throw new Error("Gagal menyimpan ke Firebase");
      await fetch(buildFirebaseUrl(firebase.env, `/kicks/${safeCode}.json`), {
        method: "DELETE",
      }).catch(() => {});
      return NextResponse.json({ success: true, message });
    };

    if (currentDeviceIds.includes(cleanDeviceId)) {
      await fetch(buildFirebaseUrl(firebase.env, `/kicks/${safeCode}.json`), {
        method: "DELETE",
      }).catch(() => {});
      return NextResponse.json({ success: true, message: "Akses diizinkan." });
    }

    if (currentDeviceIds.length < maxDevices) {
      currentDeviceIds.push(cleanDeviceId);
      tokenObj.deviceIds = currentDeviceIds;
      tokenObj.deviceId = currentDeviceIds[0]; // backward compatibility
      return await saveAndReturn("Token berhasil diikat ke perangkat ini.");
    }

    return NextResponse.json(
      { error: `Token sudah digunakan di batas maksimum (${maxDevices} TV)!` },
      { status: 403 }
    );
  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
