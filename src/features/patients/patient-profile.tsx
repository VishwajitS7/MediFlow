"use client";

import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Droplet,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import type { IPatient } from "@/types";
import { AllergyPills, GenderBadge } from "@/features/patients/patient-badges";
import { calculateAge, formatDate, formatGender, getInitials } from "@/features/patients/patient-utils";

interface PatientProfileProps {
  patient: IPatient;
  canEdit?: boolean;
  onEdit?: () => void;
}

/** Patient summary: identity header, demographic cards, allergies, emergency contact, and address. */
export function PatientProfile({ patient, canEdit = false, onEdit }: PatientProfileProps) {
  const age = calculateAge(patient.dateOfBirth);
  const addressLines = [
    patient.address?.street,
    [patient.address?.city, patient.address?.state, patient.address?.zipCode].filter(Boolean).join(", "),
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      {/* Identity header */}
      <div className="relative overflow-clip rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950/40 p-6">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-teal-500/20 shrink-0">
            {getInitials(patient.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white truncate">{patient.fullName}</h1>
              <GenderBadge gender={patient.gender} />
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-400">
              <span className="font-mono font-semibold text-teal-400">{patient.patientId}</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {age} years · Born {formatDate(patient.dateOfBirth)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Registered {formatDate(patient.createdAt, { dateOnly: false })}
              </span>
            </div>
          </div>
          {canEdit && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
              Edit Details
            </button>
          )}
        </div>
      </div>

      {/* Allergy alert banner */}
      {patient.allergies.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/25">
          <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-amber-200">
              Known allergies ({patient.allergies.length}) — verify before prescribing
            </span>
            <AllergyPills allergies={patient.allergies} />
          </div>
        </div>
      )}

      {/* Demographic cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<UserRound className="h-4 w-4 text-sky-400" />} label="Gender" value={formatGender(patient.gender)} />
        <StatCard icon={<CalendarDays className="h-4 w-4 text-indigo-400" />} label="Age" value={`${age} yrs`} />
        <StatCard
          icon={<Droplet className="h-4 w-4 text-rose-400" />}
          label="Blood Group"
          value={patient.bloodGroup ?? "Unknown"}
          mono
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
          label="Allergies"
          value={patient.allergies.length ? String(patient.allergies.length) : "None"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoCard title="Contact">
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={patient.phone} mono />
          <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={patient.email ?? "Not provided"} />
        </InfoCard>

        <InfoCard title="Emergency Contact">
          <InfoRow icon={<UserRound className="h-4 w-4" />} label="Name" value={patient.emergencyContact.name} />
          <InfoRow
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Relationship"
            value={patient.emergencyContact.relationship}
          />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={patient.emergencyContact.phone} mono />
        </InfoCard>

        <InfoCard title="Address">
          {addressLines.length > 0 ? (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-200 leading-relaxed">
                {addressLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No address on file.</p>
          )}
        </InfoCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>
      <span className={mono ? "text-xl font-bold text-white font-mono" : "text-xl font-bold text-white"}>{value}</span>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-400">{title}</h2>
      {children}
    </section>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-slate-500 mt-0.5 shrink-0">{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] text-slate-500">{label}</span>
        <span className={mono ? "text-sm text-slate-200 font-mono break-all" : "text-sm text-slate-200 break-words"}>
          {value}
        </span>
      </div>
    </div>
  );
}
