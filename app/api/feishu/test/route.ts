import { NextResponse } from "next/server";
import { sendTestMessage } from "@/lib/feishu";
import { getSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const settings = await getSettings();
    if (!settings.feishu.webhookUrl) {
      return NextResponse.json(
        { ok: false, message: "请先保存飞书 Webhook 地址。" },
        { status: 400 },
      );
    }
    await sendTestMessage(settings);
    return NextResponse.json({ ok: true, message: "测试消息已发到飞书群。" });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "测试消息发送失败",
      },
      { status: 400 },
    );
  }
}
