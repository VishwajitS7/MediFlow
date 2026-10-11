"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckCircle2, ChevronLeft, ChevronRight, RefreshCw, UserPlus, Users, X } from "lucide-react";
import type { IPatient, UserRole } from "@/types";
import type { PatientListResponse } from "@/features/patients/types";
import { listPatients, PatientApiError } from "@/features/patients/patient-client";
import { PatientSearch } from "@/features/patients/patient-search";
import { PatientTable } from "@/features/patients/patient-table";
import { PatientForm } from "@/features/patients/patient-form";
import { Dialog } from "@/components/ui/dialog";
import { AccessState, accessStateFromStatus } from "@/components/ui/access-state";

const PAGE_SIZE = 10;
const VIEW_ROLES: UserRole[] = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
const EDIT_ROLES: UserRole[] = ["ADMIN", "RECEPTIONIST"];

type LoadResult = { key: string; data?: PatientListResponse; error?: PatientApiError };

export default function PatientsDirectoryPage() {
  const { data: session, status } = useSession();
  const role = session?.user?.role;
  const canView = Boolean(role && VIEW_ROLES.includes(role));
  const canEdit = Boolean(role && EDIT_ROLES.includes(role));

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const [lastData, setLastData] = useState<PatientListResponse | null>(null);

  const [dialog, setDialog] = useState<{ mode: "create" } | { mode: "edit"; patient: IPatient } | null>(null);
  const [notice, setNotice] = useState<{ patient: IPatient; action: "registered" | "updated" } | null>(null);

  const requestKey = `${query}|${page}|${reloadToken}`;
  const isLoading = canView && result?.key !== requestKey;
  const data = result?.key === requestKey ? result.data ?? null : lastData;
  const error = result?.key === requestKey ? result.error : undefined;

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    listPatients({ query, page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setResult({ key: requestKey, data: res });
        setLastData(res);
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
  }, [canView, query, page, requestKey]);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setPage(1);
  }, []);

  const handleSaved = (patient: IPatient) => {
    setNotice({ patient, action: dialog?.mode === "edit" ? "updated" : "registered" });
    setDialog(null);
    setReloadToken((t) => t + 1);
  };

  if (status === "loading") {
    return <DirectorySkeleton />;
  }
  if (status === "unauthenticated") {
    return <AccessState kind="unauthenticated" />;
  }
  if (!canView) {
    return <AccessState resource="patient" kind="forbidden" message="The patient directory is available to clinic staff only." />;
  }
  if (error && !data && error.status !== 400) {
    return (
      <AccessState resource="patient"
        kind={accessStateFromStatus(error.status)}
        action={<RetryButton onClick={() => setReloadToken((t) => t + 1)} />}
      />
    );
  }

  const total = data?.pagination.total ?? 0;
  const patients = data?.patients ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
            <Users className="h-4 w-4" />
            Patient Management
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Patient Directory</h1>
          <p className="text-sm text-slate-400 mt-1">
            {canEdit ? "Search, register, and manage outpatient records." : "Search and review outpatient records."}
            {data && (
              <span className="ml-1 text-slate-300">
                <span className="font-semibold text-white">{total}</span>{" "}
                {query ? "matching" : "registered"} patient{total === 1 ? "" : "s"}.
              </span>
            )}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setDialog({ mode: "create" })}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-teal-500/20 hover:opacity-95 transition cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Register New Patient
          </button>
        )}
      </div>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-sm text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span className="flex-1">
            <span className="font-semibold">{notice.patient.fullName}</span> was {notice.action} as{" "}
            <Link href={`/patients/${notice.patient._id}`} className="font-mono font-semibold text-teal-300 hover:underline">
              {notice.patient.patientId}
            </Link>
            .
          </span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="p-1 rounded-md hover:bg-emerald-500/20 cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center gap-2">
        <PatientSearch onSearch={handleSearch} isSearching={isLoading && Boolean(data)} className="sm:max-w-md" />
        <button
          type="button"
          onClick={() => setReloadToken((t) => t + 1)}
          className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          title="Refresh"
          aria-label="Refresh patient list"
        >
          <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </button>
      </div>

      {error && data && (
        <p role="alert" className="text-xs text-rose-300">
          {error.message}
        </p>
      )}

      <PatientTable
        patients={patients}
        isLoading={isLoading}
        canEdit={canEdit}
        onEdit={(patient) => setDialog({ mode: "edit", patient })}
        emptyMessage={
          query
            ? `No patients match “${query}”.`
            : canEdit
              ? "No patients registered yet. Register the first patient to get started."
              : "No patients registered yet."
        }
      />

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <span>
            Showing <span className="text-white font-medium">{rangeStart}</span>–
            <span className="text-white font-medium">{rangeEnd}</span> of{" "}
            <span className="text-white font-medium">{total}</span>
          </span>
          <div className="flex items-center gap-2">
            <PageButton disabled={page <= 1 || isLoading} onClick={() => setPage((p) => p - 1)} label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </PageButton>
            <span className="px-2">
              Page <span className="text-white font-medium">{page}</span> of {totalPages}
            </span>
            <PageButton disabled={page >= totalPages || isLoading} onClick={() => setPage((p) => p + 1)} label="Next page">
              <ChevronRight className="h-4 w-4" />
            </PageButton>
          </div>
        </div>
      )}

      <Dialog
        open={dialog !== null}
        title={dialog?.mode === "edit" ? `Edit ${dialog.patient.fullName}` : "Register New Patient"}
        description={
          dialog?.mode === "edit"
            ? `Update demographics, contact details, or allergies for ${dialog.patient.patientId}.`
            : "A unique MED-YYYY-XXXXX patient ID is assigned automatically."
        }
        onClose={() => setDialog(null)}
      >
        {dialog && (
          <PatientForm
            key={dialog.mode === "edit" ? dialog.patient._id : "create"}
            patient={dialog.mode === "edit" ? dialog.patient : undefined}
            onSuccess={handleSaved}
            onCancel={() => setDialog(null)}
          />
        )}
      </Dialog>
    </main>
  );
}

function PageButton({
  disabled,
  onClick,
  label,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
    >
      {children}
    </button>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition cursor-pointer"
    >
      <RefreshCw className="h-4 w-4" />
      Try Again
    </button>
  );
}

function DirectorySkeleton() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6" aria-busy="true">
      <div className="h-16 w-72 rounded-xl bg-slate-900 animate-pulse" />
      <div className="h-11 w-full max-w-md rounded-xl bg-slate-900 animate-pulse" />
      <div className="h-80 w-full rounded-2xl bg-slate-900/60 animate-pulse" />
    </main>
  );
}
