import { HomeRoute } from "@/features/dashboard/components/home-route";

export default function DashboardHome() {
  return <HomeRoute view="profile" />;
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
