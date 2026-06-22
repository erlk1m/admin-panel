import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const firebaseUrl = process.env.FIREBASE_URL;
    if (!firebaseUrl) {
      return NextResponse.json({ error: "FIREBASE_URL is not configured" }, { status: 500 });
    }

    // Ambil data presence dari Firebase (tambahkan timestamp agar tidak di-cache)
    const res = await fetch(`${firebaseUrl}/presence.json?_t=${Date.now()}`, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    const data = await res.json();
    
    const activeUsers = [];
    const now = Date.now();
    const threshold = 60000; // 60 detik batas toleransi offline

    if (data && typeof data === 'object') {
      for (const token in data) {
        const userPresence = data[token];
        const lastSeenTime = userPresence.lastActive || userPresence.lastSeen;
        // Cek apakah lastActive masih dalam rentang 60 detik terakhir
        if (lastSeenTime && (now - lastSeenTime) <= threshold) {
          activeUsers.push({
            token: token,
            channel: userPresence.activity || userPresence.channel || "Lainnya",
            country: userPresence.country || "ID",
            lastSeen: lastSeenTime
          });
        }
      }
    }
    
    // Urutkan berdasarkan waktu terakhir aktif (paling baru)
    activeUsers.sort((a, b) => b.lastSeen - a.lastSeen);
    
    return NextResponse.json({ count: activeUsers.length, users: activeUsers }, {
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
