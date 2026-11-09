import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sign-in is by emailed code (see login/actions.ts). Installs still on Supabase's built-in email can't change the
// template, so their emails carry a link instead; this finishes that sign-in, in the browser that asked for it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/onboarding`);
  }
  return NextResponse.redirect(`${origin}/login?error=link_expired`);
}
