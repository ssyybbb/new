import { NextResponse } from "next/server";
import { sendCurrentDigest } from "@/lib/digest-runner";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await sendCurrentDigest("manual", { force: true });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "推送失败",
      },
      { status: 400 },
    );
  }
}
