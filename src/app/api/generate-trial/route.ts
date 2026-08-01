import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const { deviceId } = await request.json();

    if (!deviceId) {
      return NextResponse.json({ error: "Device ID diperlukan" }, { status: 400 });
    }

    // 1. Fetch current config
    const getRes = await fetch(`${firebaseUrl}/config.json?_t=${Date.now()}`, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    const data = await getRes.json();

    if (!data) {
      return NextResponse.json({ error: "Database tidak ditemukan" }, { status: 404 });
    }

    if (!data.tokens || !Array.isArray(data.tokens)) {
      data.tokens = [];
    }

    // 2. Check if device already claimed trial
    let alreadyClaimed = false;
    let existingToken = null;

    for (let i = 0; i < data.tokens.length; i++) {
      const t = data.tokens[i];
      if (typeof t === 'object' && t.isTrial) {
        let currentDeviceIds: string[] = [];
        if (t.deviceIds && Array.isArray(t.deviceIds)) {
          currentDeviceIds = [...t.deviceIds];
        } else if (t.deviceId && typeof t.deviceId === 'string') {
          currentDeviceIds = [t.deviceId];
        }

        if (currentDeviceIds.includes(deviceId)) {
          alreadyClaimed = true;
          existingToken = t;
          break;
        }
      }
    }

    if (alreadyClaimed && existingToken) {
        if (existingToken.expiresAt && Date.now() > existingToken.expiresAt) {
            return NextResponse.json({ error: "Masa trial Anda sudah habis!" }, { status: 403 });
        } else {
            // Give them back the same trial token if it's still active
            return NextResponse.json({ success: true, code: existingToken.code, message: "Trial dilanjutkan" });
        }
    }

    // 3. Generate new trial token
    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `TRIAL-${result}`;
    };

    // Ensure uniqueness
    let newCode = generateCode();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    while (data.tokens.some((t: any) => typeof t === 'object' && t.code === newCode)) {
        newCode = generateCode();
    }

    const tokenObj = {
        code: newCode,
        deviceId: deviceId,
        deviceIds: [deviceId],
        maxDevices: 1,
        expiresAt: Date.now() + (60 * 60 * 1000), // 1 Hour
        label: "Trial User",
        isTrial: true,
        badgeIcon: "⏱️",
        badgeColor: "#808080"
    };

    data.tokens.push(tokenObj);

    // 4. Save to Firebase
    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `&auth=${firebaseSecret}` : "";

    const putRes = await fetch(`${firebaseUrl}/config.json?_t=${Date.now()}${authQuery}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    if (!putRes.ok) throw new Error("Gagal menyimpan ke Firebase");

    return NextResponse.json({ success: true, code: newCode, message: "Trial 1 Jam berhasil diaktifkan!" });

  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
