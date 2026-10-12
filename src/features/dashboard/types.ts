export interface SerializedAppointment {
  _id: string;
  patientId: string;
  patientName: string;
  patientClinicId?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialization?: string;
  dateTime: string;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  reason: string;
  queueNumber?: number;
  notes?: string;
}

export interface SerializedPatient {
  _id: string;
  patientId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  allergies?: string[];
  createdAt: string;
}

export interface SerializedPrescription {
  _id: string;
  consultationId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  medicationsCount: number;
  medicationsSummary: string;
  createdAt: string;
}

export interface SerializedConsultation {
  _id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  chiefComplaint: string;
  diagnosis: string;
  status: "DRAFT" | "COMPLETED";
  createdAt: string;
}

export interface DoctorDashboardData {
  doctorName: string;
  specialization?: string;
  todayAppointmentsCount: number;
  waitingCount: number;
  inProgressCount: number;
  completedTodayCount: number;
  totalPrescriptionsCount: number;
  queueAppointments: SerializedAppointment[];
  recentConsultations: SerializedConsultation[];
  recentPrescriptions: SerializedPrescription[];
}

export interface ReceptionistDashboardData {
  receptionistName: string;
  totalPatientsCount: number;
  todayAppointmentsCount: number;
  waitingQueueCount: number;
  activeDoctorsCount: number;
  todayAppointments: SerializedAppointment[];
  recentPatients: SerializedPatient[];
  activeDoctors: { _id: string; name: string; specialization?: string }[];
}

export interface AdminDashboardData {
  adminName: string;
  totalPatients: number;
  totalDoctors: number;
  totalReceptionists: number;
  todayAppointmentsCount: number;
  totalConsultations: number;
  totalPrescriptions: number;
  recentPatients: SerializedPatient[];
  todayAppointments: SerializedAppointment[];
  staffList: {
    _id: string;
    name: string;
    email: string;
    role: string;
    specialization?: string;
    createdAt: string;
  }[];
  systemStatus: {
    database: string;
    uptime: number;
    version: string;
  };
}

export interface PatientDashboardData {
  patientName: string;
  patientClinicId?: string;
  allergies: string[];
  bloodGroup?: string;
  emergencyContact?: { name: string; relationship: string; phone: string };
  upcomingAppointments: SerializedAppointment[];
  pastAppointments: SerializedAppointment[];
  recentPrescriptions: SerializedPrescription[];
}
