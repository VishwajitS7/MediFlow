"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Home,
  Phone,
  Plus,
  Save,
  User,
  X,
} from "lucide-react";
import type { IPatient } from "@/types";
import { cn } from "@/lib/utils";
import { BLOOD_GROUPS, GENDERS, createPatientSchema } from "@/lib/validation/patient";
import { createPatient, PatientApiError, updatePatient } from "@/features/patients/patient-client";
import { formatGender, toDateInputValue } from "@/features/patients/patient-utils";

interface PatientFormProps {
  /** When provided, the form edits this patient; otherwise it registers a new one. */
  patient?: IPatient;
  onSuccess: (patient: IPatient) => void;
  onCancel?: () => void;
}

interface FormState {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  allergies: string[];
  emergencyName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

type FieldErrors = Partial<Record<string, string>>;

function toFormState(patient?: IPatient): FormState {
  return {
    fullName: patient?.fullName ?? "",
    dateOfBirth: toDateInputValue(patient?.dateOfBirth),
    gender: patient?.gender ?? "",
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    bloodGroup: patient?.bloodGroup ?? "",
    allergies: patient?.allergies ?? [],
    emergencyName: patient?.emergencyContact.name ?? "",
    emergencyRelationship: patient?.emergencyContact.relationship ?? "",
    emergencyPhone: patient?.emergencyContact.phone ?? "",
    street: patient?.address?.street ?? "",
    city: patient?.address?.city ?? "",
    state: patient?.address?.state ?? "",
    zipCode: patient?.address?.zipCode ?? "",
  };
}

function toPayload(form: FormState) {
  const hasAddress = [form.street, form.city, form.state, form.zipCode].some((v) => v.trim());
  return {
    fullName: form.fullName,
    dateOfBirth: form.dateOfBirth,
    gender: form.gender,
    phone: form.phone,
    email: form.email,
    bloodGroup: form.bloodGroup,
    allergies: form.allergies,
    emergencyContact: {
      name: form.emergencyName,
      relationship: form.emergencyRelationship,
      phone: form.emergencyPhone,
    },
    address: hasAddress
      ? { street: form.street, city: form.city, state: form.state, zipCode: form.zipCode }
      : undefined,
  };
}

/** Maps Zod issue paths (e.g. ["emergencyContact", "phone"]) to form field keys. */
const PATH_TO_FIELD: Record<string, keyof FormState> = {
  "emergencyContact.name": "emergencyName",
  "emergencyContact.relationship": "emergencyRelationship",
  "emergencyContact.phone": "emergencyPhone",
  "address.street": "street",
  "address.city": "city",
  "address.state": "state",
  "address.zipCode": "zipCode",
};

const RELATIONSHIPS = ["Spouse", "Parent", "Child", "Sibling", "Guardian", "Friend", "Other"];

export function PatientForm({ patient, onSuccess, onCancel }: PatientFormProps) {
  const isEdit = Boolean(patient);
  const [form, setForm] = useState<FormState>(() => toFormState(patient));
  const [allergyDraft, setAllergyDraft] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const addAllergy = () => {
    const value = allergyDraft.trim().replace(/,$/, "");
    if (!value) return;
    if (!form.allergies.some((a) => a.toLowerCase() === value.toLowerCase())) {
      update("allergies", [...form.allergies, value]);
    }
    setAllergyDraft("");
  };

  const removeAllergy = (allergy: string) => {
    update(
      "allergies",
      form.allergies.filter((a) => a !== allergy)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = toPayload(form);
    const parsed = createPatientSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        const field = PATH_TO_FIELD[path] ?? path;
        if (!next[field]) next[field] = issue.message;
      }
      setErrors(next);
      setFormError("Please correct the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const saved = patient?._id
        ? await updatePatient(patient._id, {
            ...parsed.data,
            // Explicit empty strings tell the API to clear previously stored optional values.
            email: parsed.data.email ?? "",
            bloodGroup: parsed.data.bloodGroup ?? "",
          })
        : await createPatient(parsed.data);
      onSuccess(saved);
    } catch (error) {
      if (error instanceof PatientApiError) {
        if (error.details && typeof error.details === "object") {
          const next: FieldErrors = {};
          for (const [key, messages] of Object.entries(error.details as Record<string, string[] | undefined>)) {
            if (messages?.[0]) next[key] = messages[0];
          }
          setErrors(next);
        }
        setFormError(error.message);
      } else {
        setFormError("Something went wrong while saving. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      {formError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Personal details */}
      <Section icon={<User className="h-4 w-4" />} title="Personal Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="pf-fullName" label="Full Name" required error={errors.fullName} className="sm:col-span-2">
            <input
              id="pf-fullName"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              placeholder="e.g. Jane Doe"
              autoComplete="off"
              className={inputClass(errors.fullName)}
            />
          </Field>
          <Field id="pf-dateOfBirth" label="Date of Birth" required error={errors.dateOfBirth}>
            <input
              type="date"
              id="pf-dateOfBirth"
              value={form.dateOfBirth}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => update("dateOfBirth", e.target.value)}
              className={cn(inputClass(errors.dateOfBirth), "[color-scheme:dark]")}
            />
          </Field>
          <Field label="Gender" required error={errors.gender}>
            <div role="radiogroup" aria-label="Gender" className="grid grid-cols-3 gap-1.5">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={form.gender === g}
                  onClick={() => update("gender", g)}
                  className={cn(
                    "py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer",
                    form.gender === g
                      ? "bg-teal-500/15 border-teal-500/60 text-teal-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                  )}
                >
                  {formatGender(g)}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </Section>

      {/* Contact */}
      <Section icon={<Phone className="h-4 w-4" />} title="Contact Information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field id="pf-phone" label="Phone" required error={errors.phone}>
            <input
              type="tel"
              id="pf-phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+1-555-0144"
              className={inputClass(errors.phone)}
            />
          </Field>
          <Field id="pf-email" label="Email" error={errors.email}>
            <input
              type="email"
              id="pf-email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="patient@example.com"
              className={inputClass(errors.email)}
            />
          </Field>
        </div>
      </Section>

      {/* Medical */}
      <Section icon={<HeartPulse className="h-4 w-4" />} title="Medical Profile">
        <div className="flex flex-col gap-4">
          <Field label="Blood Group" error={errors.bloodGroup}>
            <div role="radiogroup" aria-label="Blood group" className="grid grid-cols-4 sm:grid-cols-9 gap-1.5">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  role="radio"
                  aria-checked={form.bloodGroup === bg}
                  onClick={() => update("bloodGroup", form.bloodGroup === bg ? "" : bg)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-bold font-mono border transition cursor-pointer",
                    form.bloodGroup === bg
                      ? "bg-rose-500/15 border-rose-500/60 text-rose-200"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                  )}
                >
                  {bg}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={form.bloodGroup === ""}
                onClick={() => update("bloodGroup", "")}
                className={cn(
                  "py-2 rounded-xl text-[11px] font-medium border transition cursor-pointer col-span-4 sm:col-span-1",
                  form.bloodGroup === ""
                    ? "bg-slate-800 border-slate-600 text-slate-200"
                    : "bg-slate-950/60 border-slate-800 text-slate-500 hover:text-white"
                )}
              >
                Unknown
              </button>
            </div>
          </Field>

          <Field label="Allergies" error={errors.allergies} hint="Press Enter or comma to add each allergy.">
            <div
              className={cn(
                "flex flex-wrap items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-950/60 border transition focus-within:border-teal-500",
                errors.allergies ? "border-rose-500/60" : "border-slate-800"
              )}
            >
              {form.allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/25"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeAllergy(allergy)}
                    className="p-0.5 rounded-full hover:bg-amber-500/20 cursor-pointer"
                    aria-label={`Remove ${allergy}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={allergyDraft}
                onChange={(e) => setAllergyDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addAllergy();
                  } else if (e.key === "Backspace" && !allergyDraft && form.allergies.length > 0) {
                    removeAllergy(form.allergies[form.allergies.length - 1]);
                  }
                }}
                onBlur={addAllergy}
                placeholder={form.allergies.length ? "Add another…" : "e.g. Penicillin, Peanuts"}
                aria-label="Add allergy"
                maxLength={100}
                className="flex-1 min-w-32 bg-transparent py-1 text-sm text-white placeholder-slate-600 focus:outline-none"
              />
              {allergyDraft.trim() && (
                <button
                  type="button"
                  onClick={addAllergy}
                  className="p-1 rounded-lg text-teal-400 hover:bg-slate-800 cursor-pointer"
                  aria-label="Add allergy"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </Field>
        </div>
      </Section>

      {/* Emergency contact */}
      <Section icon={<AlertCircle className="h-4 w-4" />} title="Emergency Contact">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field id="pf-emergencyName" label="Name" required error={errors.emergencyName}>
            <input
              id="pf-emergencyName"
              value={form.emergencyName}
              onChange={(e) => update("emergencyName", e.target.value)}
              placeholder="John Doe"
              className={inputClass(errors.emergencyName)}
            />
          </Field>
          <Field id="pf-emergencyRelationship" label="Relationship" required error={errors.emergencyRelationship}>
            <input
              list="patient-relationships"
              id="pf-emergencyRelationship"
              value={form.emergencyRelationship}
              onChange={(e) => update("emergencyRelationship", e.target.value)}
              placeholder="Spouse"
              className={inputClass(errors.emergencyRelationship)}
            />
            <datalist id="patient-relationships">
              {RELATIONSHIPS.map((r) => (
                <option key={r} value={r} />
              ))}
            </datalist>
          </Field>
          <Field id="pf-emergencyPhone" label="Phone" required error={errors.emergencyPhone}>
            <input
              type="tel"
              id="pf-emergencyPhone"
              value={form.emergencyPhone}
              onChange={(e) => update("emergencyPhone", e.target.value)}
              placeholder="+1-555-0145"
              className={inputClass(errors.emergencyPhone)}
            />
          </Field>
        </div>
      </Section>

      {/* Address */}
      <Section icon={<Home className="h-4 w-4" />} title="Address" optional>
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
          <Field id="pf-street" label="Street" error={errors.street} className="sm:col-span-6">
            <input
              id="pf-street"
              value={form.street}
              onChange={(e) => update("street", e.target.value)}
              placeholder="123 Main St"
              className={inputClass(errors.street)}
            />
          </Field>
          <Field id="pf-city" label="City" error={errors.city} className="sm:col-span-3">
            <input id="pf-city"
              value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass(errors.city)} />
          </Field>
          <Field id="pf-state" label="State" error={errors.state} className="sm:col-span-2">
            <input id="pf-state"
              value={form.state} onChange={(e) => update("state", e.target.value)} className={inputClass(errors.state)} />
          </Field>
          <Field id="pf-zipCode" label="ZIP" error={errors.zipCode} className="sm:col-span-1">
            <input
              id="pf-zipCode"
              value={form.zipCode}
              onChange={(e) => update("zipCode", e.target.value)}
              className={inputClass(errors.zipCode)}
            />
          </Field>
        </div>
      </Section>

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
          type="submit"
          disabled={submitting}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition cursor-pointer"
        >
          {submitting ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isEdit ? (
            <Save className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          <span>{isEdit ? "Save Changes" : "Register Patient"}</span>
        </button>
      </div>
    </form>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border text-sm text-white placeholder-slate-600 focus:outline-none transition",
    error ? "border-rose-500/60 focus:border-rose-400" : "border-slate-800 focus:border-teal-500"
  );
}

function Section({
  icon,
  title,
  optional,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">
        {icon}
        {title}
        {optional && <span className="normal-case tracking-normal font-normal text-slate-500">(optional)</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  /** id of the input this label targets; omit for button groups that carry their own aria-label. */
  id?: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const LabelTag = id ? "label" : "span";
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <LabelTag {...(id ? { htmlFor: id } : {})} className="text-xs font-medium text-slate-300">
        {label}
        {required && <span className="text-rose-400 ml-0.5">*</span>}
      </LabelTag>
      {children}
      {error ? (
        <span className="text-[11px] text-rose-400">{error}</span>
      ) : hint ? (
        <span className="text-[11px] text-slate-500">{hint}</span>
      ) : null}
    </div>
  );
}
