import { RecommendedView } from "@/features/dashboard/components/recommended-view";

export default function DashboardRecommendedPortfolio() {
  return <RecommendedView />;
}

// pages render behind a client-side auth/profile guard, so there is no static shell to validate
export const instant = false;
