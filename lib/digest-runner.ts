import { randomUUID } from "node:crypto";
import { buildDemoDigest } from "@/lib/demo-data";
import { sendDigestCard, digestSummary, isDigestEmpty } from "@/lib/feishu";
import { collectDigest } from "@/lib/github";
import {
  appendLog,
  getSettings,
  readScheduleState,
  saveLastDigest,
  sourcesConfigured,
  writeScheduleState,
} from "@/lib/store";
import { isWithinScheduleWindow, zonedDateKey } from "@/lib/time";
import type { Digest, SendLog, SendTrigger } from "@/lib/types";

export async function previewDigest(): Promise<Digest> {
  try {
    return await buildCurrentDigest();
  } catch (error) {
    const settings = await getSettings();
    const digest = buildDemoDigest(settings.lookbackHours, settings.digestTitle);
    digest.warning =
      error instanceof Error
        ? error.message
        : "拉取 GitHub 失败，已暂时显示演示数据。";
    return digest;
  }
}

export async function buildCurrentDigest(): Promise<Digest> {
  const settings = await getSettings();
  if (!sourcesConfigured(settings)) {
    const digest = buildDemoDigest(settings.lookbackHours, settings.digestTitle);
    await saveLastDigest(digest);
    return digest;
  }
  const digest = await collectDigest(settings);
  await saveLastDigest(digest);
  return digest;
}

export async function sendCurrentDigest(trigger: SendTrigger, options?: { force?: boolean }) {
  const settings = await getSettings();
  const now = new Date();
  const today = zonedDateKey(now, settings.schedule.timezone);

  if (!settings.feishu.webhookUrl) {
    throw new Error("还没有配置飞书机器人 Webhook。请先在「配置」页粘贴群机器人地址。");
  }

  if (!options?.force && trigger === "schedule") {
    const state = await readScheduleState();
    if (settings.schedule.skipIfSentToday && state.lastSuccessDate === today) {
      return skip(trigger, "今天已经成功推送过，已跳过。");
    }
  }

  const digest = await buildCurrentDigest();
  await sendDigestCard(settings, digest);

  const log: SendLog = {
    id: randomUUID(),
    sentAt: now.toISOString(),
    trigger,
    status: "success",
    message: isDigestEmpty(digest)
      ? "已推送空日报（今日无新增）。"
      : "已推送到飞书群。",
    demo: digest.demo,
    summary: digestSummary(digest),
  };
  await appendLog(log);
  const state = await readScheduleState();
  await writeScheduleState({
    ...state,
    lastSuccessDate: today,
    ...(trigger === "schedule" || trigger === "cron"
      ? { lastScheduledDate: today }
      : {}),
  });
  return { ok: true as const, log, digest };
}

function skip(trigger: SendTrigger, message: string) {
  return {
    ok: true as const,
    skipped: true as const,
    log: {
      id: randomUUID(),
      sentAt: new Date().toISOString(),
      trigger,
      status: "skipped" as const,
      message,
      demo: false,
      summary: { newIssues: 0, newPulls: 0, mergedPulls: 0, closedIssues: 0 },
    },
  };
}

export async function runScheduledTick() {
  const settings = await getSettings();
  if (!settings.schedule.enabled) {
    return { ok: true, skipped: true, reason: "scheduler-disabled" };
  }
  if (!settings.feishu.webhookUrl) {
    return { ok: true, skipped: true, reason: "no-webhook" };
  }
  const now = new Date();
  if (!isWithinScheduleWindow(now, settings.schedule, 1)) {
    return { ok: true, skipped: true, reason: "not-time" };
  }
  const today = zonedDateKey(now, settings.schedule.timezone);
  const state = await readScheduleState();
  if (state.lastScheduledDate === today) {
    return { ok: true, skipped: true, reason: "already-ran" };
  }
  await writeScheduleState({ ...state, lastScheduledDate: today });
  try {
    return await sendCurrentDigest("schedule");
  } catch (error) {
    const log: SendLog = {
      id: randomUUID(),
      sentAt: now.toISOString(),
      trigger: "schedule",
      status: "failed",
      message: error instanceof Error ? error.message : "定时推送失败",
      demo: false,
      summary: { newIssues: 0, newPulls: 0, mergedPulls: 0, closedIssues: 0 },
    };
    await appendLog(log);
    return { ok: false as const, log };
  }
}
