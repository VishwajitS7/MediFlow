import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Pill,
  Play,
  Stethoscope,
  Users,
} from "lucide-react";
import type { DoctorDashboardData } from "./types";

export function DoctorDashboard({ data }: { data: DoctorDashboardData }) {
  const nextPatient = data.queueAppointments.find(
    (a) => a.status === "CONFIRMED" || a.status === "SCHEDULED" || a.status === "IN_PROGRESS"
  );

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 w-full">
        {/* Doctor Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-teal-950/40 via-slate-900/60 to-slate-900/40 border border-teal-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20 shrink-0">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Dr. {data.doctorName}
                </h1>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {data.specialization || "General Medicine"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Clinical Consultation & E-Prescription Dashboard • Today&apos;s Active Outpatient Schedule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/consultations"
              className="px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition"
            >
              <Activity className="h-4 w-4" />
              Open Clinical Console
            </Link>
          </div>
        </div>

        {/* Clinical Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Today&apos;s Appointments</span>
              <Calendar className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">{data.todayAppointmentsCount}</div>
            <span className="text-[11px] text-slate-500">Scheduled for today</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Waiting in Lobby</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{data.waitingCount}</div>
            <span className="text-[11px] text-slate-500">Checked-in & ready</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Visits Completed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-300">{data.completedTodayCount}</div>
            <span className="text-[11px] text-slate-500">Consultations locked today</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Prescriptions Authored</span>
              <Pill className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-cyan-300">{data.totalPrescriptionsCount}</div>
            <span className="text-[11px] text-slate-500">Digital Rx orders on file</span>
          </div>
        </div>

        {/* Up Next Patient Callout (if active) */}
        {nextPatient && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-900 to-slate-900 border border-teal-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-mono font-bold text-lg shrink-0">
                #{nextPatient.queueNumber ? String(nextPatient.queueNumber).padStart(2, "0") : "01"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">Up Next</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">{new Date(nextPatient.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{nextPatient.patientName}</h3>
                <p className="text-xs text-slate-400">Reason: {nextPatient.reason}</p>
              </div>
            </div>

            <Link
              href={`/appointments/${nextPatient._id}`}
              className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition shrink-0"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {nextPatient.status === "IN_PROGRESS" ? "Resume Visit Workspace" : "Start Consultation"}
            </Link>
          </div>
        )}

        {/* Main 2-Column Clinical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Today's Queue (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-400" />
                <h2 className="text-base font-bold text-white">Today&apos;s Consultation Queue</h2>
              </div>
              <Link href="/appointments" className="text-xs text-teal-400 hover:text-teal-300 transition flex items-center gap-1">
                Full Day View <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {data.queueAppointments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-400">No scheduled appointments assigned to your queue today.</p>
                <Link
                  href="/consultations"
                  className="text-xs text-teal-400 hover:underline"
                >
                  Review past consultations in Doctor Console
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
                {data.queueAppointments.map((apt) => (
                  <div key={apt._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono text-xs font-bold text-slate-200">
                        {apt.queueNumber ? `#${apt.queueNumber}` : "—"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{apt.patientName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            apt.status === "IN_PROGRESS"
                              ? "bg-teal-500/10 text-teal-300 border border-teal-500/30 animate-pulse"
                              : apt.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : apt.status === "CONFIRMED"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                          {apt.reason || "General Consultation"} • {new Date(apt.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/appointments/${apt._id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition shrink-0 flex items-center gap-1.5"
                    >
                      {apt.status === "COMPLETED" ? "View Summary" : "Open Visit"}
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Clinical Tools & Recent Prescriptions */}
          <div className="flex flex-col gap-6">
            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-teal-400" />
                Doctor Quick Actions
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  href="/consultations"
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Stethoscope className="h-4 w-4 text-teal-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">Doctor Visit Console</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-teal-400 transition" />
                </Link>

                <Link
                  href="/patients"
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">Patient Clinical History Directory</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
                </Link>

                <Link
                  href="/appointments"
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-teal-500/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">View Full Clinic Schedule</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-emerald-400 transition" />
                </Link>
              </div>
            </div>

            {/* Recent Prescriptions Authored */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Pill className="h-4 w-4 text-cyan-400" />
                Recent Prescriptions Issued
              </h2>
              {data.recentPrescriptions.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  No prescriptions recorded yet.
                </div>
              ) : (
                <div className="rounded-xl bg-slate-900/40 border border-slate-800 divide-y divide-slate-800/60">
                  {data.recentPrescriptions.map((rx) => (
                    <div key={rx._id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{rx.patientName}</span>
                        <div className="text-[11px] text-slate-400">{rx.medicationsCount} meds • {rx.medicationsSummary}</div>
                      </div>
                      <Link
                        href={`/prescriptions/${rx._id}`}
                        className="text-[11px] text-cyan-400 hover:underline shrink-0"
                      >
                        Print Rx
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
