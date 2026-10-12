import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { canProvisionRole } from "@/lib/auth/registration-policy";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Patient } from "@/models/Patient";
import { generatePatientId } from "@/features/patients/server/patient-api";
import { isMongoDuplicateKeyError } from "@/lib/api/http";
import { registerSchema } from "@/lib/validation/auth";
import { ApiResponse, IUser } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = registerSchema.safeParse(body);

    if (!parseResult.success) {
      const errorResponse: ApiResponse = {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input fields",
          details: parseResult.error.flatten().fieldErrors,
        },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { name, email, password, role, specialization, phone } = parseResult.data;

    // Public sign-up may only create PATIENT accounts; staff roles require an ADMIN session.
    const session = await getServerSession(authOptions);
    const requesterRole = session?.user?.role ?? null;
    if (!canProvisionRole(requesterRole, role)) {
      const status = requesterRole ? 403 : 401;
      const deniedResponse: ApiResponse = {
        success: false,
        error: {
          code: requesterRole ? "FORBIDDEN" : "UNAUTHORIZED",
          message: "Only a signed-in administrator can create staff accounts.",
        },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(deniedResponse, { status });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const conflictResponse: ApiResponse = {
        success: false,
        error: {
          code: "CONFLICT",
          message: "A user with this email address already exists.",
        },
        timestamp: new Date().toISOString(),
      };
      return NextResponse.json(conflictResponse, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      specialization,
      phone,
      isActive: true,
    });

    // When a PATIENT registers, automatically correlate or link their clinical Patient chart
    if (newUser.role === "PATIENT") {
      try {
        const matchCriteria: Record<string, unknown>[] = [{ email: email.toLowerCase() }];
        if (phone) matchCriteria.push({ phone });

        const existingPatient = await Patient.findOne({ $or: matchCriteria });
        if (existingPatient) {
          if (!existingPatient.userId) {
            existingPatient.userId = newUser._id;
          }
          if (!existingPatient.email) {
            existingPatient.email = email.toLowerCase();
          }
          if (phone && (!existingPatient.phone || existingPatient.phone === "Not provided")) {
            existingPatient.phone = phone;
          }
          await existingPatient.save();
        } else {
          for (let attempt = 1; attempt <= 5; attempt++) {
            const patientId = await generatePatientId();
            try {
              await Patient.create({
                patientId,
                fullName: name,
                email: email.toLowerCase(),
                phone: phone || "+1-555-0100",
                dateOfBirth: new Date("2000-01-01"),
                gender: "OTHER",
                emergencyContact: {
                  name: "Self",
                  relationship: "Self",
                  phone: phone || "+1-555-0100",
                },
                allergies: [],
                userId: newUser._id,
              });
              break;
            } catch (err) {
              const isCollision =
                isMongoDuplicateKeyError(err) &&
                typeof err === "object" &&
                err !== null &&
                "keyPattern" in err &&
                Boolean((err as { keyPattern?: Record<string, unknown> }).keyPattern?.patientId);
              if (!isCollision || attempt === 5) {
                console.error("Auto-provision patient record error:", err);
                break;
              }
            }
          }
        }
      } catch (syncError) {
        console.error("Failed to synchronize patient chart on registration:", syncError);
      }
    }

    const userPayload: IUser = {
      _id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      specialization: newUser.specialization,
      phone: newUser.phone,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };

    const successResponse: ApiResponse<IUser> = {
      success: true,
      data: userPayload,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(successResponse, { status: 201 });
  } catch (error) {
    const errorResponse: ApiResponse = {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Internal server error",
      },
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
