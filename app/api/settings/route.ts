import { NextResponse } from "next/server";
import { getPublicSettings, saveSettings } from "@/lib/store";
import { UNCHANGED } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getPublicSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as {
    digestTitle?: string;
    sources?: { mode?: "org" | "repos"; org?: string; repos?: string[] };
    lookbackHours?: number;
    include?: {
      newIssues?: boolean;
      newPulls?: boolean;
      mergedPulls?: boolean;
      closedIssues?: boolean;
    };
    maxItemsPerSection?: number;
    githubToken?: string;
    feishu?: { webhookUrl?: string; secret?: string };
    schedule?: {
      enabled?: boolean;
      timezone?: string;
      hour?: number;
      minute?: number;
      skipIfSentToday?: boolean;
    };
  };

  try {
    const settings = await saveSettings({
    digestTitle: body.digestTitle,
    sources: body.sources
      ? {
          mode: body.sources.mode ?? "org",
          org: body.sources.org ?? "",
          repos: body.sources.repos ?? [],
        }
      : undefined,
    lookbackHours: body.lookbackHours,
    include: body.include
      ? {
          newIssues: Boolean(body.include.newIssues),
          newPulls: Boolean(body.include.newPulls),
          mergedPulls: Boolean(body.include.mergedPulls),
          closedIssues: Boolean(body.include.closedIssues),
        }
      : undefined,
    maxItemsPerSection: body.maxItemsPerSection,
    githubToken:
      body.githubToken === undefined || body.githubToken === UNCHANGED
        ? UNCHANGED
        : body.githubToken,
    feishu: body.feishu
      ? {
          webhookUrl:
            body.feishu.webhookUrl === undefined
              ? UNCHANGED
              : body.feishu.webhookUrl,
          secret:
            body.feishu.secret === undefined ? UNCHANGED : body.feishu.secret,
        }
      : undefined,
    schedule: body.schedule,
    });

    return NextResponse.json({
      ok: true,
      webhookConfigured: Boolean(settings.feishu.webhookUrl),
      githubConfigured: Boolean(
        settings.sources.org || settings.sources.repos.length,
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "保存失败",
      },
      { status: 400 },
    );
  }
}
