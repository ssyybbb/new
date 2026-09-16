"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, History, Settings2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "今日日报", icon: BookOpen },
  { href: "/settings", label: "配置", icon: Settings2 },
  { href: "/logs", label: "推送记录", icon: History },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-[oklch(0.97_0.01_250)]">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col md:flex-row">
        <aside className="border-b border-border bg-white md:w-60 md:border-r md:border-b-0">
          <div className="flex items-center gap-2 px-4 py-4 md:px-5 md:pt-6">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">开源日报</p>
              <p className="text-xs text-muted-foreground">飞书群机器人</p>
            </div>
          </div>
          <nav className="flex gap-1 px-3 pb-3 md:flex-col md:px-3 md:pb-6">
            {nav.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium md:flex-none md:justify-start",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="flex-1 px-4 py-5 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
