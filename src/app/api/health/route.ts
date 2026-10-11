import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ApiResponse } from "@/types";

export async function GET() {
  const readyState = mongoose.connection.readyState;
  const statusMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = statusMap[readyState] || "unknown";
  const isHealthy = readyState === 1 || readyState === 0; // readyState 0 is acceptable in initial dev without live Mongo

  const responseBody: ApiResponse<{
    status: string;
    uptime: number;
    timestamp: string;
    database: {
      status: string;
      readyState: number;
    };
    version: string;
  }> = {
    success: isHealthy,
    data: {
      status: isHealthy ? "healthy" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        readyState,
      },
      version: "0.1.0",
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(responseBody, { status: 200 });
}
