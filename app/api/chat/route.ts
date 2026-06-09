import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  try {
    const r = await fetch(`${process.env.ORCHESTRATOR_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ingest-secret": process.env.INGEST_SECRET ?? "",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
