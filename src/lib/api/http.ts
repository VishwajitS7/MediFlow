// Server-only helpers shared by route handlers under src/app/api.
import { NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ApiResponse } from "@/types";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_SERVER_ERROR";

export function jsonSuccess<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data, timestamp: new Date().toISOString() };
  return NextResponse.json(body, { status });
}

export function jsonError(status: number, code: ApiErrorCode, message: string, details?: unknown) {
  const body: ApiResponse = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
    timestamp: new Date().toISOString(),
  };
  return NextResponse.json(body, { status });
}

export function isMongoDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === 11000;
}

/** Parses a JSON request body, returning `undefined` when it is not valid JSON. */
export async function readJsonBody(req: Request): Promise<unknown | undefined> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

/**
 * Maps thrown errors (RBAC guards, Mongo, connection failures) to the standard error envelope.
 * Never echoes raw internal error messages for unexpected failures.
 */
export function handleRouteError(error: unknown, scope = "api") {
  // Let Next.js internal control-flow errors (e.g. dynamic-rendering bailouts during prerender) propagate.
  unstable_rethrow(error);
  if (error instanceof Error) {
    if (error.name === "UNAUTHORIZED") {
      return jsonError(401, "UNAUTHORIZED", "You must be signed in to access this resource.");
    }
    if (error.name === "FORBIDDEN") {
      return jsonError(403, "FORBIDDEN", "You do not have permission to perform this action.");
    }
    if (
      error.message.includes("MONGODB_URI") ||
      error.name === "MongooseServerSelectionError" ||
      error.name === "MongoServerSelectionError"
    ) {
      return jsonError(503, "SERVICE_UNAVAILABLE", "The clinic database is currently unavailable.");
    }
  }
  if (isMongoDuplicateKeyError(error)) {
    return jsonError(409, "CONFLICT", "A record with these unique details already exists.");
  }
  console.error(`[${scope}] Unhandled route error:`, error instanceof Error ? error.name : "unknown");
  return jsonError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred.");
}
