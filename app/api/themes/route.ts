import { NextResponse } from "next/server";
import { requireSession } from "../../../lib/apiAuth";

export async function GET() {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const r = await fetch(`${process.env.ORCHESTRATOR_URL}/themes`, {
      headers: { "x-ingest-secret": process.env.INGEST_SECRET ?? "" },
      cache: "no-store",
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
