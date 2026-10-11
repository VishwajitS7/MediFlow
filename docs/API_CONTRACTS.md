# MediFlow — Canonical API Contracts & Interfaces

**Document Version:** 1.0.0  
**Status:** Approved Baseline  
**Integration Owner:** Product Owner / Team Lead  

---

## 1. Global API Standards & Envelope

All API endpoints in MediFlow adhere to standardized JSON payloads.

### 1.1 Success Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-11T10:00:00.000Z"
}
```

### 1.2 Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | INTERNAL_SERVER_ERROR",
    "message": "Human-readable explanation of error.",
    "details": [ ... ]
  },
  "timestamp": "2026-10-11T10:00:00.000Z"
}
```

### 1.3 Standard HTTP Status Codes
- `200 OK`: Successful retrieval or synchronous update.
- `201 Created`: Resource successfully created in the database.
- `400 Bad Request`: Payload validation failed (Zod error details in `error.details`).
- `401 Unauthorized`: Session missing or expired.
- `403 Forbidden`: Authenticated user lacks required role for the resource.
- `404 Not Found`: Target entity not found in MongoDB.
- `409 Conflict`: Unique constraint violation (e.g. duplicate email or patient ID).
- `500 Internal Server Error`: Unhandled server exception.
- `503 Service Unavailable`: Database connection offline.

---

## 2. API Catalog & Endpoint Contracts

### 2.1 System Health & Observability

#### `GET /api/health`
- **Purpose**: Kubernetes liveness and readiness probe / DevOps health check.
- **Auth**: None (Public).
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 1240.5,
    "timestamp": "2026-10-11T10:00:00.000Z",
    "database": {
      "status": "connected",
      "readyState": 1
    },
    "version": "0.1.0"
  },
  "timestamp": "2026-10-11T10:00:00.000Z"
}
```

---

### 2.2 Authentication & User Management

#### `POST /api/auth/register`
- **Purpose**: Provision user credentials.
- **Auth**: `ADMIN` role required (or self-registration if enabled).
- **Request Body**:
```json
{
  "name": "Dr. Sarah Jenkins",
  "email": "sarah.jenkins@mediflow.local",
  "password": "SecurePassword123!",
  "role": "DOCTOR",
  "specialization": "Cardiology",
  "phone": "+1-555-0199"
}
```
- **Response `201 Created`**: Returns created user object (excluding `passwordHash`).

#### `GET /api/auth/me`
- **Purpose**: Retrieve current authenticated user profile.
- **Auth**: Any authenticated session.
- **Response `200 OK`**: Current user profile with role privileges.

---

### 2.3 Patient Management (`/api/patients`)

#### `GET /api/patients`
- **Purpose**: Search and filter patient directory.
- **Auth**: `ADMIN`, `DOCTOR`, `RECEPTIONIST`.
- **Query Parameters**:
  - `query` (string, optional): Full-text search for name or phone.
  - `page` (number, default: 1): Pagination offset.
  - `limit` (number, default: 20): Page size.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "_id": "6708b1f5e8...",
        "patientId": "MED-2026-00101",
        "fullName": "Jane Doe",
        "dateOfBirth": "1988-04-12T00:00:00.000Z",
        "gender": "FEMALE",
        "phone": "+1-555-0144",
        "bloodGroup": "O+",
        "allergies": ["Penicillin"],
        "createdAt": "2026-10-11T08:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  },
  "timestamp": "2026-10-11T10:00:00.000Z"
}
```

#### `POST /api/patients`
- **Purpose**: Register a new patient.
- **Auth**: `ADMIN`, `RECEPTIONIST`.
- **Request Body**:
```json
{
  "fullName": "Jane Doe",
  "dateOfBirth": "1988-04-12",
  "gender": "FEMALE",
  "phone": "+1-555-0144",
  "email": "jane.doe@example.com",
  "bloodGroup": "O+",
  "allergies": ["Penicillin"],
  "emergencyContact": {
    "name": "John Doe",
    "relationship": "Spouse",
    "phone": "+1-555-0145"
  },
  "address": {
    "street": "123 Main St",
    "city": "Metropolis",
    "state": "NY",
    "zipCode": "10001"
  }
}
```
- **Response `201 Created`**: Newly created patient record with auto-assigned `patientId`.

