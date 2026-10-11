"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardList,
  FilePlus2,
  FileText,
  Loader2,
  ShieldAlert,
  ShieldX,
  Stethoscope,
} from "lucide-react";
import type { UserRole } from "@/types";
import { AccessState, accessStateFromStatus } from "@/components/ui/access-state";
import { ApiClientError } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api-query";
import { getAppointment, updateAppointmentStatus } from "@/features/appointments/appointment-client";
import { AppointmentStatusBadge } from "@/features/appointments/appointment-status-badge";
import { availableActions, type StatusAction } from "@/features/appointments/appointment-list";
import {
  CONSULTABLE_STATUSES,
  formatLongDate,
  formatTime,
  STATUS_ACTION_LABELS,
} from "@/features/appointments/appointment-utils";
import { calculateAge, formatGender } from "@/features/patients/patient-utils";
import { listConsultations, listPrescriptions } from "@/features/consultations/clinical-client";
import { ConsultationForm } from "@/features/consultations/consultation-form";
import { ConsultationSummary } from "@/features/consultations/consultation-summary";
import { PrescriptionComposer } from "@/features/prescriptions/prescription-composer";
import { PrescriptionList } from "@/features/prescriptions/prescription-list";

const CLINICAL_READERS: UserRole[] = ["DOCTOR", "ADMIN", "PATIENT"];

