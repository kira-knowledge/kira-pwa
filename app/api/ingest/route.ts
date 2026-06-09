import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ ok: false, error: "missing url" }, { status: 400 });
  }
  try {
    const r = await fetch(`${process.env.ORCHESTRATOR_URL}/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ingest-secret": process.env.INGEST_SECRET ?? "",
      },
      body: JSON.stringify({ url }),
    });
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 502 });
  }
}
