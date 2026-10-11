"use client";

import Link from "next/link";
import { DatabaseZap, Lock, LogIn, SearchX, ShieldX } from "lucide-react";

type AccessStateKind = "unauthenticated" | "forbidden" | "not-found" | "unavailable" | "error";

const CONTENT: Record<AccessStateKind, { icon: React.ReactNode; title: string; message: string }> = {
  unauthenticated: {
    icon: <Lock className="h-6 w-6 text-teal-400" />,
    title: "Sign in required",
    message: "Patient records are only available to signed-in clinic staff.",
  },
  forbidden: {
    icon: <ShieldX className="h-6 w-6 text-rose-400" />,
    title: "Access restricted",
    message: "Your role does not have permission to view this area.",
  },
  "not-found": {
    icon: <SearchX className="h-6 w-6 text-slate-400" />,
    title: "Patient not found",
    message: "This patient record does not exist or you do not have access to it.",
  },
  unavailable: {
    icon: <DatabaseZap className="h-6 w-6 text-amber-400" />,
    title: "Database unavailable",
    message: "The patient database could not be reached. Check MONGODB_URI and try again.",
  },
  error: {
    icon: <DatabaseZap className="h-6 w-6 text-rose-400" />,
    title: "Something went wrong",
    message: "An unexpected error occurred while loading patient data.",
  },
};

/** Maps an HTTP status from the patient API to the matching full-page state. */
export function accessStateFromStatus(status: number): AccessStateKind {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not-found";
  if (status === 503) return "unavailable";
  return "error";
}

export function PatientAccessState({
  kind,
  message,
  action,
}: {
  kind: AccessStateKind;
  message?: string;
  action?: React.ReactNode;
}) {
  const content = CONTENT[kind];
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/60 p-8 flex flex-col items-center text-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center">{content.icon}</div>
        <h1 className="text-lg font-bold text-white">{content.title}</h1>
        <p className="text-sm text-slate-400">{message ?? content.message}</p>
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
