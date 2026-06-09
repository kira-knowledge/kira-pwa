import { NextResponse } from "next/server";
import { createClient } from "./supabase/server";

// Returns a 401 NextResponse when there is no authenticated user (or auth is
// unreachable), else null. Fails closed — an auth boundary must never 500.
export async function requireSession(): Promise<NextResponse | null> {
  const supabase = createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } catch {
    // Supabase Auth unreachable — fail closed (treat as unauthenticated).
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}
