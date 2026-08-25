import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const res = await fetch(`${firebaseUrl}/config.json?_t=${Date.now()}`, { 
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
    const data = await res.json();
    const configData = data && typeof data === 'object' ? { ...data } : {};

    // Normalize tokens if object
    if (configData.tokens && !Array.isArray(configData.tokens) && typeof configData.tokens === 'object') {
      configData.tokens = Object.entries(configData.tokens).map(([key, val]: [string, any]) => {
        if (typeof val === 'string') {
          return { code: val || key, expiresAt: null, label: "Lifetime" };
        } else if (typeof val === 'object' && val !== null) {
          return {
            ...val,
            code: typeof val.code === 'string' ? val.code : key,
            label: typeof val.label === 'string' ? val.label : "Lifetime",
            expiresAt: typeof val.expiresAt === 'number' ? val.expiresAt : (Number(val.expiresAt) || null)
          };
        }
        return { code: key, expiresAt: null, label: "Lifetime" };
      });
    }

    // Normalize customChannels if object
    if (configData.customChannels && !Array.isArray(configData.customChannels) && typeof configData.customChannels === 'object') {
      configData.customChannels = Object.values(configData.customChannels);
    }
    
    return NextResponse.json(configData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch from Firebase" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const providedPassword = request.headers.get("x-admin-password");

    if (adminPassword && providedPassword !== adminPassword) {
      return NextResponse.json({ error: "Password Admin Salah" }, { status: 401 });
    }

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const body = await request.json();
    
    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

    // Gunakan method PUT untuk menimpa data (overwrite) di Firebase RTDB
    const res = await fetch(`${firebaseUrl}/config.json${authQuery}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Firebase Error:", errorText);
      throw new Error("Gagal menyimpan ke Firebase: " + errorText);
    }

    return NextResponse.json({ success: true });
  } // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to save to Firebase" }, { status: 500 });
  }
}
