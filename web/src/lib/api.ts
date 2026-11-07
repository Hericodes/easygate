import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return jsonError(err.issues[0]?.message ?? "Invalid input", 422);
  }
  console.error(err);
  return jsonError("Something went wrong", 500);
}
