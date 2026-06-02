import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth callback for email confirmation and password recovery flows.
 *
 * Two link shapes land here:
 *   1. `token_hash` + `type` - our custom email templates link straight to
 *      arko.life (no supabase.co hop). Keeping the link on our own domain
 *      avoids the From/link domain mismatch that makes Gmail flag the mail
 *      as phishing (and strip the button). Verified into a session via
 *      `verifyOtp`.
 *   2. `code` - PKCE exchange used by OAuth, magic links and Supabase's
 *      default templates. Kept for backward compatibility.
 * Either way we establish the session (writes Supabase cookies) and redirect
 * to `next` - defaulting to /compte.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/compte";

  // Defence against open-redirect: only accept internal paths.
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/compte";

  const supabase = await createClient();

  // 1. token_hash flow (our branded templates).
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return NextResponse.redirect(`${origin}/connexion?error=callback_failed`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // 2. PKCE code-exchange flow.
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/connexion?error=callback_failed`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/connexion?error=missing_code`);
}
