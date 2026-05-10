import type { NextRequest } from "next/server";

import {
  sendClientBookingNoResponseNotification,
} from "@/lib/email/booking";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";

/**
 * Scheduled sweep endpoint. Two jobs run every invocation:
 *
 *   1. NO-RESPONSE: bookings that stayed `pending_acceptance` past their
 *      start time get the auto-refund + status flip to `no_response`. The
 *      client gets an email so they know to find another sitter.
 *
 *   2. AUTO-CLOSE: bookings stuck in `confirmed` 48h past their planned end
 *      get force-flipped to `completed` (no comment, no email). It's the
 *      hygiene cron — sitters are supposed to close manually with their
 *      free-text comment; this just sweeps the ones that fell through.
 *
 * Trigger options (we don't ship a hard dependency on any):
 *   - Vercel Cron (vercel.json) — easy on Pro tier, capped to daily on Hobby.
 *   - GitHub Actions schedule (`*\/10 * * * *`) hitting this URL with the
 *     CRON_SECRET in the header — works on free tiers and goes to 5-min res.
 *   - Supabase pg_cron + pg_net — keeps it inside the same project.
 *   - Manual curl during ops.
 *
 * Auth: any caller must present `Authorization: Bearer ${CRON_SECRET}` or
 * the endpoint returns 401. The secret is the only thing standing between an
 * attacker and arbitrary refunds, so don't share it.
 *
 * Idempotency: every state transition uses `.eq("status", ...)` so a duplicate
 * sweep within seconds does nothing on already-processed rows. Each booking
 * succeeds or fails independently — one bad refund doesn't poison the batch.
 */

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[cron sweep] CRON_SECRET is not set");
    return new Response("Cron not configured", { status: 500 });
  }
  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();
  const autoCloseCutoffIso = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const summary = {
    noResponseProcessed: 0,
    noResponseFailures: 0,
    autoClosed: 0,
    autoCloseFailures: 0,
  };

  // ---------- 1. No-response sweep ------------------------
  const { data: stalled, error: stalledErr } = await admin
    .from("bookings")
    .select("id, stripe_payment_intent_id, refunded_at")
    .eq("status", "pending_acceptance")
    .lt("start_at", nowIso);

  if (stalledErr) {
    console.error("[cron sweep] no-response query failed", stalledErr);
  } else if (stalled && stalled.length > 0) {
    for (const booking of stalled) {
      try {
        if (booking.stripe_payment_intent_id && !booking.refunded_at) {
          await getStripe().refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
          });
        }

        const { data: updated } = await admin
          .from("bookings")
          .update({
            status: "no_response",
            refunded_at: new Date().toISOString(),
          })
          .eq("id", booking.id)
          .eq("status", "pending_acceptance")
          .select("id")
          .maybeSingle();

        if (updated) {
          summary.noResponseProcessed += 1;
          await sendClientBookingNoResponseNotification(booking.id);
        }
      } catch (e) {
        summary.noResponseFailures += 1;
        console.error("[cron sweep] no-response failed for", booking.id, e);
      }
    }
  }

  // ---------- 2. Auto-close sweep -------------------------
  // Only target rows where start_at + duration_hours + 48h margin is past.
  // We don't know the precise end_at without a SQL expression; do the math in
  // SQL via a small expression in a filtered query. Postgres supports
  // start_at + (duration_hours || ' hours')::interval, but Supabase JS doesn't
  // let us inject raw SQL into select/filter without an RPC. Pragmatic path:
  // pull confirmed rows whose start_at is at least 48h+3h ago (max duration),
  // then double-check end_at in JS before flipping.
  const earliestAcceptableStart = new Date(
    Date.now() - (48 + 3) * 60 * 60 * 1000,
  ).toISOString();

  const { data: stale, error: staleErr } = await admin
    .from("bookings")
    .select("id, start_at, duration_hours")
    .eq("status", "confirmed")
    .lt("start_at", earliestAcceptableStart);

  if (staleErr) {
    console.error("[cron sweep] auto-close query failed", staleErr);
  } else if (stale && stale.length > 0) {
    for (const booking of stale) {
      const endMs =
        new Date(booking.start_at).getTime() +
        booking.duration_hours * 60 * 60 * 1000;
      if (endMs > new Date(autoCloseCutoffIso).getTime()) continue;
      try {
        const { data: updated } = await admin
          .from("bookings")
          .update({
            status: "completed",
            sitter_closed_at: new Date().toISOString(),
          })
          .eq("id", booking.id)
          .eq("status", "confirmed")
          .select("id")
          .maybeSingle();
        if (updated) summary.autoClosed += 1;
      } catch (e) {
        summary.autoCloseFailures += 1;
        console.error("[cron sweep] auto-close failed for", booking.id, e);
      }
    }
  }

  return Response.json({ ok: true, at: nowIso, ...summary });
}
