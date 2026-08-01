import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

    const { code, deviceId } = await request.json();

    if (!code || !deviceId) {
      return NextResponse.json({ error: "Code dan Device ID diperlukan" }, { status: 400 });
    }

    // 1. Fetch current config
    const getRes = await fetch(`${firebaseUrl}/config.json?_t=${Date.now()}`, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    const data = await getRes.json();

    if (!data || !data.tokens || !Array.isArray(data.tokens)) {
      return NextResponse.json({ error: "Token tidak ditemukan" }, { status: 404 });
    }

    let tokenIndex = -1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tokenObj: any = null;

    // 2. Find token
    for (let i = 0; i < data.tokens.length; i++) {
      const t = data.tokens[i];
      if (typeof t === 'string' && t === code) {
        tokenIndex = i;
        tokenObj = { code: t, expiresAt: null, label: "Lifetime" };
        break;
      } else if (typeof t === 'object' && t.code === code) {
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
      return NextResponse.json({ error: "Token sudah kadaluarsa" }, { status: 403 });
    }

    // 4. Bind logic
    const maxDevices = tokenObj.maxDevices || 1;
    let currentDeviceIds: string[] = [];
    
    if (tokenObj.deviceIds && Array.isArray(tokenObj.deviceIds)) {
      currentDeviceIds = [...tokenObj.deviceIds];
    } else if (tokenObj.deviceId && typeof tokenObj.deviceId === 'string') {
      currentDeviceIds = [tokenObj.deviceId];
    }

    const saveAndReturn = async (message: string) => {
      data.tokens[tokenIndex] = tokenObj;
      const putRes = await fetch(`${firebaseUrl}/config.json${authQuery}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!putRes.ok) throw new Error("Gagal menyimpan ke Firebase");
      await fetch(`${firebaseUrl}/kicks/${code}.json${authQuery}`, { method: "DELETE" }).catch(() => {});
      return NextResponse.json({ success: true, message });
    };

    if (currentDeviceIds.includes(deviceId)) {
      // Already bound to this device, allow
      await fetch(`${firebaseUrl}/kicks/${code}.json${authQuery}`, { method: "DELETE" }).catch(() => {});
      return NextResponse.json({ success: true, message: "Akses diizinkan." });
    } else {
      // New device trying to bind
      if (currentDeviceIds.length < maxDevices) {
        currentDeviceIds.push(deviceId);
        tokenObj.deviceIds = currentDeviceIds;
        tokenObj.deviceId = currentDeviceIds[0]; // backward compatibility
        return await saveAndReturn("Token berhasil diikat ke perangkat ini.");
      } else {
        // Full
        return NextResponse.json({ error: `Token sudah digunakan di batas maksimum (${maxDevices} TV)!` }, { status: 403 });
      }
    }

  } // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
