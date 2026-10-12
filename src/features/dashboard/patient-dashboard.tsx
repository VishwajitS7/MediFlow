import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  HeartPulse,
  Pill,
  Printer,
  Shield,
} from "lucide-react";
import type { PatientDashboardData } from "./types";

export function PatientDashboard({ data }: { data: PatientDashboardData }) {
  const nextAppointment = data.upcomingAppointments[0];

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 w-full">
        {/* Patient Portal Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-slate-900/40 border border-emerald-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <HeartPulse className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Welcome, {data.patientName}
                </h1>
                {data.patientClinicId && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {data.patientClinicId}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Personal Patient Health Portal • Medical Records, Appointments & Digital Prescriptions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/appointments"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition"
            >
              <Calendar className="h-4 w-4" />
              My Appointments
            </Link>
          </div>
        </div>

        {/* Allergy Alert Notice (if any) */}
        {data.allergies && data.allergies.length > 0 && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            <div>
              <span className="font-bold">Medical Allergy Warning:</span> You have recorded sensitivities to:{" "}
              <span className="font-semibold text-rose-200">{data.allergies.join(", ")}</span>. Clinic doctors are automatically notified when composing medications.
            </div>
          </div>
        )}

        {/* Patient KPI Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Upcoming Visits</span>
              <Calendar className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{data.upcomingAppointments.length}</div>
            <span className="text-[11px] text-slate-500">Scheduled outpatient sessions</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Digital Prescriptions</span>
              <Pill className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-teal-300">{data.recentPrescriptions.length}</div>
            <span className="text-[11px] text-slate-500">Available to print/download</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Past Completed Visits</span>
              <Clock className="h-4 w-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-300">{data.pastAppointments.length}</div>
            <span className="text-[11px] text-slate-500">Recorded clinical visits</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Blood Group</span>
              <HeartPulse className="h-4 w-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-300">{data.bloodGroup || "—"}</div>
            <span className="text-[11px] text-slate-500">Medical chart demographic</span>
          </div>
        </div>

        {/* Next Visit Spotlight (if upcoming) */}
        {nextAppointment && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-lg shrink-0">
                #{nextAppointment.queueNumber ? String(nextAppointment.queueNumber).padStart(2, "0") : "01"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Next Upcoming Visit</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {new Date(nextAppointment.dateTime).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} at{" "}
                    {new Date(nextAppointment.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">Dr. {nextAppointment.doctorName}</h3>
                <p className="text-xs text-slate-400">Reason: {nextAppointment.reason}</p>
              </div>
            </div>

            <Link
              href={`/appointments/${nextAppointment._id}`}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0"
            >
              View Visit Details
            </Link>
          </div>
        )}

        {/* Main 2-Column Patient Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: My Appointments (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <h2 className="text-base font-bold text-white">My Clinic Appointments</h2>
              </div>
              <Link href="/appointments" className="text-xs text-emerald-400 hover:underline flex items-center gap-1">
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {data.upcomingAppointments.length === 0 && data.pastAppointments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-400">You have no recorded appointments in the clinic system.</p>
                <p className="text-xs text-slate-500">
                  Contact the clinic reception or check back after your next consultation booking.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
                {[...data.upcomingAppointments, ...data.pastAppointments].slice(0, 5).map((apt) => (
                  <div key={apt._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono text-xs font-bold text-emerald-400">
                        {apt.queueNumber ? `#${apt.queueNumber}` : "—"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">Dr. {apt.doctorName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            apt.status === "CONFIRMED"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : apt.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : apt.status === "IN_PROGRESS"
                              ? "bg-teal-500/10 text-teal-300 border border-teal-500/30 animate-pulse"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(apt.dateTime).toLocaleDateString([], { month: "short", day: "numeric" })} • {new Date(apt.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • {apt.reason}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/appointments/${apt._id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition shrink-0"
                    >
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Digital Prescriptions & Clinic Contact */}
          <div className="flex flex-col gap-6">
            {/* Prescriptions List */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Pill className="h-4 w-4 text-teal-400" />
                Digital Prescriptions
              </h2>

              {data.recentPrescriptions.length === 0 ? (
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  No active prescriptions issued yet.
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800 divide-y divide-slate-800/60">
                  {data.recentPrescriptions.map((rx) => (
                    <div key={rx._id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">Dr. {rx.doctorName}</div>
                        <div className="text-[11px] text-slate-400">{rx.medicationsCount} meds • {new Date(rx.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</div>
                      </div>
                      <Link
                        href={`/prescriptions/${rx._id}`}
                        className="px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-medium flex items-center gap-1 transition shrink-0"
                      >
                        <Printer className="h-3 w-3" />
                        Print
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency & Clinic Contact Card */}
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col gap-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                Emergency & Support
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Need urgent care or have questions regarding your appointments?
              </p>
              <div className="text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="font-semibold text-white">Clinic Front Desk: +1 (555) 0100</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Hours: Monday–Saturday, 09:00–17:00</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
