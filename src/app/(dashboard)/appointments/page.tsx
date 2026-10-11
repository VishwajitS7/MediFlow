"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import type { AppointmentStatus, UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { AccessState, accessStateFromStatus } from "@/components/ui/access-state";
import { useApiQuery } from "@/lib/api/use-api-query";
import { ApiClientError } from "@/lib/api/client";
import { listAppointments, listDoctors, updateAppointmentStatus } from "@/features/appointments/appointment-client";
import { AppointmentList, type StatusAction } from "@/features/appointments/appointment-list";
import { AppointmentBookingForm } from "@/features/appointments/appointment-booking-form";
import {
  ACTIVE_STATUSES,
  APPOINTMENT_STATUSES,
  formatLongDate,
  formatTime,
  localDayKey,
  localDayRange,
  STATUS_LABELS,
} from "@/features/appointments/appointment-utils";
import { addDays } from "@/features/appointments/clinic-time";
import type { AppointmentView } from "@/features/appointments/types";

const STAFF_ROLES: UserRole[] = ["ADMIN", "DOCTOR", "RECEPTIONIST"];
const REFRESH_MS = 30_000;

export default function AppointmentsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <PageSkeleton />;
  if (status === "unauthenticated" || !session?.user) return <AccessState kind="unauthenticated" />;
  if (session.user.role === "PATIENT") return <PatientAppointments />;
  if (!STAFF_ROLES.includes(session.user.role)) return <AccessState kind="forbidden" />;
  return <StaffAppointments role={session.user.role} userId={session.user.id} />;
}

