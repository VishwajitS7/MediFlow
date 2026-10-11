import Link from "next/link";
import { FileText, Printer } from "lucide-react";
import type { PrescriptionView } from "@/features/consultations/types";

/** Compact cards for issued prescriptions, each linking to its printable view. */
export function PrescriptionList({
  prescriptions,
  emptyMessage = "No prescriptions issued yet.",
}: {
  prescriptions: PrescriptionView[];
  emptyMessage?: string;
}) {
  if (prescriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-2 py-10 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
        <FileText className="h-6 w-6 text-slate-600" />
        <p className="text-sm text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {prescriptions.map((rx) => (
        <li key={rx._id} className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-slate-800 bg-slate-900/80">
            <FileText className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">
              {rx.createdAt
                ? new Date(rx.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : "Prescription"}
            </span>
            {rx.doctor && <span className="text-xs text-slate-400">· {rx.doctor.name}</span>}
            <Link
              href={`/prescriptions/${rx._id}`}
              className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              View / Print
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2 font-semibold">Medicine</th>
                  <th className="px-4 py-2 font-semibold">Dosage</th>
                  <th className="px-4 py-2 font-semibold">Frequency</th>
                  <th className="px-4 py-2 font-semibold">Days</th>
                  <th className="px-4 py-2 font-semibold">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {rx.medications.map((m, i) => (
                  <tr key={`${m.name}-${i}`}>
                    <td className="px-4 py-2 font-medium text-white">{m.name}</td>
                    <td className="px-4 py-2 text-slate-300">{m.dosage}</td>
                    <td className="px-4 py-2 font-mono text-slate-300">{m.frequency}</td>
                    <td className="px-4 py-2 text-slate-300 tabular-nums">{m.durationDays}</td>
                    <td className="px-4 py-2 text-slate-400">{m.instructions ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rx.generalInstructions && (
            <p className="px-4 py-3 text-xs text-slate-400 border-t border-slate-800">
              <span className="font-semibold text-slate-300">Advice: </span>
              {rx.generalInstructions}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
