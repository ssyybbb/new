import { NextResponse } from "next/server";
import { listFeishuChats } from "@/lib/feishu";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    const chats = await listFeishuChats(settings);
    return NextResponse.json({ ok: true, chats });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "读取群列表失败",
      },
      { status: 400 },
    );
  }
}
