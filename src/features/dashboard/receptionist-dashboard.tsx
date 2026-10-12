import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clock,
  Search,
  Stethoscope,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { ReceptionistDashboardData } from "./types";

export function ReceptionistDashboard({ data }: { data: ReceptionistDashboardData }) {
  return (
    <div className="flex-1 bg-slate-950 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 w-full">
        {/* Receptionist Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/40 border border-amber-500/20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Front Desk • {data.receptionistName}
                </h1>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Receptionist Console
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Outpatient Intake, Appointment Booking, Queue Token Allocation & Patient Demographics
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/patients"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition"
            >
              <UserPlus className="h-4 w-4" />
              Register Patient
            </Link>
            <Link
              href="/appointments"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <Calendar className="h-4 w-4" />
              Book Appointment
            </Link>
          </div>
        </div>

        {/* Front-Desk Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Patient Charts</span>
              <Users className="h-4 w-4 text-teal-400" />
            </div>
            <div className="text-2xl font-bold text-white">{data.totalPatientsCount}</div>
            <span className="text-[11px] text-slate-500">Registered outpatient records</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Today&apos;s Appointments</span>
              <Calendar className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{data.todayAppointmentsCount}</div>
            <span className="text-[11px] text-slate-500">Outpatient bookings today</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Checked-in & Waiting</span>
              <Clock className="h-4 w-4 text-orange-400" />
            </div>
            <div className="text-2xl font-bold text-orange-300">{data.waitingQueueCount}</div>
            <span className="text-[11px] text-slate-500">In waiting room lobby</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Doctors</span>
              <Stethoscope className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-indigo-300">{data.activeDoctorsCount}</div>
            <span className="text-[11px] text-slate-500">Available on duty</span>
          </div>
        </div>

        {/* 2-Column Front-Desk Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Today's Clinic Schedule & Queue (2 Cols) */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-amber-400" />
                <h2 className="text-base font-bold text-white">Today&apos;s Outpatient Appointments</h2>
              </div>
              <Link href="/appointments" className="text-xs text-amber-400 hover:text-amber-300 transition flex items-center gap-1">
                Open Schedule Grid <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {data.todayAppointments.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center flex flex-col items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                  <Calendar className="h-5 w-5" />
                </div>
                <p className="text-sm text-slate-400">No appointments scheduled for today yet.</p>
                <Link
                  href="/appointments"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition"
                >
                  Schedule an Appointment
                </Link>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/40 border border-slate-800 overflow-hidden divide-y divide-slate-800/60">
                {data.todayAppointments.map((apt) => (
                  <div key={apt._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition">
                    <div className="flex items-center gap-3.5">
                      <div className="h-9 w-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono text-xs font-bold text-amber-400">
                        {apt.queueNumber ? `#${apt.queueNumber}` : "—"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{apt.patientName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            apt.status === "CONFIRMED"
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              : apt.status === "IN_PROGRESS"
                              ? "bg-teal-500/10 text-teal-300 border border-teal-500/30 animate-pulse"
                              : apt.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                              : "bg-slate-800 text-slate-400"
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Dr. {apt.doctorName} • {new Date(apt.dateTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/appointments/${apt._id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition shrink-0"
                    >
                      View Details
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Recent Patients & Front-Desk Tools */}
          <div className="flex flex-col gap-6">
            {/* Front-Desk Shortcuts */}
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Search className="h-4 w-4 text-amber-400" />
                Receptionist Actions
              </h2>
              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  href="/patients"
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <UserPlus className="h-4 w-4 text-teal-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">Register New Patient</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition" />
                </Link>

                <Link
                  href="/appointments"
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">Book Patient Appointment</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition" />
                </Link>

                <Link
                  href="/patients"
                  className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-200 group-hover:text-white">Search Patient Records</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-amber-400 transition" />
                </Link>
              </div>
            </div>

            {/* Recently Registered Patients */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-teal-400" />
                  Recent Patients
                </h2>
                <Link href="/patients" className="text-xs text-teal-400 hover:underline">
                  All ({data.totalPatientsCount})
                </Link>
              </div>

              {data.recentPatients.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
                  No patients registered yet.
                </div>
              ) : (
                <div className="rounded-xl bg-slate-900/40 border border-slate-800 divide-y divide-slate-800/60">
                  {data.recentPatients.map((p) => (
                    <div key={p._id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-white">{p.fullName}</div>
                        <div className="text-[11px] font-mono text-teal-400">{p.patientId} • {p.phone}</div>
                      </div>
                      <Link
                        href={`/patients/${p._id}`}
                        className="text-[11px] text-amber-400 hover:underline shrink-0"
                      >
                        Profile
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
