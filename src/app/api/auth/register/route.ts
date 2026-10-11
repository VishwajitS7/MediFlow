import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
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
