"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, CalendarPlus, ClipboardList, LayoutDashboard, Pill, RefreshCw } from "lucide-react";
import type { IPatient, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { getPatient, PatientApiError } from "@/features/patients/patient-client";
import { PatientProfile } from "@/features/patients/patient-profile";
import { PatientForm } from "@/features/patients/patient-form";
import { Dialog } from "@/components/ui/dialog";
import { AccessState, accessStateFromStatus } from "@/components/ui/access-state";
import { AppointmentBookingForm } from "@/features/appointments/appointment-booking-form";
import {
  PatientAppointmentsPanel,
  PatientConsultationsPanel,
  PatientOverviewPanel,
  PatientPrescriptionsPanel,
} from "@/features/patients/patient-clinical-history";

const EDIT_ROLES: UserRole[] = ["ADMIN", "RECEPTIONIST"];
const BOOKING_ROLES: UserRole[] = ["ADMIN", "RECEPTIONIST", "DOCTOR"];

type Tab = "overview" | "appointments" | "consultations" | "prescriptions";
type LoadResult = { key: string; patient?: IPatient; error?: PatientApiError };

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "appointments", label: "Appointments", icon: <CalendarDays className="h-4 w-4" /> },
  { id: "consultations", label: "Consultations", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "prescriptions", label: "Prescriptions", icon: <Pill className="h-4 w-4" /> },
];

/** Client view for /patients/[id]: profile, vitals summary, and clinical-history tabs. */
export function PatientDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const canEdit = Boolean(role && EDIT_ROLES.includes(role));
  const canBook = Boolean(role && BOOKING_ROLES.includes(role));
  const isAuthenticated = status === "authenticated";

  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [booking, setBooking] = useState(false);

  const requestKey = `${id}|${reloadToken}`;
  const isLoading = result?.key !== requestKey;

  useEffect(() => {
    if (!isAuthenticated || !id) return;
    let cancelled = false;
    getPatient(id)
      .then((patient) => {
        if (!cancelled) setResult({ key: requestKey, patient });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResult({
          key: requestKey,
          error: err instanceof PatientApiError ? err : new PatientApiError("Unexpected error", 500, "UNKNOWN_ERROR"),
        });
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, id, requestKey]);

  if (status === "unauthenticated") {
    return <AccessState kind="unauthenticated" />;
  }
  if (status === "loading" || isLoading) {
    return <ProfileSkeleton />;
  }
  if (result?.error || !result?.patient) {
    return (
      <AccessState resource="patient"
        kind={accessStateFromStatus(result?.error?.status ?? 500)}
        action={
          <div className="mt-2 flex items-center gap-2">
            {role !== "PATIENT" && <BackLink />}
            <button
              type="button"
              onClick={() => setReloadToken((t) => t + 1)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        }
      />
    );
  }

  const patient = result.patient;
  const patientRef = patient._id ?? "";

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {role !== "PATIENT" && (
        <div>
          <BackLink />
        </div>
      )}

      <PatientProfile patient={patient} canEdit={canEdit} onEdit={() => setEditing(true)} />

      {/* Tabs */}
      <div className="flex flex-col gap-4">
        <div className="flex items-end gap-3 border-b border-slate-800">
        <div role="tablist" aria-label="Patient record sections" className="flex gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] flex-1 min-w-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap cursor-pointer",
                tab === t.id
                  ? "border-teal-400 text-white"
                  : "border-transparent text-slate-400 hover:text-white hover:border-slate-700"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
          {canBook && (
            <button
              type="button"
              onClick={() => setBooking(true)}
              className="mb-1.5 shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-500/15 border border-teal-500/40 text-teal-200 hover:bg-teal-500/25 transition cursor-pointer"
            >
              <CalendarPlus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Book Appointment</span>
            </button>
          )}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "overview" && <PatientOverviewPanel patientId={patientRef} role={role} />}
          {tab === "appointments" && role && session?.user && (
            <PatientAppointmentsPanel patientId={patientRef} role={role} userId={session.user.id} />
          )}
          {tab === "consultations" && <PatientConsultationsPanel patientId={patientRef} role={role} />}
          {tab === "prescriptions" && <PatientPrescriptionsPanel patientId={patientRef} />}
        </div>
      </div>

      {canBook && (
        <Dialog
          open={booking}
          title={`Book Appointment — ${patient.fullName}`}
          description="Choose a doctor and an open 30-minute slot."
          onClose={() => setBooking(false)}
        >
          {booking && (
            <AppointmentBookingForm
              initialPatient={{
                _id: patientRef,
                patientId: patient.patientId,
                fullName: patient.fullName,
                phone: patient.phone,
                gender: patient.gender,
                dateOfBirth: patient.dateOfBirth,
                allergies: patient.allergies,
              }}
              initialDoctorId={role === "DOCTOR" ? session?.user?.id : ""}
              onCancel={() => setBooking(false)}
              onSuccess={(created) => router.push(`/appointments/${created._id}`)}
            />
          )}
        </Dialog>
      )}

      {canEdit && (
        <Dialog
          open={editing}
          title={`Edit ${patient.fullName}`}
          description={`Update demographics, contact details, or allergies for ${patient.patientId}.`}
          onClose={() => setEditing(false)}
        >
          {editing && (
            <PatientForm
              patient={patient}
              onSuccess={(updated) => {
                setResult({ key: requestKey, patient: updated });
                setEditing(false);
              }}
              onCancel={() => setEditing(false)}
            />
          )}
        </Dialog>
      )}
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/patients"
      className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to directory
    </Link>
  );
}

export function ProfileSkeleton() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4" aria-busy="true">
      <div className="h-5 w-36 rounded bg-slate-900 animate-pulse" />
      <div className="h-32 rounded-3xl bg-slate-900 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-900/70 animate-pulse" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-slate-900/60 animate-pulse" />
    </main>
  );
}
