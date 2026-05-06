import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback for email confirmation and password recovery flows.
 *
 * Supabase sends users here after they click an emailed link with a `code`
 * query param. We exchange the code for a session (writes Supabase cookies)
 * and redirect to the original destination (`next`) — defaulting to /compte.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/compte";

  // Defence against open-redirect: only accept internal paths.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/compte";

  if (!code) {
    return NextResponse.redirect(`${origin}/connexion?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/connexion?error=callback_failed`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
