import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/reservations";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { message: "Invalid request payload.", issues: error.issues },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.statusCode }
    );
  }

  console.error("[route error]", error);

  return NextResponse.json(
    { message: "Something went wrong." },
    { status: 500 }
  );
}
