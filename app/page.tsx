import { DashboardPage } from "@/components/dashboard-page";
import { getDashboardPayload } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { digest, status } = await getDashboardPayload();
  return <DashboardPage initialDigest={digest} initialStatus={status} />;
}
