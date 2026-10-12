import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Patient } from "@/models/Patient";
import { Appointment } from "@/models/Appointment";
import { Consultation } from "@/models/Consultation";
import { Prescription } from "@/models/Prescription";
import { PublicLanding } from "@/features/dashboard/public-landing";
import { DoctorDashboard } from "@/features/dashboard/doctor-dashboard";
import { ReceptionistDashboard } from "@/features/dashboard/receptionist-dashboard";
import { AdminDashboard } from "@/features/dashboard/admin-dashboard";
import { PatientDashboard } from "@/features/dashboard/patient-dashboard";
import type {
  DoctorDashboardData,
  ReceptionistDashboardData,
  AdminDashboardData,
  PatientDashboardData,
  SerializedAppointment,
  SerializedPatient,
  SerializedPrescription,
  SerializedConsultation,
} from "@/features/dashboard/types";
import { Types } from "mongoose";

function DashboardSkeleton() {
  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8 w-full animate-pulse">
      <div className="h-24 bg-slate-900/60 rounded-3xl border border-slate-800" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 h-80 bg-slate-900/60 rounded-2xl border border-slate-800" />
        <div className="h-80 bg-slate-900/60 rounded-2xl border border-slate-800" />
      </div>
    </div>
  );
}

function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

async function loadDoctorDashboard(
  userId: string,
  userName: string,
  start: Date,
  end: Date
): Promise<DoctorDashboardData> {
  const fallback: DoctorDashboardData = {
    doctorName: userName,
    todayAppointmentsCount: 0,
    waitingCount: 0,
    inProgressCount: 0,
    completedTodayCount: 0,
    totalPrescriptionsCount: 0,
    queueAppointments: [],
    recentConsultations: [],
    recentPrescriptions: [],
  };

  try {
    await connectToDatabase();
    const doctorObjectId = Types.ObjectId.isValid(userId) ? new Types.ObjectId(userId) : null;

    const [appointments, consultations, prescriptions, doctorDoc] = await Promise.all([
      doctorObjectId
        ? Appointment.find({ doctorId: doctorObjectId, dateTime: { $gte: start, $lte: end } })
            .sort({ dateTime: 1 })
            .lean()
        : [],
      doctorObjectId
        ? Consultation.find({ doctorId: doctorObjectId }).sort({ createdAt: -1 }).limit(5).lean()
        : [],
      doctorObjectId
        ? Prescription.find({ doctorId: doctorObjectId }).sort({ createdAt: -1 }).limit(5).lean()
        : [],
      doctorObjectId ? User.findById(doctorObjectId).select({ specialization: 1 }).lean() : null,
    ]);

    const patientIds = [
      ...new Set([
        ...appointments.map((a) => a.patientId.toString()),
        ...consultations.map((c) => c.patientId.toString()),
        ...prescriptions.map((p) => p.patientId.toString()),
      ]),
    ];

    const patientDocs = patientIds.length
      ? await Patient.find({ _id: { $in: patientIds } })
          .select({ fullName: 1, patientId: 1 })
          .lean()
      : [];

    const patientMap = new Map(patientDocs.map((p) => [p._id.toString(), p]));

    const serializedQueue: SerializedAppointment[] = appointments.map((a) => {
      const p = patientMap.get(a.patientId.toString());
      return {
        _id: a._id.toString(),
        patientId: a.patientId.toString(),
        patientName: p?.fullName || "Patient",
        patientClinicId: p?.patientId,
        doctorId: userId,
        doctorName: userName,
        dateTime: a.dateTime.toISOString(),
        status: a.status as SerializedAppointment["status"],
        reason: a.reason,
        queueNumber: a.queueNumber,
        notes: a.notes,
      };
    });

    const serializedConsultations: SerializedConsultation[] = consultations.map((c) => {
      const p = patientMap.get(c.patientId.toString());
      return {
        _id: c._id.toString(),
        appointmentId: c.appointmentId.toString(),
        patientId: c.patientId.toString(),
        patientName: p?.fullName || "Patient",
        doctorId: userId,
        doctorName: userName,
        chiefComplaint: c.chiefComplaint,
        diagnosis: c.diagnosis,
        status: c.status as "DRAFT" | "COMPLETED",
        createdAt: c.createdAt.toISOString(),
      };
    });

    const serializedPrescriptions: SerializedPrescription[] = prescriptions.map((p) => {
      const pt = patientMap.get(p.patientId.toString());
      const summary = (p.medications || []).map((m: { name: string }) => m.name).join(", ");
      return {
        _id: p._id.toString(),
        consultationId: p.consultationId.toString(),
        patientId: p.patientId.toString(),
        patientName: pt?.fullName || "Patient",
        doctorId: userId,
        doctorName: userName,
        medicationsCount: (p.medications || []).length,
        medicationsSummary: summary || "Prescribed medications",
        createdAt: p.createdAt.toISOString(),
      };
    });

    return {
      doctorName: userName,
      specialization: (doctorDoc as { specialization?: string })?.specialization,
      todayAppointmentsCount: appointments.length,
      waitingCount: appointments.filter((a) => a.status === "CONFIRMED" || a.status === "SCHEDULED").length,
      inProgressCount: appointments.filter((a) => a.status === "IN_PROGRESS").length,
      completedTodayCount: appointments.filter((a) => a.status === "COMPLETED").length,
      totalPrescriptionsCount: prescriptions.length,
      queueAppointments: serializedQueue,
      recentConsultations: serializedConsultations,
      recentPrescriptions: serializedPrescriptions,
    };
  } catch (err) {
    console.error("Doctor dashboard loader failed:", err);
    return fallback;
  }
}

