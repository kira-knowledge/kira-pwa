import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { isPublicPath, isApiPath } from "../authPaths";

// Refresh the Supabase session on every request, persist refreshed cookies,
// and gate: unauthenticated PAGE requests -> /login; API requests are never
// redirected (they self-check and return 401 in the route handler).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() (not getSession()) revalidates against the Supabase auth server.
  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) user = data.user;
  } catch {
    // Supabase Auth unreachable — treat as unauthenticated; protected pages redirect to /login.
  }

  const path = request.nextUrl.pathname;

  // API routes: never redirect (a 302->HTML would break a fetch). Just refresh.
  if (isApiPath(path)) return response;

  // Signed-in user visiting /login -> send home.
  if (user && path === "/login") {
    const redirect = NextResponse.redirect(new URL("/", request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  // Signed-out user on a protected page -> /login?next=<path>.
  if (!user && !isPublicPath(path)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}
