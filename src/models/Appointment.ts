import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { AppointmentStatus } from "@/types";

export interface IAppointmentDocument extends Document {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  dateTime: Date;
  status: AppointmentStatus;
  reason: string;
  queueNumber?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
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
    dateTime: {
      type: Date,
      required: [true, "Appointment date and time is required"],
      index: true,
    },
    status: {
      type: String,
      enum: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
      default: "SCHEDULED",
    },
    reason: {
      type: String,
      required: [true, "Reason for visit is required"],
      trim: true,
    },
    queueNumber: {
      type: Number,
      min: 1,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

AppointmentSchema.index({ doctorId: 1, dateTime: 1 });
AppointmentSchema.index({ patientId: 1, dateTime: -1 });
AppointmentSchema.index({ status: 1, dateTime: 1 });

export const Appointment: Model<IAppointmentDocument> =
  mongoose.models.Appointment || mongoose.model<IAppointmentDocument>("Appointment", AppointmentSchema);
