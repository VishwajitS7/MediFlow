"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Activity,
  ArrowLeft,
  ClipboardList,
  FileText,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  Pill,
  RefreshCw,
  Thermometer,
  Wind,
} from "lucide-react";
import type { IPatient, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { getPatient, PatientApiError } from "@/features/patients/patient-client";
import { PatientProfile } from "@/features/patients/patient-profile";
import { PatientForm } from "@/features/patients/patient-form";
import { PatientDialog } from "@/features/patients/patient-dialog";
import { PatientAccessState, accessStateFromStatus } from "@/features/patients/patient-access-state";

const EDIT_ROLES: UserRole[] = ["ADMIN", "RECEPTIONIST"];

type Tab = "overview" | "consultations" | "prescriptions";
type LoadResult = { key: string; patient?: IPatient; error?: PatientApiError };

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "consultations", label: "Consultations", icon: <ClipboardList className="h-4 w-4" /> },
  { id: "prescriptions", label: "Prescriptions", icon: <Pill className="h-4 w-4" /> },
];

/** Client view for /patients/[id]: profile, vitals summary, and clinical-history tabs. */
export function PatientDetailView({ id }: { id: string }) {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const canEdit = Boolean(role && EDIT_ROLES.includes(role));
  const isAuthenticated = status === "authenticated";

  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);

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
    return <PatientAccessState kind="unauthenticated" />;
  }
  if (status === "loading" || isLoading) {
    return <ProfileSkeleton />;
  }
  if (result?.error || !result?.patient) {
    return (
      <PatientAccessState
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
        <div role="tablist" aria-label="Patient record sections" className="flex gap-1 border-b border-slate-800 overflow-x-auto">
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

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          {tab === "overview" && <VitalsSummaryCard />}
          {tab === "consultations" && (
            <PendingModule
              icon={<ClipboardList className="h-6 w-6 text-indigo-400" />}
              title="No consultations recorded"
              message="Consultation history (chief complaint, diagnosis, clinical notes) will appear here once the consultation module (TASK-DEV3-01) is integrated."
            />
          )}
          {tab === "prescriptions" && (
            <PendingModule
              icon={<FileText className="h-6 w-6 text-emerald-400" />}
              title="No prescriptions issued"
              message="Active and past prescriptions will appear here once the prescription module (TASK-DEV3-01) is integrated."
            />
          )}
        </div>
      </div>

      {canEdit && (
        <PatientDialog
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
        </PatientDialog>
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

const VITALS = [
  { label: "Blood Pressure", unit: "mmHg", icon: <Gauge className="h-4 w-4 text-rose-400" /> },
  { label: "Heart Rate", unit: "bpm", icon: <HeartPulse className="h-4 w-4 text-pink-400" /> },
  { label: "Temperature", unit: "°F", icon: <Thermometer className="h-4 w-4 text-amber-400" /> },
  { label: "SpO₂", unit: "%", icon: <Wind className="h-4 w-4 text-sky-400" /> },
];

/** Latest-vitals summary. Vitals are captured during consultations (TASK-DEV3-01), so this shows an empty state until then. */
function VitalsSummaryCard() {
  return (
    <section className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
          <Activity className="h-4 w-4" />
          Latest Vitals
        </h2>
        <span className="text-[11px] text-slate-500">Recorded during consultations</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {VITALS.map((v) => (
          <div key={v.label} className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              {v.icon}
              {v.label}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-slate-600">—</span>
              <span className="text-[11px] text-slate-600">{v.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500">No vitals have been recorded for this patient yet.</p>
    </section>
  );
}

function PendingModule({ icon, title, message }: { icon: React.ReactNode; title: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2 py-14 px-6 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
      <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center">{icon}</div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="text-xs text-slate-400 max-w-md">{message}</p>
    </div>
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
