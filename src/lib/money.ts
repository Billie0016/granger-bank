/** The balance to show for an account: cachedBalanceMinor (provider-sourced)
 * when present, otherwise internalLedgerBalanceMinor (Granger Bank's own
 * ledger, used for accounts with no real provider connected — see
 * internalLedgerBalanceMinor in schema.prisma). Null if neither is set,
 * which formatMinor renders as "—" — an honest "no balance available"
 * rather than a fabricated number. */
export function getDisplayBalanceMinor(account: {
  cachedBalanceMinor: string | null;
  internalLedgerBalanceMinor: string | null;
}): string | null {
  return account.cachedBalanceMinor ?? account.internalLedgerBalanceMinor;
}

/** Formats an integer-minor-unit amount (as returned by the API — always a
 * string, never a float) into a display currency string. Never does
 * floating-point arithmetic on the amount itself. */
export function formatMinor(amountMinor: string | null | undefined, currency = "USD"): string {
  if (amountMinor === null || amountMinor === undefined) return "—";
  const zero = BigInt(0);
  const hundred = BigInt(100);
  const minor = BigInt(amountMinor);
  const negative = minor < zero;
  const abs = negative ? -minor : minor;
  const whole = abs / hundred;
  const cents = (abs % hundred).toString().padStart(2, "0");
  const formattedWhole = whole.toLocaleString("en-US");
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${negative ? "-" : ""}${symbol}${formattedWhole}.${cents}`;
}
