"use client";

import { useState } from "react";
import { AlertCircle, AlertTriangle, CalendarCheck, Clock, Loader2, Search, Stethoscope, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiClientError, firstFieldErrors } from "@/lib/api/client";
import { useApiQuery } from "@/lib/api/use-api-query";
import { createAppointmentSchema } from "@/lib/validation/appointment";
import { listPatients } from "@/features/patients/patient-client";
import { calculateAge } from "@/features/patients/patient-utils";
import { createAppointment, listAppointments, listDoctors } from "@/features/appointments/appointment-client";
import {
  ACTIVE_STATUSES,
  buildDaySlots,
  formatTime,
  localDayKey,
  localDayRange,
  slotsOverlap,
} from "@/features/appointments/appointment-utils";
import type { AppointmentView, PatientSummary } from "@/features/appointments/types";

interface AppointmentBookingFormProps {
  /** Pre-selected patient (e.g. when booking from a patient profile). */
  initialPatient?: PatientSummary;
  /** Pre-selected doctor (defaults to the signed-in doctor). */
  initialDoctorId?: string;
  initialDay?: string;
  onSuccess: (appointment: AppointmentView) => void;
  onCancel?: () => void;
}

type FieldErrors = Partial<Record<"patientId" | "doctorId" | "dateTime" | "reason" | "notes", string>>;

