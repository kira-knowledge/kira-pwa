import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const r = await fetch(
      `${process.env.ORCHESTRATOR_URL}/items/${encodeURIComponent(params.id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-ingest-secret": process.env.INGEST_SECRET ?? "",
        },
        body: JSON.stringify(body),
      }
    );
    return NextResponse.json(await r.json(), { status: r.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
