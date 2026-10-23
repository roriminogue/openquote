import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "@/lib/supabase/env";

// Refreshes the Supabase session cookie on every request and sends signed-out visitors to /login.
// This is an optimistic check only; pages still verify the user (see lib/auth.ts).
const PUBLIC_PATHS = ["/", "/login", "/auth", "/p", "/setup"];

export async function proxy(request: NextRequest) {
  // A fresh install with settings missing: send everything to the setup checklist instead of erroring.
  const configured = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !!process.env.DATABASE_URL;
  if (!configured) {
    if (request.nextUrl.pathname.startsWith("/setup")) return NextResponse.next({ request });
    const to = request.nextUrl.clone();
    to.pathname = "/setup";
    to.search = "";
    return NextResponse.redirect(to);
  }

  let response = NextResponse.next({ request });
  const { url, key } = supabaseEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  // Don't put code between createServerClient and getClaims: it validates and refreshes the session.
  const { data } = await supabase.auth.getClaims();

  const path = request.nextUrl.pathname;
  // The app's front door: estimates when signed in, sign-in otherwise.
  if (path === "/") {
    const to = request.nextUrl.clone();
    to.pathname = data?.claims ? "/estimates" : "/login";
    to.search = "";
    return NextResponse.redirect(to);
  }
  const isPublic = PUBLIC_PATHS.some((p) => path === p || (p !== "/" && path.startsWith(`${p}/`)));
  // API routes check auth themselves and answer 401 JSON; a redirect to an HTML page would confuse callers.
  const isApi = path.startsWith("/api/");
  if (!data?.claims && !isPublic && !isApi) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest)$).*)"],
};
