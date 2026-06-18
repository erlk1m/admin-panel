import { NextResponse } from "next/server";

export async function GET() {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    const res = await fetch(`${firebaseUrl}/config.json`, { cache: 'no-store' });
    const data = await res.json();
    
    return NextResponse.json(data || {});
  } catch (error) {
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

    // Gunakan method PUT untuk menimpa data (overwrite) di Firebase RTDB
    const res = await fetch(`${firebaseUrl}/config.json`, {
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
  } catch (error: any) {
    console.error("API Route Error:", error.message);
    return NextResponse.json({ error: error.message || "Failed to save to Firebase" }, { status: 500 });
  }
}
