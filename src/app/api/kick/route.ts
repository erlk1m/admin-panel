import { NextResponse } from "next/server";

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
    const { token } = body;
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Tulis data KICK ke /kicks/<token>.json
    const res = await fetch(`${firebaseUrl}/kicks/${token}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Date.now()), // Menyimpan timestamp kapan ditendang
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
    return NextResponse.json({ error: error.message || "Failed to kick user" }, { status: 500 });
  }
}
