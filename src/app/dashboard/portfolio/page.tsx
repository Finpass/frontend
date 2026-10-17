import { HomeRoute } from "@/features/dashboard/components/home-route";

export default function DashboardPortfolio() {
  return <HomeRoute view="portfolio" />;
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
