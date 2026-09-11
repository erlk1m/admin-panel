import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: "ADMIN_PASSWORD belum dikonfigurasi di server" }, { status: 500 });
    }

    if (typeof password === "string" && password.length > 0 && password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Password Admin Salah" }, { status: 401 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
