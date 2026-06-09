import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server client for route handlers and helpers.
// Next 14.2.5: cookies() is synchronous (NOT awaited).
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          // Server Components/route handlers may be unable to set cookies;
          // middleware handles refresh. Swallow so reads still work.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* safe to ignore — middleware refreshes the session */
          }
        },
      },
    }
  );
}
