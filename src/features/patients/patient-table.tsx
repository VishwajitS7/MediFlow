"use client";

import Link from "next/link";
import { Eye, Pencil, Users } from "lucide-react";
import type { IPatient } from "@/types";
import { AllergyPills, BloodGroupBadge, GenderBadge } from "@/features/patients/patient-badges";
import { calculateAge, getInitials } from "@/features/patients/patient-utils";

interface PatientTableProps {
  patients: IPatient[];
  isLoading?: boolean;
  canEdit?: boolean;
  onEdit?: (patient: IPatient) => void;
  emptyMessage?: string;
}

const COLUMNS = ["Patient ID", "Full Name", "Gender", "Phone", "Blood Group", "Allergies", ""];

export function PatientTable({
  patients,
  isLoading = false,
  canEdit = false,
  onEdit,
  emptyMessage = "No patients found.",
}: PatientTableProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-left">
              {COLUMNS.map((col) => (
                <th
                  key={col || "actions"}
                  scope="col"
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap"
                >
                  {col || <span className="sr-only">Actions</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {isLoading && patients.length === 0
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {COLUMNS.map((col) => (
                      <td key={col || "actions"} className="px-4 py-4">
                        <div className="h-4 rounded bg-slate-800/80 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-800/30 transition group">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-teal-400">{patient.patientId}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/patients/${patient._id}`} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-teal-500/30 to-indigo-500/30 border border-slate-700 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                          {getInitials(patient.fullName)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-white group-hover:text-teal-300 transition">
                            {patient.fullName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {calculateAge(patient.dateOfBirth)} yrs
                          </span>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <GenderBadge gender={patient.gender} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-300 font-mono text-xs">{patient.phone}</td>
                    <td className="px-4 py-3">
                      <BloodGroupBadge bloodGroup={patient.bloodGroup} />
                    </td>
                    <td className="px-4 py-3 min-w-44">
                      <AllergyPills allergies={patient.allergies} max={2} emptyLabel="None" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/patients/${patient._id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          title="View profile"
                          aria-label={`View ${patient.fullName}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        {canEdit && onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(patient)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-300 hover:bg-slate-800 transition cursor-pointer"
                            title="Edit patient"
                            aria-label={`Edit ${patient.fullName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && patients.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
          <div className="h-12 w-12 rounded-2xl bg-slate-800/80 flex items-center justify-center">
            <Users className="h-6 w-6 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
