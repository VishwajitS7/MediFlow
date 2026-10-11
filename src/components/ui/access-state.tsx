"use client";

import Link from "next/link";
import { DatabaseZap, Lock, LogIn, SearchX, ShieldX } from "lucide-react";

export type AccessStateKind = "unauthenticated" | "forbidden" | "not-found" | "unavailable" | "error";

function content(kind: AccessStateKind, resource: string): { icon: React.ReactNode; title: string; message: string } {
  const Resource = resource.charAt(0).toUpperCase() + resource.slice(1);
  switch (kind) {
    case "unauthenticated":
      return {
        icon: <Lock className="h-6 w-6 text-teal-400" />,
        title: "Sign in required",
        message: "Clinic records are only available to signed-in users.",
      };
    case "forbidden":
      return {
        icon: <ShieldX className="h-6 w-6 text-rose-400" />,
        title: "Access restricted",
        message: "Your role does not have permission to view this area.",
      };
    case "not-found":
      return {
        icon: <SearchX className="h-6 w-6 text-slate-400" />,
        title: `${Resource} not found`,
        message: `This ${resource} does not exist or you do not have access to it.`,
      };
    case "unavailable":
      return {
        icon: <DatabaseZap className="h-6 w-6 text-amber-400" />,
        title: "Database unavailable",
        message: "The clinic database could not be reached. Check MONGODB_URI and try again.",
      };
    default:
      return {
        icon: <DatabaseZap className="h-6 w-6 text-rose-400" />,
        title: "Something went wrong",
        message: `An unexpected error occurred while loading this ${resource}.`,
      };
  }
}

/** Maps an HTTP status from the API to the matching full-page state. */
export function accessStateFromStatus(status: number): AccessStateKind {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 503) return "unavailable";
  return "error";
}

/** Full-page empty/error state for signed-out, forbidden, missing, or failed loads. */
export function AccessState({
  kind,
  message,
  action,
  resource = "record",
}: {
  kind: AccessStateKind;
  message?: string;
  action?: React.ReactNode;
  /** Noun used in not-found / error copy, e.g. "patient" or "appointment". */
  resource?: string;
}) {
  const c = content(kind, resource);
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center">{c.icon}</div>
        <h1 className="text-lg font-bold text-white">{c.title}</h1>
        <p className="text-sm text-slate-400">{message ?? c.message}</p>
        {kind === "unauthenticated" ? (
          <Link
            href="/login"
            className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-semibold transition"
          >
            <LogIn className="h-4 w-4" />
            Sign In
          </Link>
        ) : (
          action
        )}
      </div>
    </div>
  );
}
