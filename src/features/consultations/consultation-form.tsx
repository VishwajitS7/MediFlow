"use client";

import { useState } from "react";
import { Activity, AlertCircle, ClipboardList, Loader2, Lock, Plus, Save, Stethoscope, X } from "lucide-react";
import type { ConsultationStatus, IVitals } from "@/types";
import { cn } from "@/lib/utils";
import { ApiClientError, firstFieldErrors } from "@/lib/api/client";
import { createConsultationSchema, updateConsultationSchema } from "@/lib/validation/consultation";
import { createConsultation, updateConsultation } from "@/features/consultations/clinical-client";
import type { AppointmentView } from "@/features/appointments/types";
import type { ConsultationView } from "@/features/consultations/types";

type VitalKey = keyof IVitals;

const VITAL_FIELDS: { key: VitalKey; label: string; unit: string; step: string; placeholder: string }[] = [
  { key: "bloodPressureSystolic", label: "BP Systolic", unit: "mmHg", step: "1", placeholder: "120" },
  { key: "bloodPressureDiastolic", label: "BP Diastolic", unit: "mmHg", step: "1", placeholder: "80" },
  { key: "heartRate", label: "Heart Rate", unit: "bpm", step: "1", placeholder: "72" },
  { key: "temperature", label: "Temperature", unit: "°F", step: "0.1", placeholder: "98.6" },
  { key: "spo2", label: "SpO₂", unit: "%", step: "1", placeholder: "98" },
  { key: "weight", label: "Weight", unit: "kg", step: "0.1", placeholder: "70" },
  { key: "height", label: "Height", unit: "cm", step: "0.1", placeholder: "170" },
];

interface ConsultationFormProps {
  appointment: AppointmentView;
  /** Existing DRAFT consultation to continue editing. */
  draft?: ConsultationView;
  onSaved: (consultation: ConsultationView) => void;
}

function toVitalStrings(vitals?: IVitals): Record<VitalKey, string> {
  const out = {} as Record<VitalKey, string>;
  for (const f of VITAL_FIELDS) out[f.key] = vitals?.[f.key] !== undefined ? String(vitals[f.key]) : "";
  return out;
}

