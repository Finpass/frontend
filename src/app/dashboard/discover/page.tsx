import { DiscoverView } from "@/features/dashboard/components/discover-view";

export default function DashboardDiscover() {
  return <DiscoverView />;
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
