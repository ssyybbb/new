"use client";

import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/app-shell";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <AppShell>{children}</AppShell>
        <Toaster position="top-center" richColors duration={6000} className="!z-[100]" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
