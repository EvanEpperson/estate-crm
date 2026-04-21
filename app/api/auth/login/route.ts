import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/session";
import { timingSafeEqual, createHash } from "node:crypto";

export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return NextResponse.json({ error: "ADMIN_PASSWORD is not configured." }, { status: 500 });
  }

  // Constant-time comparison to prevent timing attacks
  const given = createHash("sha256").update(String(password)).digest();
  const expected = createHash("sha256").update(adminPassword).digest();
  const match = given.length === expected.length && timingSafeEqual(given, expected);

  if (!match) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isLoggedIn = true;
  await session.save();
  return res;
}