function StaffAppointments({ role, userId }: { role: UserRole; userId: string }) {
  const router = useRouter();
  const [day, setDay] = useState(() => localDayKey());
  const [doctorFilter, setDoctorFilter] = useState(role === "DOCTOR" ? userId : "");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "">("");
  const [booking, setBooking] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string; href?: string } | null>(null);

  const doctors = useApiQuery("doctors", listDoctors);
  const range = localDayRange(day);
  const appointments = useApiQuery(`appointments|${day}|${doctorFilter}|${statusFilter}`, () =>
    listAppointments({ from: range.from, to: range.to, doctorId: doctorFilter || undefined, status: statusFilter || undefined })
  );
  const { reload } = appointments;

  useEffect(() => {
    const id = setInterval(reload, REFRESH_MS);
    return () => clearInterval(id);
  }, [reload]);

  const list = appointments.data ?? (appointments.isLoading ? (appointments.previous ?? []) : []);
  const waiting = list.filter((a) => a.status === "SCHEDULED" || a.status === "CONFIRMED");
  const inConsultation = list.filter((a) => a.status === "IN_PROGRESS");
  const completed = list.filter((a) => a.status === "COMPLETED");
  const missed = list.filter((a) => a.status === "CANCELLED" || a.status === "NO_SHOW");
  const today = localDayKey();

  const handleAction = async (appointment: AppointmentView, next: StatusAction) => {
    if (
      (next === "CANCELLED" || next === "NO_SHOW") &&
      !window.confirm(`${next === "CANCELLED" ? "Cancel" : "Mark as no-show"}: ${appointment.patient?.fullName ?? "this appointment"}?`)
    ) {
      return;
    }
    setBusyId(appointment._id);
    setNotice(null);
    try {
      const updated = await updateAppointmentStatus(appointment._id, next);
      if (next === "IN_PROGRESS" && role === "DOCTOR") {
        router.push(`/appointments/${updated._id}`);
        return;
      }
      appointments.setData(list.map((a) => (a._id === updated._id ? updated : a)));
      setNotice({ tone: "success", text: `${updated.patient?.fullName ?? "Appointment"} is now ${STATUS_LABELS[updated.status].toLowerCase()}.` });
    } catch (error) {
      setNotice({ tone: "error", text: error instanceof ApiClientError ? error.message : "Could not update the appointment." });
      reload();
    } finally {
      setBusyId(null);
    }
  };

  if (appointments.error && !appointments.previous) {
    return (
      <AccessState
        kind={accessStateFromStatus(appointments.error.status)}
        resource="appointment list"
        action={<RetryButton onClick={reload} />}
      />
    );
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
            <CalendarDays className="h-4 w-4" />
            Scheduling & Queue
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Appointments</h1>
          <p className="text-sm text-slate-400 mt-1">{formatLongDate(`${day}T12:00:00`)}</p>
        </div>
        <button
          type="button"
          onClick={() => setBooking(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-teal-500/20 hover:opacity-95 transition cursor-pointer"
        >
          <CalendarPlus className="h-4 w-4" />
          Book Appointment
        </button>
      </div>

      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "flex items-center gap-3 p-3.5 rounded-xl border text-sm",
            notice.tone === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
              : "bg-rose-500/10 border-rose-500/25 text-rose-200"
          )}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1">
            {notice.text}{" "}
            {notice.href && (
              <Link href={notice.href} className="font-semibold underline">
                Open
              </Link>
            )}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="p-1 rounded-md hover:bg-white/10 cursor-pointer" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex items-center gap-1.5">
          <IconButton label="Previous day" onClick={() => setDay((d) => addDays(d, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </IconButton>
          <button
            type="button"
            onClick={() => setDay(today)}
            disabled={day === today}
            className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            Today
          </button>
          <IconButton label="Next day" onClick={() => setDay((d) => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </IconButton>
          <input
            type="date"
            value={day}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            aria-label="Select date"
            className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500 [color-scheme:dark]"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            aria-label="Filter by doctor"
            className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All doctors</option>
            {(doctors.data ?? []).map((d) => (
              <option key={d._id} value={d._id}>
                {d._id === userId ? `${d.name} (me)` : d.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | "")}
            aria-label="Filter by status"
            className="px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-sm text-white focus:outline-none focus:border-teal-500"
          >
            <option value="">All statuses</option>
            {APPOINTMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <IconButton label="Refresh" onClick={reload}>
            <RefreshCw className={cn("h-4 w-4", appointments.isLoading && "animate-spin")} />
          </IconButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Users className="h-4 w-4 text-sky-400" />} label="Waiting" value={waiting.length} />
        <Stat icon={<Stethoscope className="h-4 w-4 text-amber-400" />} label="In Consultation" value={inConsultation.length} />
        <Stat icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />} label="Completed" value={completed.length} />
        <Stat icon={<X className="h-4 w-4 text-rose-400" />} label="Cancelled / No-show" value={missed.length} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_20rem] gap-6 items-start">
        <section aria-label="Appointments for the day">
          <AppointmentList
            appointments={list}
            role={role}
            userId={userId}
            isLoading={appointments.isLoading}
            busyId={busyId}
            onAction={handleAction}
            emptyMessage={statusFilter || doctorFilter ? "No appointments match these filters." : "No appointments booked for this day."}
          />
        </section>

        {/* Live queue */}
        <aside className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-800 bg-slate-900/40 xl:sticky xl:top-20">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-teal-400">
            <Clock className="h-4 w-4" />
            Clinic Queue
            <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-slate-500">auto-refreshes</span>
          </h2>
          <QueueGroup title="In Consultation" tone="amber" items={inConsultation} empty="No one is with a doctor." />
          <QueueGroup title="Waiting Room" tone="sky" items={waiting} empty="Waiting room is empty." />
        </aside>
      </div>

      <Dialog
        open={booking}
        title="Book Appointment"
        description="Choose a patient, doctor, and an open 30-minute slot."
        onClose={() => setBooking(false)}
      >
        {booking && (
          <AppointmentBookingForm
            initialDoctorId={role === "DOCTOR" ? userId : ""}
            initialDay={day}
            onCancel={() => setBooking(false)}
            onSuccess={(created) => {
              setBooking(false);
              const createdDay = localDayKey(new Date(created.dateTime));
              setNotice({
                tone: "success",
                text: `Booked ${created.patient?.fullName ?? "patient"} at ${formatTime(created.dateTime)} (token #${created.queueNumber}).`,
                href: `/appointments/${created._id}`,
              });
              if (createdDay === day) reload();
              else setDay(createdDay);
            }}
          />
        )}
      </Dialog>
    </main>
  );
}

function PatientAppointments() {
  const appointments = useApiQuery("my-appointments", () => listAppointments({}));
  const [now] = useState(() => Date.now());

  if (appointments.error) {
    return (
      <AccessState
        kind={accessStateFromStatus(appointments.error.status)}
        resource="appointment list"
        action={<RetryButton onClick={appointments.reload} />}
      />
    );
  }

  const list = appointments.data ?? [];
  const upcoming = list.filter((a) => ACTIVE_STATUSES.includes(a.status) && a.status !== "COMPLETED" && new Date(a.dateTime).getTime() >= now - 60 * 60000);
  const past = list.filter((a) => !upcoming.includes(a)).reverse();

  return (
    <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 mb-1">
          <CalendarDays className="h-4 w-4" />
          Patient Portal
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">My Appointments</h1>
        <p className="text-sm text-slate-400 mt-1">To book or change a visit, please contact the clinic front desk.</p>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Upcoming</h2>
        <AppointmentList appointments={upcoming} role="PATIENT" userId="" isLoading={appointments.isLoading} showDate emptyMessage="You have no upcoming appointments." />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Past Visits</h2>
        <AppointmentList appointments={past} role="PATIENT" userId="" isLoading={appointments.isLoading} showDate emptyMessage="No past visits yet." />
      </section>
    </main>
  );
}

function QueueGroup({
  title,
  tone,
  items,
  empty,
}: {
  title: string;
  tone: "amber" | "sky";
  items: AppointmentView[];
  empty: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
        {title}
        <span className={cn("px-1.5 rounded-md", tone === "amber" ? "bg-amber-500/15 text-amber-300" : "bg-sky-500/15 text-sky-300")}>
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500">{empty}</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {items.map((a) => (
            <li key={a._id}>
              <Link
                href={`/appointments/${a._id}`}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <span className="text-[11px] font-mono text-teal-400 w-7">#{a.queueNumber ?? "–"}</span>
                <span className="flex-1 min-w-0 text-xs text-white truncate">{a.patient?.fullName}</span>
                <span className="text-[11px] text-slate-500 tabular-nums">{formatTime(a.dateTime)}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {icon}
        {label}
      </div>
      <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
    >
      {children}
    </button>
  );
}

function RetryButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition cursor-pointer"
    >
      <RefreshCw className="h-4 w-4" />
      Try Again
    </button>
  );
}

function PageSkeleton() {
  return (
    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6" aria-busy="true">
      <div className="h-16 w-72 rounded-xl bg-slate-900 animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-slate-900/70 animate-pulse" />
        ))}
      </div>
      <div className="h-80 rounded-2xl bg-slate-900/60 animate-pulse" />
    </main>
  );
}