export function AppointmentBookingForm({
  initialPatient,
  initialDoctorId = "",
  initialDay,
  onSuccess,
  onCancel,
}: AppointmentBookingFormProps) {
  // Captured once per form mount so render stays pure; slots that pass during booking are rejected server-side.
  const [now] = useState(() => Date.now());
  const today = localDayKey(new Date(now));
  const [patient, setPatient] = useState<PatientSummary | undefined>(initialPatient);
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [day, setDay] = useState(initialDay && initialDay >= today ? initialDay : today);
  const [slot, setSlot] = useState<string>("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const doctors = useApiQuery("doctors", listDoctors);
  const range = localDayRange(day);
  const booked = useApiQuery(doctorId ? `slots|${doctorId}|${day}` : null, () =>
    listAppointments({ doctorId, from: range.from, to: range.to })
  );

  const takenTimes = (booked.data ?? [])
    .filter((a) => ACTIVE_STATUSES.includes(a.status))
    .map((a) => new Date(a.dateTime));
  const slots = buildDaySlots(day).map((start) => ({
    start,
    iso: start.toISOString(),
    taken: takenTimes.some((t) => slotsOverlap(t, start)),
    past: start.getTime() < now,
  }));

  const clearError = (key: keyof FieldErrors) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const payload = { patientId: patient?._id ?? "", doctorId, dateTime: slot, reason, notes };
    const parsed = createAppointmentSchema.safeParse(payload);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      if (!patient) next.patientId = "Select a patient";
      if (!doctorId) next.doctorId = "Select a doctor";
      if (!slot) next.dateTime = "Select an available time slot";
      setErrors(next);
      setFormError("Please complete the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      onSuccess(await createAppointment(payload));
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrors(firstFieldErrors(error.details));
        setFormError(error.message);
        if (error.status === 409) booked.reload();
      } else {
        setFormError("Something went wrong while booking. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {formError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Patient */}
      <Field label="Patient" icon={<User className="h-4 w-4" />} error={errors.patientId}>
        {patient ? (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-teal-500/40">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{patient.fullName}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                {patient.patientId} · {patient.phone} · {calculateAge(patient.dateOfBirth)} yrs
              </div>
              {patient.allergies.length > 0 && (
                <div className="flex items-center gap-1 mt-1 text-[11px] text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  Allergies: {patient.allergies.join(", ")}
                </div>
              )}
            </div>
            {!initialPatient && (
              <button
                type="button"
                onClick={() => setPatient(undefined)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Change patient"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <PatientPicker
            onSelect={(p) => {
              setPatient(p);
              clearError("patientId");
            }}
          />
        )}
      </Field>

      {/* Doctor + date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Doctor" icon={<Stethoscope className="h-4 w-4" />} error={errors.doctorId} htmlFor="book-doctor">
          <select
            id="book-doctor"
            value={doctorId}
            onChange={(e) => {
              setDoctorId(e.target.value);
              setSlot("");
              clearError("doctorId");
            }}
            className={inputClass(errors.doctorId)}
          >
            <option value="">{doctors.isLoading ? "Loading doctors…" : "Select a doctor"}</option>
            {(doctors.data ?? []).map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
                {d.specialization ? ` — ${d.specialization}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" icon={<CalendarCheck className="h-4 w-4" />} htmlFor="book-day">
          <input
            id="book-day"
            type="date"
            value={day}
            min={today}
            onChange={(e) => {
              if (e.target.value) {
                setDay(e.target.value);
                setSlot("");
              }
            }}
            className={cn(inputClass(), "[color-scheme:dark]")}
          />
        </Field>
      </div>

      {/* Slots */}
      <Field label="Time Slot" icon={<Clock className="h-4 w-4" />} error={errors.dateTime}>
        {!doctorId ? (
          <p className="text-xs text-slate-500 p-3 rounded-xl border border-dashed border-slate-800">
            Select a doctor to see available slots.
          </p>
        ) : booked.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-3">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking availability…
          </div>
        ) : (
          <div role="radiogroup" aria-label="Available time slots" className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {slots.map((s) => {
              const disabled = s.taken || s.past;
              return (
                <button
                  key={s.iso}
                  type="button"
                  role="radio"
                  aria-checked={slot === s.iso}
                  disabled={disabled}
                  title={s.taken ? "Already booked" : s.past ? "In the past" : "Available"}
                  onClick={() => {
                    setSlot(s.iso);
                    clearError("dateTime");
                  }}
                  className={cn(
                    "py-2 rounded-lg text-xs font-medium border transition",
                    slot === s.iso
                      ? "bg-teal-500/20 border-teal-400 text-teal-100"
                      : disabled
                        ? "bg-slate-900/40 border-slate-800/60 text-slate-600 line-through cursor-not-allowed"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-teal-500/50 hover:text-white cursor-pointer"
                  )}
                >
                  {formatTime(s.start)}
                </button>
              );
            })}
          </div>
        )}
      </Field>

      <Field label="Reason for Visit" error={errors.reason} htmlFor="book-reason">
        <textarea
          id="book-reason"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            clearError("reason");
          }}
          rows={2}
          maxLength={500}
          placeholder="e.g. Routine hypertension follow-up"
          className={cn(inputClass(errors.reason), "resize-none")}
        />
      </Field>

      <Field label="Administrative Notes (optional)" error={errors.notes} htmlFor="book-notes">
        <input
          id="book-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          placeholder="e.g. Patient requested afternoon slot"
          className={inputClass(errors.notes)}
        />
      </Field>

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
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarCheck className="h-4 w-4" />}
          Book Appointment
        </button>
      </div>
    </form>
  );
}

/** Debounced patient search with a selectable results list. */
function PatientPicker({ onSelect }: { onSelect: (patient: PatientSummary) => void }) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const results = useApiQuery(debounced.length >= 2 ? `patient-search|${debounced}` : null, () =>
    listPatients({ query: debounced, limit: 8 })
  );

  const onChange = (value: string) => {
    setQuery(value);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => setDebounced(value.trim()), 250));
  };

  const patients = results.data?.patients ?? [];

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search patient by name, phone, or MED ID…"
          aria-label="Search patient"
          maxLength={100}
          className={cn(inputClass(), "pl-10")}
        />
        {results.isLoading && (
          <Loader2 className="h-4 w-4 text-teal-400 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
        )}
      </div>
      {debounced.length >= 2 && !results.isLoading && (
        <ul className="max-h-52 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/80 divide-y divide-slate-800/70">
          {results.error && <li className="px-3 py-2.5 text-xs text-rose-300">{results.error.message}</li>}
          {!results.error && patients.length === 0 && (
            <li className="px-3 py-2.5 text-xs text-slate-500">No patients match “{debounced}”.</li>
          )}
          {patients.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                onClick={() =>
                  onSelect({
                    _id: p._id ?? "",
                    patientId: p.patientId,
                    fullName: p.fullName,
                    phone: p.phone,
                    gender: p.gender,
                    dateOfBirth: p.dateOfBirth,
                    allergies: p.allergies,
                  })
                }
                className="w-full text-left px-3 py-2.5 hover:bg-slate-800/60 transition cursor-pointer"
              >
                <div className="text-sm text-white">{p.fullName}</div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {p.patientId} · {p.phone}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border text-sm text-white placeholder-slate-600 focus:outline-none transition",
    error ? "border-rose-500/60 focus:border-rose-400" : "border-slate-800 focus:border-teal-500"
  );
}

function Field({
  label,
  icon,
  error,
  htmlFor,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const LabelTag = htmlFor ? "label" : "span";
  return (
    <div className="flex flex-col gap-1.5">
      <LabelTag
        {...(htmlFor ? { htmlFor } : {})}
        className="flex items-center gap-1.5 text-xs font-medium text-slate-300"
      >
        {icon && <span className="text-teal-400">{icon}</span>}
        {label}
      </LabelTag>
      {children}
      {error && <span className="text-[11px] text-rose-400">{error}</span>}
    </div>
  );
}
