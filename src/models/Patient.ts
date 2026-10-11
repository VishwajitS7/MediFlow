import mongoose, { Schema, Document, Model, Types } from "mongoose";
import { BloodGroup, Gender, IAddress, IEmergencyContact } from "@/types";

export interface IPatientDocument extends Document {
  patientId: string;
  fullName: string;
  dateOfBirth: Date;
  gender: Gender;
  phone: string;
  email?: string;
  bloodGroup?: BloodGroup;
  allergies: string[];
  emergencyContact: IEmergencyContact;
  address?: IAddress;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EmergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: [true, "Emergency contact name is required"], trim: true },
    relationship: { type: String, required: [true, "Emergency contact relationship is required"], trim: true },
    phone: { type: String, required: [true, "Emergency contact phone is required"], trim: true },
  },
  { _id: false }
);

const AddressSchema = new Schema<IAddress>(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  { _id: false }
);

const PatientSchema = new Schema<IPatientDocument>(
  {
    patientId: {
      type: String,
      required: [true, "Patient ID is required"],
      unique: true,
      trim: true,
      match: [/^MED-\d{4}-\d{5}$/, "Patient ID must match MED-YYYY-XXXXX"],
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: [true, "Gender is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },
    allergies: {
      type: [String],
      default: [],
    },
    emergencyContact: {
      type: EmergencyContactSchema,
      required: [true, "Emergency contact is required"],
    },
    address: {
      type: AddressSchema,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

PatientSchema.index({ fullName: "text", phone: "text" });

export const Patient: Model<IPatientDocument> =
  mongoose.models.Patient || mongoose.model<IPatientDocument>("Patient", PatientSchema);
