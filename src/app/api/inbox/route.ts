import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const providedPassword = req.headers.get("x-admin-password");
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword || providedPassword !== adminPassword) {
      return NextResponse.json({ error: "Password Admin Salah atau Belum Dikonfigurasi" }, { status: 401 });
    }

    const { token, message } = await req.json();
    if (!token || typeof token !== "string" || !message || typeof message !== "string") {
      return NextResponse.json({ error: "Token dan message wajib diisi" }, { status: 400 });
    }

    const safeToken = encodeURIComponent(token.trim()).replace(/\./g, '%2E');
    const safeMessage = message.trim().slice(0, 1000);

    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "Firebase URL not configured" }, { status: 500 });
    }

    const firebaseSecret = process.env.FIREBASE_SECRET;
    const authQuery = firebaseSecret ? `?auth=${firebaseSecret}` : "";

    // Write to /inbox/{safeToken}.json
    const res = await fetch(`${firebaseUrl}/inbox/${safeToken}.json${authQuery}`, {
      method: "PUT", // Replace existing message or set new one
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: safeMessage,
        timestamp: Date.now(),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Firebase Error in Inbox:", errorText);
      return NextResponse.json({ error: "Gagal menyimpan pesan ke Firebase: " + errorText }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Inbox API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
