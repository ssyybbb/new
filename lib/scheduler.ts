import { runScheduledTick } from "@/lib/digest-runner";

const globalForScheduler = globalThis as unknown as {
  __ossDigestScheduler?: { started: boolean; timer?: ReturnType<typeof setInterval> };
};

export function startScheduler() {
  if (globalForScheduler.__ossDigestScheduler?.started) return;
  globalForScheduler.__ossDigestScheduler = { started: true };
  const timer = setInterval(() => {
    runScheduledTick().catch((error) => {
      console.error("[oss-digest] scheduled tick failed", error);
    });
  }, 30_000);
  globalForScheduler.__ossDigestScheduler.timer = timer;
  runScheduledTick().catch((error) => {
    console.error("[oss-digest] initial tick failed", error);
  });
  console.log("[oss-digest] daily scheduler started");
}