async function loadReceptionistDashboard(
  userName: string,
  start: Date,
  end: Date
): Promise<ReceptionistDashboardData> {
  const fallback: ReceptionistDashboardData = {
    receptionistName: userName,
    totalPatientsCount: 0,
    todayAppointmentsCount: 0,
    waitingQueueCount: 0,
    activeDoctorsCount: 0,
    todayAppointments: [],
    recentPatients: [],
    activeDoctors: [],
  };

  try {
    await connectToDatabase();
    const [totalPatients, todayApts, recentPatientsDocs, activeDoctorDocs] = await Promise.all([
      Patient.countDocuments(),
      Appointment.find({ dateTime: { $gte: start, $lte: end } }).sort({ dateTime: 1 }).lean(),
      Patient.find().sort({ createdAt: -1 }).limit(6).lean(),
      User.find({ role: "DOCTOR", isActive: true }).select({ name: 1, specialization: 1 }).lean(),
    ]);

    const participantIds = [
      ...new Set([
        ...todayApts.map((a) => a.patientId.toString()),
        ...todayApts.map((a) => a.doctorId.toString()),
      ]),
    ];

    const [pDocs, dDocs] = await Promise.all([
      Patient.find({ _id: { $in: participantIds } }).select({ fullName: 1, patientId: 1 }).lean(),
      User.find({ _id: { $in: participantIds } }).select({ name: 1 }).lean(),
    ]);

    const pMap = new Map(pDocs.map((p) => [p._id.toString(), p]));
    const dMap = new Map(dDocs.map((d) => [d._id.toString(), d]));

    const serializedAppointments: SerializedAppointment[] = todayApts.map((a) => {
      const pt = pMap.get(a.patientId.toString());
      const doc = dMap.get(a.doctorId.toString());
      return {
        _id: a._id.toString(),
        patientId: a.patientId.toString(),
        patientName: pt?.fullName || "Patient",
        patientClinicId: pt?.patientId,
        doctorId: a.doctorId.toString(),
        doctorName: doc?.name || "Doctor",
        dateTime: a.dateTime.toISOString(),
        status: a.status as SerializedAppointment["status"],
        reason: a.reason,
        queueNumber: a.queueNumber,
        notes: a.notes,
      };
    });

    const serializedPatients: SerializedPatient[] = recentPatientsDocs.map((p) => ({
      _id: p._id.toString(),
      patientId: p.patientId,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth.toISOString(),
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies ?? [],
      createdAt: p.createdAt.toISOString(),
    }));

    return {
      receptionistName: userName,
      totalPatientsCount: totalPatients,
      todayAppointmentsCount: todayApts.length,
      waitingQueueCount: todayApts.filter((a) => a.status === "CONFIRMED" || a.status === "SCHEDULED").length,
      activeDoctorsCount: activeDoctorDocs.length,
      todayAppointments: serializedAppointments,
      recentPatients: serializedPatients,
      activeDoctors: activeDoctorDocs.map((d) => ({
        _id: d._id.toString(),
        name: d.name,
        specialization: d.specialization,
      })),
    };
  } catch (err) {
    console.error("Receptionist dashboard loader failed:", err);
    return fallback;
  }
}