/** Doctor workspace form: vitals, chief complaint, symptoms, diagnosis, and notes. */
export function ConsultationForm({ appointment, draft, onSaved }: ConsultationFormProps) {
  const [vitals, setVitals] = useState(() => toVitalStrings(draft?.vitals));
  const [chiefComplaint, setChiefComplaint] = useState(draft?.chiefComplaint ?? appointment.reason);
  const [symptoms, setSymptoms] = useState<string[]>(draft?.symptoms ?? []);
  const [symptomDraft, setSymptomDraft] = useState("");
  const [diagnosis, setDiagnosis] = useState(draft?.diagnosis ?? "");
  const [clinicalNotes, setClinicalNotes] = useState(draft?.clinicalNotes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<ConsultationStatus | null>(null);

  const addSymptom = () => {
    const value = symptomDraft.trim().replace(/,$/, "");
    if (value && !symptoms.some((s) => s.toLowerCase() === value.toLowerCase())) setSymptoms([...symptoms, value]);
    setSymptomDraft("");
  };

  const numericVitals = (): IVitals => {
    const out: IVitals = {};
    for (const f of VITAL_FIELDS) {
      const raw = vitals[f.key].trim();
      if (raw !== "") out[f.key] = Number(raw);
    }
    return out;
  };

  const save = async (status: ConsultationStatus) => {
    setFormError(null);
    if (
      status === "COMPLETED" &&
      !window.confirm("Complete and lock this consultation? It cannot be edited afterwards.")
    ) {
      return;
    }

    const clinical = {
      vitals: numericVitals(),
      chiefComplaint,
      symptoms,
      diagnosis,
      clinicalNotes,
      status,
    };
    const parsed = draft
      ? updateConsultationSchema.safeParse(clinical)
      : createConsultationSchema.safeParse({ ...clinical, appointmentId: appointment._id, patientId: appointment.patientId });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[issue.path.length - 1]?.toString() ?? "form";
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setFormError("Please correct the highlighted fields.");
      return;
    }

    setErrors({});
    setSaving(status);
    try {
      const saved = draft
        ? await updateConsultation(draft._id, clinical)
        : await createConsultation({ ...clinical, appointmentId: appointment._id, patientId: appointment.patientId });
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors(firstFieldErrors(error.details));
        setFormError(error.message);
      } else {
        setFormError("Something went wrong while saving. Please try again.");
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {formError && (
        <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <Section icon={<Activity className="h-4 w-4" />} title="Vitals">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {VITAL_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label htmlFor={`vital-${f.key}`} className="text-[11px] font-medium text-slate-400">
                {f.label} <span className="text-slate-600">({f.unit})</span>
              </label>
              <input
                id={`vital-${f.key}`}
                type="number"
                inputMode="decimal"
                step={f.step}
                value={vitals[f.key]}
                placeholder={f.placeholder}
                onChange={(e) => setVitals((prev) => ({ ...prev, [f.key]: e.target.value }))}
                className={inputClass(errors[f.key])}
              />
              {errors[f.key] && <span className="text-[11px] text-rose-400">{errors[f.key]}</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section icon={<ClipboardList className="h-4 w-4" />} title="Findings">
        <div className="flex flex-col gap-4">
          <Field id="cf-complaint" label="Chief Complaint" required error={errors.chiefComplaint}>
            <input
              id="cf-complaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              maxLength={500}
              className={inputClass(errors.chiefComplaint)}
            />
          </Field>
          <Field id="cf-symptom" label="Symptoms" error={errors.symptoms} hint="Press Enter or comma to add each symptom.">
            <div className="flex flex-wrap items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 focus-within:border-teal-500 transition">
              {symptoms.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-200 border border-indigo-500/25">
                  {s}
                  <button
                    type="button"
                    onClick={() => setSymptoms(symptoms.filter((x) => x !== s))}
                    className="p-0.5 rounded-full hover:bg-indigo-500/20 cursor-pointer"
                    aria-label={`Remove ${s}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                id="cf-symptom"
                value={symptomDraft}
                onChange={(e) => setSymptomDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addSymptom();
                  } else if (e.key === "Backspace" && !symptomDraft && symptoms.length) {
                    setSymptoms(symptoms.slice(0, -1));
                  }
                }}
                onBlur={addSymptom}
                maxLength={100}
                placeholder={symptoms.length ? "Add another…" : "e.g. Dry cough, Fever"}
                className="flex-1 min-w-32 bg-transparent py-1 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
              {symptomDraft.trim() && (
                <button type="button" onClick={addSymptom} className="p-1 rounded-lg text-teal-400 hover:bg-slate-800 cursor-pointer" aria-label="Add symptom">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </Field>
        </div>
      </Section>

      <Section icon={<Stethoscope className="h-4 w-4" />} title="Assessment">
        <div className="flex flex-col gap-4">
          <Field id="cf-diagnosis" label="Diagnosis" required error={errors.diagnosis}>
            <input
              id="cf-diagnosis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              maxLength={500}
              placeholder="e.g. Acute upper respiratory tract infection (viral)"
              className={inputClass(errors.diagnosis)}
            />
          </Field>
          <Field id="cf-notes" label="Clinical Notes & Treatment Plan" error={errors.clinicalNotes}>
            <textarea
              id="cf-notes"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder="Examination findings, advice, follow-up plan…"
              className={cn(inputClass(errors.clinicalNotes), "resize-y")}
            />
          </Field>
        </div>
      </Section>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => save("DRAFT")}
          disabled={saving !== null}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-sm font-medium border border-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          {saving === "DRAFT" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Draft
        </button>
        <button
          type="button"
          onClick={() => save("COMPLETED")}
          disabled={saving !== null}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-teal-500/20 hover:opacity-95 transition cursor-pointer disabled:opacity-50"
        >
          {saving === "COMPLETED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          Complete & Lock
        </button>
      </div>
    </div>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border text-sm text-white placeholder-slate-600 focus:outline-none transition",
    error ? "border-rose-500/60 focus:border-rose-400" : "border-slate-800 focus:border-teal-500"
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-slate-300">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <span className="text-[11px] text-rose-400">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-slate-500">{hint}</span>
      ) : null}
    </div>
  );
}
