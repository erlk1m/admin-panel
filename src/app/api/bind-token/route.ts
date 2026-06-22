import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

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
    if (!tokenObj.deviceId) {
      // Not bound yet, bind it!
      tokenObj.deviceId = deviceId;
      data.tokens[tokenIndex] = tokenObj;

      // Save back to Firebase
      const putRes = await fetch(`${firebaseUrl}/config.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!putRes.ok) throw new Error("Gagal menyimpan ke Firebase");
      
      return NextResponse.json({ success: true, message: "Token berhasil diikat ke perangkat ini." });
    } else {
      // Already bound
      if (tokenObj.deviceId === deviceId) {
        // Same device, allow
        return NextResponse.json({ success: true, message: "Akses diizinkan." });
      } else {
        // Different device! Reject.
        return NextResponse.json({ error: "Token sudah digunakan di TV lain!" }, { status: 403 });
      }
    }

  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