/** Visit page: appointment details, consultation workspace, and prescriptions for one appointment. */
export function AppointmentDetailView({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const user = session?.user;
  const role = user?.role;
  const canReadClinical = Boolean(role && CLINICAL_READERS.includes(role));

  const appointment = useApiQuery(user ? `appointment|${id}` : null, () => getAppointment(id));
  const consultations = useApiQuery(
    user && canReadClinical && appointment.data ? `consultation|${id}` : null,
    () => listConsultations({ appointmentId: id, limit: 1 })
  );
  const consultation = consultations.data?.[0];
  const prescriptions = useApiQuery(consultation ? `prescriptions|${consultation._id}` : null, () =>
    listPrescriptions({ consultationId: consultation?._id ?? "" })
  );

  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (status === "unauthenticated") return <AccessState kind="unauthenticated" />;
  if (status === "loading" || appointment.isLoading) return <DetailSkeleton />;
  if (appointment.error || !appointment.data || !user || !role) {
    return (
      <AccessState
        kind={accessStateFromStatus(appointment.error?.status ?? 500)}
        resource="appointment"
        action={
          <Link href="/appointments" className="mt-2 text-sm text-teal-400 hover:underline">
            Back to appointments
          </Link>
        }
      />
    );
  }

  const appt = appointment.data;
  const isAssignedDoctor = role === "DOCTOR" && appt.doctorId === user.id;
  const isAuthor = Boolean(consultation && role === "DOCTOR" && consultation.doctorId === user.id);
  const actions = availableActions(appt, role, user.id).filter((a) => a !== "IN_PROGRESS");
  const patient = appt.patient;

  const changeStatus = async (next: StatusAction) => {
    if ((next === "CANCELLED" || next === "NO_SHOW") && !window.confirm(`${STATUS_ACTION_LABELS[next]} this appointment?`)) return;
    setBusy(true);
    setActionError(null);
    try {
      appointment.setData(await updateAppointmentStatus(appt._id, next));
    } catch (error) {
      setActionError(error instanceof ApiClientError ? error.message : "Could not update the appointment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div>
        <Link href="/appointments" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          {role === "PATIENT" ? "My appointments" : "Back to appointments"}
        </Link>
      </div>

      {/* Visit header */}
      <section className="relative overflow-clip rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{patient?.fullName ?? "Patient"}</h1>
              <AppointmentStatusBadge status={appt.status} />
              {appt.queueNumber !== undefined && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/25">
                  Token #{appt.queueNumber}
                </span>
              )}
            </div>
            {patient && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                {role === "PATIENT" ? (
                  <span className="font-mono text-teal-400">{patient.patientId}</span>
                ) : (
                  <Link href={`/patients/${patient._id}`} className="font-mono text-teal-400 hover:underline">
                    {patient.patientId}
                  </Link>
                )}
                <span>
                  {formatGender(patient.gender)} · {calculateAge(patient.dateOfBirth)} yrs
                </span>
                <span className="font-mono">{patient.phone}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300 mt-1">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="h-4 w-4 text-indigo-400" />
                {formatLongDate(appt.dateTime)} · {formatTime(appt.dateTime)}
              </span>
              {appt.doctor && (
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="h-4 w-4 text-teal-400" />
                  {appt.doctor.name}
                  {appt.doctor.specialization ? ` · ${appt.doctor.specialization}` : ""}
                </span>
              )}
            </div>
          </div>
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <button
                  key={a}
                  type="button"
                  disabled={busy}
                  onClick={() => changeStatus(a)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : STATUS_ACTION_LABELS[a]}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Reason for Visit</div>
            <p className="text-slate-100">{appt.reason}</p>
          </div>
          {appt.notes && role !== "PATIENT" && (
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Front-desk Notes</div>
              <p className="text-slate-300">{appt.notes}</p>
            </div>
          )}
        </div>
        {actionError && (
          <p role="alert" className="text-xs text-rose-300">
            {actionError}
          </p>
        )}
      </section>

      {patient && patient.allergies.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-200">
            <span className="font-semibold">Known allergies:</span> {patient.allergies.join(", ")}
          </div>
        </div>
      )}

      {/* Consultation */}
      <Card icon={<ClipboardList className="h-4 w-4" />} title="Consultation">
        {!canReadClinical ? (
          <Restricted message="Clinical notes are only visible to doctors, administrators, and the patient." />
        ) : consultations.isLoading ? (
          <Loading />
        ) : consultations.error ? (
          <p className="text-sm text-rose-300">{consultations.error.message}</p>
        ) : consultation && (consultation.status === "COMPLETED" || !isAuthor) ? (
          <ConsultationSummary consultation={consultation} />
        ) : consultation && isAuthor ? (
          <>
            <p className="text-xs text-amber-300 -mt-1 mb-4">Draft saved — complete it to lock the record and finish the visit.</p>
            <ConsultationForm
              key={consultation.updatedAt?.toString()}
              appointment={appt}
              draft={consultation}
              onSaved={(saved) => {
                consultations.setData([saved]);
                appointment.reload();
              }}
            />
          </>
        ) : isAssignedDoctor && CONSULTABLE_STATUSES.includes(appt.status) ? (
          <ConsultationForm
            appointment={appt}
            onSaved={(saved) => {
              consultations.setData([saved]);
              appointment.reload();
            }}
          />
        ) : (
          <p className="text-sm text-slate-400">
            {CONSULTABLE_STATUSES.includes(appt.status)
              ? role === "DOCTOR"
                ? "Only the assigned doctor can record this consultation."
                : "The consultation will appear here once the doctor records it."
              : "No consultation was recorded for this visit."}
          </p>
        )}
      </Card>

      {/* Prescriptions */}
      {consultation && (
        <Card
          icon={<FileText className="h-4 w-4" />}
          title="Prescriptions"
          action={
            isAuthor && !composing ? (
              <button
                type="button"
                onClick={() => setComposing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/15 border border-teal-500/40 text-teal-200 hover:bg-teal-500/25 transition cursor-pointer"
              >
                <FilePlus2 className="h-3.5 w-3.5" />
                New Prescription
              </button>
            ) : undefined
          }
        >
          {composing && (
            <div className="mb-5">
              <PrescriptionComposer
                consultation={consultation}
                onCancel={() => setComposing(false)}
                onCreated={(rx) => {
                  setComposing(false);
                  prescriptions.setData([rx, ...(prescriptions.data ?? [])]);
                }}
              />
            </div>
          )}
          {prescriptions.isLoading ? (
            <Loading />
          ) : prescriptions.error ? (
            <p className="text-sm text-rose-300">{prescriptions.error.message}</p>
          ) : (
            <PrescriptionList
              prescriptions={prescriptions.data ?? []}
              emptyMessage={isAuthor ? "No prescriptions yet. Use “New Prescription” to issue one." : "No prescriptions were issued for this visit."}
            />
          )}
        </Card>
      )}
    </main>
  );
}

function Card({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="p-5 sm:p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Restricted({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-400">
      <ShieldX className="h-5 w-5 text-slate-500" />
      {message}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading…
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4" aria-busy="true">
      <div className="h-5 w-40 rounded bg-slate-900 animate-pulse" />
      <div className="h-44 rounded-3xl bg-slate-900 animate-pulse" />
      <div className="h-64 rounded-2xl bg-slate-900/60 animate-pulse" />
    </main>
  );
}
