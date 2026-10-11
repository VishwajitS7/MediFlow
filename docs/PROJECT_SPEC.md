# MediFlow — Project Specification

**Document Version:** 1.0.0  
**Status:** Approved Baseline  
**Integration Owner:** Product Owner / Team Lead  

---

## 1. Executive Summary

**MediFlow** is a modern, web-based Smart Clinic Management Platform engineered for outpatient clinics, polyclinics, and independent healthcare practices. MediFlow streamlines patient onboarding, appointment scheduling, electronic medical records (EMR), clinical consultations, and prescription issuance into a unified, secure, high-performance web experience.

---

## 2. User Roles & Personas

MediFlow supports four primary user roles governed by Role-Based Access Control (RBAC):

| Role | Responsibilities | Key Capabilities |
|---|---|---|
| **ADMIN** | System administration, user provisioning, clinic settings, audit logs. | Full access to clinic data, user role assignment, system health monitoring. |
| **DOCTOR** | Clinical consultations, diagnosis, medical records, prescription issuance. | View assigned appointments, edit consultation notes, write prescriptions, view patient history. |
| **RECEPTIONIST** | Patient registration, intake, appointment scheduling, queue management. | Register patients, book/reschedule appointments, manage daily clinic queue. |
| **PATIENT** | Self-service access, viewing personal health history and upcoming visits. | View own profile, appointments, and active prescriptions. |

---

## 3. Approved Features & Scope

### 3.1 Authentication & Role-Based Access Control (RBAC)
- Secure credential-based authentication using Auth.js (NextAuth).
- Role-gated route middleware and server-side session checks.
- Dynamic navigation bar and role-aware dashboard layouts.
- Auto-logout and session expiration policies.

### 3.2 Patient Registration & Management
- Patient demographic intake: Full Name, Date of Birth, Gender, Phone, Email, Emergency Contact, Blood Group, Allergies.
- Unique Patient Identifier (`MED-<YEAR>-<5-DIGIT-SEQUENCE>`).
- Fast search and filtering by name, phone, or patient ID.
- Patient profile overview displaying historical visits, vitals timeline, and active prescriptions.

### 3.3 Appointment Scheduling & Queue Management
- Calendar and slot-based booking for outpatient consultations.
- Appointment statuses: `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
- Real-time clinic queue status (Waiting Room vs In Consultation).
- Search and filter appointments by date range, doctor, and status.

### 3.4 Clinical Consultations & Electronic Medical Records (EMR)
- Doctor consultation workspace linked to an active appointment.
- Structured clinical inputs:
  - Chief Complaint & Symptoms.
  - Vitals Recording: Blood Pressure (systolic/diastolic), Heart Rate (bpm), Body Temperature (°F/°C), Weight (kg), Height (cm), SpO2 (%).
  - Clinical Notes, Diagnosis (ICD/standard terminology), and Treatment Plan.
- Permanent record locking once consultation is marked `COMPLETED`.

### 3.5 Electronic Prescriptions
- Drug ordering interface integrated into consultation workflow.
- Medication details: Name, Strength/Form (e.g. 500mg tablet), Dosage, Frequency (e.g. 1-0-1), Duration (days), Special Instructions (e.g. after food).
- Exportable/printable prescription summary view for the patient.

### 3.6 System Health & Observability (DevOps/SRE)
- High-availability `/api/health` endpoint returning system uptime, MongoDB connection state, and memory metrics.
- Structured JSON logging.

---

## 4. Acceptance Criteria

1. **Authentication**: Users must be prevented from accessing routes without an authenticated session. Users with unauthorized roles must be rejected with HTTP 403 Forbidden.
2. **Data Validation**: Every API payload must pass server-side Zod validation before database writes.
3. **Data Isolation**: Patients can only access their own records. Receptionists cannot edit clinical consultation notes. Doctors can only write prescriptions for attended consultations.
4. **Resilience**: Database connection failures must return graceful HTTP 503 error payloads without crashing the Node.js server.
5. **Testing**: Core business utilities, validation schemas, and API handlers must be covered by automated Vitest tests.

---

## 5. Explicit Exclusions (Out of Scope for v1.0)

- Real payment gateway integrations (Stripe, Razorpay, etc.) — payment status tracking uses synthetic records.
- External SMS/WhatsApp notifications — synthetic notification stubs only.
- Telemedicine video streaming / WebRTC — future milestone.
- Multi-tenant cloud SaaS segregation — single-clinic deployment model in v1.0.
- Production regulatory compliance certifications (HIPAA/GDPR formal auditing) — MediFlow implements security controls and synthetic datasets but makes no formal compliance claims.
