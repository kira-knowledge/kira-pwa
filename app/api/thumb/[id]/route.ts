import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "../../../../lib/apiAuth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauth = await requireSession();
  if (unauth) return unauth;
  try {
    const r = await fetch(
      `${process.env.ORCHESTRATOR_URL}/thumb/${encodeURIComponent(params.id)}`,
      {
        headers: { "x-ingest-secret": process.env.INGEST_SECRET ?? "" },
        cache: "no-store",
      }
    );
    if (!r.ok) return new NextResponse(null, { status: r.status });
    return new NextResponse(await r.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": r.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
