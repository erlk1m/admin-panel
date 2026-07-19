import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get("x-admin-password");
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, message } = await req.json();
    if (!token || !message) {
      return NextResponse.json({ error: "Token dan message wajib diisi" }, { status: 400 });
    }

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "Firebase URL not configured" }, { status: 500 });
    }

    // Write to /inbox/{token}.json
    const res = await fetch(`${firebaseUrl}/inbox/${token}.json`, {
      method: "PUT", // Replace existing message or set new one
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        timestamp: Date.now(),
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Gagal menyimpan pesan ke Firebase" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inbox API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
