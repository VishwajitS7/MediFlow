"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Activity, ArrowLeft, Printer } from "lucide-react";
import { AccessState, accessStateFromStatus } from "@/components/ui/access-state";
import { useApiQuery } from "@/lib/api/use-api-query";
import { getPrescription } from "@/features/consultations/clinical-client";
import { calculateAge, formatGender } from "@/features/patients/patient-utils";
import { totalDoses } from "@/features/prescriptions/prescription-utils";

/** Printable prescription summary for the patient. Uses Tailwind `print:` variants for paper output. */
export function PrescriptionPrintView({ id }: { id: string }) {
  const { status } = useSession();
  const rx = useApiQuery(status === "authenticated" ? `prescription|${id}` : null, () => getPrescription(id));

  if (status === "unauthenticated") return <AccessState kind="unauthenticated" />;
  if (status === "loading" || rx.isLoading) return <PrintSkeleton />;
  if (rx.error || !rx.data) {
    return <AccessState kind={accessStateFromStatus(rx.error?.status ?? 500)} resource="prescription" />;
  }

  const p = rx.data;
  const issued = p.createdAt ? new Date(p.createdAt) : undefined;

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4 print:p-0 print:max-w-none">
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link
          href={`/appointments`}
          onClick={(e) => {
            if (window.history.length > 1) {
              e.preventDefault();
              window.history.back();
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-teal-500/20 hover:opacity-95 cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      <article className="rounded-2xl bg-white text-slate-900 shadow-2xl p-8 sm:p-10 flex flex-col gap-6 print:shadow-none print:rounded-none print:p-0">
        {/* Letterhead */}
        <header className="flex items-start justify-between gap-4 pb-5 border-b-2 border-teal-600">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-teal-600 flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">MediFlow Smart Clinic</div>
              <div className="text-xs text-slate-500">Outpatient Prescription</div>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div className="font-mono">Rx #{p._id.slice(-8).toUpperCase()}</div>
            {issued && <div>{issued.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</div>}
          </div>
        </header>

        {/* Parties */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Patient</div>
            <div className="font-semibold">{p.patient?.fullName}</div>
            {p.patient && (
              <div className="text-slate-600 text-xs mt-0.5">
                <span className="font-mono">{p.patient.patientId}</span> · {formatGender(p.patient.gender)} ·{" "}
                {calculateAge(p.patient.dateOfBirth)} yrs · {p.patient.phone}
              </div>
            )}
          </div>
          <div className="sm:text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Prescribing Doctor</div>
            <div className="font-semibold">{p.doctor?.name}</div>
            {p.doctor?.specialization && <div className="text-slate-600 text-xs mt-0.5">{p.doctor.specialization}</div>}
          </div>
        </section>

        {p.patient && p.patient.allergies.length > 0 && (
          <div className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900">
            <span className="font-semibold">Known allergies:</span> {p.patient.allergies.join(", ")}
          </div>
        )}

        {/* Medications */}
        <section>
          <div className="text-3xl font-serif font-bold text-teal-700 mb-2" aria-hidden="true">
            ℞
          </div>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-300">
                <th className="py-2 pr-2 font-semibold w-6">#</th>
                <th className="py-2 pr-2 font-semibold">Medicine</th>
                <th className="py-2 pr-2 font-semibold">Dosage</th>
                <th className="py-2 pr-2 font-semibold">Frequency</th>
                <th className="py-2 pr-2 font-semibold">Duration</th>
                <th className="py-2 font-semibold">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {p.medications.map((m, i) => {
                const doses = totalDoses(m.frequency, m.durationDays);
                return (
                  <tr key={`${m.name}-${i}`} className="border-b border-slate-200 align-top">
                    <td className="py-2.5 pr-2 text-slate-500">{i + 1}</td>
                    <td className="py-2.5 pr-2 font-semibold">{m.name}</td>
                    <td className="py-2.5 pr-2">{m.dosage}</td>
                    <td className="py-2.5 pr-2 font-mono">{m.frequency}</td>
                    <td className="py-2.5 pr-2 whitespace-nowrap">
                      {m.durationDays} day{m.durationDays === 1 ? "" : "s"}
                      {doses !== undefined && <div className="text-[11px] text-slate-500">{doses} doses</div>}
                    </td>
                    <td className="py-2.5 text-slate-700">{m.instructions ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 mt-2">Frequency notation: morning-afternoon-night (e.g. 1-0-1 = morning and night).</p>
        </section>

        {p.generalInstructions && (
          <section className="text-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Advice</div>
            <p className="text-slate-800 whitespace-pre-wrap">{p.generalInstructions}</p>
          </section>
        )}

        <footer className="flex items-end justify-between gap-4 pt-10 text-xs text-slate-500">
          <span>Generated by MediFlow · Synthetic demo data</span>
          <div className="text-center">
            <div className="w-48 border-t border-slate-400 mb-1" />
            {p.doctor?.name ?? "Doctor"}&apos;s signature
          </div>
        </footer>
      </article>
    </main>
  );
}

export function PrintSkeleton() {
  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 py-8" aria-busy="true">
      <div className="h-[32rem] rounded-2xl bg-slate-900/60 animate-pulse" />
    </main>
  );
}
