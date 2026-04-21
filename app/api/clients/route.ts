import { NextRequest, NextResponse } from "next/server";
import { clientDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("q") ?? undefined;
  return NextResponse.json(await clientDb.list(search));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.first_name || !body.last_name) {
    return NextResponse.json({ error: "first_name and last_name are required" }, { status: 400 });
  }
  const created = await clientDb.create(body);
  return NextResponse.json(created, { status: 201 });
}
