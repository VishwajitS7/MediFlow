"use client";

import Link from "next/link";
import { AlertTriangle, CalendarX2, ChevronRight, Loader2 } from "lucide-react";
import type { AppointmentStatus, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { AppointmentStatusBadge } from "@/features/appointments/appointment-status-badge";
import {
  canTransition,
  formatTime,
  STATUS_ACTION_LABELS,
} from "@/features/appointments/appointment-utils";
import type { AppointmentView } from "@/features/appointments/types";

export type StatusAction = Exclude<AppointmentStatus, "SCHEDULED">;

/** Status actions offered in the UI for a role. The API enforces the same workflow server-side. */
export function availableActions(appointment: AppointmentView, role: UserRole, userId: string): StatusAction[] {
  const candidates: StatusAction[] =
    role === "DOCTOR"
      ? appointment.doctorId === userId
        ? ["IN_PROGRESS"]
        : []
      : role === "ADMIN" || role === "RECEPTIONIST"
        ? ["CONFIRMED", "NO_SHOW", "CANCELLED"]
        : [];
  return candidates.filter((status) => canTransition(appointment.status, status));
}

interface AppointmentListProps {
  appointments: AppointmentView[];
  role: UserRole;
  userId: string;
  isLoading?: boolean;
  busyId?: string | null;
  showDate?: boolean;
  emptyMessage?: string;
  onAction?: (appointment: AppointmentView, status: StatusAction) => void;
}

export function AppointmentList({
  appointments,
  role,
  userId,
  isLoading = false,
  busyId = null,
  showDate = false,
  emptyMessage = "No appointments for this day.",
  onAction,
}: AppointmentListProps) {
  if (isLoading && appointments.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-900/60 animate-pulse" />
        ))}
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-14 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
        <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center">
          <CalendarX2 className="h-6 w-6 text-slate-500" />
        </div>
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {appointments.map((a) => {
        const actions = onAction ? availableActions(a, role, userId) : [];
        const muted = a.status === "CANCELLED" || a.status === "NO_SHOW";
        return (
          <li
            key={a._id}
            className={cn(
              "flex flex-col md:flex-row md:items-center gap-3 p-4 rounded-2xl border bg-slate-900/50 transition",
              a.status === "IN_PROGRESS" ? "border-amber-500/30" : "border-slate-800 hover:border-slate-700",
              muted && "opacity-60"
            )}
          >
            {/* Time + queue */}
            <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0.5 md:w-28 shrink-0">
              <span className="text-base font-bold text-white tabular-nums">{formatTime(a.dateTime)}</span>
              {showDate && (
                <span className="text-[11px] text-slate-400">
                  {new Date(a.dateTime).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
              {a.queueNumber !== undefined && (
                <span className="text-[11px] font-mono text-teal-400">Token #{a.queueNumber}</span>
              )}
            </div>

            {/* Patient + reason */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white truncate">{a.patient?.fullName ?? "Unknown patient"}</span>
                {a.patient && <span className="text-[11px] font-mono text-slate-500">{a.patient.patientId}</span>}
                {a.patient && a.patient.allergies.length > 0 && (
                  <span
                    className="inline-flex items-center gap-1 text-[11px] text-amber-300"
                    title={`Allergies: ${a.patient.allergies.join(", ")}`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    {a.patient.allergies.length} allerg{a.patient.allergies.length === 1 ? "y" : "ies"}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 truncate">{a.reason}</p>
              {a.doctor && (
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {a.doctor.name}
                  {a.doctor.specialization ? ` · ${a.doctor.specialization}` : ""}
                </p>
              )}
            </div>

            {/* Status + actions */}
            <div className="flex flex-wrap items-center gap-2 md:justify-end">
              <AppointmentStatusBadge status={a.status} />
              {actions.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={busyId === a._id}
                  onClick={() => onAction?.(a, status)}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer disabled:opacity-50 disabled:cursor-wait",
                    status === "IN_PROGRESS"
                      ? "bg-teal-500/15 border-teal-500/40 text-teal-200 hover:bg-teal-500/25"
                      : status === "CONFIRMED"
                        ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-200 hover:bg-indigo-500/20"
                        : "bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600"
                  )}
                >
                  {busyId === a._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : STATUS_ACTION_LABELS[status]}
                </button>
              ))}
              <Link
                href={`/appointments/${a._id}`}
                className="flex items-center gap-0.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Open
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
