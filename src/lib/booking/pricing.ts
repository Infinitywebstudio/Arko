/**
 * Server-side booking pricing. Hardcoded per the validated tariff sheet:
 *
 *   1h → client pays 18€   sitter gets 12€   platform keeps  6€
 *   2h → client pays 32€   sitter gets 21€   platform keeps 11€
 *   3h → client pays 45€   sitter gets 29€   platform keeps 16€
 *
 * Options (added on top of the base tariff):
 *   - dangerous_breed (cat. 1/2 dog):     +5€
 *   - urgent (RDV dans < 30 min):         +7€
 *   - late (after 19h):                   +7€
 *
 * IMPORTANT: clients NEVER send a price. The action layer always re-derives
 * the price from these constants — the booking row is then validated by a
 * Postgres trigger that asserts price = sitter_payout + platform_fee.
 *
 * OPEN DECISION — pending Louis confirmation:
 *   Where do option surcharges go (sitter vs platform)?
 *   Default below: 100% to platform (treat options as risk/friction premiums
 *   that compensate the platform's commitment, base tariff being the sitter's
 *   "fair share"). Flip OPTION_RECIPIENT to "sitter" if Louis decides options
 *   should compensate the sitter for accepting the dangerous dog / unusual hours.
 */

export type Duration = 1 | 2 | 3;

const BASE_TARIFF: Record<Duration, { price_cents: number; sitter_payout_cents: number; platform_fee_cents: number }> = {
  1: { price_cents: 1800, sitter_payout_cents: 1200, platform_fee_cents: 600 },
  2: { price_cents: 3200, sitter_payout_cents: 2100, platform_fee_cents: 1100 },
  3: { price_cents: 4500, sitter_payout_cents: 2900, platform_fee_cents: 1600 },
};

const OPTION_SURCHARGES_CENTS = {
  dangerous_breed: 500,
  urgent: 700,
  late: 700,
} as const;

const OPTION_RECIPIENT: "platform" | "sitter" = "platform";

export type PricingInput = {
  duration: Duration;
  dangerous_breed?: boolean;
  urgent?: boolean;
  late?: boolean;
};

export type PricingBreakdown = {
  /** Total the client is charged, in cents. */
  price_cents: number;
  /** What the sitter is owed, in cents. */
  sitter_payout_cents: number;
  /** ARKO commission, in cents. price = sitter_payout + platform_fee always. */
  platform_fee_cents: number;
  /** For UI: the two halves so callers can show a breakdown if useful. */
  base_cents: number;
  options_cents: number;
};

/**
 * Pure function: compute the booking price from validated inputs. Caller is
 * responsible for ensuring inputs are sane (duration is 1/2/3, booleans are
 * booleans). Throws if duration is out of range to surface programming errors.
 */
export function calculatePrice(input: PricingInput): PricingBreakdown {
  const base = BASE_TARIFF[input.duration];
  if (!base) {
    throw new Error(`Invalid duration: ${input.duration} — must be 1, 2 or 3`);
  }

  let options = 0;
  if (input.dangerous_breed) options += OPTION_SURCHARGES_CENTS.dangerous_breed;
  if (input.urgent) options += OPTION_SURCHARGES_CENTS.urgent;
  if (input.late) options += OPTION_SURCHARGES_CENTS.late;

  const sitterFromOptions = OPTION_RECIPIENT === "sitter" ? options : 0;
  const platformFromOptions = OPTION_RECIPIENT === "platform" ? options : 0;

  return {
    price_cents: base.price_cents + options,
    sitter_payout_cents: base.sitter_payout_cents + sitterFromOptions,
    platform_fee_cents: base.platform_fee_cents + platformFromOptions,
    base_cents: base.price_cents,
    options_cents: options,
  };
}

/** Format a cents amount as "12,00 €" — French convention, no decimals if exact euros. */
export function formatEuros(cents: number): string {
  const euros = cents / 100;
  return `${euros.toFixed(2).replace(".", ",")} €`;
}
