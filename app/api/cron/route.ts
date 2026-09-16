import { NextResponse } from "next/server";
import { runScheduledTick, sendCurrentDigest } from "@/lib/digest-runner";

export const dynamic = "force-dynamic";

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("secret") ?? "";
  return token === secret || queryToken === secret;
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ ok: false, message: "未授权" }, { status: 401 });
  }
  const url = new URL(request.url);
  const force = url.searchParams.get("force") === "1";
  try {
    const result = force
      ? await sendCurrentDigest("cron", { force: true })
      : await runScheduledTick();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "定时任务失败",
      },
      { status: 500 },
    );
  }
}