#### `GET /api/patients/:id`
- **Purpose**: Retrieve full patient profile with clinical history.
- **Auth**: `ADMIN`, `DOCTOR`, `RECEPTIONIST` or `PATIENT` (self only).
- **Response `200 OK`**: Patient document plus visit history summary.

---

### 2.4 Appointment Scheduling (`/api/appointments`)

#### `GET /api/appointments`
- **Purpose**: List appointments with filtering.
- **Auth**: `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`.
- **Query Parameters**:
  - `doctorId` (string, optional)
  - `patientId` (string, optional)
  - `date` (string, YYYY-MM-DD, optional)
  - `status` (string, optional)
- **Response `200 OK`**: Array of appointments with populated doctor and patient details.

#### `POST /api/appointments`
- **Purpose**: Book an appointment.
- **Auth**: `ADMIN`, `RECEPTIONIST`, `DOCTOR`.
- **Request Body**:
```json
{
  "patientId": "6708b1f5e8...",
  "doctorId": "6708a0d2f1...",
  "dateTime": "2026-10-12T14:30:00.000Z",
  "reason": "Routine hypertension follow-up",
  "notes": "Patient requested afternoon slot"
}
```
- **Response `201 Created`**: Created appointment with status `SCHEDULED`.

#### `PATCH /api/appointments/:id/status`
- **Purpose**: Update appointment workflow lifecycle.
- **Auth**: `ADMIN`, `RECEPTIONIST`, `DOCTOR`.
- **Request Body**:
```json
{
  "status": "CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED | NO_SHOW"
}
```
- **Response `200 OK`**: Updated appointment object.

---

### 2.5 Clinical Consultations (`/api/consultations`)

#### `POST /api/consultations`
- **Purpose**: Record clinical consultation notes and vitals.
- **Auth**: `DOCTOR` only.
- **Request Body**:
```json
{
  "appointmentId": "6708c2a11b...",
  "patientId": "6708b1f5e8...",
  "vitals": {
    "bloodPressureSystolic": 120,
    "bloodPressureDiastolic": 80,
    "heartRate": 72,
    "temperature": 98.6,
    "weight": 70,
    "height": 175,
    "spo2": 99
  },
  "chiefComplaint": "Persistent dry cough for 5 days",
  "symptoms": ["Dry cough", "Mild throat irritation"],
  "diagnosis": "Acute upper respiratory tract infection (viral)",
  "clinicalNotes": "Lungs clear to auscultation. Advised warm fluids and rest.",
  "status": "COMPLETED"
}
```
- **Response `201 Created`**: Created consultation record. Also transitions linked appointment to `COMPLETED`.

#### `GET /api/consultations/:id`
- **Purpose**: Retrieve consultation detail.
- **Auth**: `DOCTOR`, `ADMIN`, `PATIENT` (self).
- **Response `200 OK`**: Consultation document.

---

### 2.6 Prescriptions (`/api/prescriptions`)

#### `POST /api/prescriptions`
- **Purpose**: Issue prescription linked to a consultation.
- **Auth**: `DOCTOR` only.
- **Request Body**:
```json
{
  "consultationId": "6708d3e99c...",
  "patientId": "6708b1f5e8...",
  "medications": [
    {
      "name": "Dextromethorphan Syrup",
      "dosage": "10ml",
      "frequency": "0-0-1",
      "durationDays": 5,
      "instructions": "Take before bed"
    },
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "1-0-1",
      "durationDays": 3,
      "instructions": "After food if fever arises"
    }
  ],
  "generalInstructions": "Drink plenty of warm liquids."
}
```
- **Response `201 Created`**: Created prescription record.

#### `GET /api/prescriptions`
- **Purpose**: Query prescriptions.
- **Auth**: `DOCTOR`, `ADMIN`, `RECEPTIONIST`, `PATIENT` (self).
- **Query Parameters**: `patientId`, `consultationId`.
- **Response `200 OK`**: Prescriptions list.
