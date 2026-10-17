import { SettingsView } from "@/features/dashboard/components/settings-view";

export default function DashboardSettings() {
  return <SettingsView />;
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
