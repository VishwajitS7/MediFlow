import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { ConsultationStatus, IVitals } from "@/types";

export interface IConsultationDocument extends Document {
  appointmentId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  vitals: IVitals;
  chiefComplaint: string;
  symptoms: string[];
  diagnosis: string;
  clinicalNotes?: string;
  status: ConsultationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const VitalsSchema = new Schema<IVitals>(
  {
    bloodPressureSystolic: { type: Number },
    bloodPressureDiastolic: { type: Number },
    heartRate: { type: Number },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    spo2: { type: Number },
  },
  { _id: false }
);

const ConsultationSchema = new Schema<IConsultationDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: [true, "Appointment is required"],
      unique: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Doctor is required"],
      index: true,
    },
    vitals: {
      type: VitalsSchema,
      default: {},
    },
    chiefComplaint: {
      type: String,
      required: [true, "Chief complaint is required"],
      trim: true,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },
    clinicalNotes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "COMPLETED"],
      default: "COMPLETED",
    },
  },
  {
    timestamps: true,
  }
);

ConsultationSchema.index({ patientId: 1, createdAt: -1 });

export const Consultation: Model<IConsultationDocument> =
  mongoose.models.Consultation || mongoose.model<IConsultationDocument>("Consultation", ConsultationSchema);
