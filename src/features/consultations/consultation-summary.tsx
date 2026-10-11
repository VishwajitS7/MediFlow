import { Lock, PencilLine } from "lucide-react";
import { VitalsGrid } from "@/features/consultations/vitals-grid";
import type { ConsultationView } from "@/features/consultations/types";

/** Read-only consultation record (vitals, findings, diagnosis, notes). */
export function ConsultationSummary({ consultation, showHeader = true }: { consultation: ConsultationView; showHeader?: boolean }) {
  const locked = consultation.status === "COMPLETED";
  return (
    <div className="flex flex-col gap-4">
      {showHeader && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span
            className={
              locked
                ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-semibold"
                : "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold"
            }
          >
            {locked ? <Lock className="h-3 w-3" /> : <PencilLine className="h-3 w-3" />}
            {locked ? "Completed · locked" : "Draft"}
          </span>
          {consultation.doctor && <span>by {consultation.doctor.name}</span>}
          {consultation.updatedAt && (
            <span>
              · {new Date(consultation.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
            </span>
          )}
        </div>
      )}

      <VitalsGrid vitals={consultation.vitals} />

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Chief Complaint</dt>
          <dd className="text-sm text-slate-100">{consultation.chiefComplaint}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Diagnosis</dt>
          <dd className="text-sm font-semibold text-white">{consultation.diagnosis}</dd>
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Symptoms</dt>
          <dd className="flex flex-wrap gap-1">
            {consultation.symptoms.length === 0 ? (
              <span className="text-sm text-slate-500">None recorded</span>
            ) : (
              consultation.symptoms.map((s) => (
                <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/10 text-indigo-200 border border-indigo-500/25">
                  {s}
                </span>
              ))
            )}
          </dd>
        </div>
        {consultation.clinicalNotes && (
          <div className="flex flex-col gap-1 md:col-span-2">
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Clinical Notes</dt>
            <dd className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{consultation.clinicalNotes}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
