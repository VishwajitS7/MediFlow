"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, Loader2, Pill, Plus, Send, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiClientError } from "@/lib/api/client";
import { createPrescriptionSchema } from "@/lib/validation/prescription";
import { createPrescription } from "@/features/consultations/clinical-client";
import type { ConsultationView, PrescriptionView } from "@/features/consultations/types";
import { FREQUENCY_PRESETS, matchingAllergies } from "@/features/prescriptions/prescription-utils";

interface MedicationRow {
  key: number;
  name: string;
  dosage: string;
  frequency: string;
  durationDays: string;
  instructions: string;
}

let rowKey = 0;
const emptyRow = (): MedicationRow => ({
  key: ++rowKey,
  name: "",
  dosage: "",
  frequency: "1-0-1",
  durationDays: "5",
  instructions: "",
});

interface PrescriptionComposerProps {
  consultation: ConsultationView;
  onCreated: (prescription: PrescriptionView) => void;
  onCancel?: () => void;
}

/** Drug prescription composer linked to a consultation. */
export function PrescriptionComposer({ consultation, onCreated, onCancel }: PrescriptionComposerProps) {
  const [rows, setRows] = useState<MedicationRow[]>(() => [emptyRow()]);
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const allergies = consultation.patient?.allergies ?? [];

  const update = (key: number, patch: Partial<MedicationRow>) =>
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const submit = async () => {
    setFormError(null);
    const payload = {
      consultationId: consultation._id,
      patientId: consultation.patientId,
      medications: rows.map((r) => ({
        name: r.name,
        dosage: r.dosage,
        frequency: r.frequency,
        durationDays: r.durationDays,
        instructions: r.instructions,
      })),
      generalInstructions,
    };
    const parsed = createPrescriptionSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<number, string> = {};
      let general: string | null = null;
      for (const issue of parsed.error.issues) {
        if (issue.path[0] === "medications" && typeof issue.path[1] === "number") {
          const row = rows[issue.path[1]];
          if (row && !next[row.key]) next[row.key] = issue.message;
        } else if (!general) {
          general = issue.message;
        }
      }
      setRowErrors(next);
      setFormError(general ?? "Please correct the highlighted medications.");
      return;
    }

    setRowErrors({});
    setSubmitting(true);
    try {
      onCreated(await createPrescription(parsed.data));
    } catch (error) {
      setFormError(error instanceof ApiClientError ? error.message : "Could not issue the prescription.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {formError && (
        <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {rows.map((row, index) => {
          const allergyHits = matchingAllergies(row.name, allergies);
          return (
            <li key={row.key} className={cn("p-4 rounded-2xl border bg-slate-950/40", rowErrors[row.key] ? "border-rose-500/40" : "border-slate-800")}>
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Pill className="h-4 w-4 text-teal-400" />
                  Medication {index + 1}
                </span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                    aria-label={`Remove medication ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
                <Input label="Medicine" className="sm:col-span-3" value={row.name} placeholder="e.g. Paracetamol" onChange={(v) => update(row.key, { name: v })} />
                <Input label="Strength / Form" className="sm:col-span-3" value={row.dosage} placeholder="e.g. 500mg tablet" onChange={(v) => update(row.key, { dosage: v })} />
                <div className="sm:col-span-4 flex flex-col gap-1">
                  <Input label="Frequency" value={row.frequency} placeholder="1-0-1" onChange={(v) => update(row.key, { frequency: v })} />
                  <div className="flex flex-wrap gap-1">
                    {FREQUENCY_PRESETS.map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => update(row.key, { frequency: f })}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-[11px] font-mono border transition cursor-pointer",
                          row.frequency === f ? "bg-teal-500/15 border-teal-500/50 text-teal-200" : "border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <Input
                  label="Days"
                  type="number"
                  className="sm:col-span-2"
                  value={row.durationDays}
                  onChange={(v) => update(row.key, { durationDays: v })}
                />
                <Input
                  label="Instructions"
                  className="sm:col-span-6"
                  value={row.instructions}
                  placeholder="e.g. After food"
                  onChange={(v) => update(row.key, { instructions: v })}
                />
              </div>
              {allergyHits.length > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Patient has a recorded allergy to {allergyHits.join(", ")}. Verify before prescribing.
                </p>
              )}
              {rowErrors[row.key] && <p className="mt-2 text-[11px] text-rose-400">{rowErrors[row.key]}</p>}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => setRows([...rows, emptyRow()])}
        disabled={rows.length >= 20}
        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-700 text-sm text-slate-300 hover:text-white hover:border-teal-500/50 transition cursor-pointer disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
        Add Medication
      </button>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="rx-general" className="text-xs font-medium text-slate-300">
          General Instructions (optional)
        </label>
        <textarea
          id="rx-general"
          value={generalInstructions}
          onChange={(e) => setGeneralInstructions(e.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="e.g. Drink plenty of warm liquids. Review in 5 days if symptoms persist."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-teal-500/20 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Issue Prescription
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      <input
        type={type}
        value={value}
        min={type === "number" ? 1 : undefined}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-800 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
      />
    </label>
  );
}
