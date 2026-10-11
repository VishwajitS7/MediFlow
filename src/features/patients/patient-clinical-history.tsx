"use client";

import Link from "next/link";
import { Activity, CalendarClock, ChevronRight, ClipboardList, Lock, PencilLine, ShieldX } from "lucide-react";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { useApiQuery } from "@/lib/api/use-api-query";
import { listAppointments } from "@/features/appointments/appointment-client";
import { AppointmentList } from "@/features/appointments/appointment-list";
import { AppointmentStatusBadge } from "@/features/appointments/appointment-status-badge";
import { formatLongDate, formatTime } from "@/features/appointments/appointment-utils";
import { listConsultations, listPrescriptions } from "@/features/consultations/clinical-client";
import { VitalsGrid } from "@/features/consultations/vitals-grid";
import { PrescriptionList } from "@/features/prescriptions/prescription-list";

const CLINICAL_READERS: UserRole[] = ["DOCTOR", "ADMIN", "PATIENT"];

export const canReadClinicalNotes = (role?: UserRole) => Boolean(role && CLINICAL_READERS.includes(role));

/** Overview tab: latest recorded vitals plus the next upcoming visit. */
export function PatientOverviewPanel({ patientId, role }: { patientId: string; role?: UserRole }) {
  const clinical = canReadClinicalNotes(role);
  const latest = useApiQuery(clinical ? `latest-consultation|${patientId}` : null, () =>
    listConsultations({ patientId, limit: 5 })
  );
  const upcoming = useApiQuery(`upcoming|${patientId}`, () =>
    listAppointments({ patientId, from: new Date().toISOString(), limit: 5 })
  );

  const record = latest.data?.find((c) => c.status === "COMPLETED") ?? latest.data?.[0];
  const next = upcoming.data?.find((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED");

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_20rem] gap-4 items-start">
      <section className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <Activity className="h-4 w-4" />
            Latest Vitals
          </h2>
          {record?.updatedAt && (
            <span className="text-[11px] text-slate-500">
              Recorded {new Date(record.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              {record.doctor ? ` by ${record.doctor.name}` : ""}
            </span>
          )}
        </div>
        {!clinical ? (
          <Restricted />
        ) : latest.isLoading ? (
          <div className="h-24 rounded-xl bg-slate-900 animate-pulse" />
        ) : (
          <>
            <VitalsGrid vitals={record?.vitals} />
            {!record && <p className="text-xs text-slate-500">No vitals have been recorded for this patient yet.</p>}
            {record && (
              <p className="text-xs text-slate-400">
                <span className="text-slate-500">Last diagnosis:</span> {record.diagnosis}
              </p>
            )}
          </>
        )}
      </section>

      <section className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
          <CalendarClock className="h-4 w-4" />
          Next Visit
        </h2>
        {upcoming.isLoading ? (
          <div className="h-16 rounded-xl bg-slate-900 animate-pulse" />
        ) : next ? (
          <Link href={`/appointments/${next._id}`} className="flex flex-col gap-1 p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition">
            <span className="text-sm font-semibold text-white">{formatLongDate(next.dateTime)}</span>
            <span className="text-xs text-slate-400">
              {formatTime(next.dateTime)} · {next.doctor?.name}
            </span>
            <AppointmentStatusBadge status={next.status} className="w-fit mt-1" />
          </Link>
        ) : (
          <p className="text-sm text-slate-500">No upcoming appointments.</p>
        )}
      </section>
    </div>
  );
}

export function PatientAppointmentsPanel({ patientId, role, userId }: { patientId: string; role: UserRole; userId: string }) {
  const appts = useApiQuery(`patient-appointments|${patientId}`, () => listAppointments({ patientId, limit: 100 }));
  if (appts.error) return <p className="text-sm text-rose-300">{appts.error.message}</p>;
  const list = [...(appts.data ?? [])].reverse();
  return (
    <AppointmentList
      appointments={list}
      role={role}
      userId={userId}
      isLoading={appts.isLoading}
      showDate
      emptyMessage="No appointments booked for this patient."
    />
  );
}

export function PatientConsultationsPanel({ patientId, role }: { patientId: string; role?: UserRole }) {
  const clinical = canReadClinicalNotes(role);
  const consultations = useApiQuery(clinical ? `patient-consultations|${patientId}` : null, () =>
    listConsultations({ patientId, limit: 50 })
  );

  if (!clinical) return <Restricted />;
  if (consultations.isLoading) return <div className="h-32 rounded-2xl bg-slate-900/60 animate-pulse" />;
  if (consultations.error) return <p className="text-sm text-rose-300">{consultations.error.message}</p>;

  const list = consultations.data ?? [];
  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
        <ClipboardList className="h-6 w-6 text-slate-600" />
        <p className="text-sm text-slate-400">No consultations recorded yet.</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {list.map((c) => (
        <li key={c._id}>
          <Link
            href={`/appointments/${c.appointmentId}`}
            className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition"
          >
            <div className="sm:w-32 shrink-0 text-xs text-slate-400">
              <div className="text-sm font-semibold text-white">
                {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : ""}
              </div>
              {c.doctor?.name}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">{c.diagnosis}</div>
              <p className="text-xs text-slate-400 truncate">{c.chiefComplaint}</p>
              {c.symptoms.length > 0 && <p className="text-[11px] text-slate-500 mt-1 truncate">Symptoms: {c.symptoms.join(", ")}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold",
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
    </ol>
  );
}

export function PatientPrescriptionsPanel({ patientId }: { patientId: string }) {
  const prescriptions = useApiQuery(`patient-prescriptions|${patientId}`, () => listPrescriptions({ patientId, limit: 50 }));
  if (prescriptions.isLoading) return <div className="h-32 rounded-2xl bg-slate-900/60 animate-pulse" />;
  if (prescriptions.error) return <p className="text-sm text-rose-300">{prescriptions.error.message}</p>;
  return <PrescriptionList prescriptions={prescriptions.data ?? []} />;
}

function Restricted() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-sm text-slate-400">
      <ShieldX className="h-5 w-5 text-slate-500 shrink-0" />
      Clinical notes and vitals are only visible to doctors, administrators, and the patient.
    </div>
  );
}
