import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { IMedicationItem } from "@/types";

export interface IPrescriptionDocument extends Document {
  consultationId: Types.ObjectId;
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  medications: IMedicationItem[];
  generalInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MedicationSchema = new Schema<IMedicationItem>(
  {
    name: { type: String, required: [true, "Medication name is required"], trim: true },
    dosage: { type: String, required: [true, "Dosage is required"], trim: true },
    frequency: { type: String, required: [true, "Frequency is required"], trim: true },
    durationDays: { type: Number, required: [true, "Duration is required"], min: 1 },
    instructions: { type: String, trim: true },
  },
  { _id: false }
);

const PrescriptionSchema = new Schema<IPrescriptionDocument>(
  {
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: "Consultation",
      required: [true, "Consultation is required"],
      index: true,
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
    medications: {
      type: [MedicationSchema],
      required: true,
      validate: {
        validator: (items: IMedicationItem[]) => Array.isArray(items) && items.length > 0,
        message: "At least one medication is required",
      },
    },
    generalInstructions: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PrescriptionSchema.index({ patientId: 1, createdAt: -1 });

export const Prescription: Model<IPrescriptionDocument> =
  mongoose.models.Prescription || mongoose.model<IPrescriptionDocument>("Prescription", PrescriptionSchema);
