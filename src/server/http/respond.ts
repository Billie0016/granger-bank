import "server-only";
import { NextResponse } from "next/server";
import { toSafeErrorResponse } from "../security/errors";

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

/** Wraps a route handler so every thrown AppError (or unexpected error) is
 * converted to a safe, consistent JSON response instead of every route
 * repeating its own try/catch. See src/server/security/errors.ts. */
export function withErrorHandling<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const { status, body } = toSafeErrorResponse(error);
      return NextResponse.json(body, { status });
    }
  };
}

/** JSON-safe serialization for BigInt fields (Prisma returns BigInt for
 * amountMinor/balance columns; JSON.stringify throws on BigInt by default).
 * Amounts are serialized as strings, never as floating-point numbers, so
 * clients don't lose precision or reintroduce float math. */
export function serializeMoney<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_key, val) => (typeof val === "bigint" ? val.toString() : val)));
}