async function loadAdminDashboard(
  userName: string,
  start: Date,
  end: Date
): Promise<AdminDashboardData> {
  const fallback: AdminDashboardData = {
    adminName: userName,
    totalPatients: 0,
    totalDoctors: 0,
    totalReceptionists: 0,
    todayAppointmentsCount: 0,
    totalConsultations: 0,
    totalPrescriptions: 0,
    recentPatients: [],
    todayAppointments: [],
    staffList: [],
    systemStatus: { database: "Offline", uptime: 0, version: "0.1.0" },
  };

  try {
    await connectToDatabase();
    const [
      totalPatients,
      totalDoctors,
      totalReceptionists,
      todayAptsCount,
      totalConsultations,
      totalPrescriptions,
      recentPatientsDocs,
      staffListDocs,
    ] = await Promise.all([
      Patient.countDocuments(),
      User.countDocuments({ role: "DOCTOR" }),
      User.countDocuments({ role: "RECEPTIONIST" }),
      Appointment.countDocuments({ dateTime: { $gte: start, $lte: end } }),
      Consultation.countDocuments(),
      Prescription.countDocuments(),
      Patient.find().sort({ createdAt: -1 }).limit(5).lean(),
      User.find({ role: { $in: ["ADMIN", "DOCTOR", "RECEPTIONIST"] } })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    const serializedPatients: SerializedPatient[] = recentPatientsDocs.map((p) => ({
      _id: p._id.toString(),
      patientId: p.patientId,
      fullName: p.fullName,
      dateOfBirth: p.dateOfBirth.toISOString(),
      gender: p.gender,
      phone: p.phone,
      email: p.email,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies ?? [],
      createdAt: p.createdAt.toISOString(),
    }));

    return {
      adminName: userName,
      totalPatients,
      totalDoctors,
      totalReceptionists,
      todayAppointmentsCount: todayAptsCount,
      totalConsultations,
      totalPrescriptions,
      recentPatients: serializedPatients,
      todayAppointments: [],
      staffList: staffListDocs.map((u) => ({
        _id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        specialization: u.specialization,
        createdAt: u.createdAt.toISOString(),
      })),
      systemStatus: {
        database: "MongoDB Connected",
        uptime: process.uptime(),
        version: "0.1.0",
      },
    };
  } catch (err) {
    console.error("Admin dashboard loader failed:", err);
    return fallback;
  }
}

async function loadPatientDashboard(
  userId: string,
  userEmail: string | undefined | null,
  userName: string
): Promise<PatientDashboardData> {
  const fallback: PatientDashboardData = {
    patientName: userName,
    allergies: [],
    upcomingAppointments: [],
    pastAppointments: [],
    recentPrescriptions: [],
  };

  try {
    await connectToDatabase();
    const patientDoc = await Patient.findOne({
      $or: [
        ...(Types.ObjectId.isValid(userId) ? [{ userId: new Types.ObjectId(userId) }] : []),
        ...(userEmail ? [{ email: userEmail.toLowerCase() }] : []),
      ],
    }).lean();

    if (!patientDoc) {
      return fallback;
    }

    const patientObjectId = patientDoc._id;
    const now = new Date();

    const [upcomingApts, pastApts, prescriptions] = await Promise.all([
      Appointment.find({ patientId: patientObjectId, dateTime: { $gte: now } })
        .sort({ dateTime: 1 })
        .limit(5)
        .lean(),
      Appointment.find({ patientId: patientObjectId, dateTime: { $lt: now } })
        .sort({ dateTime: -1 })
        .limit(5)
        .lean(),
      Prescription.find({ patientId: patientObjectId }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const doctorIds = [
      ...new Set([
        ...upcomingApts.map((a) => a.doctorId.toString()),
        ...pastApts.map((a) => a.doctorId.toString()),
        ...prescriptions.map((p) => p.doctorId.toString()),
      ]),
    ];

    const doctorDocs = doctorIds.length
      ? await User.find({ _id: { $in: doctorIds } }).select({ name: 1 }).lean()
      : [];

    const docMap = new Map(doctorDocs.map((d) => [d._id.toString(), d.name]));

    const serializeApt = (a: (typeof upcomingApts)[number]): SerializedAppointment => ({
      _id: a._id.toString(),
      patientId: patientObjectId.toString(),
      patientName: patientDoc.fullName,
      patientClinicId: patientDoc.patientId,
      doctorId: a.doctorId.toString(),
      doctorName: docMap.get(a.doctorId.toString()) || "Doctor",
      dateTime: a.dateTime.toISOString(),
      status: a.status as SerializedAppointment["status"],
      reason: a.reason,
      queueNumber: a.queueNumber,
      notes: a.notes,
    });

    const serializedPrescriptions: SerializedPrescription[] = prescriptions.map((p) => {
      const docName = docMap.get(p.doctorId.toString()) || "Doctor";
      const summary = (p.medications || []).map((m: { name: string }) => m.name).join(", ");
      return {
        _id: p._id.toString(),
        consultationId: p.consultationId.toString(),
        patientId: patientObjectId.toString(),
        patientName: patientDoc.fullName,
        doctorId: p.doctorId.toString(),
        doctorName: docName,
        medicationsCount: (p.medications || []).length,
        medicationsSummary: summary || "Prescribed medications",
        createdAt: p.createdAt.toISOString(),
      };
    });

    return {
      patientName: patientDoc.fullName || userName,
      patientClinicId: patientDoc.patientId,
      allergies: patientDoc.allergies ?? [],
      bloodGroup: patientDoc.bloodGroup,
      emergencyContact: patientDoc.emergencyContact,
      upcomingAppointments: upcomingApts.map(serializeApt),
      pastAppointments: pastApts.map(serializeApt),
      recentPrescriptions: serializedPrescriptions,
    };
  } catch (err) {
    console.error("Patient dashboard loader failed:", err);
    return fallback;
  }
}

async function RoleDashboardRouter() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <PublicLanding />;
  }

  const role = session.user.role;
  const userId = session.user.id;
  const userName = session.user.name || session.user.email || "User";
  const userEmail = session.user.email;
  const { start, end } = getTodayBounds();

  if (role === "DOCTOR") {
    const data = await loadDoctorDashboard(userId, userName, start, end);
    return <DoctorDashboard data={data} />;
  }

  if (role === "RECEPTIONIST") {
    const data = await loadReceptionistDashboard(userName, start, end);
    return <ReceptionistDashboard data={data} />;
  }

  if (role === "ADMIN") {
    const data = await loadAdminDashboard(userName, start, end);
    return <AdminDashboard data={data} />;
  }

  if (role === "PATIENT") {
    const data = await loadPatientDashboard(userId, userEmail, userName);
    return <PatientDashboard data={data} />;
  }

  return <PublicLanding />;
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <RoleDashboardRouter />
    </Suspense>
  );
}
