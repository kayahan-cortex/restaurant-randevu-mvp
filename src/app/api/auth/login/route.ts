import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Geçersiz" }, { status: 401 });
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Geçersiz" }, { status: 401 });
    const token = await new SignJWT({ userId: user.id, email: user.email, role: user.role })
      .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("24h").sign(JWT_SECRET);
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth_token", token, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 86400, path: "/" });
    return response;
  } catch (error) { return NextResponse.json({ error: "Hata" }, { status: 500 }); }
}
