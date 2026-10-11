"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ChevronRight, ClipboardList, Lock, PencilLine, RefreshCw, Stethoscope } from "lucide-react";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { AccessState, accessStateFromStatus } from "@/components/ui/access-state";
import { ApiClientError } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api-query";
import { listAppointments, updateAppointmentStatus } from "@/features/appointments/appointment-client";
import { AppointmentList, type StatusAction } from "@/features/appointments/appointment-list";
import { localDayKey, localDayRange } from "@/features/appointments/appointment-utils";
import type { AppointmentView } from "@/features/appointments/types";
import { listConsultations } from "@/features/consultations/clinical-client";

const ALLOWED: UserRole[] = ["DOCTOR", "ADMIN"];

export default function ConsultationsPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return <Skeleton />;
  if (status === "unauthenticated" || !session?.user) return <AccessState kind="unauthenticated" />;
  if (!ALLOWED.includes(session.user.role)) {
    return <AccessState kind="forbidden" message="The consultation console is available to doctors and administrators." />;
  }
  return <Console role={session.user.role} userId={session.user.id} />;
}

function Console({ role, userId }: { role: UserRole; userId: string }) {
  const router = useRouter();
  const isDoctor = role === "DOCTOR";
  const [day] = useState(() => localDayKey());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const range = localDayRange(day);

  const queue = useApiQuery(isDoctor ? `my-queue|${day}` : null, () =>
    listAppointments({ doctorId: userId, from: range.from, to: range.to })
  );
  const recent = useApiQuery(`recent-consultations|${role}`, () =>
    listConsultations({ doctorId: isDoctor ? userId : undefined, limit: 25 })
  );

  if (recent.error && !recent.previous) {
    return <AccessState kind={accessStateFromStatus(recent.error.status)} resource="consultation list" />;
  }

  const active = (queue.data ?? []).filter((a) => a.status !== "CANCELLED" && a.status !== "NO_SHOW");

  const handleAction = async (appointment: AppointmentView, next: StatusAction) => {
    setBusyId(appointment._id);
    setError(null);
    try {
      await updateAppointmentStatus(appointment._id, next);
      router.push(`/appointments/${appointment._id}`);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : "Could not start the visit.");
      setBusyId(null);
      queue.reload();
    }
  };

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
            <Stethoscope className="h-4 w-4" />
            Clinical Workspace
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{isDoctor ? "My Consultations" : "Consultations"}</h1>
          <p className="text-sm text-slate-400 mt-1">
            {isDoctor
              ? "Start visits from today's queue and continue any saved drafts."
              : "Recent consultation records across all doctors."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            queue.reload();
            recent.reload();
          }}
          className="self-start sm:self-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-slate-300 hover:text-white cursor-pointer"
        >
          <RefreshCw className={cn("h-4 w-4", (queue.isLoading || recent.isLoading) && "animate-spin")} />
          Refresh
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-300">
          {error}
        </p>
      )}

      {isDoctor && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Today&apos;s Queue</h2>
          <AppointmentList
            appointments={active}
            role={role}
            userId={userId}
            isLoading={queue.isLoading}
            busyId={busyId}
            onAction={handleAction}
            emptyMessage="No patients in your queue today."
          />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recent Consultations</h2>
        {recent.isLoading && !recent.previous ? (
          <div className="h-40 rounded-2xl bg-slate-900/60 animate-pulse" />
        ) : (recent.data ?? recent.previous ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
            <ClipboardList className="h-6 w-6 text-slate-600" />
            <p className="text-sm text-slate-400">No consultations recorded yet.</p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-800/70 rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
            {(recent.data ?? recent.previous ?? []).map((c) => (
              <li key={c._id}>
                <Link
                  href={`/appointments/${c.appointmentId}`}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 hover:bg-slate-800/30 transition"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white">{c.patient?.fullName ?? "Patient"}</span>
                      <span className="text-[11px] font-mono text-slate-500">{c.patient?.patientId}</span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">{c.diagnosis}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {!isDoctor && c.doctor && <span>{c.doctor.name}</span>}
                    <span>
                      {c.updatedAt
                        ? new Date(c.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                        : ""}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-semibold",
                        c.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/25"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/25"
                      )}
                    >
                      {c.status === "COMPLETED" ? <Lock className="h-3 w-3" /> : <PencilLine className="h-3 w-3" />}
                      {c.status === "COMPLETED" ? "Completed" : "Draft"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-slate-600" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function Skeleton() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6" aria-busy="true">
      <div className="h-16 w-72 rounded-xl bg-slate-900 animate-pulse" />
      <div className="h-64 rounded-2xl bg-slate-900/60 animate-pulse" />
    </main>
  );
}
