import { GitMerge, GitPullRequest, CircleDot, CircleCheck } from "lucide-react";
import type { Digest, DigestItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function Section({
  title,
  icon: Icon,
  items,
  empty,
  accent,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: DigestItem[];
  empty: string;
  accent: string;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${accent}`} />
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <p className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border bg-white">
          {items.map((item) => (
            <li key={`${item.repo}-${item.number}-${item.type}-${item.mergedAt ?? item.closedAt ?? item.createdAt}`}>
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col gap-1 px-3 py-2.5 hover:bg-muted/50 md:flex-row md:items-center md:justify-between"
              >
                <span className="text-sm font-medium text-foreground">
                  <span className="text-muted-foreground">#{item.number}</span>{" "}
                  {item.title}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {item.repo} · @{item.author}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function DigestView({ digest }: { digest: Digest }) {
  return (
    <Card className="overflow-hidden bg-white py-0 shadow-sm">
      <div className="bg-[#3370ff] px-5 py-4 text-white">
        <p className="text-xs/5 opacity-80">飞书群将看到类似这样的卡片</p>
        <h2 className="text-lg font-semibold">
          {digest.title}
          {digest.demo ? " · 演示" : ""}
        </h2>
        <p className="mt-1 text-sm text-white/85">
          过去 {digest.lookbackHours} 小时 · {digest.sourceLabel}
        </p>
      </div>
      <CardContent className="space-y-5 py-5">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="新 Issue" value={digest.newIssues.length} />
          <Stat label="新 PR" value={digest.newPulls.length} />
          <Stat label="已合并" value={digest.mergedPulls.length} />
          <Stat label="已关闭" value={digest.closedIssues.length} />
        </div>
        <Section
          title="新 Issue"
          icon={CircleDot}
          items={digest.newIssues}
          empty="这段时间没有新建 Issue。"
          accent="text-orange-500"
        />
        <Section
          title="新 Pull Request"
          icon={GitPullRequest}
          items={digest.newPulls}
          empty="这段时间没有新建 PR。"
          accent="text-sky-600"
        />
        <Section
          title="已合并 PR"
          icon={GitMerge}
          items={digest.mergedPulls}
          empty="这段时间没有合并 PR。"
          accent="text-violet-600"
        />
        <Section
          title="已关闭 Issue"
          icon={CircleCheck}
          items={digest.closedIssues}
          empty="这段时间没有关闭 Issue。"
          accent="text-emerald-600"
        />
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/70 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
