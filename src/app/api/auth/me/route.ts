import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth-options";
import { ApiResponse } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    const unauthorizedResponse: ApiResponse = {
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be signed in to access this resource.",
      },
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(unauthorizedResponse, { status: 401 });
  }

  const response: ApiResponse = {
    success: true,
    data: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}
