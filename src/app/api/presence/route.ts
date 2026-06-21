import { NextResponse } from "next/server";

export async function GET() {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    // Ambil data presence dari Firebase
    const res = await fetch(`${firebaseUrl}/presence.json`, { cache: 'no-store' });
    const data = await res.json();
    
    const activeUsers = [];
    const now = Date.now();
    const threshold = 60000; // 60 detik batas toleransi offline

    if (data && typeof data === 'object') {
      for (const token in data) {
        const userPresence = data[token];
        // Cek apakah lastSeen masih dalam rentang 60 detik terakhir
        if (userPresence.lastSeen && (now - userPresence.lastSeen) <= threshold) {
          activeUsers.push({
            token: token,
            channel: userPresence.channel || "Lainnya",
            country: userPresence.country || "ID",
            lastSeen: userPresence.lastSeen
          });
        }
      }
    }
    
    // Urutkan berdasarkan waktu terakhir aktif (paling baru)
    activeUsers.sort((a, b) => b.lastSeen - a.lastSeen);
    
    return NextResponse.json({ count: activeUsers.length, users: activeUsers });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch from Firebase" }, { status: 500 });
  }
}
