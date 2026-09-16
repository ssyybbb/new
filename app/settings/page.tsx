import { SettingsPage } from "@/components/settings-page";
import { getPublicSettings } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const settings = await getPublicSettings();
  return <SettingsPage initialSettings={settings} />;
}
