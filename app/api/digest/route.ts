import { NextResponse } from "next/server";
import { getDashboardPayload } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await getDashboardPayload();
  return NextResponse.json(payload);
}
