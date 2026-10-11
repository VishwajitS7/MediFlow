import type { AppointmentStatus } from "@/types";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/features/appointments/appointment-utils";

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  SCHEDULED: "bg-sky-500/10 text-sky-300 border-sky-500/25",
  CONFIRMED: "bg-indigo-500/10 text-indigo-300 border-indigo-500/25",
  IN_PROGRESS: "bg-amber-500/10 text-amber-300 border-amber-500/25",
  COMPLETED: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25",
  CANCELLED: "bg-slate-700/40 text-slate-400 border-slate-600/50",
  NO_SHOW: "bg-rose-500/10 text-rose-300 border-rose-500/25",
};

export function AppointmentStatusBadge({ status, className }: { status: AppointmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap",
        STATUS_STYLES[status],
        className
      )}
    >
      {status === "IN_PROGRESS" && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {STATUS_LABELS[status]}
    </span>
  );
}
